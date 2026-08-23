using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ServiceDesk.API.DTOs.Tickets;
using ServiceDesk.API.Models;
using ServiceDesk.API.Tests.Infrastructure;

namespace ServiceDesk.API.Tests.Tickets;

public class TicketsRejectIntegrationTests : IntegrationTestBase, IClassFixture<ServiceDeskWebApplicationFactory>
{
    public TicketsRejectIntegrationTests(ServiceDeskWebApplicationFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task RejectClosedTicket_Returns400()
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
            status: TicketStatus.Closed,
            assigneeId: doctorUser.Id);
        var doctorToken = await TestAuthHelper.GetAccessTokenAsync(Client, doctorUser.Email, doctorUser.Password);
        SetBearerToken(doctorToken);

        var response = await Client.PostAsJsonAsync(
            $"/api/tickets/{ticketId}/reject",
            new RejectRequest { Reason = "Appointment rejected by test" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RejectRejectedTicket_Returns400()
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
            status: TicketStatus.Rejected,
            assigneeId: doctorUser.Id);
        var doctorToken = await TestAuthHelper.GetAccessTokenAsync(Client, doctorUser.Email, doctorUser.Password);
        SetBearerToken(doctorToken);

        var response = await Client.PostAsJsonAsync(
            $"/api/tickets/{ticketId}/reject",
            new RejectRequest { Reason = "Appointment rejected by test" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task RejectTicketAssignedToAnotherUser_Returns403()
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
            $"/api/tickets/{ticketId}/reject",
            new RejectRequest { Reason = "Appointment rejected by test" });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
