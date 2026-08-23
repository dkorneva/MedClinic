namespace ServiceDesk.API.Models;

public enum TicketStatus
{
    New,
    InProgress,
    Resolved,
    Closed,
    Rejected
}

public enum TicketPriority
{
    Low,
    Medium,
    High
}
