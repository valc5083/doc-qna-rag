using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DocQnA.API.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAiFallbackFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AnswerSource",
                table: "ChatMessages",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FallbackReason",
                table: "ChatMessages",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AnswerSource",
                table: "ChatMessages");

            migrationBuilder.DropColumn(
                name: "FallbackReason",
                table: "ChatMessages");
        }
    }
}
