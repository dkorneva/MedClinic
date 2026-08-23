namespace ServiceDesk.API.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string DoctorSpecialty { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
