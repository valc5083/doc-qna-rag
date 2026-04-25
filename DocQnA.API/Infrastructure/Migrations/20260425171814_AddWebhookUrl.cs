using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DocQnA.API.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWebhookUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "WebhookUrl",
                table: "Users",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "WebhookUrl",
                table: "Users");
        }
    }
}
