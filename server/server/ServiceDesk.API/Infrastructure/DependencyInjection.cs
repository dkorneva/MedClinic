using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ServiceDesk.API.Application.Abstractions.Persistence;
using ServiceDesk.API.Data;
using ServiceDesk.API.Infrastructure.Auth;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Infrastructure;

public static class DependencyInjection
{
    public const string ClientCorsPolicy = "ClientCorsPolicy";

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // дженерик после имени метода - принимаемые значения, до имени метода - возвращаемые значения
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));
        services.AddScoped<IAppDbContext>(provider => provider.GetRequiredService<AppDbContext>());

        services.AddIdentity<ApplicationUser, IdentityRole>(options =>
        {
            options.Password.RequireDigit = true;
            options.Password.RequiredLength = 6;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequireUppercase = false;
            options.User.RequireUniqueEmail = true;
        })
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        var jwtKey = configuration["Jwt:Key"]
            ?? Environment.GetEnvironmentVariable("JWT_KEY")
            ?? throw new InvalidOperationException("Jwt:Key is not configured.");
        var jwtIssuer = configuration["Jwt:Issuer"]
            ?? Environment.GetEnvironmentVariable("JWT_ISSUER")
            ?? throw new InvalidOperationException("Jwt:Issuer is not configured.");
        var jwtAudience = configuration["Jwt:Audience"]
            ?? Environment.GetEnvironmentVariable("JWT_AUDIENCE")
            ?? throw new InvalidOperationException("Jwt:Audience is not configured.");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
                RoleClaimType = ClaimTypes.Role
            };

            options.Events = new JwtBearerEvents
            {
                OnTokenValidated = context =>
                {
                    if (context.Principal?.Identity is not ClaimsIdentity identity)
                    {
                        return Task.CompletedTask;
                    }

                    var standardRole = identity.FindFirst(ClaimTypes.Role)?.Value;
                    var shortRole = identity.FindFirst("role")?.Value;

                    if (string.IsNullOrWhiteSpace(standardRole) && !string.IsNullOrWhiteSpace(shortRole))
                    {
                        identity.AddClaim(new Claim(ClaimTypes.Role, shortRole));
                    }

                    if (string.IsNullOrWhiteSpace(shortRole) && !string.IsNullOrWhiteSpace(standardRole))
                    {
                        identity.AddClaim(new Claim("role", standardRole));
                    }

                    var nameIdentifier = identity.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    var subject = identity.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                        ?? identity.FindFirst("sub")?.Value;

                    if (string.IsNullOrWhiteSpace(nameIdentifier) && !string.IsNullOrWhiteSpace(subject))
                    {
                        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, subject));
                    }

                    return Task.CompletedTask;
                },
                OnChallenge = async context =>
                {
                    context.HandleResponse();
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/problem+json";

                    var problem = new ProblemDetails
                    {
                        Status = StatusCodes.Status401Unauthorized,
                        Title = "Unauthorized",
                        Detail = "A valid Bearer token is required.",
                        Instance = context.Request.Path
                    };

                    await context.Response.WriteAsJsonAsync(problem);
                },
                OnForbidden = async context =>
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/problem+json";

                    var problem = new ProblemDetails
                    {
                        Status = StatusCodes.Status403Forbidden,
                        Title = "Forbidden",
                        Detail = "You do not have permission to access this resource.",
                        Instance = context.Request.Path
                    };

                    await context.Response.WriteAsJsonAsync(problem);
                }
            };
        });

        services.AddAuthorization();
        services.AddSignalR();
        services.AddCors(options =>
        {
            options.AddPolicy(ClientCorsPolicy, policy =>
            {
                policy
                    .WithOrigins("http://localhost:5173")
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });

        services.AddScoped<ITokenService, TokenService>();
        services
            .AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "ServiceDesk API",
                Version = "v1"
            });

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter your JWT token (without 'Bearer ' prefix)."
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    Array.Empty<string>()
                }
            });
        });

        return services;
    }
}
