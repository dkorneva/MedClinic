using Microsoft.EntityFrameworkCore.Migrations;

namespace ServiceDesk.API.Migrations.AppDb;

public partial class ServiceNamesBySpecialty : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_Categories_Name", table: "Categories");
        migrationBuilder.CreateIndex(
            name: "IX_Categories_DoctorSpecialty_Name",
            table: "Categories",
            columns: new[] { "DoctorSpecialty", "Name" },
            unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_Categories_DoctorSpecialty_Name", table: "Categories");
        migrationBuilder.CreateIndex(name: "IX_Categories_Name", table: "Categories", column: "Name", unique: true);
    }
}
