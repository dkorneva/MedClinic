using ServiceDesk.API.DTOs.Diagnoses;

namespace ServiceDesk.API.Application.Abstractions.Services;

public interface IDiagnosisService
{
    Task<IReadOnlyList<DiagnosisResponse>> GetListAsync(string? specialty, string currentUserId, string currentRole);
}
