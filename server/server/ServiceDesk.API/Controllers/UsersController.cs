using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.DTOs.Users;

namespace ServiceDesk.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IUserAdminService _userAdminService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(
        IUserAdminService userAdminService,
        ILogger<UsersController> logger)
    {
        _userAdminService = userAdminService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IEnumerable<UserResponse>>> GetAll()
    {
        return Ok(await _userAdminService.GetAllAsync());
    }

    [HttpPut("{id}/role")]
    [ProducesResponseType(typeof(UserResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserResponse>> UpdateRole(string id, [FromBody] UpdateUserRoleRequest request)
    {
        var result = await _userAdminService.UpdateRoleAsync(id, request);
        _logger.LogInformation("Admin updated role for user {UserId} to {Role}", result.Id, result.Role);
        return Ok(result);
    }
}
