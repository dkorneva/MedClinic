using Microsoft.IdentityModel.Tokens;
using ServiceDesk.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ServiceDesk.API.Infrastructure.Auth;

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(ApplicationUser user, string role)
    {
        var jwtKey = _configuration["Jwt:Key"];
        if (string.IsNullOrWhiteSpace(jwtKey))
            throw new InvalidOperationException("Jwt:Key is not configured.");

        var jwtIssuer = _configuration["Jwt:Issuer"];
        if (string.IsNullOrWhiteSpace(jwtIssuer))
            throw new InvalidOperationException("Jwt:Issuer is not configured.");

        var jwtAudience = _configuration["Jwt:Audience"];
        if (string.IsNullOrWhiteSpace(jwtAudience))
            throw new InvalidOperationException("Jwt:Audience is not configured.");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim("role", role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var expiresMinutes = _configuration.GetValue<int>("Jwt:ExpiresMinutes", 60);

        // именованные аргументы
        // двоеточие разрешает произвольный порядок, имя_параметра : значение
        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
