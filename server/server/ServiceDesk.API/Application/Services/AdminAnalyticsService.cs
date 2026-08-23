using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Application.Abstractions.Persistence;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.DTOs.Admin;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Application.Services;

// можно экземпляр, наследоваться нельзя
public sealed class AdminAnalyticsService : IAdminAnalyticsService
{
    private readonly IAppDbContext _db;

    public AdminAnalyticsService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<AdminDashboardResponse> GetDashboardAsync()
    {
        var now = DateTimeOffset.UtcNow;
        var todayStart = now.Date;
        var todayEnd = todayStart.AddDays(1);

        var todayTickets = await _db.Tickets
            .AsNoTracking()
            .Include(ticket => ticket.Author)
            .Include(ticket => ticket.Doctor)
            .Include(ticket => ticket.Category)
            .Where(ticket => ticket.AppointmentAt >= todayStart && ticket.AppointmentAt < todayEnd)
            .OrderBy(ticket => ticket.AppointmentAt)
            .ToListAsync();

        return new AdminDashboardResponse
        {
            TotalDoctors = await _db.Doctors.CountAsync(),
            ActiveDoctors = await _db.Doctors.CountAsync(doctor => doctor.Status == DoctorStatus.Active),
            ActiveCategories = await _db.Categories.CountAsync(category => category.IsActive),
            TodayAppointmentsCount = todayTickets.Count,
            NewAppointmentsCount = todayTickets.Count(ticket => ticket.Status == TicketStatus.New),
            InProgressAppointmentsCount = todayTickets.Count(ticket => ticket.Status == TicketStatus.InProgress),
            CompletedAppointmentsCount = todayTickets.Count(ticket => ticket.Status == TicketStatus.Resolved),
            TodayRevenue = todayTickets.Where(ticket => ticket.Status == TicketStatus.Resolved).Sum(ticket => ticket.Category.Price),
            TodayAppointments = todayTickets.Select(ticket => new AdminDashboardAppointmentResponse
            {
                TicketId = ticket.Id,
                AppointmentAt = ticket.AppointmentAt,
                PatientName = ticket.Author.DisplayName,
                DoctorName = ticket.Doctor.FullName,
                DoctorSpecialty = ticket.Doctor.Specialty,
                CategoryName = ticket.Category.Name,
                Status = ticket.Status.ToString()
            }).ToList(),
            DoctorLoads = await BuildDoctorLoadsAsync(5)
        };
    }

    public async Task<AdminReportsResponse> GetReportsAsync(DateTimeOffset? start, DateTimeOffset? end)
    {
        var rangeEnd = (end ?? DateTimeOffset.UtcNow).ToUniversalTime();
        var rangeStart = (start ?? rangeEnd.AddMonths(-5).Date).ToUniversalTime();

        if (rangeEnd < rangeStart)
        {
            (rangeStart, rangeEnd) = (rangeEnd, rangeStart);
        }

        rangeEnd = rangeEnd.Date.AddDays(1);

        var tickets = await _db.Tickets
            .AsNoTracking()
            .Include(ticket => ticket.Author)
            .Include(ticket => ticket.Category)
            .Where(ticket => ticket.AppointmentAt >= rangeStart && ticket.AppointmentAt < rangeEnd)
            .ToListAsync();

        var completedAppointments = tickets.Count(ticket => ticket.Status == TicketStatus.Resolved);
        var totalAppointments = tickets.Count;

        return new AdminReportsResponse
        {
            Start = rangeStart,
            End = rangeEnd.AddDays(-1),
            Revenue = tickets.Where(ticket => ticket.Status == TicketStatus.Resolved).Sum(ticket => ticket.Category.Price),
            TotalAppointments = totalAppointments,
            CompletedAppointments = completedAppointments,
            RejectedAppointments = tickets.Count(ticket => ticket.Status == TicketStatus.Rejected),
            NewPatients = tickets.Select(ticket => ticket.AuthorId).Distinct().Count(),
            ActiveDoctors = await _db.Doctors.CountAsync(doctor => doctor.Status == DoctorStatus.Active),
            CompletionRate = totalAppointments == 0 ? 0 : Math.Round(completedAppointments * 100m / totalAppointments, 1),
            CurrentMonthRevenueByDay = await BuildRevenueByDayAsync(rangeStart, rangeEnd, tickets),
            RevenueByMonth = BuildMonthlyRevenue(rangeStart, rangeEnd, tickets),
            Statuses = Enum.GetValues<TicketStatus>()
                .Select(status => new AdminStatusStatResponse
                {
                    Status = status.ToString(),
                    Count = tickets.Count(ticket => ticket.Status == status)
                })
                .ToList(),
            DoctorLoads = await BuildDoctorLoadsAsync(10)
        };
    }

    private async Task<IReadOnlyList<AdminDoctorLoadResponse>> BuildDoctorLoadsAsync(int take)
    {
        var doctors = await _db.Doctors
            .AsNoTracking()
            .Where(doctor => doctor.Status != DoctorStatus.Inactive)
            .Include(doctor => doctor.TimeSlots)
            .OrderBy(doctor => doctor.FullName)
            .ToListAsync();

        return doctors
            .Select(doctor =>
            {
                var totalSlots = doctor.TimeSlots.Count;
                var bookedSlots = doctor.TimeSlots.Count(slot => slot.IsBooked);

                return new AdminDoctorLoadResponse
                {
                    DoctorId = doctor.Id,
                    DoctorName = doctor.FullName,
                    Specialty = doctor.Specialty,
                    TotalSlots = totalSlots,
                    BookedSlots = bookedSlots,
                    LoadPercent = totalSlots == 0 ? 0 : Math.Round(bookedSlots * 100m / totalSlots, 1)
                };
            })
            .OrderByDescending(item => item.LoadPercent)
            .ThenBy(item => item.DoctorName)
            .Take(take)
            .ToList();
    }

    private Task<IReadOnlyList<AdminDailyRevenueResponse>> BuildRevenueByDayAsync(
        DateTimeOffset rangeStart,
        DateTimeOffset rangeEnd,
        IReadOnlyList<Ticket> tickets)
    {
        var result = new List<AdminDailyRevenueResponse>();

        for (var day = rangeStart; day < rangeEnd; day = day.AddDays(1))
        {
            var dayEnd = day.AddDays(1);
            result.Add(new AdminDailyRevenueResponse
            {
                DateKey = day.ToString("yyyy-MM-dd"),
                Revenue = tickets
                    .Where(ticket => ticket.AppointmentAt >= day && ticket.AppointmentAt < dayEnd && ticket.Status == TicketStatus.Resolved)
                    .Sum(ticket => ticket.Category.Price)
            });
        }

        return Task.FromResult<IReadOnlyList<AdminDailyRevenueResponse>>(result);
    }

    private static IReadOnlyList<AdminMonthlyRevenueResponse> BuildMonthlyRevenue(
        DateTimeOffset start,
        DateTimeOffset end,
        IReadOnlyList<Ticket> tickets)
    {
        var monthStart = new DateTimeOffset(start.Year, start.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var finalMonth = new DateTimeOffset(end.AddDays(-1).Year, end.AddDays(-1).Month, 1, 0, 0, 0, TimeSpan.Zero);
        var result = new List<AdminMonthlyRevenueResponse>();

        while (monthStart <= finalMonth)
        {
            var nextMonth = monthStart.AddMonths(1);
            var monthTickets = tickets.Where(ticket => ticket.AppointmentAt >= monthStart && ticket.AppointmentAt < nextMonth).ToList();

            result.Add(new AdminMonthlyRevenueResponse
            {
                MonthKey = monthStart.ToString("yyyy-MM"),
                Revenue = monthTickets.Where(ticket => ticket.Status == TicketStatus.Resolved).Sum(ticket => ticket.Category.Price),
                AppointmentsCount = monthTickets.Count
            });

            monthStart = nextMonth;
        }

        return result;
    }
}
