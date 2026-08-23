using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.DTOs.Diagnoses;
using System.Security.Claims;

namespace ServiceDesk.API.Controllers;

[ApiController]
[Route("api/diagnoses")]
[Authorize]
[Produces("application/json")]
public class DiagnosesController : ControllerBase
{
    private readonly IDiagnosisService _diagnosisService;

    public DiagnosesController(IDiagnosisService diagnosisService)
    {
        _diagnosisService = diagnosisService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<DiagnosisResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DiagnosisResponse>>> GetList([FromQuery] string? specialty = null)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new InvalidOperationException("User ID claim is missing.");

        var role = User.FindFirstValue(ClaimTypes.Role)
            ?? User.FindFirstValue("role")
            ?? throw new InvalidOperationException("Role claim is missing.");

        return Ok(await _diagnosisService.GetListAsync(specialty, userId, role));
    }
}
