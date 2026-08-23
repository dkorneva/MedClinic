using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ServiceDesk.API.Migrations.AppDb
{
    /// <inheritdoc />
    public partial class DoctorDiagnosesAndTreatment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DiagnosisId",
                table: "Tickets",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Treatment",
                table: "Tickets",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Diagnoses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Specialty = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Diagnoses", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_DiagnosisId",
                table: "Tickets",
                column: "DiagnosisId");

            migrationBuilder.CreateIndex(
                name: "IX_Diagnoses_Specialty_Name",
                table: "Diagnoses",
                columns: new[] { "Specialty", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Tickets_Diagnoses_DiagnosisId",
                table: "Tickets",
                column: "DiagnosisId",
                principalTable: "Diagnoses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tickets_Diagnoses_DiagnosisId",
                table: "Tickets");

            migrationBuilder.DropTable(
                name: "Diagnoses");

            migrationBuilder.DropIndex(
                name: "IX_Tickets_DiagnosisId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "DiagnosisId",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "Treatment",
                table: "Tickets");
        }
    }
}
