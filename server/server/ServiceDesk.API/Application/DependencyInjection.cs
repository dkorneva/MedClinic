using Microsoft.Extensions.DependencyInjection;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.Application.Services;

namespace ServiceDesk.API.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IAdminAnalyticsService, AdminAnalyticsService>();
        services.AddScoped<IDiagnosisService, DiagnosisService>();
        services.AddScoped<IDoctorService, DoctorService>();
        services.AddScoped<IUserAdminService, UserAdminService>();
        services.AddScoped<ITicketService, TicketService>();

        return services;
    }
}
