using ServiceDesk.API.DTOs;
using ServiceDesk.API.DTOs.Tickets;

namespace ServiceDesk.API.Application.Abstractions.Services;

public interface ITicketService
{
    Task<TicketResponse> CreateAsync(CreateTicketRequest request, string currentUserId, string currentRole);
    Task<PagedResponse<TicketResponse>> GetListAsync(TicketsQuery query, string currentUserId, string currentRole); // возвращает объект класса PagedResponse, содержащий список TicketResponse
    Task<TicketResponse> GetByIdAsync(int id, string currentUserId, string currentRole);
    Task<TicketResponse> AssignToMeAsync(int id, string currentUserId, string currentRole);
    Task<TicketResponse> ChangeStatusAsync(int id, ChangeStatusRequest request, string currentUserId, string currentRole);
    Task<TicketResponse> RejectAsync(int id, RejectRequest request, string currentUserId, string currentRole);
    Task<TicketResponse> UpdateMedicalRecordAsync(int id, UpdateMedicalRecordRequest request, string currentUserId, string currentRole);
}
