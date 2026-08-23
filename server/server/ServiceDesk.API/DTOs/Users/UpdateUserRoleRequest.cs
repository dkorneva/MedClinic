using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.API.DTOs.Users;

public sealed class UpdateUserRoleRequest
{
    [Required]
    public string Role { get; set; } = string.Empty;
}
