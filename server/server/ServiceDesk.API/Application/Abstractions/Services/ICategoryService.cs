using ServiceDesk.API.DTOs.Categories;

namespace ServiceDesk.API.Application.Abstractions.Services;

public interface ICategoryService
{
    Task<IReadOnlyList<CategoryResponse>> GetAllAsync(bool includeInactive, string role);
    Task<CategoryResponse> CreateAsync(CreateCategoryRequest request);
    Task<CategoryResponse> UpdateAsync(int id, UpdateCategoryRequest request);
    Task<CategoryResponse> SetActiveAsync(int id, SetActiveCategoryRequest request);
}
