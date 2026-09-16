using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Application.Abstractions.Persistence;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.DTOs.Auth;
using ServiceDesk.API.Exceptions;
using ServiceDesk.API.Infrastructure.Auth;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Application.Services;

public class AuthService : IAuthService
{
    private const string DefaultDoctorSpecialty = "Не указана";

    private readonly IAppDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITokenService _tokenService;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IAppDbContext db,
        UserManager<ApplicationUser> userManager,
        ITokenService tokenService,
        ILogger<AuthService> logger)
    {
        _db = db;
        _userManager = userManager;
        _tokenService = tokenService;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            throw new BusinessException("Email is already registered.");
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new BusinessException(errors);
        }

        var roleResult = await _userManager.AddToRoleAsync(user, "Patient");
        if (!roleResult.Succeeded)
        {
            _logger.LogError("Failed to assign Patient role to user {UserId}", user.Id);
            throw new BusinessException("Failed to assign default role.");
        }

        var token = _tokenService.GenerateToken(user, "Patient");
        _logger.LogInformation("User {Email} registered successfully", user.Email);

        return new AuthResponse(token);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, request.Password))
        {
            throw new UnauthorizedException("Invalid email or password.");
        }

        var roles = await _userManager.GetRolesAsync(user);
        var role = roles.FirstOrDefault() ?? "Patient";

        var token = _tokenService.GenerateToken(user, role);
        _logger.LogInformation("User {Email} logged in successfully", user.Email);

        return new AuthResponse(token);
    }

    public async Task<MeResponse> GetMeAsync(string userId, string role)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user is null)
        {
            throw new UnauthorizedException("User not found.");
        }

        if (role == "Doctor")
        {
            await EnsureDoctorCardAsync(user);
        }

        return new MeResponse(user.Id, user.Email!, user.DisplayName, role);
    }

    private async Task EnsureDoctorCardAsync(ApplicationUser user)
    {
        var email = NormalizeRequired(user.Email, "Email пользователя");
        var doctorExists = await _db.Doctors.AnyAsync(item => item.Email == email);
        if (doctorExists)
        {
            return;
        }

        _db.Doctors.Add(new Doctor
        {
            FullName = NormalizeRequired(user.DisplayName, "ФИО пользователя"),
            Email = email,
            Specialty = DefaultDoctorSpecialty,
            Status = DoctorStatus.Active
        });

        await _db.SaveChangesAsync();
    }

    private static string NormalizeRequired(string? value, string fieldName)
    {
        var normalized = (value ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new BusinessException($"{fieldName} не должно быть пустым.");
        }

        return normalized;
    }
}
