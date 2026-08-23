using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ServiceDesk.API.Application.Abstractions.Persistence;
using ServiceDesk.API.Models;

namespace ServiceDesk.API.Data;

// IdentityDbContext закрывается типом ApplicationUser
public class AppDbContext : IdentityDbContext<ApplicationUser>, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>(); // геттер
    public DbSet<Diagnosis> Diagnoses => Set<Diagnosis>();
    public DbSet<Doctor> Doctors => Set<Doctor>();
    public DbSet<DoctorTimeSlot> DoctorTimeSlots => Set<DoctorTimeSlot>();
    public DbSet<Ticket> Tickets => Set<Ticket>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Category>()
            .HasIndex(category => category.Name)
            .IsUnique();

        builder.Entity<Category>()
            .Property(category => category.Name)
            .HasMaxLength(100);

        builder.Entity<Category>()
            .Property(category => category.DoctorSpecialty)
            .HasMaxLength(100);

        builder.Entity<Category>()
            .Property(category => category.Price)
            .HasColumnType("decimal(10,2)");

        builder.Entity<Diagnosis>()
            .HasIndex(diagnosis => new { diagnosis.Specialty, diagnosis.Name })
            .IsUnique();

        builder.Entity<Diagnosis>()
            .Property(diagnosis => diagnosis.Name)
            .HasMaxLength(200);

        builder.Entity<Diagnosis>()
            .Property(diagnosis => diagnosis.Specialty)
            .HasMaxLength(100);

        builder.Entity<Doctor>()
            .HasIndex(doctor => doctor.Email)
            .IsUnique();

        builder.Entity<Doctor>()
            .Property(doctor => doctor.FullName)
            .HasMaxLength(150);

        builder.Entity<Doctor>()
            .Property(doctor => doctor.Email)
            .HasMaxLength(150);

        builder.Entity<Doctor>()
            .Property(doctor => doctor.Specialty)
            .HasMaxLength(100);

        builder.Entity<Doctor>()
            .HasMany(doctor => doctor.TimeSlots)
            .WithOne(slot => slot.Doctor)
            .HasForeignKey(slot => slot.DoctorId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<DoctorTimeSlot>()
            .HasIndex(slot => new { slot.DoctorId, slot.StartAt })
            .IsUnique();

        builder.Entity<Ticket>()
            .Property(ticket => ticket.Title)
            .HasMaxLength(200);

        builder.Entity<Ticket>()
            .Property(ticket => ticket.Description)
            .HasMaxLength(2000);

        builder.Entity<Ticket>()
            .Property(ticket => ticket.Treatment)
            .HasMaxLength(2000);

        builder.Entity<Ticket>()
            .HasOne(ticket => ticket.Category)
            .WithMany(category => category.Tickets)
            .HasForeignKey(ticket => ticket.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Ticket>()
            .HasOne(ticket => ticket.Doctor)
            .WithMany(doctor => doctor.Tickets)
            .HasForeignKey(ticket => ticket.DoctorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Ticket>()
            .HasOne(ticket => ticket.DoctorTimeSlot)
            .WithOne(slot => slot.Ticket)
            .HasForeignKey<Ticket>(ticket => ticket.DoctorTimeSlotId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Ticket>()
            .HasOne(ticket => ticket.Author)
            .WithMany()
            .HasForeignKey(ticket => ticket.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Ticket>()
            .HasOne(ticket => ticket.Assignee)
            .WithMany()
            .HasForeignKey(ticket => ticket.AssigneeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Ticket>()
            .HasOne(ticket => ticket.Diagnosis)
            .WithMany(diagnosis => diagnosis.Tickets)
            .HasForeignKey(ticket => ticket.DiagnosisId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Ticket>()
            .HasIndex(ticket => ticket.CreatedAt);

        builder.Entity<Ticket>()
            .HasIndex(ticket => ticket.Status);

        builder.Entity<Ticket>()
            .HasIndex(ticket => ticket.AppointmentAt);
    }
}
