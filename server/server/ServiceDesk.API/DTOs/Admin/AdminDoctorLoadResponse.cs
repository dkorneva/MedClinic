namespace ServiceDesk.API.DTOs.Admin;

public sealed class AdminDoctorLoadResponse
{
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public int TotalSlots { get; set; }
    public int BookedSlots { get; set; }
    public decimal LoadPercent { get; set; }
}
