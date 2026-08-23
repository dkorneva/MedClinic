namespace ServiceDesk.API.DTOs.Tickets;

public sealed class TicketsQuery
{
    public string? Status { get; set; }
    public int? CategoryId { get; set; }
    public bool? AssignedToMe { get; set; }
    public bool? UnassignedOnly { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
