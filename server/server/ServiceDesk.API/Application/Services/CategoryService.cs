using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Application.Abstractions.Persistence;
using ServiceDesk.API.Application.Abstractions.Services;
using ServiceDesk.API.Application.Mapping;
using ServiceDesk.API.DTOs.Categories;
using ServiceDesk.API.Exceptions;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly IAppDbContext _db;
    private readonly ILogger<CategoryService> _logger;

    public CategoryService(IAppDbContext db, ILogger<CategoryService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<IReadOnlyList<CategoryResponse>> GetAllAsync(bool includeInactive, string role)
    {
        IQueryable<Category> query = _db.Categories.AsNoTracking();
        var isAdmin = string.Equals(role, "Admin", StringComparison.Ordinal);

        if (!isAdmin || !includeInactive)
        {
            query = query.Where(category => category.IsActive);
        }

        var categories = await query
            .OrderBy(category => category.DoctorSpecialty)
            .ThenBy(category => category.Name)
            .ToListAsync();

        return categories
            .Select(category => category.ToResponse())
            .ToList();
    }

    public async Task<CategoryResponse> CreateAsync(CreateCategoryRequest request)
    {
        var name = NormalizeName(request.Name);
        var doctorSpecialty = await NormalizeDoctorSpecialtyAsync(request.DoctorSpecialty);
        var price = NormalizePrice(request.Price);

        if (await _db.Categories.AnyAsync(category => category.Name == name))
        {
            throw new BusinessException("Услуга с таким названием уже существует.");
        }

        var category = new Category
        {
            Name = name,
            DoctorSpecialty = doctorSpecialty,
            Price = price,
            IsActive = true
        };

        _db.Categories.Add(category);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Created clinic service {CategoryName} for specialty {DoctorSpecialty} with price {Price}",
            category.Name,
            category.DoctorSpecialty,
            category.Price);

        return category.ToResponse();
    }

    public async Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest request)
    {
        var category = await _db.Categories.FindAsync(id)
            ?? throw new NotFoundException($"Услуга с id {id} не найдена.");

        var name = NormalizeName(request.Name);
        var doctorSpecialty = await NormalizeDoctorSpecialtyAsync(request.DoctorSpecialty);
        var price = NormalizePrice(request.Price);

        if (await _db.Categories.AnyAsync(existing => existing.Id != id && existing.Name == name))
        {
            throw new BusinessException("Услуга с таким названием уже существует.");
        }

        category.Name = name;
        category.DoctorSpecialty = doctorSpecialty;
        category.Price = price;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Updated clinic service {CategoryId}: {CategoryName}, specialty {DoctorSpecialty}, price {Price}",
            category.Id,
            category.Name,
            category.DoctorSpecialty,
            category.Price);

        return category.ToResponse();
    }

    public async Task<CategoryResponse> SetActiveAsync(int id, SetActiveCategoryRequest request)
    {
        var category = await _db.Categories.FindAsync(id)
            ?? throw new NotFoundException($"Услуга с id {id} не найдена.");

        category.IsActive = request.IsActive;
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Changed clinic service {CategoryId} active state to {IsActive}",
            category.Id,
            category.IsActive);

        return category.ToResponse();
    }

    private static string NormalizeName(string? name)
    {
        var normalized = (name ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new BusinessException("Название услуги не должно быть пустым.");
        }

        return normalized;
    }

    private async Task<string> NormalizeDoctorSpecialtyAsync(string? doctorSpecialty)
    {
        var normalized = (doctorSpecialty ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new BusinessException("Специальность врача не должна быть пустой.");
        }

        var exists = await _db.Doctors.AnyAsync(doctor => doctor.Specialty == normalized);
        if (!exists)
        {
            throw new BusinessException("Нельзя выбрать специальность, по которой нет врачей.");
        }

        return normalized;
    }

    private static decimal NormalizePrice(decimal price)
    {
        if (price <= 0)
        {
            throw new BusinessException("Стоимость услуги должна быть больше нуля.");
        }

        return decimal.Round(price, 2, MidpointRounding.AwayFromZero);
    }
}
