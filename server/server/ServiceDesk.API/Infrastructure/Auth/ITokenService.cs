using ServiceDesk.API.Models;

namespace ServiceDesk.API.Infrastructure.Auth;

public interface ITokenService
{
    string GenerateToken(ApplicationUser user, string role);
}
