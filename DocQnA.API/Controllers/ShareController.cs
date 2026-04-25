using DocQnA.API.DTOs;
using DocQnA.API.Extensions;
using DocQnA.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DocQnA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ShareController : ControllerBase
{
    private readonly ShareService _shareService;

    public ShareController(ShareService shareService)
    {
        _shareService = shareService;
    }

    /// <summary>Create a public share link</summary>
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(
        [FromBody] CreateShareRequest request)
    {
        try
        {
            var userId = User.GetUserId();
            var result = await _shareService
                .CreateShareAsync(request, userId);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>View a shared chat (public — no auth)</summary>
    [HttpGet("{token}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetShared(string token)
    {
        try
        {
            var result = await _shareService
                .GetSharedChatAsync(token);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>Get current user's shares</summary>
    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMyShares()
    {
        var userId = User.GetUserId();
        var shares = await _shareService
            .GetUserSharesAsync(userId);
        return Ok(shares);
    }

    /// <summary>Delete a share link</summary>
    [HttpDelete("{token}")]
    [Authorize]
    public async Task<IActionResult> Delete(string token)
    {
        var userId = User.GetUserId();
        var deleted = await _shareService
            .DeleteShareAsync(token, userId);

        if (!deleted)
            return NotFound(new { message = "Share not found." });

        return NoContent();
    }
}