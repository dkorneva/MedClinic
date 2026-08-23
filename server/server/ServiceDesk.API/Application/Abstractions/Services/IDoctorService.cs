using ServiceDesk.API.DTOs.Doctors;

namespace ServiceDesk.API.Application.Abstractions.Services;

public interface IDoctorService
{
    Task<IReadOnlyList<DoctorResponse>> GetAllAsync(DoctorListQuery query);
    Task<IReadOnlyList<string>> GetSpecialtiesAsync();
    Task<IReadOnlyList<DoctorTimeSlotResponse>> GetAvailableSlotsAsync(int doctorId);
    Task<IReadOnlyList<DoctorScheduleSlotResponse>> GetScheduleAsync(int doctorId);
    Task<IReadOnlyList<DoctorScheduleSlotResponse>> GetOwnScheduleAsync(string currentUserId);
    Task<IReadOnlyList<DoctorScheduleSlotResponse>> UpdateScheduleAsync(int doctorId, UpdateDoctorScheduleRequest request);
    Task<DoctorResponse> CreateAsync(CreateDoctorRequest request);
    Task<DoctorResponse> UpdateAsync(int id, UpdateDoctorRequest request);
    Task DeleteAsync(int id);
}
