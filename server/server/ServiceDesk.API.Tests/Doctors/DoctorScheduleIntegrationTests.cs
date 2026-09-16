using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ServiceDesk.API.DTOs.Doctors;
using ServiceDesk.API.Models;
using ServiceDesk.API.Tests.Infrastructure;

namespace ServiceDesk.API.Tests.Doctors;

public class DoctorScheduleIntegrationTests : IntegrationTestBase, IClassFixture<ServiceDeskWebApplicationFactory>
{
    public DoctorScheduleIntegrationTests(ServiceDeskWebApplicationFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task UpdateSchedule_WhenBookedSlotIsOmitted_AddsFutureSlotAndKeepsBookedSlot()
    {
        var admin = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Admin");
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        var (_, doctor) = await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Therapy");
        var categoryId = await TestDataSeeder.CreateActiveCategoryAsync(Factory, doctor.Specialty);
        var clinicOffset = TimeSpan.FromHours(3);
        var clinicToday = DateTimeOffset.UtcNow.ToOffset(clinicOffset).Date;
        var bookedSlot = new DateTimeOffset(clinicToday.AddDays(4).AddHours(9), clinicOffset);
        var existingFutureSlot = new DateTimeOffset(clinicToday.AddDays(4).AddHours(10), clinicOffset);
        var newFutureSlot = new DateTimeOffset(clinicToday.AddDays(4).AddHours(8), clinicOffset);
        var bookedSlotId = await TestDataSeeder.CreateFutureSlotAsync(
            Factory,
            doctor.Id,
            bookedSlot);
        await TestDataSeeder.CreateFutureSlotAsync(Factory, doctor.Id, existingFutureSlot);
        await TestDataSeeder.SeedTicketAsync(
            Factory,
            patient.Id,
            doctor.Id,
            categoryId,
            bookedSlotId,
            status: TicketStatus.Resolved);

        var adminToken = await TestAuthHelper.GetAccessTokenAsync(Client, admin.Email, admin.Password);
        SetBearerToken(adminToken);

        var response = await Client.PutAsJsonAsync($"/api/doctors/{doctor.Id}/schedule", new UpdateDoctorScheduleRequest
        {
            Slots =
            [
                existingFutureSlot.ToString("yyyy-MM-ddTHH:mm:ss"),
                newFutureSlot.ToString("yyyy-MM-ddTHH:mm:ss")
            ]
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        var schedule = await response.Content.ReadFromJsonAsync<List<DoctorScheduleSlotResponse>>();
        schedule.Should().NotBeNull();
        schedule!.Should().Contain(slot => slot.StartAt == newFutureSlot);
        schedule.Should().Contain(slot => slot.StartAt == bookedSlot && slot.IsBooked);
    }
}
