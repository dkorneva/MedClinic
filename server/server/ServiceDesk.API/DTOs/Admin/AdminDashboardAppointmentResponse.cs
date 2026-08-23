namespace ServiceDesk.API.DTOs.Admin;

public sealed class AdminDashboardAppointmentResponse
{
    public int TicketId { get; set; }
    public DateTimeOffset AppointmentAt { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string DoctorName { get; set; } = string.Empty;
    public string DoctorSpecialty { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
