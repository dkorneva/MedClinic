using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.DTOs.Doctors;

namespace ServiceDesk.API.Controllers;

[ApiController]
[Route("api/doctors")]
[Authorize]
[Produces("application/json")]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorService _doctorService;

    public DoctorsController(IDoctorService doctorService)
    {
        _doctorService = doctorService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<DoctorResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DoctorResponse>>> GetAll([FromQuery] DoctorListQuery query)
    {
        return Ok(await _doctorService.GetAllAsync(query));
    }

    [HttpGet("specialties")]
    [ProducesResponseType(typeof(IEnumerable<string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<string>>> GetSpecialties()
    {
        return Ok(await _doctorService.GetSpecialtiesAsync());
    }

    [HttpGet("{doctorId:int}/slots")]
    [ProducesResponseType(typeof(IEnumerable<DoctorTimeSlotResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DoctorTimeSlotResponse>>> GetSlots(int doctorId)
    {
        return Ok(await _doctorService.GetAvailableSlotsAsync(doctorId));
    }

    [HttpGet("{doctorId:int}/schedule")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<DoctorScheduleSlotResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DoctorScheduleSlotResponse>>> GetSchedule(int doctorId)
    {
        return Ok(await _doctorService.GetScheduleAsync(doctorId));
    }

    [HttpGet("me/schedule")]
    [Authorize(Roles = "Doctor")]
    [ProducesResponseType(typeof(IEnumerable<DoctorScheduleSlotResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DoctorScheduleSlotResponse>>> GetMySchedule()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? throw new InvalidOperationException("User ID claim is missing.");

        return Ok(await _doctorService.GetOwnScheduleAsync(userId));
    }

    [HttpPut("{id:int}/schedule")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(IEnumerable<DoctorScheduleSlotResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<DoctorScheduleSlotResponse>>> UpdateSchedule(int id, [FromBody] UpdateDoctorScheduleRequest request)
    {
        return Ok(await _doctorService.UpdateScheduleAsync(id, request));
    }

}
