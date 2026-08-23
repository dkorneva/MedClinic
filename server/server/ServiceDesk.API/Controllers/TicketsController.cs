using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.DTOs;
using ServiceDesk.API.DTOs.Tickets;

namespace ServiceDesk.API.Controllers;

[ApiController]
[Route("api/tickets")]
[Authorize]
[Produces("application/json")]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpPost]
    [Authorize(Roles = "Patient")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<TicketResponse>> Create([FromBody] CreateTicketRequest request)
    {
        var result = await _ticketService.CreateAsync(request, GetCurrentUserId(), GetCurrentRole());
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<TicketResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResponse<TicketResponse>>> GetList([FromQuery] TicketsQuery query)
    {
        var result = await _ticketService.GetListAsync(query, GetCurrentUserId(), GetCurrentRole());
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TicketResponse>> GetById(int id)
    {
        var result = await _ticketService.GetByIdAsync(id, GetCurrentUserId(), GetCurrentRole());
        return Ok(result);
    }

    [HttpPost("{id:int}/assign")]
    [Authorize(Roles = "Doctor")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<TicketResponse>> AssignToMe(int id)
    {
        var result = await _ticketService.AssignToMeAsync(id, GetCurrentUserId(), GetCurrentRole());
        return Ok(result);
    }

    [HttpPost("{id:int}/status")]
    [Authorize(Roles = "Doctor")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TicketResponse>> ChangeStatus(int id, [FromBody] ChangeStatusRequest request)
    {
        var result = await _ticketService.ChangeStatusAsync(id, request, GetCurrentUserId(), GetCurrentRole());
        return Ok(result);
    }

    [HttpPost("{id:int}/reject")]
    [Authorize(Roles = "Doctor")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TicketResponse>> Reject(int id, [FromBody] RejectRequest request)
    {
        var result = await _ticketService.RejectAsync(id, request, GetCurrentUserId(), GetCurrentRole());
        return Ok(result);
    }

    [HttpPost("{id:int}/medical-record")]
    [Authorize(Roles = "Doctor")]
    [ProducesResponseType(typeof(TicketResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<TicketResponse>> UpdateMedicalRecord(int id, [FromBody] UpdateMedicalRecordRequest request)
    {
        var result = await _ticketService.UpdateMedicalRecordAsync(id, request, GetCurrentUserId(), GetCurrentRole());
        return Ok(result);
    }

    private string GetCurrentUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? throw new InvalidOperationException("User ID claim is missing.");

    private string GetCurrentRole() =>
        User.FindFirstValue(ClaimTypes.Role)
        ?? User.FindFirstValue("role")
        ?? throw new InvalidOperationException("Role claim is missing.");
}
