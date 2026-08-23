using System.Net;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using ServiceDesk.API.Tests.Infrastructure;

namespace ServiceDesk.API.Tests.Platform;

public class PlatformIntegrationTests : IntegrationTestBase, IClassFixture<ServiceDeskWebApplicationFactory>
{
    public PlatformIntegrationTests(ServiceDeskWebApplicationFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task HealthEndpoint_Returns200()
    {
        var response = await Client.GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithoutToken_ReturnsProblemDetails401()
    {
        var response = await Client.GetAsync("/api/categories");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        response.Content.Headers.ContentType?.MediaType.Should()
            .BeOneOf("application/problem+json", "application/json");

        var problem = await response.ReadProblemDetailsAsync();
        problem.Should().NotBeNull();
        problem!.Status.Should().Be(StatusCodes.Status401Unauthorized);
        problem.Title.Should().Be("Unauthorized");
        problem.Detail.Should().NotBeNullOrWhiteSpace();
        problem.Instance.Should().Be("/api/categories");
    }
}
