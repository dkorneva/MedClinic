using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Application.Abstractions.Persistence;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.DTOs.Diagnoses;
using ServiceDesk.API.Exceptions;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Application.Services;

public class DiagnosisService : IDiagnosisService
{
    private readonly IAppDbContext _db;

    public DiagnosisService(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<IReadOnlyList<DiagnosisResponse>> GetListAsync(string? specialty, string currentUserId, string currentRole)
    {
        var effectiveSpecialty = specialty?.Trim();

        if (string.Equals(currentRole, "Doctor", StringComparison.Ordinal) && string.IsNullOrWhiteSpace(effectiveSpecialty))
        {
            effectiveSpecialty = await GetDoctorSpecialtyAsync(currentUserId);
        }

        var query = _db.Diagnoses.AsNoTracking().Where(item => item.IsActive);

        if (!string.IsNullOrWhiteSpace(effectiveSpecialty))
        {
            query = query.Where(item => item.Specialty == effectiveSpecialty);
        }

        return await query
            .OrderBy(item => item.Specialty)
            .ThenBy(item => item.Name)
            .Select(item => new DiagnosisResponse
            {
                Id = item.Id,
                Name = item.Name,
                Specialty = item.Specialty
            })
            .ToListAsync();
    }

    private async Task<string> GetDoctorSpecialtyAsync(string currentUserId)
    {
        var doctor = await (
            from doctorItem in _db.Doctors.AsNoTracking()
            join user in _db.Users.AsNoTracking() on doctorItem.Email equals user.Email
            join userRole in _db.UserRoles.AsNoTracking() on user.Id equals userRole.UserId
            join role in _db.Roles.AsNoTracking() on userRole.RoleId equals role.Id
            where user.Id == currentUserId && role.Name == "Doctor"
            select doctorItem)
            .FirstOrDefaultAsync()
            ?? throw new ForbiddenException("Для текущего аккаунта врача не найдена карточка врача.");

        return doctor.Specialty;
    }
}
