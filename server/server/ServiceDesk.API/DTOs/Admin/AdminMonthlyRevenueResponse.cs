namespace ServiceDesk.API.DTOs.Admin;

public sealed class AdminMonthlyRevenueResponse
{
    public string MonthKey { get; set; } = string.Empty;
    public decimal Revenue { get; set; }
    public int AppointmentsCount { get; set; }
}
