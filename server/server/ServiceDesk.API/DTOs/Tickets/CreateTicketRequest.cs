using System.ComponentModel.DataAnnotations;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.DTOs.Tickets;

public sealed class CreateTicketRequest
{
    [Required]
    [TrimmedTextLength]
    public string Description { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string DoctorSpecialty { get; set; } = string.Empty;

    [Required]
    public int CategoryId { get; set; }

    [Required]
    public int DoctorId { get; set; }

    [Required]
    public int DoctorTimeSlotId { get; set; }

    [Required]
    [System.Text.Json.Serialization.JsonRequired]
    [EnumDataType(typeof(TicketPriority))]
    public TicketPriority Priority { get; set; }
}
