using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Application.Abstractions.Persistence;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.Application.Mapping;
using ServiceDesk.API.DTOs.Users;
using ServiceDesk.API.Exceptions;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Application.Services;

public class UserAdminService : IUserAdminService
{
    private static readonly HashSet<string> ValidRoles = ["Patient", "Doctor", "Admin"];
    private const string DefaultDoctorSpecialty = "Не указана";

    private readonly IAppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<UserAdminService> _logger;

    public UserAdminService(
        IAppDbContext db,
        UserManager<ApplicationUser> userManager,
        ILogger<UserAdminService> logger)
    {
        _db = db;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<IReadOnlyList<UserResponse>> GetAllAsync()
    {
        var users = await _userManager.Users
            .OrderBy(user => user.DisplayName)
            .ThenBy(user => user.Email)
            .ToListAsync();

        var result = new List<UserResponse>(users.Count);

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? "Patient";
            result.Add(user.ToResponse(role));
        }

        return result;
    }

    public async Task<UserResponse> UpdateRoleAsync(string userId, UpdateUserRoleRequest request)
    {
        var requestedRole = (request.Role ?? string.Empty).Trim();
        if (!ValidRoles.Contains(requestedRole))
        {
            throw new BusinessException("Допустимые роли: Patient, Doctor, Admin.");
        }

        var user = await _userManager.FindByIdAsync(userId)
            ?? throw new NotFoundException($"Пользователь с id {userId} не найден.");

        var currentRoles = await _userManager.GetRolesAsync(user);
        var oldRole = currentRoles.FirstOrDefault() ?? "None";

        if (currentRoles.Count > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
            {
                throw new BusinessException($"Не удалось удалить текущую роль: {FormatIdentityErrors(removeResult)}");
            }
        }

        var addResult = await _userManager.AddToRoleAsync(user, requestedRole);
        if (!addResult.Succeeded)
        {
            throw new BusinessException($"Не удалось назначить роль: {FormatIdentityErrors(addResult)}");
        }

        if (currentRoles.Contains("Patient") && requestedRole != "Patient")
        {
            await RemovePatientAppointmentsAsync(user.Id);
        }

        if (requestedRole == "Doctor")
        {
            await EnsureDoctorCardAsync(user);
        }

        _logger.LogInformation("Changed user {UserId} role from {OldRole} to {NewRole}", user.Id, oldRole, requestedRole);

        return user.ToResponse(requestedRole);
    }

    private async Task EnsureDoctorCardAsync(ApplicationUser user)
    {
        var email = NormalizeRequired(user.Email, "Email пользователя");
        var doctor = await _db.Doctors.FirstOrDefaultAsync(item => item.Email == email);

        if (doctor is not null)
        {
            doctor.FullName = NormalizeRequired(user.DisplayName, "ФИО пользователя");
            doctor.Status = DoctorStatus.Active;
            await _db.SaveChangesAsync();
            return;
        }

        _db.Doctors.Add(new Doctor
        {
            FullName = NormalizeRequired(user.DisplayName, "ФИО пользователя"),
            Email = email,
            Specialty = DefaultDoctorSpecialty,
            Status = DoctorStatus.Active
        });

        await _db.SaveChangesAsync();
    }

    private async Task RemovePatientAppointmentsAsync(string userId)
    {
        var appointments = await _db.Tickets
            .Include(ticket => ticket.DoctorTimeSlot)
            .Where(ticket => ticket.AuthorId == userId)
            .ToListAsync();

        if (appointments.Count == 0)
        {
            return;
        }

        foreach (var appointment in appointments)
        {
            appointment.DoctorTimeSlot.IsBooked = false;
        }

        _db.Tickets.RemoveRange(appointments);
        await _db.SaveChangesAsync();
    }

    private static string FormatIdentityErrors(IdentityResult result)
    {
        return string.Join("; ", result.Errors.Select(error => error.Description));
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
}
