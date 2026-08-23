namespace ServiceDesk.API.DTOs.Doctors;

public sealed class DoctorResponse
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
