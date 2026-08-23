using ServiceDesk.API.DTOs.Tickets;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Application.Mapping;

public static class TicketMapping
{
    public static TicketResponse ToResponse(this Ticket ticket) => new()
    {
        Id = ticket.Id,
        Title = ticket.Title,
        Description = ticket.Description,
        Status = ticket.Status.ToString(),
        Priority = ticket.Priority.ToString(),
        CreatedAt = ticket.CreatedAt,
        AppointmentAt = ticket.AppointmentAt,
        CategoryId = ticket.CategoryId,
        CategoryName = ticket.Category.Name,
        DoctorSpecialty = ticket.Doctor.Specialty,
        DoctorId = ticket.DoctorId,
        DoctorFullName = ticket.Doctor.FullName,
        DoctorTimeSlotId = ticket.DoctorTimeSlotId,
        DiagnosisId = ticket.DiagnosisId,
        DiagnosisName = ticket.Diagnosis?.Name,
        Treatment = ticket.Treatment,
        Author = new UserBriefResponse
        {
            Id = ticket.Author.Id,
            DisplayName = ticket.Author.DisplayName
        },
        Assignee = ticket.Assignee is null
            ? null
            : new UserBriefResponse
            {
                Id = ticket.Assignee.Id,
                DisplayName = ticket.Assignee.DisplayName
            }
    };
}
