namespace ServiceDesk.API.DTOs.Doctors;

public sealed class UpdateDoctorScheduleRequest
{
    public IReadOnlyList<string> Slots { get; set; } = [];
}
