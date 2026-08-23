using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ServiceDesk.API.DTOs.Tickets;
using ServiceDesk.API.Models;
using ServiceDesk.API.Tests.Infrastructure;

namespace ServiceDesk.API.Tests.Tickets;

public class TicketsStatusIntegrationTests : IntegrationTestBase, IClassFixture<ServiceDeskWebApplicationFactory>
{
    public TicketsStatusIntegrationTests(ServiceDeskWebApplicationFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task DoctorChangesStatus_OfAppointmentAssignedToAnotherUser_Returns403()
    {
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var (doctorUser, doctor) = await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Cardiology");
        var otherAssignee = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Doctor");
        var categoryId = await TestDataSeeder.CreateActiveCategoryAsync(Factory, doctor.Specialty);
        var slotId = await TestDataSeeder.CreateFutureSlotAsync(Factory, doctor.Id);
        var ticketId = await TestDataSeeder.SeedTicketAsync(
            Factory,
            patient.Id,
            doctor.Id,
            categoryId,
            slotId,
            status: TicketStatus.InProgress,
            assigneeId: otherAssignee.Id);
        var doctorToken = await TestAuthHelper.GetAccessTokenAsync(Client, doctorUser.Email, doctorUser.Password);
        SetBearerToken(doctorToken);

        var response = await Client.PostAsJsonAsync(
            $"/api/tickets/{ticketId}/status",
            new ChangeStatusRequest { Status = "Resolved" });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task SameStatus_Returns400()
    {
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var (doctorUser, doctor) = await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Cardiology");
        var categoryId = await TestDataSeeder.CreateActiveCategoryAsync(Factory, doctor.Specialty);
        var slotId = await TestDataSeeder.CreateFutureSlotAsync(Factory, doctor.Id);
        var ticketId = await TestDataSeeder.SeedTicketAsync(
            Factory,
            patient.Id,
            doctor.Id,
            categoryId,
            slotId,
            status: TicketStatus.InProgress,
            assigneeId: doctorUser.Id);
        var doctorToken = await TestAuthHelper.GetAccessTokenAsync(Client, doctorUser.Email, doctorUser.Password);
        SetBearerToken(doctorToken);

        var response = await Client.PostAsJsonAsync(
            $"/api/tickets/{ticketId}/status",
            new ChangeStatusRequest { Status = "InProgress" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task InvalidTransition_Returns400()
    {
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var (doctorUser, doctor) = await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Cardiology");
        var categoryId = await TestDataSeeder.CreateActiveCategoryAsync(Factory, doctor.Specialty);
        var slotId = await TestDataSeeder.CreateFutureSlotAsync(Factory, doctor.Id);
        var ticketId = await TestDataSeeder.SeedTicketAsync(
            Factory,
            patient.Id,
            doctor.Id,
            categoryId,
            slotId,
            status: TicketStatus.InProgress,
            assigneeId: doctorUser.Id);
        var doctorToken = await TestAuthHelper.GetAccessTokenAsync(Client, doctorUser.Email, doctorUser.Password);
        SetBearerToken(doctorToken);

        var response = await Client.PostAsJsonAsync(
            $"/api/tickets/{ticketId}/status",
            new ChangeStatusRequest { Status = "Closed" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ValidTransitionToResolved_Succeeds()
    {
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var (doctorUser, doctor) = await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Cardiology");
        var categoryId = await TestDataSeeder.CreateActiveCategoryAsync(Factory, doctor.Specialty);
        var slotId = await TestDataSeeder.CreateFutureSlotAsync(Factory, doctor.Id);
        var diagnosisId = await TestDataSeeder.CreateDiagnosisAsync(Factory, doctor.Specialty);
        var ticketId = await TestDataSeeder.SeedTicketAsync(
            Factory,
            patient.Id,
            doctor.Id,
            categoryId,
            slotId,
            status: TicketStatus.InProgress,
            assigneeId: doctorUser.Id,
            diagnosisId: diagnosisId,
            treatment: "Prescribed treatment");
        var doctorToken = await TestAuthHelper.GetAccessTokenAsync(Client, doctorUser.Email, doctorUser.Password);
        SetBearerToken(doctorToken);

        var response = await Client.PostAsJsonAsync(
            $"/api/tickets/{ticketId}/status",
            new ChangeStatusRequest { Status = "Resolved" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var updated = await response.Content.ReadFromJsonAsync<TicketResponse>();
        updated.Should().NotBeNull();
        updated!.Status.Should().Be("Resolved");
    }
}
