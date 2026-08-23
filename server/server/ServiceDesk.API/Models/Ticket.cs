namespace ServiceDesk.API.Models;

public class Ticket
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketStatus Status { get; set; } = TicketStatus.New;
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public int CategoryId { get; set; }
    public Category Category { get; set; } = default!;
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = default!;
    public int DoctorTimeSlotId { get; set; }
    public DoctorTimeSlot DoctorTimeSlot { get; set; } = default!;
    public DateTimeOffset AppointmentAt { get; set; }
    public string AuthorId { get; set; } = string.Empty;
    public ApplicationUser Author { get; set; } = default!;
    public string? AssigneeId { get; set; }
    public ApplicationUser? Assignee { get; set; }
    public int? DiagnosisId { get; set; }
    public Diagnosis? Diagnosis { get; set; }
    public string? Treatment { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}
