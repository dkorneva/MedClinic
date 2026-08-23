using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ServiceDesk.API.Data;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Tests.Infrastructure;

public sealed record TestUser(string Id, string Email, string Password, string DisplayName, string Role);
public sealed record TestDoctor(int Id, string FullName, string Email, string Specialty);

public static class TestDataSeeder
{
    public static async Task EnsureDefaultRolesAsync(ServiceDeskWebApplicationFactory factory)
    {
        using var scope = factory.Services.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var role in new[] { "Patient", "Doctor", "Admin" })
        {
            if (await roleManager.RoleExistsAsync(role))
            {
                continue;
            }

            var createRoleResult = await roleManager.CreateAsync(new IdentityRole(role));
            EnsureSucceeded(createRoleResult, $"create role '{role}'");
        }
    }

    public static async Task<TestUser> CreateUserWithRoleAsync(
        ServiceDeskWebApplicationFactory factory,
        string role,
        string? email = null,
        string? displayName = null,
        string password = "Password123!")
    {
        email ??= $"{role.ToLowerInvariant()}.{Guid.NewGuid():N}@test.local";
        displayName ??= $"{role} User {Guid.NewGuid():N}";

        await EnsureDefaultRolesAsync(factory);

        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            DisplayName = displayName
        };

        var createUserResult = await userManager.CreateAsync(user, password);
        EnsureSucceeded(createUserResult, $"create user '{email}'");

        var addRoleResult = await userManager.AddToRoleAsync(user, role);
        EnsureSucceeded(addRoleResult, $"add user '{email}' to role '{role}'");

        return new TestUser(user.Id, email, password, displayName, role);
    }

    public static async Task<(TestUser User, TestDoctor Doctor)> CreateDoctorUserAsync(
        ServiceDeskWebApplicationFactory factory,
        string specialty = "Cardiology",
        string? email = null,
        string? displayName = null,
        string password = "Password123!")
    {
        var doctorUser = await CreateUserWithRoleAsync(factory, "Doctor", email, displayName, password);

        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var doctor = new Doctor
        {
            FullName = doctorUser.DisplayName,
            Email = doctorUser.Email,
            Specialty = specialty,
            Status = DoctorStatus.Active
        };

        db.Doctors.Add(doctor);
        await db.SaveChangesAsync();

        return (doctorUser, new TestDoctor(doctor.Id, doctor.FullName, doctor.Email, doctor.Specialty));
    }

    public static async Task<int> CreateActiveCategoryAsync(
        ServiceDeskWebApplicationFactory factory,
        string specialty,
        string? name = null,
        decimal price = 1500m)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var category = new Category
        {
            Name = name ?? $"Service {Guid.NewGuid():N}",
            DoctorSpecialty = specialty,
            Price = price,
            IsActive = true
        };

        db.Categories.Add(category);
        await db.SaveChangesAsync();
        return category.Id;
    }

    public static async Task<int> CreateFutureSlotAsync(
        ServiceDeskWebApplicationFactory factory,
        int doctorId,
        DateTimeOffset? startAt = null)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var slot = new DoctorTimeSlot
        {
            DoctorId = doctorId,
            StartAt = startAt ?? DateTimeOffset.UtcNow.AddDays(2),
            IsBooked = false
        };

        db.DoctorTimeSlots.Add(slot);
        await db.SaveChangesAsync();
        return slot.Id;
    }

    public static async Task<int> CreateDiagnosisAsync(
        ServiceDeskWebApplicationFactory factory,
        string specialty,
        string? name = null)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var diagnosis = new Diagnosis
        {
            Name = name ?? $"Diagnosis {Guid.NewGuid():N}",
            Specialty = specialty,
            IsActive = true
        };

        db.Diagnoses.Add(diagnosis);
        await db.SaveChangesAsync();
        return diagnosis.Id;
    }

    public static async Task<int> SeedTicketAsync(
        ServiceDeskWebApplicationFactory factory,
        string patientUserId,
        int doctorId,
        int categoryId,
        int slotId,
        TicketStatus status = TicketStatus.New,
        string? assigneeId = null,
        int? diagnosisId = null,
        string? treatment = null,
        TicketPriority priority = TicketPriority.Medium,
        string? description = null)
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var slot = await db.DoctorTimeSlots.FirstAsync(item => item.Id == slotId);
        slot.IsBooked = true;

        var category = await db.Categories.AsNoTracking().FirstAsync(item => item.Id == categoryId);

        var ticket = new Ticket
        {
            Title = $"Appointment for {category.Name}",
            Description = description ?? $"Appointment {Guid.NewGuid():N}",
            Status = status,
            Priority = priority,
            CategoryId = categoryId,
            DoctorId = doctorId,
            DoctorTimeSlotId = slotId,
            AppointmentAt = slot.StartAt,
            AuthorId = patientUserId,
            AssigneeId = assigneeId,
            DiagnosisId = diagnosisId,
            Treatment = treatment
        };

        db.Tickets.Add(ticket);
        await db.SaveChangesAsync();
        return ticket.Id;
    }

    public static async Task<IReadOnlyList<string>> GetUserRolesAsync(
        ServiceDeskWebApplicationFactory factory,
        string userId)
    {
        using var scope = factory.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var user = await userManager.FindByIdAsync(userId)
            ?? throw new InvalidOperationException($"User '{userId}' was not found.");

        var roles = await userManager.GetRolesAsync(user);
        return roles.ToList();
    }

    private static void EnsureSucceeded(IdentityResult result, string operation)
    {
        if (result.Succeeded)
        {
            return;
        }

        var errors = string.Join(", ", result.Errors.Select(error => error.Description));
        throw new InvalidOperationException($"Failed to {operation}: {errors}");
    }
}
