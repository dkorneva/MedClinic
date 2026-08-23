using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.DTOs.Categories;

namespace ServiceDesk.API.Controllers;

[ApiController]
[Route("api/categories")]
[Authorize]
[Produces("application/json")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categoryService;
    private readonly ILogger<CategoriesController> _logger;

    public CategoriesController(
        ICategoryService categoryService,
        ILogger<CategoriesController> logger)
    {
        _categoryService = categoryService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<CategoryResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IEnumerable<CategoryResponse>>> GetAll([FromQuery] bool includeInactive = false)
    {
        var role = User.FindFirstValue(ClaimTypes.Role)
            ?? User.FindFirstValue("role")
            ?? string.Empty;
        return Ok(await _categoryService.GetAllAsync(includeInactive, role));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<CategoryResponse>> Create([FromBody] CreateCategoryRequest request)
    {
        var result = await _categoryService.CreateAsync(request);
        _logger.LogInformation("Admin created category {CategoryId}", result.Id);
        return CreatedAtAction(nameof(GetAll), new { includeInactive = true }, result);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryResponse>> Update(int id, [FromBody] UpdateCategoryRequest request)
    {
        var result = await _categoryService.UpdateAsync(id, request);
        _logger.LogInformation("Admin updated category {CategoryId}", result.Id);
        return Ok(result);
    }

    [HttpPatch("{id:int}/active")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(CategoryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CategoryResponse>> SetActive(int id, [FromBody] SetActiveCategoryRequest request)
    {
        var result = await _categoryService.SetActiveAsync(id, request);
        _logger.LogInformation("Admin changed activity for category {CategoryId} to {IsActive}", result.Id, result.IsActive);
        return Ok(result);
    }
}
