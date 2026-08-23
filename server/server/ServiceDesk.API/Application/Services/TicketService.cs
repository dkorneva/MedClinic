using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Application.Abstractions.Persistence;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.Application.Mapping;
using ServiceDesk.API.DTOs;
using ServiceDesk.API.DTOs.Tickets;
using ServiceDesk.API.Exceptions;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Application.Services;

public class TicketService : ITicketService
{
    private readonly IAppDbContext _db;
    private readonly ILogger<TicketService> _logger;

    public TicketService(IAppDbContext db, ILogger<TicketService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<TicketResponse> CreateAsync(CreateTicketRequest request, string currentUserId, string currentRole)
    {
        if (!string.Equals(currentRole, "Patient", StringComparison.Ordinal))
        {
            throw new UnauthorizedException("Only patients can create appointments.");
        }

        var description = request.Description.Trim();
        var doctorSpecialty = request.DoctorSpecialty.Trim();

        if (string.IsNullOrWhiteSpace(description))
        {
            throw new BusinessException("Complaint is required.");
        }

        if (string.IsNullOrWhiteSpace(doctorSpecialty))
        {
            throw new BusinessException("Doctor specialty is required.");
        }

        var category = await _db.Categories
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == request.CategoryId)
            ?? throw new BusinessException($"Category {request.CategoryId} was not found.");

        if (!category.IsActive)
        {
            throw new BusinessException("Inactive category cannot be used for appointment.");
        }

        if (!string.Equals(category.DoctorSpecialty, doctorSpecialty, StringComparison.Ordinal))
        {
            throw new BusinessException("Selected category does not match doctor specialty.");
        }

        var doctor = await _db.Doctors
            .AsNoTracking()
            .Where(item => item.Id == request.DoctorId)
            .Join(
                GetDoctorRoleUsersQuery(),
                doctor => doctor.Email,
                user => user.Email!,
                (doctor, _) => doctor)
            .FirstOrDefaultAsync()
            ?? throw new BusinessException($"Doctor {request.DoctorId} was not found.");

        if (doctor.Status != DoctorStatus.Active)
        {
            throw new BusinessException("Selected doctor is not available for appointment.");
        }

        if (!string.Equals(doctor.Specialty, doctorSpecialty, StringComparison.Ordinal))
        {
            throw new BusinessException("Selected doctor does not match chosen specialty.");
        }

        var slot = await _db.DoctorTimeSlots
            .FirstOrDefaultAsync(item => item.Id == request.DoctorTimeSlotId && item.DoctorId == request.DoctorId)
            ?? throw new BusinessException("Selected slot was not found.");

        if (slot.IsBooked)
        {
            throw new BusinessException("Selected slot is already booked.");
        }

        if (slot.StartAt < DateTimeOffset.UtcNow)
        {
            throw new BusinessException("Cannot book past time slot.");
        }

        var ticket = new Ticket
        {
            Title = $"Appointment for {category.Name}",
            Description = description,
            CategoryId = request.CategoryId,
            DoctorId = request.DoctorId,
            DoctorTimeSlotId = request.DoctorTimeSlotId,
            AppointmentAt = slot.StartAt,
            Priority = request.Priority,
            Status = TicketStatus.New,
            AuthorId = currentUserId
        };

        slot.IsBooked = true;
        _db.Tickets.Add(ticket);
        await _db.SaveChangesAsync();

        var createdTicket = await GetTicketQuery().FirstAsync(item => item.Id == ticket.Id);

        _logger.LogInformation(
            "Patient {UserId} created appointment {TicketId} for doctor {DoctorId}, category {CategoryId}, slot {SlotId}",
            currentUserId,
            ticket.Id,
            ticket.DoctorId,
            ticket.CategoryId,
            ticket.DoctorTimeSlotId);

        return createdTicket.ToResponse();
    }

    public async Task<PagedResponse<TicketResponse>> GetListAsync(TicketsQuery query, string currentUserId, string currentRole)
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var ticketsQuery = GetTicketQuery();

        if (string.Equals(currentRole, "Patient", StringComparison.Ordinal))
        {
            ticketsQuery = ticketsQuery.Where(item => item.AuthorId == currentUserId);
        }
        else if (string.Equals(currentRole, "Doctor", StringComparison.Ordinal))
        {
            var currentDoctorId = await GetCurrentDoctorIdAsync(currentUserId);
            ticketsQuery = ticketsQuery.Where(item => item.DoctorId == currentDoctorId);

            if (query.UnassignedOnly == true)
            {
                ticketsQuery = ticketsQuery.Where(item => item.AssigneeId == null);
            }

            if (query.AssignedToMe == true)
            {
                ticketsQuery = ticketsQuery.Where(item => item.AssigneeId == currentUserId);

                if (string.IsNullOrWhiteSpace(query.Status))
                {
                    ticketsQuery = ticketsQuery.Where(item => item.Status == TicketStatus.New || item.Status == TicketStatus.InProgress);
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            if (!Enum.TryParse<TicketStatus>(query.Status, true, out var status))
            {
                throw new BusinessException("Invalid appointment status.");
            }

            ticketsQuery = ticketsQuery.Where(item => item.Status == status);
        }

        if (query.CategoryId.HasValue)
        {
            ticketsQuery = ticketsQuery.Where(item => item.CategoryId == query.CategoryId.Value);
        }

        var total = await ticketsQuery.CountAsync();
        var items = await ticketsQuery
            .OrderBy(item => item.AppointmentAt)
            .ThenByDescending(item => item.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResponse<TicketResponse>(items.Select(item => item.ToResponse()), page, pageSize, total);
    }

    public async Task<TicketResponse> GetByIdAsync(int id, string currentUserId, string currentRole)
    {
        var ticket = await GetTicketQuery()
            .FirstOrDefaultAsync(item => item.Id == id)
            ?? throw new NotFoundException($"Appointment {id} was not found.");

        if (string.Equals(currentRole, "Patient", StringComparison.Ordinal) && !string.Equals(ticket.AuthorId, currentUserId, StringComparison.Ordinal))
        {
            throw new NotFoundException($"Appointment {id} was not found.");
        }

        if (string.Equals(currentRole, "Doctor", StringComparison.Ordinal))
        {
            var currentDoctorId = await GetCurrentDoctorIdAsync(currentUserId);
            EnsureTicketBelongsToCurrentDoctor(ticket, currentDoctorId, id);
        }

        return ticket.ToResponse();
    }

    public async Task<TicketResponse> AssignToMeAsync(int id, string currentUserId, string currentRole)
    {
        EnsureDoctorRole(currentRole);

        var currentDoctorId = await GetCurrentDoctorIdAsync(currentUserId);
        var ticket = await GetTrackedTicketQuery()
            .FirstOrDefaultAsync(item => item.Id == id)
            ?? throw new NotFoundException($"Appointment {id} was not found.");

        EnsureTicketBelongsToCurrentDoctor(ticket, currentDoctorId, id);

        if (!string.IsNullOrWhiteSpace(ticket.AssigneeId) && !string.Equals(ticket.AssigneeId, currentUserId, StringComparison.Ordinal))
        {
            throw new ConflictException("This appointment is already assigned to another doctor.");
        }

        if (string.Equals(ticket.AssigneeId, currentUserId, StringComparison.Ordinal))
        {
            throw new BusinessException("This appointment is already assigned to you.");
        }

        if (ticket.Status is TicketStatus.Resolved or TicketStatus.Closed or TicketStatus.Rejected)
        {
            throw new BusinessException("Final appointment cannot be assigned.");
        }

        ticket.AssigneeId = currentUserId;
        if (ticket.Status == TicketStatus.New)
        {
            ticket.Status = TicketStatus.InProgress;
        }

        await _db.SaveChangesAsync();
        return await GetTicketResponseAsync(id);
    }

    public async Task<TicketResponse> ChangeStatusAsync(int id, ChangeStatusRequest request, string currentUserId, string currentRole)
    {
        EnsureDoctorRole(currentRole);

        var currentDoctorId = await GetCurrentDoctorIdAsync(currentUserId);
        var ticket = await GetTrackedTicketQuery()
            .FirstOrDefaultAsync(item => item.Id == id)
            ?? throw new NotFoundException($"Appointment {id} was not found.");

        EnsureTicketBelongsToCurrentDoctor(ticket, currentDoctorId, id);

        if (!string.Equals(ticket.AssigneeId, currentUserId, StringComparison.Ordinal))
        {
            throw new ForbiddenException("Only assigned doctor can change appointment status.");
        }

        if (!Enum.TryParse<TicketStatus>(request.Status, true, out var nextStatus))
        {
            throw new BusinessException("Invalid appointment status.");
        }

        if (ticket.Status == nextStatus)
        {
            throw new BusinessException("Appointment already has selected status.");
        }

        if (!IsValidTransition(ticket.Status, nextStatus))
        {
            throw new BusinessException("Status transition is not allowed.");
        }

        if (nextStatus == TicketStatus.Resolved && (ticket.DiagnosisId is null || string.IsNullOrWhiteSpace(ticket.Treatment)))
        {
            throw new BusinessException("Fill diagnosis and treatment before completing appointment.");
        }

        ticket.Status = nextStatus;
        await _db.SaveChangesAsync();
        return await GetTicketResponseAsync(id);
    }

    public async Task<TicketResponse> RejectAsync(int id, RejectRequest request, string currentUserId, string currentRole)
    {
        EnsureDoctorRole(currentRole);

        var currentDoctorId = await GetCurrentDoctorIdAsync(currentUserId);
        var ticket = await GetTrackedTicketQuery()
            .FirstOrDefaultAsync(item => item.Id == id)
            ?? throw new NotFoundException($"Appointment {id} was not found.");

        EnsureTicketBelongsToCurrentDoctor(ticket, currentDoctorId, id);

        var canRejectOwnAssignedTicket = string.Equals(ticket.AssigneeId, currentUserId, StringComparison.Ordinal);
        var canRejectNewUnassignedTicket = ticket.Status == TicketStatus.New && string.IsNullOrWhiteSpace(ticket.AssigneeId);
        if (!canRejectOwnAssignedTicket && !canRejectNewUnassignedTicket)
        {
            throw new ForbiddenException("Only assigned doctor can reject appointment, except for new unassigned appointments.");
        }

        if (ticket.Status is TicketStatus.Closed or TicketStatus.Rejected)
        {
            throw new BusinessException("Appointment already has final status.");
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new BusinessException("Reject reason is required.");
        }

        ticket.Status = TicketStatus.Rejected;
        ticket.AssigneeId ??= currentUserId;
        await _db.SaveChangesAsync();
        return await GetTicketResponseAsync(id);
    }

    public async Task<TicketResponse> UpdateMedicalRecordAsync(int id, UpdateMedicalRecordRequest request, string currentUserId, string currentRole)
    {
        EnsureDoctorRole(currentRole);

        var currentDoctorId = await GetCurrentDoctorIdAsync(currentUserId);
        var ticket = await GetTrackedTicketQuery()
            .FirstOrDefaultAsync(item => item.Id == id)
            ?? throw new NotFoundException($"Appointment {id} was not found.");

        EnsureTicketBelongsToCurrentDoctor(ticket, currentDoctorId, id);

        if (!string.Equals(ticket.AssigneeId, currentUserId, StringComparison.Ordinal))
        {
            throw new ForbiddenException("Only assigned doctor can update medical record.");
        }

        if (ticket.Status is TicketStatus.Closed or TicketStatus.Rejected)
        {
            throw new BusinessException("Medical record cannot be updated for final appointment.");
        }

        var treatment = request.Treatment.Trim();
        if (string.IsNullOrWhiteSpace(treatment))
        {
            throw new BusinessException("Treatment is required.");
        }

        var diagnosis = await _db.Diagnoses
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == request.DiagnosisId && item.IsActive)
            ?? throw new BusinessException("Diagnosis was not found.");

        if (!string.Equals(diagnosis.Specialty, ticket.Doctor.Specialty, StringComparison.Ordinal))
        {
            throw new BusinessException("Diagnosis does not match doctor specialty.");
        }

        ticket.DiagnosisId = diagnosis.Id;
        ticket.Treatment = treatment;
        await _db.SaveChangesAsync();
        return await GetTicketResponseAsync(id);
    }

    private IQueryable<Ticket> GetTicketQuery() =>
        _db.Tickets
            .Include(item => item.Category)
            .Include(item => item.Doctor)
            .Include(item => item.DoctorTimeSlot)
            .Include(item => item.Author)
            .Include(item => item.Assignee)
            .Include(item => item.Diagnosis)
            .AsNoTracking();

    private IQueryable<Ticket> GetTrackedTicketQuery() =>
        _db.Tickets
            .Include(item => item.Category)
            .Include(item => item.Doctor)
            .Include(item => item.DoctorTimeSlot)
            .Include(item => item.Author)
            .Include(item => item.Assignee)
            .Include(item => item.Diagnosis);

    private async Task<int> GetCurrentDoctorIdAsync(string currentUserId)
    {
        var doctor = await _db.Doctors
            .AsNoTracking()
            .Join(
                GetDoctorRoleUsersQuery().Where(user => user.Id == currentUserId),
                doctor => doctor.Email,
                user => user.Email!,
                (doctor, _) => doctor)
            .FirstOrDefaultAsync()
            ?? throw new ForbiddenException("Doctor card for current account was not found.");

        return doctor.Id;
    }

    private IQueryable<ApplicationUser> GetDoctorRoleUsersQuery()
    {
        return from user in _db.Users.AsNoTracking()
               join userRole in _db.UserRoles.AsNoTracking() on user.Id equals userRole.UserId
               join role in _db.Roles.AsNoTracking() on userRole.RoleId equals role.Id
               where role.Name == "Doctor"
               select user;
    }

    private async Task<TicketResponse> GetTicketResponseAsync(int id)
    {
        var ticket = await GetTicketQuery().FirstAsync(item => item.Id == id);
        return ticket.ToResponse();
    }

    private static bool IsValidTransition(TicketStatus current, TicketStatus next) =>
        (current, next) switch
        {
            (TicketStatus.New, TicketStatus.InProgress) => true,
            (TicketStatus.InProgress, TicketStatus.Resolved) => true,
            _ => false
        };

    private static void EnsureDoctorRole(string currentRole)
    {
        if (!string.Equals(currentRole, "Doctor", StringComparison.Ordinal))
        {
            throw new UnauthorizedException("Only doctor can perform this action.");
        }
    }

    private static void EnsureTicketBelongsToCurrentDoctor(Ticket ticket, int currentDoctorId, int ticketId)
    {
        if (ticket.DoctorId != currentDoctorId)
        {
            throw new NotFoundException($"Appointment {ticketId} was not found.");
        }
    }
}
