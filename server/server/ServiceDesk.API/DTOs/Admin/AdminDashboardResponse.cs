namespace ServiceDesk.API.DTOs.Admin;

public sealed class AdminDashboardResponse
{
    public int TotalDoctors { get; set; }
    public int ActiveDoctors { get; set; }
    public int ActiveCategories { get; set; }
    public int TodayAppointmentsCount { get; set; }
    public int NewAppointmentsCount { get; set; }
    public int InProgressAppointmentsCount { get; set; }
    public int CompletedAppointmentsCount { get; set; }
    public decimal TodayRevenue { get; set; }
    public IReadOnlyList<AdminDashboardAppointmentResponse> TodayAppointments { get; set; } = [];
    public IReadOnlyList<AdminDoctorLoadResponse> DoctorLoads { get; set; } = [];
}
