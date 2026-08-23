using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Application.Abstractions.Persistence;

public interface IAppDbContext
{
    DbSet<Category> Categories { get; }
    DbSet<Diagnosis> Diagnoses { get; }
    DbSet<Doctor> Doctors { get; }
    DbSet<DoctorTimeSlot> DoctorTimeSlots { get; }
    DbSet<Ticket> Tickets { get; }
    DbSet<ApplicationUser> Users { get; }
    DbSet<IdentityRole> Roles { get; }
    DbSet<IdentityUserRole<string>> UserRoles { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
