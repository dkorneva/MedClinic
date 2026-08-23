using ServiceDesk.API.DTOs.Admin;

namespace ServiceDesk.API.Application.Abstractions.Services;

public interface IAdminAnalyticsService
{
    Task<AdminDashboardResponse> GetDashboardAsync();
    Task<AdminReportsResponse> GetReportsAsync(DateTimeOffset? start, DateTimeOffset? end); // ? - могут принимать null
}
