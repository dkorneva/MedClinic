using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.API.DTOs.Tickets;

[AttributeUsage(AttributeTargets.Property)]
public sealed class TrimmedTextLengthAttribute : ValidationAttribute
{
    public TrimmedTextLengthAttribute() : base("Текст должен содержать от 50 до 2000 символов после удаления пробелов по краям.") { }
    public override bool IsValid(object? value) => value is string text && text.Trim().Length is >= 50 and <= 2000;
}
