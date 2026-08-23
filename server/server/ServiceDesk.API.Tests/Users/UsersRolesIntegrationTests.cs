using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ServiceDesk.API.DTOs.Doctors;
using ServiceDesk.API.DTOs.Users;
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
