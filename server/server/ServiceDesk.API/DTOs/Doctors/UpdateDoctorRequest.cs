using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.API.DTOs.Doctors;

public sealed class UpdateDoctorRequest
{
    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Specialty { get; set; } = string.Empty;

    [Required]
    public string Status { get; set; } = string.Empty;

    public IReadOnlyList<string> Slots { get; set; } = [];
}
