using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ServiceDesk.API.DTOs.Tickets;
using ServiceDesk.API.DTOs.Users;
using ServiceDesk.API.Models;
using ServiceDesk.API.Tests.Infrastructure;

namespace ServiceDesk.API.Tests.Tickets;

public class TicketsIntegrationTests : IntegrationTestBase, IClassFixture<ServiceDeskWebApplicationFactory>
{
    public TicketsIntegrationTests(ServiceDeskWebApplicationFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task PatientCreatesTicket_Succeeds_WithStatusNew()
    {
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var (_, doctor) = await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Cardiology");
        var categoryId = await TestDataSeeder.CreateActiveCategoryAsync(Factory, doctor.Specialty);
        var slotId = await TestDataSeeder.CreateFutureSlotAsync(Factory, doctor.Id);
        var patientToken = await TestAuthHelper.GetAccessTokenAsync(Client, patient.Email, patient.Password);

        var created = await CreateTicketAsPatientAsync(patientToken, categoryId, doctor.Id, slotId, doctor.Specialty);

        created.Status.Should().Be("New");
        created.DoctorId.Should().Be(doctor.Id);
        created.Author.Id.Should().Be(patient.Id);
    }

    [Fact]
    public async Task PatientCannotAccessAnotherPatientsTicket_Returns404()
    {
        var patientA = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var patientB = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var (_, doctor) = await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Cardiology");
        var categoryId = await TestDataSeeder.CreateActiveCategoryAsync(Factory, doctor.Specialty);
        var slotId = await TestDataSeeder.CreateFutureSlotAsync(Factory, doctor.Id);
        var patientAToken = await TestAuthHelper.GetAccessTokenAsync(Client, patientA.Email, patientA.Password);
        var patientBToken = await TestAuthHelper.GetAccessTokenAsync(Client, patientB.Email, patientB.Password);

        var created = await CreateTicketAsPatientAsync(patientAToken, categoryId, doctor.Id, slotId, doctor.Specialty);

        SetBearerToken(patientBToken);
        var response = await Client.GetAsync($"/api/tickets/{created.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task DoctorAssignToMe_ForNewUnassignedAppointment_Succeeds()
    {
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var (doctorUser, doctor) = await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Cardiology");
        var categoryId = await TestDataSeeder.CreateActiveCategoryAsync(Factory, doctor.Specialty);
        var slotId = await TestDataSeeder.CreateFutureSlotAsync(Factory, doctor.Id);
        var patientToken = await TestAuthHelper.GetAccessTokenAsync(Client, patient.Email, patient.Password);
        var doctorToken = await TestAuthHelper.GetAccessTokenAsync(Client, doctorUser.Email, doctorUser.Password);

        var created = await CreateTicketAsPatientAsync(patientToken, categoryId, doctor.Id, slotId, doctor.Specialty);

        SetBearerToken(doctorToken);
        var assignResponse = await Client.PostAsync($"/api/tickets/{created.Id}/assign", null);

        assignResponse.StatusCode.Should().Be(HttpStatusCode.OK);
        var assigned = await assignResponse.Content.ReadFromJsonAsync<TicketResponse>();
        assigned.Should().NotBeNull();
        assigned!.Status.Should().Be("InProgress");
        assigned.Assignee.Should().NotBeNull();
        assigned.Assignee!.Id.Should().Be(doctorUser.Id);
    }

    [Fact]
    public async Task AssignToMe_WhenAppointmentAlreadyAssignedToAnotherUser_Returns409()
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

        var response = await Client.PostAsync($"/api/tickets/{ticketId}/assign", null);

        response.StatusCode.Should().Be(HttpStatusCode.Conflict);
    }

    [Fact]
    public async Task PatientCannotCreateTicket_ForUserWithoutCurrentDoctorRole()
    {
        var admin = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Admin");
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var (doctorUser, doctor) = await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Cardiology");
        var categoryId = await TestDataSeeder.CreateActiveCategoryAsync(Factory, doctor.Specialty);
        var slotId = await TestDataSeeder.CreateFutureSlotAsync(Factory, doctor.Id);

        var adminToken = await TestAuthHelper.GetAccessTokenAsync(Client, admin.Email, admin.Password);
        SetBearerToken(adminToken);

        var roleChangeResponse = await Client.PutAsJsonAsync(
            $"/api/users/{doctorUser.Id}/role",
            new UpdateUserRoleRequest { Role = "Patient" });

        roleChangeResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var patientToken = await TestAuthHelper.GetAccessTokenAsync(Client, patient.Email, patient.Password);
        SetBearerToken(patientToken);

        var response = await Client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest
        {
            Description = $"Appointment {Guid.NewGuid():N}",
            DoctorSpecialty = doctor.Specialty,
            CategoryId = categoryId,
            DoctorId = doctor.Id,
            DoctorTimeSlotId = slotId,
            Priority = TicketPriority.Medium
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    private async Task<TicketResponse> CreateTicketAsPatientAsync(
        string patientToken,
        int categoryId,
        int doctorId,
        int slotId,
        string doctorSpecialty)
    {
        SetBearerToken(patientToken);
        var response = await Client.PostAsJsonAsync("/api/tickets", new CreateTicketRequest
        {
            Description = $"Appointment {Guid.NewGuid():N}",
            DoctorSpecialty = doctorSpecialty,
            CategoryId = categoryId,
            DoctorId = doctorId,
            DoctorTimeSlotId = slotId,
            Priority = TicketPriority.Medium
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await response.Content.ReadFromJsonAsync<TicketResponse>();
        created.Should().NotBeNull();
        return created!;
    }
}
