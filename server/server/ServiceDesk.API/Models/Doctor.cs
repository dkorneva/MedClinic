namespace ServiceDesk.API.Models;

public class Doctor
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public DoctorStatus Status { get; set; } = DoctorStatus.Active;
    public ICollection<DoctorTimeSlot> TimeSlots { get; set; } = new List<DoctorTimeSlot>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
