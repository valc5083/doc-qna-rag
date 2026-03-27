using DocQnA.API.Extensions;
using DocQnA.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DocQnA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // ← All endpoints require JWT
public class DocumentController : ControllerBase
{
    private readonly DocumentService _documentService;

    public DocumentController(DocumentService documentService)
    {
        _documentService = documentService;
    }

    /// <summary>Upload a PDF document</summary>
    [HttpPost("upload")]
    [RequestSizeLimit(52428800)] // 50MB
    public async Task<IActionResult> Upload(IFormFile file)
    {
        try
        {
            var userId = User.GetUserId();
            var response = await _documentService.UploadAsync(file, userId);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>Get all documents for the current user</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = User.GetUserId();
        var documents = await _documentService.GetUserDocumentsAsync(userId);
        return Ok(documents);
    }

    /// <summary>Get a specific document by ID</summary>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var userId = User.GetUserId();
        var document = await _documentService.GetDocumentByIdAsync(id, userId);

        if (document == null)
            return NotFound(new { message = "Document not found." });

        return Ok(document);
    }

    /// <summary>Delete a document</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var userId = User.GetUserId();
        var deleted = await _documentService.DeleteDocumentAsync(id, userId);

        if (!deleted)
            return NotFound(new { message = "Document not found." });

        return NoContent();
    }

    /// <summary>Get document ingestion status</summary>
    [HttpGet("{id:guid}/status")]
    public async Task<IActionResult> GetStatus(Guid id)
    {
        var userId = User.GetUserId();
        var document = await _documentService.GetDocumentByIdAsync(id, userId);

        if (document == null)
            return NotFound(new { message = "Document not found." });

        return Ok(new { id = document.Id, status = document.Status });
    }

    /// <summary>Test PDF extraction only — remove after Next Integration</summary>
    [HttpPost("test-extraction")]
    [AllowAnonymous]
    public async Task<IActionResult> TestExtraction(
        IFormFile file,
        [FromServices] PdfExtractorService extractor,
        [FromServices] TextChunkerService chunker,
        [FromServices] ILogger<DocumentController> logger)
    {
        if (file == null || Path.GetExtension(file.FileName) != ".pdf")
            return BadRequest(new { message = "Please upload a PDF file." });

        using var stream = file.OpenReadStream();

        // Extract text
        var text = extractor.ExtractText(stream);
        logger.LogInformation("Text extraction completed. Length: {TextLength}", text.Length);

        // Chunk it
        stream.Position = 0;
        var chunks = chunker.ChunkText(text);
        logger.LogInformation("Text chunking completed. Chunk count: {ChunkCount}", chunks.Count);

        // Build response with materialized chunks
        var chunkDtos = chunks.Select(c => new
        {
            index = c.Index,
            tokenEstimate = c.TokenEstimate,
            preview = c.Text.Length > 150 ? c.Text[..150] + "..." : c.Text
        }).ToList();

        logger.LogInformation("Response serialization started");

        var response = new
        {
            totalCharacters = text.Length,
            estimatedTokens = text.Length / 4,
            chunkCount = chunks.Count,
            chunks = chunkDtos
        };

        logger.LogInformation("Response object created, returning result");
        return Ok(response);
    }
}