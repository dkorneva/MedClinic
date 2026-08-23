using ServiceDesk.API.DTOs.Users;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Application.Mapping;

public static class UserMapping
{
    public static UserResponse ToResponse(this ApplicationUser user, string role) => new()
    {
        Id = user.Id,
        DisplayName = user.DisplayName,
        Email = user.Email ?? string.Empty,
        Role = role
    };
}
