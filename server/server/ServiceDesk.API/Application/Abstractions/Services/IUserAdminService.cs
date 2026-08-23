using ServiceDesk.API.DTOs.Users;

namespace ServiceDesk.API.Application.Abstractions.Services;

public interface IUserAdminService
{
    Task<IReadOnlyList<UserResponse>> GetAllAsync();
    Task<UserResponse> UpdateRoleAsync(string userId, UpdateUserRoleRequest request);
}
