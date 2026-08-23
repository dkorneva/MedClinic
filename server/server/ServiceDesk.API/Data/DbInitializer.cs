using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Data;

public static class DbInitializer
{
    private record SeedUser(string Email, string Password, string DisplayName, string Role);
    private record SeedDoctor(string FullName, string Email, string Specialty, DoctorStatus Status, IReadOnlyList<DateTimeOffset> Slots);
    private record SeedCategory(string Name, string DoctorSpecialty, decimal Price, bool IsActive);
    private record SeedDiagnosis(string Name, string Specialty);
    private record SeedTicket(
        string Description,
        string PatientEmail,
        string CategoryName,
        string DoctorEmail,
        string? AssigneeEmail,
        TicketPriority Priority,
        TicketStatus Status,
        int SlotIndex,
        int CreatedDaysAgo,
        string? DiagnosisName = null,
        string? Treatment = null);

    private static readonly string[] Roles = ["Patient", "Doctor", "Admin"];
    private static readonly string[] LegacyRoles = ["Student", "Operator"];
    private static readonly string[] LegacyUserEmails = ["student@demo.com", "operator@demo.com", "doctor1@demo.com", "doctor2@demo.com"];
    private static readonly string[] LegacyCategoryNames = ["Account Management", "Hardware Issues", "Network Problems", "Security Concerns", "Software Issues"];
    private static readonly string[] LegacyDoctorEmails = ["doctor1@demo.com", "doctor2@demo.com", "operator1@demo.com", "operator2@demo.com"];
    private static readonly string[] LegacyDoctorNames = ["Doctor One", "Doctor Two", "Operator One", "Operator Two"];
    private const string ArchivedDoctorNamePrefix = "Архивный врач #";
    private const string LegacyDoctorEmailPrefix = "legacy-doctor-";

    private static readonly SeedUser[] Users =
    [
        new("admin@demo.com", "Admin123!", "Администратор клиники", "Admin"),
        new("petrov@medclinic.ru", "Doctor123!", "Петров Александр Иванович", "Doctor"),
        new("sokolova@medclinic.ru", "Doctor123!", "Соколова Марина Викторовна", "Doctor"),
        new("morozov@medclinic.ru", "Doctor123!", "Морозов Сергей Николаевич", "Doctor"),
        new("kozlova@medclinic.ru", "Doctor123!", "Козлова Ирина Владимировна", "Doctor"),
        new("novikov@medclinic.ru", "Doctor123!", "Новиков Дмитрий Сергеевич", "Doctor"),
        new("patient1@demo.com", "Patient123!", "Мария Волкова", "Patient"),
        new("patient2@demo.com", "Patient123!", "Алексей Крылов", "Patient"),
        new("patient3@demo.com", "Patient123!", "Елена Соколова", "Patient")
    ];

    private static readonly DateTimeOffset SeedBaseUtc = new(2026, 4, 20, 0, 0, 0, TimeSpan.Zero);

    private static readonly SeedDoctor[] Doctors =
    [
        new("Петров Александр Иванович", "petrov@medclinic.ru", "Терапевт", DoctorStatus.Active, CreateWeeklySlots((9, 0), (10, 0), (11, 0), (12, 0))),
        new("Соколова Марина Викторовна", "sokolova@medclinic.ru", "Терапевт", DoctorStatus.Active, CreateWeeklySlots((10, 0), (11, 30), (13, 0))),
        new("Морозов Сергей Николаевич", "morozov@medclinic.ru", "Кардиолог", DoctorStatus.Active, CreateWeeklySlots((14, 0), (15, 0), (16, 0))),
        new("Козлова Ирина Владимировна", "kozlova@medclinic.ru", "Гинеколог", DoctorStatus.Active, CreateWeeklySlots((9, 30), (10, 30), (11, 30))),
        new("Новиков Дмитрий Сергеевич", "novikov@medclinic.ru", "Врач ультразвуковой диагностики", DoctorStatus.Active, CreateWeeklySlots((13, 0), (14, 0), (15, 0)))
    ];

    private static readonly SeedCategory[] Categories =
    [
        new("Первичный прием терапевта", "Терапевт", 2500m, true),
        new("Повторный прием терапевта", "Терапевт", 2200m, true),
        new("Консультация кардиолога", "Кардиолог", 3200m, true),
        new("УЗИ органов брюшной полости", "Врач ультразвуковой диагностики", 2800m, true),
        new("Повторный прием гинеколога", "Гинеколог", 2300m, true)
    ];

    private static readonly SeedDiagnosis[] Diagnoses =
    [
        new("ОРВИ", "Терапевт"),
        new("Острый фарингит", "Терапевт"),
        new("Артериальная гипертензия", "Кардиолог"),
        new("Синусовая тахикардия", "Кардиолог"),
        new("Киста яичника", "Гинеколог"),
        new("Плановое наблюдение", "Гинеколог"),
        new("Диффузные изменения печени", "Врач ультразвуковой диагностики"),
        new("Без патологии", "Врач ультразвуковой диагностики")
    ];

    private static readonly SeedTicket[] Tickets =
    [
        new("Повышенная температура и першение в горле второй день.", "patient1@demo.com", "Первичный прием терапевта", "petrov@medclinic.ru", null, TicketPriority.Medium, TicketStatus.New, 0, 1),
        new("Нужна плановая консультация перед чек-апом.", "patient2@demo.com", "Повторный прием терапевта", "sokolova@medclinic.ru", null, TicketPriority.Low, TicketStatus.New, 0, 1),
        new("Беспокоит учащенное сердцебиение после нагрузки.", "patient3@demo.com", "Консультация кардиолога", "morozov@medclinic.ru", "morozov@medclinic.ru", TicketPriority.High, TicketStatus.InProgress, 0, 2),
        new("Контрольный прием после назначенного лечения.", "patient1@demo.com", "Повторный прием гинеколога", "kozlova@medclinic.ru", "kozlova@medclinic.ru", TicketPriority.Medium, TicketStatus.InProgress, 0, 3),
        new("Нужно проверить результаты УЗИ и получить рекомендации.", "patient2@demo.com", "УЗИ органов брюшной полости", "novikov@medclinic.ru", "novikov@medclinic.ru", TicketPriority.Medium, TicketStatus.Resolved, 0, 5, "Без патологии", "Рекомендовано динамическое наблюдение и повторное УЗИ через 6 месяцев."),
        new("Повторная консультация по давлению после обследования.", "patient3@demo.com", "Консультация кардиолога", "morozov@medclinic.ru", "morozov@medclinic.ru", TicketPriority.High, TicketStatus.Resolved, 1, 7, "Артериальная гипертензия", "Назначен контроль артериального давления, коррекция образа жизни и повторный прием через 2 недели."),
        new("Пациент просит перенести прием без свободных слотов на нужную дату.", "patient1@demo.com", "Первичный прием терапевта", "petrov@medclinic.ru", "petrov@medclinic.ru", TicketPriority.Low, TicketStatus.Rejected, 1, 4)
    ];

    public static async Task SeedAsync(IServiceProvider services)
    {
        var db = services.GetRequiredService<AppDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
        var logger = services.GetRequiredService<ILogger<AppDbContext>>();

        foreach (var role in Roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                var roleResult = await roleManager.CreateAsync(new IdentityRole(role));
                if (!roleResult.Succeeded)
                {
                    logger.LogError("Failed to create role {Role}: {Errors}", role, string.Join(", ", roleResult.Errors.Select(error => error.Description)));
                }
            }
        }

        await RemoveLegacyUsersAndRolesAsync(db, userManager, roleManager, logger);
        await RemoveLegacyCategoriesAsync(db, logger);
        await RemoveLegacyDoctorsAsync(db, logger);
        await SeedUsersAsync(userManager, logger);
        await SeedDoctorsAsync(db);
        await SeedCategoriesAsync(db);
        await SeedDiagnosesAsync(db);
        await SeedTicketsAsync(db, userManager, logger);
        logger.LogInformation("Clinic service seed completed");
    }

    private static async Task SeedUsersAsync(UserManager<ApplicationUser> userManager, ILogger logger)
    {
        foreach (var seed in Users)
        {
            if (await userManager.FindByEmailAsync(seed.Email) is { } existingUser)
            {
                existingUser.DisplayName = seed.DisplayName;
                existingUser.UserName = seed.Email;
                existingUser.Email = seed.Email;

                var updateResult = await userManager.UpdateAsync(existingUser);
                if (!updateResult.Succeeded)
                {
                    logger.LogWarning("Failed to update seeded user {Email}: {Errors}", seed.Email, string.Join(", ", updateResult.Errors.Select(error => error.Description)));
                }

                var existingRoles = await userManager.GetRolesAsync(existingUser);
                if (!existingRoles.Contains(seed.Role))
                {
                    if (existingRoles.Count > 0)
                    {
                        await userManager.RemoveFromRolesAsync(existingUser, existingRoles);
                    }

                    await userManager.AddToRoleAsync(existingUser, seed.Role);
                }

                continue;
            }

            var user = new ApplicationUser
            {
                UserName = seed.Email,
                Email = seed.Email,
                DisplayName = seed.DisplayName
            };

            var createResult = await userManager.CreateAsync(user, seed.Password);
            if (!createResult.Succeeded)
            {
                logger.LogError("Failed to seed user {Email}: {Errors}", seed.Email, string.Join(", ", createResult.Errors.Select(error => error.Description)));
                continue;
            }

            await userManager.AddToRoleAsync(user, seed.Role);
        }
    }

    private static async Task SeedDoctorsAsync(AppDbContext db)
    {
        foreach (var seed in Doctors)
        {
            var doctor = await db.Doctors
                .Include(item => item.TimeSlots)
                .FirstOrDefaultAsync(item => item.Email == seed.Email);

            if (doctor is null)
            {
                doctor = new Doctor
                {
                    FullName = seed.FullName,
                    Email = seed.Email,
                    Specialty = seed.Specialty,
                    Status = seed.Status
                };
                db.Doctors.Add(doctor);
            }
            else
            {
                doctor.FullName = seed.FullName;
                doctor.Specialty = seed.Specialty;
                doctor.Status = seed.Status;
            }

            var existingStarts = doctor.TimeSlots.Select(slot => slot.StartAt).ToHashSet();
            foreach (var slot in seed.Slots.Where(slot => !existingStarts.Contains(slot)))
            {
                doctor.TimeSlots.Add(new DoctorTimeSlot
                {
                    StartAt = slot,
                    IsBooked = false
                });
            }
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedCategoriesAsync(AppDbContext db)
    {
        foreach (var categorySeed in Categories)
        {
            var existingCategory = await db.Categories.FirstOrDefaultAsync(existing => existing.Name == categorySeed.Name);
            if (existingCategory is not null)
            {
                existingCategory.DoctorSpecialty = categorySeed.DoctorSpecialty;
                existingCategory.Price = categorySeed.Price;
                existingCategory.IsActive = categorySeed.IsActive;
                continue;
            }

            db.Categories.Add(new Category
            {
                Name = categorySeed.Name,
                DoctorSpecialty = categorySeed.DoctorSpecialty,
                Price = categorySeed.Price,
                IsActive = categorySeed.IsActive
            });
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedDiagnosesAsync(AppDbContext db)
    {
        foreach (var diagnosisSeed in Diagnoses)
        {
            var existingDiagnosis = await db.Diagnoses.FirstOrDefaultAsync(existing => existing.Name == diagnosisSeed.Name && existing.Specialty == diagnosisSeed.Specialty);
            if (existingDiagnosis is not null)
            {
                existingDiagnosis.IsActive = true;
                continue;
            }

            db.Diagnoses.Add(new Diagnosis
            {
                Name = diagnosisSeed.Name,
                Specialty = diagnosisSeed.Specialty,
                IsActive = true
            });
        }

        await db.SaveChangesAsync();
    }

    private static async Task SeedTicketsAsync(AppDbContext db, UserManager<ApplicationUser> userManager, ILogger logger)
    {
        if (await db.Tickets.AnyAsync())
        {
            return;
        }

        var usersByEmail = await userManager.Users
            .Where(user => user.Email != null)
            .ToDictionaryAsync(user => user.Email!, StringComparer.OrdinalIgnoreCase);

        var categoriesByName = await db.Categories.ToDictionaryAsync(category => category.Name, StringComparer.OrdinalIgnoreCase);
        var doctorsByEmail = await db.Doctors.Include(doctor => doctor.TimeSlots).ToDictionaryAsync(doctor => doctor.Email, StringComparer.OrdinalIgnoreCase);
        var diagnosesByKey = await db.Diagnoses.ToDictionaryAsync(diagnosis => $"{diagnosis.Specialty}|{diagnosis.Name}", StringComparer.OrdinalIgnoreCase);

        var now = DateTimeOffset.UtcNow;
        var tickets = new List<Ticket>();

        foreach (var seed in Tickets)
        {
            if (!usersByEmail.TryGetValue(seed.PatientEmail, out var patient) ||
                !categoriesByName.TryGetValue(seed.CategoryName, out var category) ||
                !doctorsByEmail.TryGetValue(seed.DoctorEmail, out var doctor))
            {
                continue;
            }

            var slot = doctor.TimeSlots.OrderBy(item => item.StartAt).Skip(seed.SlotIndex).FirstOrDefault();
            if (slot is null || slot.IsBooked)
            {
                continue;
            }

            usersByEmail.TryGetValue(seed.AssigneeEmail ?? string.Empty, out var assignee);
            Diagnosis? diagnosis = null;
            if (!string.IsNullOrWhiteSpace(seed.DiagnosisName))
            {
                diagnosesByKey.TryGetValue($"{doctor.Specialty}|{seed.DiagnosisName}", out diagnosis);
            }

            slot.IsBooked = true;
            tickets.Add(new Ticket
            {
                Title = $"Запись на {category.Name}",
                Description = seed.Description,
                AuthorId = patient.Id,
                AssigneeId = assignee?.Id,
                CategoryId = category.Id,
                DoctorId = doctor.Id,
                DoctorTimeSlotId = slot.Id,
                AppointmentAt = slot.StartAt,
                Priority = seed.Priority,
                Status = seed.Status,
                DiagnosisId = diagnosis?.Id,
                Treatment = seed.Treatment,
                CreatedAt = now.AddDays(-seed.CreatedDaysAgo)
            });
        }

        if (tickets.Count == 0)
        {
            return;
        }

        db.Tickets.AddRange(tickets);
        await db.SaveChangesAsync();
        logger.LogInformation("Seeded {Count} clinic appointments", tickets.Count);
    }

    private static async Task RemoveLegacyUsersAndRolesAsync(AppDbContext db, UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager, ILogger logger)
    {
        foreach (var legacyEmail in LegacyUserEmails)
        {
            var legacyUser = await userManager.FindByEmailAsync(legacyEmail);
            if (legacyUser is null)
            {
                continue;
            }

            await UnassignUserFromTicketsAsync(db, legacyUser.Id);
            var deleteResult = await userManager.DeleteAsync(legacyUser);
            if (!deleteResult.Succeeded)
            {
                logger.LogWarning("Failed to delete legacy user {Email}: {Errors}", legacyEmail, string.Join(", ", deleteResult.Errors.Select(error => error.Description)));
            }
        }

        foreach (var legacyRole in LegacyRoles)
        {
            var role = await roleManager.FindByNameAsync(legacyRole);
            if (role is null)
            {
                continue;
            }

            var usersInRole = await userManager.GetUsersInRoleAsync(legacyRole);
            foreach (var user in usersInRole)
            {
                await UnassignUserFromTicketsAsync(db, user.Id);
                await userManager.DeleteAsync(user);
            }

            await roleManager.DeleteAsync(role);
        }
    }

    private static async Task RemoveLegacyCategoriesAsync(AppDbContext db, ILogger logger)
    {
        var legacyCategories = await db.Categories
            .Where(category => LegacyCategoryNames.Contains(category.Name))
            .ToListAsync();

        if (legacyCategories.Count == 0)
        {
            return;
        }

        var legacyCategoryIds = legacyCategories.Select(category => category.Id).ToHashSet();
        var legacyTickets = await db.Tickets
            .Include(ticket => ticket.DoctorTimeSlot)
            .Where(ticket => legacyCategoryIds.Contains(ticket.CategoryId))
            .ToListAsync();

        foreach (var legacyTicket in legacyTickets)
        {
            legacyTicket.DoctorTimeSlot.IsBooked = false;
        }

        if (legacyTickets.Count > 0)
        {
            db.Tickets.RemoveRange(legacyTickets);
        }

        db.Categories.RemoveRange(legacyCategories);
        await db.SaveChangesAsync();

        logger.LogInformation(
            "Removed {CategoryCount} legacy categories and {TicketCount} legacy appointments.",
            legacyCategories.Count,
            legacyTickets.Count);
    }

    private static async Task RemoveLegacyDoctorsAsync(AppDbContext db, ILogger logger)
    {
        var legacyDoctors = await db.Doctors
            .Include(doctor => doctor.TimeSlots)
            .Where(doctor =>
                LegacyDoctorEmails.Contains(doctor.Email) ||
                LegacyDoctorNames.Contains(doctor.FullName) ||
                doctor.Email.StartsWith(LegacyDoctorEmailPrefix) ||
                doctor.FullName.StartsWith(ArchivedDoctorNamePrefix))
            .ToListAsync();

        if (legacyDoctors.Count == 0)
        {
            return;
        }

        var legacyDoctorIds = legacyDoctors.Select(doctor => doctor.Id).ToHashSet();
        var legacyTickets = await db.Tickets
            .Where(ticket => legacyDoctorIds.Contains(ticket.DoctorId))
            .ToListAsync();

        if (legacyTickets.Count > 0)
        {
            db.Tickets.RemoveRange(legacyTickets);
        }

        var legacySlots = legacyDoctors.SelectMany(doctor => doctor.TimeSlots).ToList();
        if (legacySlots.Count > 0)
        {
            db.DoctorTimeSlots.RemoveRange(legacySlots);
        }

        db.Doctors.RemoveRange(legacyDoctors);
        await db.SaveChangesAsync();
        logger.LogInformation(
            "Removed {DoctorCount} legacy doctors, {SlotCount} slots and {TicketCount} appointments.",
            legacyDoctors.Count,
            legacySlots.Count,
            legacyTickets.Count);
    }

    private static async Task UnassignUserFromTicketsAsync(AppDbContext db, string userId)
    {
        var assignedTickets = await db.Tickets.Where(ticket => ticket.AssigneeId == userId).ToListAsync();
        if (assignedTickets.Count == 0)
        {
            return;
        }

        foreach (var ticket in assignedTickets)
        {
            ticket.AssigneeId = null;
        }

        await db.SaveChangesAsync();
    }

    private static IReadOnlyList<DateTimeOffset> CreateWeeklySlots(params (int hour, int minute)[] timePoints)
    {
        var slots = new List<DateTimeOffset>();

        for (var dayOffset = 0; dayOffset < 7; dayOffset++)
        {
            foreach (var (hour, minute) in timePoints)
            {
                slots.Add(SeedBaseUtc.AddDays(dayOffset).AddHours(hour).AddMinutes(minute));
            }
        }

        return slots;
    }
}
