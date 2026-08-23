using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;

namespace ServiceDesk.API.Tests.Infrastructure;

public static class ApiTestClientExtensions
{
    public static void SetBearerToken(this HttpClient client, string token)
    {
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    public static async Task<ProblemDetails?> ReadProblemDetailsAsync(this HttpResponseMessage response)
    {
        return await response.Content.ReadFromJsonAsync<ProblemDetails>();
    }
}
