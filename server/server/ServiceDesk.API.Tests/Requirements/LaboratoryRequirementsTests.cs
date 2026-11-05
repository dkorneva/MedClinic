using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ServiceDesk.API.Data;
using ServiceDesk.API.DTOs.Auth;
using ServiceDesk.API.DTOs.Categories;
using ServiceDesk.API.DTOs.Tickets;
using ServiceDesk.API.Models;
using ServiceDesk.API.Tests.Infrastructure;

namespace ServiceDesk.API.Tests.Requirements;

public class LaboratoryRequirementsTests : IntegrationTestBase, IClassFixture<ServiceDeskWebApplicationFactory>
{
    public LaboratoryRequirementsTests(ServiceDeskWebApplicationFactory factory) : base(factory) { }

    [Theory]
    [InlineData(1, false)] [InlineData(2, true)] [InlineData(3, true)]
    [InlineData(29, true)] [InlineData(30, true)] [InlineData(31, false)]
    public async Task RegistrationNameBoundaries(int length, bool accepted)
        => await RegisterAndAssert(new string('И', length), "Qw1!er", "Qw1!er", accepted);

    [Theory]
    [InlineData("")] [InlineData("Иван3")] [InlineData(" Иван")]
    [InlineData("Иван ")] [InlineData("Иван!")]
    public async Task RegistrationRejectsInvalidNames(string name)
        => await RegisterAndAssert(name, "Qw1!er", "Qw1!er", false);

    [Theory]
    [InlineData("Qw1!e", false)] [InlineData("Qw1!er", true)]
    [InlineData("qwerty1!", false)] [InlineData("QWERTY1!", false)]
    [InlineData("Qwerty!", false)] [InlineData("Qwerty1", false)]
    public async Task RegistrationPasswordRules(string password, bool accepted)
        => await RegisterAndAssert("Иван", password, password, accepted);

    [Theory]
    [InlineData("")] [InlineData("Qwerty1?")]
    public async Task RegistrationRequiresMatchingConfirmation(string confirmation)
        => await RegisterAndAssert("Иван", "Qwerty1!", confirmation, false);

    private async Task RegisterAndAssert(string name, string password, string confirmation, bool accepted)
    {
        var email = $"lab.{Guid.NewGuid():N}@test.local";
        var response = await Client.PostAsJsonAsync("/api/auth/register", new RegisterRequest(email, password, name, confirmation));
        response.StatusCode.Should().Be(accepted ? HttpStatusCode.OK : HttpStatusCode.BadRequest);
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.Users.AnyAsync(user => user.Email == email)).Should().Be(accepted);
    }

    private async Task AdminForCategories()
    {
        var admin = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Admin");
        await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Cardiology");
        SetBearerToken(await TestAuthHelper.GetAccessTokenAsync(Client, admin.Email, admin.Password));
    }

    [Fact]
    public void SqlServerModelMatchesMigrationSnapshot()
    {
        using var db = new AppDbContext(new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer("Server=localhost;Database=model-check;Integrated Security=true;").Options);
        db.Database.HasPendingModelChanges().Should().BeFalse();
        db.Database.GetMigrations().Should().Contain("20261006120000_ServiceNamesBySpecialty");
    }

    [Theory]
    [InlineData("Critical")] [InlineData(99)] [InlineData(null)]
    public async Task InvalidOrMissingPriorityCannotBookSlot(object? priority)
    {
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var (_, doctor) = await TestDataSeeder.CreateDoctorUserAsync(Factory);
        var categoryId = await TestDataSeeder.CreateActiveCategoryAsync(Factory, doctor.Specialty);
        var slotId = await TestDataSeeder.CreateFutureSlotAsync(Factory, doctor.Id);
        SetBearerToken(await TestAuthHelper.GetAccessTokenAsync(Client, patient.Email, patient.Password));
        var payload = new Dictionary<string, object> {
            ["description"] = new string('а', 50), ["doctorSpecialty"] = doctor.Specialty,
            ["categoryId"] = categoryId, ["doctorId"] = doctor.Id, ["doctorTimeSlotId"] = slotId
        };
        if (priority is not null) payload["priority"] = priority;
        (await Client.PostAsJsonAsync("/api/tickets", payload)).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.DoctorTimeSlots.FindAsync(slotId))!.IsBooked.Should().BeFalse();
    }

    [Theory]
    [InlineData("Л", false)] [InlineData("ЛФ", true)]
    [InlineData("12345", false)] [InlineData("Приём!", false)]
    [InlineData("Приём.", false)] [InlineData(" Приём", false)]
    [InlineData("Приём ", false)] [InlineData("Приём (ЛФК), этап 1/2", true)]
    public async Task ServiceNameRules(string name, bool accepted)
    {
        await AdminForCategories();
        var response = await Client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest { Name = name, DoctorSpecialty = "Cardiology", Price = 0.01m });
        response.StatusCode.Should().Be(accepted ? HttpStatusCode.Created : HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData(100, true)] [InlineData(101, false)]
    public async Task ServiceNameUpperBoundary(int length, bool accepted)
        => await ServiceNameRules(new string('Л', length), accepted);

    [Theory]
    [InlineData("0.01", true)] [InlineData("0", false)]
    [InlineData("-0.01", false)] [InlineData("1.001", false)]
    public async Task ServicePriceRules(string price, bool accepted)
    {
        await AdminForCategories();
        var response = await Client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest { Name = "Приём", DoctorSpecialty = "Cardiology", Price = decimal.Parse(price, System.Globalization.CultureInfo.InvariantCulture) });
        response.StatusCode.Should().Be(accepted ? HttpStatusCode.Created : HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ServiceUniquenessIsWithinSpecialtyAndEditingOwnNameIsAllowed()
    {
        await AdminForCategories();
        await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Neurology");
        var request = new CreateCategoryRequest { Name = "Приём", DoctorSpecialty = "Cardiology", Price = 1m };
        var first = await Client.PostAsJsonAsync("/api/categories", request);
        first.StatusCode.Should().Be(HttpStatusCode.Created);
        var category = (await first.Content.ReadFromJsonAsync<CategoryResponse>())!;
        (await Client.PostAsJsonAsync("/api/categories", request)).StatusCode.Should().Be(HttpStatusCode.BadRequest);
        request.DoctorSpecialty = "Neurology";
        (await Client.PostAsJsonAsync("/api/categories", request)).StatusCode.Should().Be(HttpStatusCode.Created);
        (await Client.PutAsJsonAsync($"/api/categories/{category.Id}", new UpdateCategoryRequest { Name = "Приём", DoctorSpecialty = "Cardiology", Price = 2m })).StatusCode.Should().Be(HttpStatusCode.OK);
        (await Client.PutAsJsonAsync($"/api/categories/{category.Id}", new UpdateCategoryRequest { Name = "Приём", DoctorSpecialty = "Neurology", Price = 2m })).StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData(0, false)] [InlineData(49, false)] [InlineData(50, true)]
    [InlineData(51, true)] [InlineData(1999, true)] [InlineData(2000, true)] [InlineData(2001, false)]
    public async Task ComplaintBoundariesAndNoBookingOnRejection(int length, bool accepted)
    {
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var (_, doctor) = await TestDataSeeder.CreateDoctorUserAsync(Factory);
        var categoryId = await TestDataSeeder.CreateActiveCategoryAsync(Factory, doctor.Specialty);
        var slotId = await TestDataSeeder.CreateFutureSlotAsync(Factory, doctor.Id);
        SetBearerToken(await TestAuthHelper.GetAccessTokenAsync(Client, patient.Email, patient.Password));
        var response = await Client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest { Description = "  " + new string('а', length) + "  ", DoctorSpecialty = doctor.Specialty, CategoryId = categoryId, DoctorId = doctor.Id, DoctorTimeSlotId = slotId, Priority = TicketPriority.Medium });
        response.StatusCode.Should().Be(accepted ? HttpStatusCode.Created : HttpStatusCode.BadRequest);
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        (await db.DoctorTimeSlots.FindAsync(slotId))!.IsBooked.Should().Be(accepted);
    }

    [Theory]
    [InlineData(0, false)] [InlineData(49, false)] [InlineData(50, true)]
    [InlineData(51, true)] [InlineData(1999, true)] [InlineData(2000, true)] [InlineData(2001, false)]
    public async Task TreatmentBoundariesAndNoPersistenceOnRejection(int length, bool accepted)
    {
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var (user, doctor) = await TestDataSeeder.CreateDoctorUserAsync(Factory);
        var categoryId = await TestDataSeeder.CreateActiveCategoryAsync(Factory, doctor.Specialty);
        var slotId = await TestDataSeeder.CreateFutureSlotAsync(Factory, doctor.Id);
        var diagnosisId = await TestDataSeeder.CreateDiagnosisAsync(Factory, doctor.Specialty);
        var ticketId = await TestDataSeeder.SeedTicketAsync(Factory, patient.Id, doctor.Id, categoryId, slotId, assigneeId: user.Id, status: TicketStatus.InProgress);
        SetBearerToken(await TestAuthHelper.GetAccessTokenAsync(Client, user.Email, user.Password));
        var response = await Client.PostAsJsonAsync($"/api/tickets/{ticketId}/medical-record", new UpdateMedicalRecordRequest { DiagnosisId = diagnosisId, Treatment = "  " + new string('а', length) + "  " });
        response.StatusCode.Should().Be(accepted ? HttpStatusCode.OK : HttpStatusCode.BadRequest);
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ticket = (await db.Tickets.FindAsync(ticketId))!;
        ticket.Treatment.Should().Be(accepted ? new string('а', length) : null);
    }
}
