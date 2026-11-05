using System.ComponentModel.DataAnnotations;

namespace ServiceDesk.API.DTOs.Auth;

public sealed class RegisterRequest
{
    public RegisterRequest() { }
    public RegisterRequest(string email, string password, string displayName, string confirmPassword)
    {
        Email = email;
        Password = password;
        DisplayName = displayName;
        ConfirmPassword = confirmPassword;
    }

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;

    [Required, StringLength(30, MinimumLength = 2)]
    [RegularExpression(@"[A-Za-zА-Яа-яЁё-](?:[A-Za-zА-Яа-яЁё -]*[A-Za-zА-Яа-яЁё-])?", ErrorMessage = "Имя должно содержать 2–30 букв, пробелов или дефисов, без пробелов по краям.")]
    public string DisplayName { get; set; } = string.Empty;

    [Required, Compare(nameof(Password), ErrorMessage = "Пароли не совпадают.")]
    public string ConfirmPassword { get; set; } = string.Empty;
}
