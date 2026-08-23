namespace ServiceDesk.API.DTOs.Tickets;

public sealed class TicketResponse
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset AppointmentAt { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string DoctorSpecialty { get; set; } = string.Empty;
    public int DoctorId { get; set; }
    public string DoctorFullName { get; set; } = string.Empty;
    public int DoctorTimeSlotId { get; set; }
    public int? DiagnosisId { get; set; }
    public string? DiagnosisName { get; set; }
    public string? Treatment { get; set; }
    public UserBriefResponse Author { get; set; } = default!;
    public UserBriefResponse? Assignee { get; set; }
}
