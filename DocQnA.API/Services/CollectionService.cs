using DocQnA.API.DTOs;
using DocQnA.API.Infrastructure;
using DocQnA.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DocQnA.API.Services;

public class CollectionService
{
    private readonly AppDbContext _db;
    private readonly ILogger<CollectionService> _logger;

    public CollectionService(
        AppDbContext db,
        ILogger<CollectionService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<List<CollectionResponse>> GetAllAsync(Guid userId)
    {
        return await _db.Collections
            .Where(c => c.UserId == userId)
            .Include(c => c.CollectionDocuments)
                .ThenInclude(cd => cd.Document)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new CollectionResponse
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                DocumentCount = c.CollectionDocuments.Count,
                CreatedAt = c.CreatedAt,
                Documents = c.CollectionDocuments
                    .OrderByDescending(cd => cd.AddedAt)
                    .Select(cd => new CollectionDocumentResponse
                    {
                        Id = cd.Document.Id,
                        OriginalFileName = cd.Document.OriginalFileName,
                        Status = cd.Document.Status,
                        ChunkCount = cd.Document.ChunkCount,
                        FileSizeBytes = cd.Document.FileSizeBytes,
                        AddedAt = cd.AddedAt
                    }).ToList()
            })
            .ToListAsync();
    }

    public async Task<CollectionResponse> CreateAsync(
        CreateCollectionRequest request, Guid userId)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            throw new ArgumentException("Collection name is required.");

        var exists = await _db.Collections
            .AnyAsync(c =>
                c.UserId == userId &&
                c.Name.ToLower() == request.Name.ToLower());

        if (exists)
            throw new InvalidOperationException(
                "A collection with this name already exists.");

        var collection = new Collection
        {
            UserId = userId,
            Name = request.Name.Trim(),
            Description = request.Description.Trim()
        };

        _db.Collections.Add(collection);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Collection {Name} created for user {UserId}",
            collection.Name, userId);

        return new CollectionResponse
        {
            Id = collection.Id,
            Name = collection.Name,
            Description = collection.Description,
            DocumentCount = 0,
            CreatedAt = collection.CreatedAt,
            Documents = new List<CollectionDocumentResponse>()
        };
    }

    public async Task<bool> AddDocumentAsync(
        Guid collectionId, Guid documentId, Guid userId)
    {
        // Verify collection belongs to user
        var collection = await _db.Collections
            .FirstOrDefaultAsync(c =>
                c.Id == collectionId && c.UserId == userId);

        if (collection == null) return false;

        // Verify document belongs to user
        var document = await _db.Documents
            .FirstOrDefaultAsync(d =>
                d.Id == documentId && d.UserId == userId);

        if (document == null) return false;

        // Check not already added
        var alreadyAdded = await _db.CollectionDocuments
            .AnyAsync(cd =>
                cd.CollectionId == collectionId &&
                cd.DocumentId == documentId);

        if (alreadyAdded) return true; // idempotent

        _db.CollectionDocuments.Add(new CollectionDocument
        {
            CollectionId = collectionId,
            DocumentId = documentId
        });

        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Document {DocId} added to collection {ColId}",
            documentId, collectionId);

        return true;
    }

    public async Task<bool> RemoveDocumentAsync(
        Guid collectionId, Guid documentId, Guid userId)
    {
        var collection = await _db.Collections
            .FirstOrDefaultAsync(c =>
                c.Id == collectionId && c.UserId == userId);

        if (collection == null) return false;

        var collectionDoc = await _db.CollectionDocuments
            .FirstOrDefaultAsync(cd =>
                cd.CollectionId == collectionId &&
                cd.DocumentId == documentId);

        if (collectionDoc == null) return false;

        _db.CollectionDocuments.Remove(collectionDoc);
        await _db.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteAsync(Guid collectionId, Guid userId)
    {
        var collection = await _db.Collections
            .FirstOrDefaultAsync(c =>
                c.Id == collectionId && c.UserId == userId);

        if (collection == null) return false;

        _db.Collections.Remove(collection);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Collection {ColId} deleted", collectionId);

        return true;
    }
}