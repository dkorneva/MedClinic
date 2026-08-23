using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ServiceDesk.API.DTOs.Auth;
using ServiceDesk.API.Tests.Infrastructure;

namespace ServiceDesk.API.Tests.Auth;

public class AuthIntegrationTests : IntegrationTestBase, IClassFixture<ServiceDeskWebApplicationFactory>
{
    public AuthIntegrationTests(ServiceDeskWebApplicationFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task Register_WithValidData_Succeeds()
    {
        var email = $"register.{Guid.NewGuid():N}@test.local";

        var response = await Client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "Password123!", "Register User"));

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var payload = await response.Content.ReadFromJsonAsync<AuthResponse>();
        payload.Should().NotBeNull();
        payload!.AccessToken.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Login_WithWrongPassword_Returns401()
    {
        var user = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");

        var response = await Client.PostAsJsonAsync("/api/auth/login",
            new LoginRequest(user.Email, "WrongPassword123!"));

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMe_WithoutToken_Returns401()
    {
        var response = await Client.GetAsync("/api/auth/me");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMe_WithValidToken_ReturnsCurrentUser()
    {
        var email = $"me.{Guid.NewGuid():N}@test.local";
        const string displayName = "Current Patient";

        var registerResponse = await Client.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest(email, "Password123!", displayName));
        registerResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var auth = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>();
        auth.Should().NotBeNull();

        using var meClient = Factory.CreateClient();
        meClient.SetBearerToken(auth!.AccessToken);

        var meResponse = await meClient.GetAsync("/api/auth/me");
        meResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var me = await meResponse.Content.ReadFromJsonAsync<MeResponse>();
        me.Should().NotBeNull();
        me!.Email.Should().Be(email);
        me.DisplayName.Should().Be(displayName);
        me.Role.Should().Be("Patient");
    }
}
