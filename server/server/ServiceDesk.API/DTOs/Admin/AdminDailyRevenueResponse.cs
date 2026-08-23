namespace ServiceDesk.API.DTOs.Admin;

public sealed class AdminDailyRevenueResponse
{
    public string DateKey { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
}
