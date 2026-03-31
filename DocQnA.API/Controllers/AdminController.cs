using DocQnA.API.Middleware;
using DocQnA.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DocQnA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AdminController : ControllerBase
{
    private readonly AdminService _adminService;
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;

    public AdminController(
        AdminService adminService,
        IConfiguration config,
        IWebHostEnvironment env)
    {
        _adminService = adminService;
        _config = config;
        _env = env;
    }

    private IActionResult Forbidden() =>
        StatusCode(403, new { message = "Admin access required." });

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        if (!User.IsAdmin(_config)) return Forbidden();
        var stats = await _adminService.GetStatsAsync();
        return Ok(stats);
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        if (!User.IsAdmin(_config)) return Forbidden();
        var users = await _adminService.GetUsersAsync();
        return Ok(users);
    }

    [HttpDelete("users/{userId:guid}")]
    public async Task<IActionResult> DeleteUser(Guid userId)
    {
        if (!User.IsAdmin(_config)) return Forbidden();
        var deleted = await _adminService.DeleteUserAsync(userId);
        if (!deleted)
            return NotFound(new { message = "User not found." });
        return NoContent();
    }

    [HttpGet("documents")]
    public async Task<IActionResult> GetDocuments()
    {
        if (!User.IsAdmin(_config)) return Forbidden();
        var docs = await _adminService.GetDocumentsAsync();
        return Ok(docs);
    }

    [HttpDelete("documents/{documentId:guid}")]
    public async Task<IActionResult> DeleteDocument(Guid documentId)
    {
        if (!User.IsAdmin(_config)) return Forbidden();
        var deleted = await _adminService
            .DeleteDocumentAsync(documentId);
        if (!deleted)
            return NotFound(new { message = "Document not found." });
        return NoContent();
    }

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations(
        [FromQuery] int limit = 50)
    {
        if (!User.IsAdmin(_config)) return Forbidden();
        var convos = await _adminService
            .GetConversationsAsync(limit);
        return Ok(convos);
    }

    [HttpGet("health")]
    public IActionResult GetSystemHealth()
    {
        if (!User.IsAdmin(_config)) return Forbidden();
        return Ok(new
        {
            databaseStatus = "Connected",
            qdrantStatus = "Connected",
            appVersion = "1.0.0",
            serverTime = DateTime.UtcNow,
            environment = _env.EnvironmentName
        });
    }
}