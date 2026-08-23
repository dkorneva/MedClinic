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
            .OrderBy(slot => slot.StartAt)
            .ToListAsync();

        return slots.Select(slot => slot.ToResponse()).ToList();
    }

    public async Task<IReadOnlyList<DoctorScheduleSlotResponse>> GetScheduleAsync(int doctorId)
    {
        var doctorExists = await _db.Doctors.AnyAsync(doctor => doctor.Id == doctorId);
        if (!doctorExists)
        {
            throw new NotFoundException($"Врач с id {doctorId} не найден.");
        }

        return await _db.DoctorTimeSlots
            .AsNoTracking()
            .Where(slot => slot.DoctorId == doctorId)
            .Include(slot => slot.Ticket)
                .ThenInclude(ticket => ticket!.Author)
            .Include(slot => slot.Ticket)
                .ThenInclude(ticket => ticket!.Category)
            .OrderBy(slot => slot.StartAt)
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
    }

    public async Task<IReadOnlyList<DoctorScheduleSlotResponse>> GetOwnScheduleAsync(string currentUserId)
    {
        var doctor = await GetCurrentDoctorAsync(currentUserId);

        return await _db.DoctorTimeSlots
            .AsNoTracking()
            .Where(slot => slot.DoctorId == doctor.Id)
            .Include(slot => slot.Ticket)
                .ThenInclude(ticket => ticket!.Author)
            .Include(slot => slot.Ticket)
                .ThenInclude(ticket => ticket!.Category)
            .OrderBy(slot => slot.StartAt)
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

        if (parsedSlots.Any(slot => slot.UtcDateTime <= DateTimeOffset.UtcNow.UtcDateTime))
        {
            throw new BusinessException("Нельзя добавить слот в прошлом.");
        }

        var bookedRemovedSlots = doctor.TimeSlots
            .Where(slot => slot.IsBooked)
            .Any(slot => !requestedSlots.Contains(slot.StartAt));

        if (bookedRemovedSlots)
        {
            throw new BusinessException("Нельзя удалить слот, который уже занят записью.");
        }

        var removableSlots = doctor.TimeSlots
            .Where(slot => !slot.IsBooked && !requestedSlots.Contains(slot.StartAt))
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

    public async Task<DoctorResponse> CreateAsync(CreateDoctorRequest request)
    {
        var fullName = NormalizeRequired(request.FullName, "ФИО врача");
        var email = NormalizeRequired(request.Email, "Email врача");
        var specialty = NormalizeRequired(request.Specialty, "Специальность врача");
        var status = ParseStatus(request.Status);

        if (await _db.Doctors.AnyAsync(doctor => doctor.Email == email))
        {
            throw new BusinessException("Врач с таким email уже существует.");
        }

        var parsedSlots = ParseLocalSlots(request.Slots);

        if (parsedSlots.Any(slot => slot <= DateTimeOffset.UtcNow))
        {
            throw new BusinessException("Нельзя добавить слот в прошлом.");
        }

        var doctor = new Doctor
        {
            FullName = fullName,
            Email = email,
            Specialty = specialty,
            Status = status,
            TimeSlots = CreateSlots(parsedSlots).ToList()
        };

        _db.Doctors.Add(doctor);
        await _db.SaveChangesAsync();
        return doctor.ToResponse();
    }

    public async Task<DoctorResponse> UpdateAsync(int id, UpdateDoctorRequest request)
    {
        var doctor = await _db.Doctors
            .Include(item => item.TimeSlots)
            .FirstOrDefaultAsync(item => item.Id == id)
            ?? throw new NotFoundException($"Врач с id {id} не найден.");

        var fullName = NormalizeRequired(request.FullName, "ФИО врача");
        var email = NormalizeRequired(request.Email, "Email врача");
        var specialty = NormalizeRequired(request.Specialty, "Специальность врача");
        var status = ParseStatus(request.Status);

        if (await _db.Doctors.AnyAsync(existing => existing.Id != id && existing.Email == email))
        {
            throw new BusinessException("Врач с таким email уже существует.");
        }

        var parsedSlots = ParseLocalSlots(request.Slots);
        var requestedSlots = new HashSet<DateTimeOffset>(parsedSlots);

        if (parsedSlots.Any(slot => slot <= DateTimeOffset.UtcNow))
        {
            throw new BusinessException("Нельзя добавить слот в прошлом.");
        }

        var bookedRemovedSlots = doctor.TimeSlots
            .Where(slot => slot.IsBooked)
            .Any(slot => !requestedSlots.Contains(slot.StartAt));

        if (bookedRemovedSlots)
        {
            throw new BusinessException("Нельзя удалить слот, который уже занят записью.");
        }

        var removableSlots = doctor.TimeSlots
            .Where(slot => !slot.IsBooked && !requestedSlots.Contains(slot.StartAt))
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

        doctor.FullName = fullName;
        doctor.Email = email;
        doctor.Specialty = specialty;
        doctor.Status = status;

        await _db.SaveChangesAsync();
        return doctor.ToResponse();
    }

    public async Task DeleteAsync(int id)
    {
        var doctor = await _db.Doctors
            .Include(item => item.TimeSlots)
            .FirstOrDefaultAsync(item => item.Id == id)
            ?? throw new NotFoundException($"Врач с id {id} не найден.");

        if (await _db.Tickets.AnyAsync(ticket => ticket.DoctorId == id))
        {
            throw new BusinessException("Нельзя удалить врача, у которого уже есть записи.");
        }

        _db.Doctors.Remove(doctor);
        await _db.SaveChangesAsync();
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

    private static IEnumerable<DoctorTimeSlot> CreateSlots(IReadOnlyList<DateTimeOffset> requestedSlots)
    {
        return requestedSlots
            .Select(slot => new DoctorTimeSlot
            {
                StartAt = slot,
                IsBooked = false
            });
    }

    private static string NormalizeRequired(string? value, string fieldName)
    {
        var normalized = (value ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new BusinessException($"{fieldName} не должно быть пустым.");
        }

        return normalized;
    }

    private static DoctorStatus ParseStatus(string? status)
    {
        if (!Enum.TryParse<DoctorStatus>((status ?? string.Empty).Trim(), true, out var parsed))
        {
            throw new BusinessException("Некорректный статус врача.");
        }

        return parsed;
    }
}
