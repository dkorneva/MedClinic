using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ServiceDesk.API.Tests.Infrastructure;

namespace ServiceDesk.API.Tests.Doctors;

public class DoctorEndpointsIntegrationTests : IntegrationTestBase, IClassFixture<ServiceDeskWebApplicationFactory>
{
    public DoctorEndpointsIntegrationTests(ServiceDeskWebApplicationFactory factory) : base(factory)
    {
    }

    [Theory]
    [InlineData("POST", "/api/doctors", HttpStatusCode.MethodNotAllowed)]
    [InlineData("DELETE", "/api/doctors/1", HttpStatusCode.NotFound)]
    [InlineData("PUT", "/api/doctors/1", HttpStatusCode.NotFound)]
    public async Task DoctorCardManagement_IsNotExposed_EvenForAdmin(string method, string path, HttpStatusCode expectedStatus)
    {
        var admin = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Admin");
        var token = await TestAuthHelper.GetAccessTokenAsync(Client, admin.Email, admin.Password);
        SetBearerToken(token);

        using var request = new HttpRequestMessage(new HttpMethod(method), path);
        if (method is "POST" or "PUT")
        {
            request.Content = JsonContent.Create(new { });
        }

        using var response = await Client.SendAsync(request);

        response.StatusCode.Should().Be(expectedStatus);
    }
}
