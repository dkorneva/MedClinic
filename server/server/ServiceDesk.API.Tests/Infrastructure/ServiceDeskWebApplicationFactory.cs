using System.Data.Common;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using ServiceDesk.API.Controllers;
using ServiceDesk.API.Data;

namespace ServiceDesk.API.Tests.Infrastructure;

public sealed class ServiceDeskWebApplicationFactory : WebApplicationFactory<AuthController>
{
    private readonly SqliteConnection _connection = new("DataSource=:memory:");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        if (_connection.State != System.Data.ConnectionState.Open)
        {
            _connection.Open();
        }

        Environment.SetEnvironmentVariable("JWT_KEY", "medclinic-test-secret-key-1234567890");
        Environment.SetEnvironmentVariable("JWT_ISSUER", "MedClinic.Tests");
        Environment.SetEnvironmentVariable("JWT_AUDIENCE", "MedClinic.Tests.Client");

        builder.UseEnvironment("Testing");
        builder.UseSetting("Jwt:Key", "medclinic-test-secret-key-1234567890");
        builder.UseSetting("Jwt:Issuer", "MedClinic.Tests");
        builder.UseSetting("Jwt:Audience", "MedClinic.Tests.Client");
        builder.UseSetting("Jwt:ExpiresHours", "24");

        builder.ConfigureAppConfiguration((_, configBuilder) =>
        {
            configBuilder.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] =
                    "Server=(localdb)\\mssqllocaldb;Database=medclinic-tests;Trusted_Connection=True;",
                ["Jwt:Key"] = "medclinic-test-secret-key-1234567890",
                ["Jwt:Issuer"] = "MedClinic.Tests",
                ["Jwt:Audience"] = "MedClinic.Tests.Client",
                ["Jwt:ExpiresHours"] = "24"
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.RemoveAll<AppDbContext>();
            services.RemoveAll<DbConnection>();

            services.AddSingleton<DbConnection>(_ => _connection);

            services.AddDbContext<AppDbContext>((serviceProvider, options) =>
            {
                var connection = serviceProvider.GetRequiredService<DbConnection>();
                options.UseSqlite(connection);
            });

            using var scope = services.BuildServiceProvider().CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Database.EnsureCreated();
        });
    }

    public async Task ResetDatabaseAsync()
    {
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);

        if (disposing)
        {
            _connection.Dispose();
        }
    }
}
