using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.Data;
using ServiceDesk.API.DTOs.Doctors;
using ServiceDesk.API.DTOs.Users;
using ServiceDesk.API.Models;
using ServiceDesk.API.Tests.Infrastructure;

namespace ServiceDesk.API.Tests.Users;

public class UsersRolesIntegrationTests : IntegrationTestBase, IClassFixture<ServiceDeskWebApplicationFactory>
{
    public UsersRolesIntegrationTests(ServiceDeskWebApplicationFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task ValidRoleChange_Succeeds_AndLeavesExactlyOneRole()
    {
        var admin = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Admin");
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var adminToken = await TestAuthHelper.GetAccessTokenAsync(Client, admin.Email, admin.Password);
        SetBearerToken(adminToken);

        var response = await Client.PutAsJsonAsync($"/api/users/{patient.Id}/role",
            new UpdateUserRoleRequest { Role = "Doctor" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var updated = await response.Content.ReadFromJsonAsync<UserResponse>();
        updated.Should().NotBeNull();
        updated!.Role.Should().Be("Doctor");

        var roles = await TestDataSeeder.GetUserRolesAsync(Factory, patient.Id);
        roles.Should().ContainSingle().Which.Should().Be("Doctor");
    }

    [Fact]
    public async Task ChangeRoleToDoctor_CreatesDoctorCard_ForDoctorPages()
    {
        var admin = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Admin");
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient", email: "doctor4@demo.com");
        var adminToken = await TestAuthHelper.GetAccessTokenAsync(Client, admin.Email, admin.Password);
        SetBearerToken(adminToken);

        var roleChangeResponse = await Client.PutAsJsonAsync(
            $"/api/users/{patient.Id}/role",
            new UpdateUserRoleRequest { Role = "Doctor" });

        roleChangeResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var doctor = await db.Doctors.AsNoTracking().FirstOrDefaultAsync(item => item.Email == patient.Email);
            doctor.Should().NotBeNull();
            doctor!.Status.Should().Be(DoctorStatus.Active);
            var doctorService = scope.ServiceProvider.GetRequiredService<IDoctorService>();
            var schedule = await doctorService.GetOwnScheduleAsync(patient.Id);
            schedule.Should().BeEmpty();
        }

        var doctorToken = await TestAuthHelper.GetAccessTokenAsync(Client, patient.Email, patient.Password);
        SetBearerToken(doctorToken);
        var scheduleResponse = await Client.GetAsync("/api/doctors/me/schedule");
        var scheduleBody = await scheduleResponse.Content.ReadAsStringAsync();

        scheduleResponse.StatusCode.Should().Be(HttpStatusCode.OK, scheduleBody);
    }

    [Fact]
    public async Task ChangeRoleFromPatientToDoctor_RemovesPatientAppointmentsAndFreesSlots()
    {
        var admin = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Admin");
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient", email: "doctor4@demo.com");
        var (_, doctor) = await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Therapy");
        var categoryId = await TestDataSeeder.CreateActiveCategoryAsync(Factory, doctor.Specialty);
        var slotId = await TestDataSeeder.CreateFutureSlotAsync(Factory, doctor.Id);
        var ticketId = await TestDataSeeder.SeedTicketAsync(
            Factory,
            patient.Id,
            doctor.Id,
            categoryId,
            slotId);
        var adminToken = await TestAuthHelper.GetAccessTokenAsync(Client, admin.Email, admin.Password);
        SetBearerToken(adminToken);

        var roleChangeResponse = await Client.PutAsJsonAsync(
            $"/api/users/{patient.Id}/role",
            new UpdateUserRoleRequest { Role = "Doctor" });

        roleChangeResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        using var scope = Factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ticketExists = await db.Tickets.AnyAsync(ticket => ticket.Id == ticketId);
        var slot = await db.DoctorTimeSlots.AsNoTracking().FirstAsync(item => item.Id == slotId);

        ticketExists.Should().BeFalse();
        slot.IsBooked.Should().BeFalse();
    }

    [Fact]
    public async Task AuthMe_ForDoctorWithoutDoctorCard_CreatesDoctorCard()
    {
        var doctorUser = await TestDataSeeder.CreateUserWithRoleAsync(
            Factory,
            "Doctor",
            email: "doctor4@demo.com");
        var doctorToken = await TestAuthHelper.GetAccessTokenAsync(Client, doctorUser.Email, doctorUser.Password);
        SetBearerToken(doctorToken);

        var meResponse = await Client.GetAsync("/api/auth/me");

        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        using (var scope = Factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var doctor = await db.Doctors.AsNoTracking().FirstOrDefaultAsync(item => item.Email == doctorUser.Email);
            doctor.Should().NotBeNull();
            doctor!.Status.Should().Be(DoctorStatus.Active);
        }

        var scheduleResponse = await Client.GetAsync("/api/doctors/me/schedule");
        scheduleResponse.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task NonexistentUser_Returns404()
    {
        var admin = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Admin");
        var adminToken = await TestAuthHelper.GetAccessTokenAsync(Client, admin.Email, admin.Password);
        SetBearerToken(adminToken);

        var response = await Client.PutAsJsonAsync($"/api/users/{Guid.NewGuid():N}/role",
            new UpdateUserRoleRequest { Role = "Doctor" });

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task InvalidRole_Returns400()
    {
        var admin = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Admin");
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var adminToken = await TestAuthHelper.GetAccessTokenAsync(Client, admin.Email, admin.Password);
        SetBearerToken(adminToken);

        var response = await Client.PutAsJsonAsync($"/api/users/{patient.Id}/role",
            new UpdateUserRoleRequest { Role = "Manager" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ChangedFromDoctorRole_UserIsHiddenFromDoctorsList()
    {
        var admin = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Admin");
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var (doctorUser, doctor) = await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Cardiology");

        var adminToken = await TestAuthHelper.GetAccessTokenAsync(Client, admin.Email, admin.Password);
        SetBearerToken(adminToken);

        var roleChangeResponse = await Client.PutAsJsonAsync(
            $"/api/users/{doctorUser.Id}/role",
            new UpdateUserRoleRequest { Role = "Patient" });

        roleChangeResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var patientToken = await TestAuthHelper.GetAccessTokenAsync(Client, patient.Email, patient.Password);
        SetBearerToken(patientToken);

        var doctorsResponse = await Client.GetAsync("/api/doctors");
        doctorsResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var doctors = await doctorsResponse.Content.ReadFromJsonAsync<List<DoctorResponse>>();
        doctors.Should().NotBeNull();
        doctors!.Should().NotContain(item => item.Id == doctor.Id);
    }
}
