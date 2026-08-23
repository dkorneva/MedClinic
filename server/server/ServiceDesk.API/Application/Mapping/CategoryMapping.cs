using ServiceDesk.API.DTOs.Categories;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Application.Mapping;

// не может иметь потомков, создаваться через new
public static class CategoryMapping
{
    public static CategoryResponse ToResponse(this Category category) => new()
    {
        Id = category.Id,
        Name = category.Name,
        DoctorSpecialty = category.DoctorSpecialty,
        Price = category.Price,
        IsActive = category.IsActive
    };
}
