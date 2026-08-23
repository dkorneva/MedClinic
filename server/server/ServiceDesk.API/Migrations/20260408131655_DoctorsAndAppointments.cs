using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceDesk.API.Migrations
{
    /// <inheritdoc />
    public partial class DoctorsAndAppointments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "AppointmentAt",
                table: "Tickets",
                type: "datetimeoffset",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            migrationBuilder.AddColumn<int>(
                name: "DoctorId",
                table: "Tickets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "DoctorTimeSlotId",
                table: "Tickets",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Doctors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FullName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Email = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                    Specialty = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Doctors", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DoctorTimeSlots",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DoctorId = table.Column<int>(type: "int", nullable: false),
                    StartAt = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false),
                    IsBooked = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DoctorTimeSlots", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DoctorTimeSlots_Doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(@"
SET IDENTITY_INSERT [Doctors] ON;
INSERT INTO [Doctors] ([Id], [FullName], [Email], [Specialty], [Status])
SELECT
    [t].[Id],
    COALESCE([u].[DisplayName], N'Архивный врач #' + CAST([t].[Id] AS nvarchar(20))),
    CONCAT('legacy-doctor-', [t].[Id], '@medclinic.local'),
    [c].[DoctorSpecialty],
    0
FROM [Tickets] AS [t]
INNER JOIN [Categories] AS [c] ON [c].[Id] = [t].[CategoryId]
LEFT JOIN [AspNetUsers] AS [u] ON [u].[Id] = [t].[AssigneeId]
WHERE NOT EXISTS (
    SELECT 1
    FROM [Doctors] AS [d]
    WHERE [d].[Id] = [t].[Id]
);
SET IDENTITY_INSERT [Doctors] OFF;
");

            migrationBuilder.Sql(@"
SET IDENTITY_INSERT [DoctorTimeSlots] ON;
INSERT INTO [DoctorTimeSlots] ([Id], [DoctorId], [StartAt], [IsBooked])
SELECT
    [t].[Id],
    [t].[Id],
    CASE
        WHEN [t].[CreatedAt] > '2000-01-01T00:00:00+00:00' THEN DATEADD(day, 1, [t].[CreatedAt])
        ELSE SYSUTCDATETIME()
    END,
    1
FROM [Tickets] AS [t]
WHERE NOT EXISTS (
    SELECT 1
    FROM [DoctorTimeSlots] AS [s]
    WHERE [s].[Id] = [t].[Id]
);
SET IDENTITY_INSERT [DoctorTimeSlots] OFF;
");

            migrationBuilder.Sql(@"
UPDATE [t]
SET
    [t].[DoctorId] = [t].[Id],
    [t].[DoctorTimeSlotId] = [t].[Id],
    [t].[AppointmentAt] = [s].[StartAt]
FROM [Tickets] AS [t]
INNER JOIN [DoctorTimeSlots] AS [s] ON [s].[Id] = [t].[Id];
");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_AppointmentAt",
                table: "Tickets",
                column: "AppointmentAt");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_DoctorId",
                table: "Tickets",
                column: "DoctorId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_DoctorTimeSlotId",
                table: "Tickets",
                column: "DoctorTimeSlotId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Doctors_Email",
                table: "Doctors",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DoctorTimeSlots_DoctorId_StartAt",
                table: "DoctorTimeSlots",
                columns: new[] { "DoctorId", "StartAt" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_DoctorTimeSlots_DoctorTimeSlotId",
                table: "Tickets",
                column: "DoctorTimeSlotId",
                principalTable: "DoctorTimeSlots",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_Doctors_DoctorId",
                table: "Tickets",
                column: "DoctorId",
                principalTable: "Doctors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_DoctorTimeSlots_DoctorTimeSlotId",
                table: "Tickets");

            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_Doctors_DoctorId",
                table: "Tickets");

            migrationBuilder.DropTable(
                name: "DoctorTimeSlots");

            migrationBuilder.DropTable(
                name: "Doctors");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_AppointmentAt",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_DoctorId",
                table: "Tickets");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_DoctorTimeSlotId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "AppointmentAt",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "DoctorId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "DoctorTimeSlotId",
                table: "Tickets");
        }
    }
}
