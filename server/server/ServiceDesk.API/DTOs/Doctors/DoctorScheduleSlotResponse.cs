namespace ServiceDesk.API.DTOs.Doctors;

public sealed class DoctorScheduleSlotResponse
{
    public int Id { get; set; }
    public DateTimeOffset StartAt { get; set; }
    public bool IsBooked { get; set; }
    public int? TicketId { get; set; }
    public string? PatientName { get; set; }
    public string? CategoryName { get; set; }
    public string? Status { get; set; }
}
