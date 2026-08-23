using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace ServiceDesk.API.Hubs;

[Authorize]
public class DoctorSlotsHub : Hub
{
    private const string DoctorGroupPrefix = "doctor_";
    
    public async Task SubscribeToDoctorSlots(int doctorId)
    {
        var groupName = GetGroupName(doctorId);
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task UnsubscribeFromDoctorSlots(int doctorId)
    {
        var groupName = GetGroupName(doctorId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    public static string GetGroupName(int doctorId) => $"{DoctorGroupPrefix}{doctorId}";
}
