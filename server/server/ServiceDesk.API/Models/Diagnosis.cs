namespace ServiceDesk.API.Models;

public class Diagnosis
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Specialty { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
