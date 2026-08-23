using ServiceDesk.API.DTOs.Doctors;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Application.Mapping;

public static class DoctorMapping
{
    // расширение
    public static DoctorResponse ToResponse(this Doctor doctor) => new()
    {
        Id = doctor.Id,
        FullName = doctor.FullName,
        Email = doctor.Email,
        Specialty = doctor.Specialty,
        Status = doctor.Status.ToString()
    };

    public static DoctorTimeSlotResponse ToResponse(this DoctorTimeSlot slot) => new()
    {
        Id = slot.Id,
        StartAt = slot.StartAt,
        IsBooked = slot.IsBooked
    };
}
