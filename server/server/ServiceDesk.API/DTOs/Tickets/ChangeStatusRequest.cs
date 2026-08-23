using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.API.DTOs.Tickets;

public sealed class ChangeStatusRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
}
