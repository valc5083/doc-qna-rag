using DocQnA.API.DTOs;
using DocQnA.API.Extensions;
using DocQnA.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DocQnA.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CollectionController : ControllerBase
{
    private readonly CollectionService _collectionService;

    public CollectionController(CollectionService collectionService)
    {
        _collectionService = collectionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var userId = User.GetUserId();
        var collections = await _collectionService.GetAllAsync(userId);
        return Ok(collections);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateCollectionRequest request)
    {
        try
        {
            var userId = User.GetUserId();
            var collection = await _collectionService
                .CreateAsync(request, userId);
            return Ok(collection);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("{collectionId:guid}/documents")]
    public async Task<IActionResult> AddDocument(
        Guid collectionId,
        [FromBody] AddDocumentToCollectionRequest request)
    {
        var userId = User.GetUserId();
        var success = await _collectionService
            .AddDocumentAsync(collectionId, request.DocumentId, userId);

        if (!success)
            return NotFound(new { message = "Collection or document not found." });

        return Ok(new { message = "Document added to collection." });
    }

    [HttpDelete("{collectionId:guid}/documents/{documentId:guid}")]
    public async Task<IActionResult> RemoveDocument(
        Guid collectionId, Guid documentId)
    {
        var userId = User.GetUserId();
        var success = await _collectionService
            .RemoveDocumentAsync(collectionId, documentId, userId);

        if (!success)
            return NotFound(new { message = "Not found." });

        return NoContent();
    }

    [HttpDelete("{collectionId:guid}")]
    public async Task<IActionResult> Delete(Guid collectionId)
    {
        var userId = User.GetUserId();
        var deleted = await _collectionService
            .DeleteAsync(collectionId, userId);

        if (!deleted)
            return NotFound(new { message = "Collection not found." });

        return NoContent();
    }
}