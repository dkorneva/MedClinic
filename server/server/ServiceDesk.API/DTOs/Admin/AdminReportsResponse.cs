namespace ServiceDesk.API.DTOs.Admin;

public sealed class AdminReportsResponse
{
    public DateTimeOffset Start { get; set; }
    public DateTimeOffset End { get; set; }
    public decimal Revenue { get; set; }
    public int TotalAppointments { get; set; }
    public int CompletedAppointments { get; set; }
    public int RejectedAppointments { get; set; }
    public int NewPatients { get; set; }
    public int ActiveDoctors { get; set; }
    public decimal CompletionRate { get; set; }
    public IReadOnlyList<AdminDailyRevenueResponse> CurrentMonthRevenueByDay { get; set; } = [];
    public IReadOnlyList<AdminMonthlyRevenueResponse> RevenueByMonth { get; set; } = [];
    public IReadOnlyList<AdminStatusStatResponse> Statuses { get; set; } = [];
    public IReadOnlyList<AdminDoctorLoadResponse> DoctorLoads { get; set; } = [];
}
