namespace ServiceDesk.API.DTOs.Doctors;

public sealed class DoctorTimeSlotResponse
{
    public int Id { get; set; }
    public DateTimeOffset StartAt { get; set; }
    public bool IsBooked { get; set; }
}
