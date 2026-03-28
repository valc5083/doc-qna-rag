using DocQnA.API.DTOs;
using DocQnA.API.Extensions;
using DocQnA.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DocQnA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class QnAController : ControllerBase
{
    private readonly QnAService _qnAService;

    public QnAController(QnAService qnAService)
    {
        _qnAService = qnAService;
    }

    /// <summary>Ask a question about a document</summary>
    [HttpPost("ask")]
    public async Task<IActionResult> Ask([FromBody] AskRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Question))
            return BadRequest(new { message = "Question cannot be empty." });

        if (request.DocumentId == Guid.Empty)
            return BadRequest(new { message = "DocumentId is required." });

        try
        {
            var userId = User.GetUserId();
            var response = await _qnAService.AskAsync(request, userId);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Ask a question with streaming response via SSE</summary>
    [HttpGet("ask-stream")]
    public async Task AskStream(
        [FromQuery] string question,
        [FromQuery] Guid documentId)
    {
        if (string.IsNullOrWhiteSpace(question) || documentId == Guid.Empty)
        {
            Response.StatusCode = 400;
            return;
        }

        // ── Set SSE headers ───────────────────────────────────────
        Response.Headers["Content-Type"] = "text/event-stream";
        Response.Headers["Cache-Control"] = "no-cache";

        var userId = User.GetUserId();

        await _qnAService.AskStreamAsync(
            question, documentId, userId, Response);
    }

    /// <summary>Get chat history for current user</summary>
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory(
        [FromQuery] int limit = 20)
    {
        var userId = User.GetUserId();
        var history = await _qnAService.GetHistoryAsync(userId, limit);
        return Ok(history);
    }

    /// <summary>Clear all chat history</summary>
    [HttpDelete("history")]
    public async Task<IActionResult> ClearHistory()
    {
        var userId = User.GetUserId();
        await _qnAService.ClearHistoryAsync(userId);
        return NoContent();
    }
}