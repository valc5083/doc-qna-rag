using DocQnA.API.DTOs;
using DocQnA.API.Extensions;
using DocQnA.API.Infrastructure;
using DocQnA.API.Services;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Mvc;

namespace DocQnA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequests request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequests request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] string refreshToken)
    {
        try
        {
            var response = await _authService.RefreshTokenAsync(refreshToken);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] string refreshToken)
    {
        await _authService.LogoutAsync(refreshToken);
        return NoContent();
    }

    [HttpPut("webhook")]
    public async Task<IActionResult> UpdateWebhook(
    [FromBody] UpdateWebhookRequest request,
    [FromServices] AppDbContext db)
    {
        var userId = User.GetUserId();
        var user = await db.Users.FindAsync(userId);
        if (user == null) return NotFound();

        user.WebhookUrl = request.WebhookUrl;
        await db.SaveChangesAsync();

        return Ok(new
        {
            message = "Webhook URL updated.",
            webhookUrl = user.WebhookUrl
        });
    }

    [HttpPost("webhook/test")]
    public async Task<IActionResult> TestWebhook(
        [FromBody] WebhookTestRequest request,
        [FromServices] WebhookService webhookService)
    {
        await webhookService.SendAsync(
            request.WebhookUrl,
            "test",
            new { message = "DocQnA webhook test successful!" });

        return Ok(new { message = "Test webhook sent." });
    }

}