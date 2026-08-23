using System.ComponentModel.DataAnnotations;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.DTOs.Tickets;

public sealed class CreateTicketRequest
{
    [Required]
    [MaxLength(2000)]
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
    public TicketPriority Priority { get; set; }
}
