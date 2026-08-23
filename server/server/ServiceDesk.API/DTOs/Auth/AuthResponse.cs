namespace ServiceDesk.API.DTOs.Auth;

// record - не изменяемый (immutable) объект данных, который может содержать несколько полей. Он автоматически генерирует конструктор, свойства, методы Equals и GetHashCode, а также синтаксис для создания экземпляров, методы сравнения и ToString()

public record AuthResponse(string AccessToken);
