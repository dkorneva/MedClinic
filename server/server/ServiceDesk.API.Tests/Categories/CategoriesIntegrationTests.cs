using System.Net;
using System.Net.Http.Json;
using FluentAssertions;
using ServiceDesk.API.DTOs.Categories;
using ServiceDesk.API.Tests.Infrastructure;

namespace ServiceDesk.API.Tests.Categories;

public class CategoriesIntegrationTests : IntegrationTestBase, IClassFixture<ServiceDeskWebApplicationFactory>
{
    public CategoriesIntegrationTests(ServiceDeskWebApplicationFactory factory) : base(factory)
    {
    }

    [Fact]
    public async Task AdminCreatesCategorySuccessfully()
    {
        var admin = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Admin");
        await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Cardiology");
        var adminToken = await TestAuthHelper.GetAccessTokenAsync(Client, admin.Email, admin.Password);
        SetBearerToken(adminToken);

        var response = await Client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest
        {
            Name = "Cardiology Consultation",
            DoctorSpecialty = "Cardiology",
            Price = 2500m
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var created = await response.Content.ReadFromJsonAsync<CategoryResponse>();
        created.Should().NotBeNull();
        created!.Name.Should().Be("Cardiology Consultation");
        created.DoctorSpecialty.Should().Be("Cardiology");
        created.Price.Should().Be(2500m);
        created.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task DuplicateCategoryName_Returns400()
    {
        var admin = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Admin");
        await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Cardiology");
        var adminToken = await TestAuthHelper.GetAccessTokenAsync(Client, admin.Email, admin.Password);
        SetBearerToken(adminToken);

        var first = await Client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest
        {
            Name = "Duplicate Service",
            DoctorSpecialty = "Cardiology",
            Price = 1500m
        });
        first.StatusCode.Should().Be(HttpStatusCode.Created);

        var duplicate = await Client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest
        {
            Name = "Duplicate Service",
            DoctorSpecialty = "Cardiology",
            Price = 1800m
        });

        duplicate.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task EmptyOrWhitespaceCategoryName_Returns400(string name)
    {
        var admin = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Admin");
        await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Cardiology");
        var adminToken = await TestAuthHelper.GetAccessTokenAsync(Client, admin.Email, admin.Password);
        SetBearerToken(adminToken);

        var response = await Client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest
        {
            Name = name,
            DoctorSpecialty = "Cardiology",
            Price = 1200m
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Patient_WithIncludeInactiveTrue_StillSeesOnlyActiveCategories()
    {
        var admin = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Admin");
        var patient = await TestDataSeeder.CreateUserWithRoleAsync(Factory, "Patient");
        await TestDataSeeder.CreateDoctorUserAsync(Factory, specialty: "Cardiology");
        var adminToken = await TestAuthHelper.GetAccessTokenAsync(Client, admin.Email, admin.Password);
        var patientToken = await TestAuthHelper.GetAccessTokenAsync(Client, patient.Email, patient.Password);

        SetBearerToken(adminToken);
        var activeResponse = await Client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest
        {
            Name = $"Active {Guid.NewGuid():N}",
            DoctorSpecialty = "Cardiology",
            Price = 1000m
        });
        activeResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var activeCategory = await activeResponse.Content.ReadFromJsonAsync<CategoryResponse>();

        var inactiveResponse = await Client.PostAsJsonAsync("/api/categories", new CreateCategoryRequest
        {
            Name = $"Inactive {Guid.NewGuid():N}",
            DoctorSpecialty = "Cardiology",
            Price = 1100m
        });
        inactiveResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var inactiveCategory = await inactiveResponse.Content.ReadFromJsonAsync<CategoryResponse>();

        var deactivate = await Client.PatchAsJsonAsync(
            $"/api/categories/{inactiveCategory!.Id}/active",
            new SetActiveCategoryRequest { IsActive = false });
        deactivate.StatusCode.Should().Be(HttpStatusCode.OK);

        SetBearerToken(patientToken);
        var getResponse = await Client.GetAsync("/api/categories?includeInactive=true");
        getResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        var categories = await getResponse.Content.ReadFromJsonAsync<List<CategoryResponse>>();
        categories.Should().NotBeNull();
        categories!.Should().OnlyContain(item => item.IsActive);
        categories.Should().ContainSingle(item => item.Id == activeCategory!.Id);
        categories.Should().NotContain(item => item.Id == inactiveCategory.Id);
    }
}
