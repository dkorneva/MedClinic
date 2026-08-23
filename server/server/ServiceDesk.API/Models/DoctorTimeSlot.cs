namespace ServiceDesk.API.Models;

public class DoctorTimeSlot
{
    public int Id { get; set; }
    public int DoctorId { get; set; }
    public Doctor Doctor { get; set; } = default!;
    public DateTimeOffset StartAt { get; set; }
    public bool IsBooked { get; set; }
    public Ticket? Ticket { get; set; }
}
