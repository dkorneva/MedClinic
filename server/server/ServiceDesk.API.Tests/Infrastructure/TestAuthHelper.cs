using System.Net.Http.Json;
using ServiceDesk.API.DTOs.Auth;

namespace ServiceDesk.API.Tests.Infrastructure;

public static class TestAuthHelper
{
    public static async Task<string> GetAccessTokenAsync(HttpClient client, string email, string password)
    {
        var response = await client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync();
            throw new InvalidOperationException(
                $"Login failed for '{email}' with status {(int)response.StatusCode}: {body}");
        }

        var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>()
            ?? throw new InvalidOperationException("Login returned empty response.");

        if (string.IsNullOrWhiteSpace(authResponse.AccessToken))
        {
            throw new InvalidOperationException("Login returned an empty token.");
        }

        return authResponse.AccessToken;
    }
}
