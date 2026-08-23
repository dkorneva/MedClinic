using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceDesk.API.Migrations
{
    /// <inheritdoc />
    public partial class ClinicServicesStructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DoctorSpecialty",
                table: "Categories",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Categories",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DoctorSpecialty",
                table: "Categories");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Categories");
        }
    }
}
