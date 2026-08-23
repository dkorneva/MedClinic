using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.API.DTOs.Categories;

public sealed class UpdateCategoryRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string DoctorSpecialty { get; set; } = string.Empty;

    public decimal Price { get; set; }
}
