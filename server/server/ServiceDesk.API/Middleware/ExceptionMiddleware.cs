using System.Net;
using Microsoft.AspNetCore.Mvc;
using ServiceDesk.API.Exceptions;

namespace ServiceDesk.API.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var (statusCode, title) = exception switch
        {
            BusinessException => (HttpStatusCode.BadRequest, "Bad Request"),
            NotFoundException => (HttpStatusCode.NotFound, "Not Found"),
            UnauthorizedException => (HttpStatusCode.Unauthorized, "Unauthorized"),
            ForbiddenException => (HttpStatusCode.Forbidden, "Forbidden"),
            ConflictException => (HttpStatusCode.Conflict, "Conflict"),
            _ => (HttpStatusCode.InternalServerError, "Internal Server Error")
        };

        if (statusCode == HttpStatusCode.InternalServerError)
        {
            _logger.LogError(exception, "Unhandled exception occurred");
        }

        var problem = new ProblemDetails
        {
            Status = (int)statusCode,
            Title = title,
            Detail = statusCode == HttpStatusCode.InternalServerError
                ? "An unexpected error occurred."
                : exception.Message,
            Instance = context.Request.Path
        };

        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)statusCode;

        await context.Response.WriteAsJsonAsync(problem);
    }
}
