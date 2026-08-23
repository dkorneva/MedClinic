using Microsoft.AspNetCore.Identity;
using ServiceDesk.API.Application;
using ServiceDesk.API.Data;
using ServiceDesk.API.Hubs;
using ServiceDesk.API.Infrastructure;
using ServiceDesk.API.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

    foreach (var roleName in new[] { "Patient", "Doctor", "Admin" })
    {
        if (!await roleManager.RoleExistsAsync(roleName))
        {
            await roleManager.CreateAsync(new IdentityRole(roleName));
        }
    }

    if (app.Environment.IsDevelopment())
    {
        await DbInitializer.SeedAsync(scope.ServiceProvider);
    }
}

app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(ServiceDesk.API.Infrastructure.DependencyInjection.ClientCorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<DoctorSlotsHub>("/hubs/doctor-slots");
app.MapGet("/health", () => Results.Ok("Healthy"));

app.Run();
