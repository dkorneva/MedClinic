using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.DTOs.Admin;

namespace ServiceDesk.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
public sealed class AdminController : ControllerBase
{
    private readonly IAdminAnalyticsService _adminAnalyticsService;

    public AdminController(IAdminAnalyticsService adminAnalyticsService)
    {
        _adminAnalyticsService = adminAnalyticsService;
    }

    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(AdminDashboardResponse), StatusCodes.Status200OK)]
    
    // Task<ActionResult<AdminDashboardResponse>> — тип, который может быть либо AdminDashboardResponse, либо производным от ActionResult
    public async Task<ActionResult<AdminDashboardResponse>> GetDashboard()
    {
        return Ok(await _adminAnalyticsService.GetDashboardAsync());
    }

    [HttpGet("reports")]
    [ProducesResponseType(typeof(AdminReportsResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminReportsResponse>> GetReports([FromQuery] DateTimeOffset? start, [FromQuery] DateTimeOffset? end)
    {
        return Ok(await _adminAnalyticsService.GetReportsAsync(start, end));
    }
}
