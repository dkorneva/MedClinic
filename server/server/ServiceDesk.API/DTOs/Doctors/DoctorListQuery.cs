namespace ServiceDesk.API.DTOs.Doctors;

public sealed class DoctorListQuery
{
    public bool IncludeInactive { get; set; }
    public string? Specialty { get; set; }
}
