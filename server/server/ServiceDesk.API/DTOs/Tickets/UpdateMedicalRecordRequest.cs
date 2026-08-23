using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.API.DTOs.Tickets;

public sealed class UpdateMedicalRecordRequest
{
    [Required]
    public int DiagnosisId { get; set; }

    [Required]
    [MaxLength(2000)]
    public string Treatment { get; set; } = string.Empty;
}
