namespace ServiceDesk.API.DTOs.Categories;

public sealed class CategoryResponse
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DoctorSpecialty { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsActive { get; set; }
}
