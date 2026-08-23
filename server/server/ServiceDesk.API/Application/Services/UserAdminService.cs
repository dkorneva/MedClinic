using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.Application.Mapping;
using ServiceDesk.API.DTOs.Users;
using ServiceDesk.API.Exceptions;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Application.Services;

public class UserAdminService : IUserAdminService
{
    private static readonly HashSet<string> ValidRoles = ["Patient", "Doctor", "Admin"];

    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<UserAdminService> _logger;

    public UserAdminService(
        UserManager<ApplicationUser> userManager,
        ILogger<UserAdminService> logger)
    {
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

        _logger.LogInformation("Changed user {UserId} role from {OldRole} to {NewRole}", user.Id, oldRole, requestedRole);

        return user.ToResponse(requestedRole);
    }

    private static string FormatIdentityErrors(IdentityResult result)
    {
        return string.Join("; ", result.Errors.Select(error => error.Description));
    }
}
