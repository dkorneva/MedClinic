using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Application.Abstractions.Persistence;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.Application.Mapping;
using ServiceDesk.API.DTOs.Doctors;
using ServiceDesk.API.Exceptions;
using ServiceDesk.API.Hubs;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Application.Services;

public class DoctorService : IDoctorService
{
    private readonly IAppDbContext _db;
    private readonly IHubContext<DoctorSlotsHub> _slotsHubContext;

    public DoctorService(IAppDbContext db, IHubContext<DoctorSlotsHub> slotsHubContext)
    {
        _db = db;
        _slotsHubContext = slotsHubContext;
    }

    public async Task<IReadOnlyList<DoctorResponse>> GetAllAsync(DoctorListQuery query)
    {
        var doctorEmailsQuery = GetDoctorRoleEmailsQuery();
        var doctorsQuery = _db.Doctors
            .AsNoTracking()
            .Where(doctor => doctorEmailsQuery.Contains(doctor.Email))
            .AsQueryable();

        if (!query.IncludeInactive)
        {
            doctorsQuery = doctorsQuery.Where(doctor => doctor.Status == DoctorStatus.Active);
        }

        if (!string.IsNullOrWhiteSpace(query.Specialty))
        {
            var specialty = query.Specialty.Trim();
            doctorsQuery = doctorsQuery.Where(doctor => doctor.Specialty == specialty);
        }

        var doctors = await doctorsQuery
            .OrderBy(doctor => doctor.Specialty)
            .ThenBy(doctor => doctor.FullName)
            .ToListAsync();

        return doctors.Select(doctor => doctor.ToResponse()).ToList();
    }

    public async Task<IReadOnlyList<string>> GetSpecialtiesAsync()
    {
        var doctorEmailsQuery = GetDoctorRoleEmailsQuery();

        return await _db.Doctors
            .AsNoTracking()
            .Where(doctor => doctorEmailsQuery.Contains(doctor.Email))
            .Where(doctor => doctor.Status == DoctorStatus.Active)
            .Select(doctor => doctor.Specialty)
            .Distinct()
            .OrderBy(specialty => specialty)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<DoctorTimeSlotResponse>> GetAvailableSlotsAsync(int doctorId)
    {
        var doctorExists = await GetDoctorsWithCurrentRoleQuery()
            .AnyAsync(doctor => doctor.Id == doctorId && doctor.Status == DoctorStatus.Active);

        if (!doctorExists)
        {
            throw new NotFoundException($"Врач с id {doctorId} не найден.");
        }

        var now = DateTimeOffset.UtcNow;

        var slots = await _db.DoctorTimeSlots
            .AsNoTracking()
            .Where(slot => slot.DoctorId == doctorId && !slot.IsBooked && slot.StartAt >= now)
            .ToListAsync();

        return slots
            .OrderBy(slot => slot.StartAt)
            .Select(slot => slot.ToResponse())
            .ToList();
    }

    public async Task<IReadOnlyList<DoctorScheduleSlotResponse>> GetScheduleAsync(int doctorId)
    {
        var doctorExists = await _db.Doctors.AnyAsync(doctor => doctor.Id == doctorId);
        if (!doctorExists)
        {
            throw new NotFoundException($"Врач с id {doctorId} не найден.");
        }

        var schedule = await _db.DoctorTimeSlots
            .AsNoTracking()
            .Where(slot => slot.DoctorId == doctorId)
            .Include(slot => slot.Ticket)
                .ThenInclude(ticket => ticket!.Author)
            .Include(slot => slot.Ticket)
                .ThenInclude(ticket => ticket!.Category)
            .Select(slot => new DoctorScheduleSlotResponse
            {
                Id = slot.Id,
                StartAt = slot.StartAt,
                IsBooked = slot.IsBooked,
                TicketId = slot.Ticket != null ? slot.Ticket.Id : null,
                PatientName = slot.Ticket != null ? slot.Ticket.Author.DisplayName : null,
                CategoryName = slot.Ticket != null ? slot.Ticket.Category.Name : null,
                Status = slot.Ticket != null ? slot.Ticket.Status.ToString() : null
            })
            .ToListAsync();

        return schedule.OrderBy(slot => slot.StartAt).ToList();
    }

    public async Task<IReadOnlyList<DoctorScheduleSlotResponse>> GetOwnScheduleAsync(string currentUserId)
    {
        var doctor = await GetCurrentDoctorAsync(currentUserId);

        var schedule = await _db.DoctorTimeSlots
            .AsNoTracking()
            .Where(slot => slot.DoctorId == doctor.Id)
            .Include(slot => slot.Ticket)
                .ThenInclude(ticket => ticket!.Author)
            .Include(slot => slot.Ticket)
                .ThenInclude(ticket => ticket!.Category)
            .Select(slot => new DoctorScheduleSlotResponse
            {
                Id = slot.Id,
                StartAt = slot.StartAt,
                IsBooked = slot.IsBooked,
                TicketId = slot.Ticket != null ? slot.Ticket.Id : null,
                PatientName = slot.Ticket != null ? slot.Ticket.Author.DisplayName : null,
                CategoryName = slot.Ticket != null ? slot.Ticket.Category.Name : null,
                Status = slot.Ticket != null ? slot.Ticket.Status.ToString() : null
            })
            .ToListAsync();

        return schedule.OrderBy(slot => slot.StartAt).ToList();
    }

    public async Task<IReadOnlyList<DoctorScheduleSlotResponse>> UpdateScheduleAsync(int doctorId, UpdateDoctorScheduleRequest request)
    {
        var doctor = await _db.Doctors
            .Include(item => item.TimeSlots)
                .ThenInclude(slot => slot.Ticket)
                    .ThenInclude(ticket => ticket!.Author)
            .Include(item => item.TimeSlots)
                .ThenInclude(slot => slot.Ticket)
                    .ThenInclude(ticket => ticket!.Category)
            .FirstOrDefaultAsync(item => item.Id == doctorId)
            ?? throw new NotFoundException($"Врач с id {doctorId} не найден.");

        var parsedSlots = ParseLocalSlots(request.Slots);
        var requestedSlots = new HashSet<DateTimeOffset>(parsedSlots);

        var now = DateTimeOffset.UtcNow;

        if (parsedSlots.Any(slot => slot.UtcDateTime <= now.UtcDateTime))
        {
            throw new BusinessException("Нельзя добавить слот в прошлом.");
        }

        var removableSlots = doctor.TimeSlots
            .Where(slot => IsFutureSlot(slot, now) && !slot.IsBooked && !requestedSlots.Contains(slot.StartAt))
            .ToList();
        _db.DoctorTimeSlots.RemoveRange(removableSlots);

        var existingSlots = doctor.TimeSlots
            .Select(slot => slot.StartAt)
            .ToHashSet();

        foreach (var slot in requestedSlots.Where(slot => !existingSlots.Contains(slot)))
        {
            doctor.TimeSlots.Add(new DoctorTimeSlot
            {
                StartAt = slot,
                IsBooked = false
            });
        }

        await _db.SaveChangesAsync();

        return doctor.TimeSlots
            .OrderBy(slot => slot.StartAt)
            .Select(slot => new DoctorScheduleSlotResponse
            {
                Id = slot.Id,
                StartAt = slot.StartAt,
                IsBooked = slot.IsBooked,
                TicketId = slot.Ticket?.Id,
                PatientName = slot.Ticket?.Author.DisplayName,
                CategoryName = slot.Ticket?.Category.Name,
                Status = slot.Ticket?.Status.ToString()
            })
            .ToList();
    }

    private async Task<Doctor> GetCurrentDoctorAsync(string currentUserId)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(item => item.Id == currentUserId)
            ?? throw new UnauthorizedException("Пользователь не найден.");

        return await GetDoctorsWithCurrentRoleQuery().FirstOrDefaultAsync(item => item.Email == user.Email)
            ?? throw new ForbiddenException("Для текущего аккаунта врача не найдена карточка врача.");
    }

    private IQueryable<string?> GetDoctorRoleEmailsQuery()
    {
        return from user in _db.Users.AsNoTracking()
               join userRole in _db.UserRoles.AsNoTracking() on user.Id equals userRole.UserId
               join role in _db.Roles.AsNoTracking() on userRole.RoleId equals role.Id
               where role.Name == "Doctor"
               select user.Email;
    }

    private IQueryable<Doctor> GetDoctorsWithCurrentRoleQuery()
    {
        return _db.Doctors
            .AsNoTracking()
            .Join(
                GetDoctorRoleEmailsQuery().Where(email => email != null),
                doctor => doctor.Email,
                email => email!,
                (doctor, _) => doctor);
    }

    private static List<DateTimeOffset> ParseLocalSlots(IReadOnlyList<string> slots)
    {
        var timeZone = TimeZoneInfo.FindSystemTimeZoneById("Russian Standard Time");

        return slots
            .Select(slotStr =>
            {
                if (!DateTime.TryParse(slotStr, out var dateTime))
                {
                    throw new BusinessException($"Неверный формат времени: {slotStr}");
                }

                var unspecifiedDateTime = DateTime.SpecifyKind(dateTime, DateTimeKind.Unspecified);
                var offset = timeZone.GetUtcOffset(unspecifiedDateTime);
                return new DateTimeOffset(unspecifiedDateTime, offset);
            })
            .OrderBy(slot => slot)
            .ToList();
    }

    private static bool IsFutureSlot(DoctorTimeSlot slot, DateTimeOffset now)
    {
        return slot.StartAt.UtcDateTime > now.UtcDateTime;
    }
}
