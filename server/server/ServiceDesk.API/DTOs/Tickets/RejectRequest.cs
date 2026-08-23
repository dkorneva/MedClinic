using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.API.DTOs.Tickets;

public sealed class RejectRequest
{
    [Required]
    [MaxLength(500)]
    public string Reason { get; set; } = string.Empty;
}
