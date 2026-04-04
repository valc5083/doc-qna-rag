using DocQnA.API.DTOs;
using DocQnA.API.Models;
using DocQnA.API.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DocQnA.API.Services
{
    public class DocumentService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<DocumentService> _logger;
        private readonly IngestionService _ingestionService;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly QdrantService _qdrantService;
        private readonly SemanticCacheService? _cache;

        //Max file size in bytes (e.g., 50 MB)
        private const long MaxFileSizeBytes = 50 * 1024 * 1024;

        public DocumentService(AppDbContext db, ILogger<DocumentService> logger, IngestionService ingestionService, IServiceScopeFactory scopeFactory, QdrantService qdrantService, SemanticCacheService? cache)
        {
            _db = db;
            _logger = logger;
            _ingestionService = ingestionService;
            _scopeFactory = scopeFactory;
            _qdrantService = qdrantService;
            _cache = cache;
        }

        public async Task<DocumentUploadResponse> UploadAsync(IFormFile file, Guid userId)
        {
            // - Validate the file----------------------------------------------------------
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("File is required.");
            }

            if(file.Length > MaxFileSizeBytes)
            {
                throw new ArgumentException($"File size exceeds the maximum allowed size of {MaxFileSizeBytes / (1024 * 1024)} MB.");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if(extension != ".pdf" && extension != ".docx")
            {
                throw new ArgumentException("Unsupported file type. Only PDF and DOCX are allowed.");
            }

            //----- Generate unique Qdrant collection name ---------------
            var collectionName = $"doc_{userId}_{Guid.NewGuid():N}";

            // - Save the file to disk ------------------------------------------------------
            var document = new Document
            {
                UserId = userId,
                OriginalFileName = file.FileName,
                QdrantCollectionName = collectionName,
                FileSizeBytes = file.Length,
                Status = "processing"
            };

            _db.Documents.Add(document);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Document {DocumentId} uploaded by user {UserId}. Original file name: {FileName}, Size: {FileSize} bytes", 
                document.Id, userId, file.FileName, file.Length);

            // ── Trigger ingestion pipeline in background ──────────
            // ── Trigger ingestion in background with its own scope ────
            // ── Save file to disk ─────────────────────────────
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "uploads");

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            var filePath = Path.Combine(uploadsFolder, $"{Guid.NewGuid()}_{file.FileName}");

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // ── Trigger ingestion in background ───────────────
            var docId = document.Id;

            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var ingestionService = scope.ServiceProvider
                        .GetRequiredService<IngestionService>();

                    await ingestionService.IngestFromFileAsync(docId, filePath);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Background ingestion failed for document {DocId}", docId);
                }
            });

            return new DocumentUploadResponse
            {
                Id = document.Id,
                OriginalFileName = document.OriginalFileName,
                Status = document.Status,
                FileSizeBytes = document.FileSizeBytes,
                CreatedAt = document.CreatedAt
            };
        }

        public async Task<List<DocumentListResponse>> GetUserDocumentsAsync(Guid userId)
        {
            return await _db.Documents
                .Where(d => d.UserId == userId)
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new DocumentListResponse
                {
                    Id = d.Id,
                    OriginalFileName = d.OriginalFileName,
                    Status = d.Status,
                    chunkCount = d.ChunkCount,
                    FileSizeBytes = d.FileSizeBytes,
                    CreatedAt = d.CreatedAt
                })
                .ToListAsync();
        }
    
        public async Task<DocumentListResponse> GetDocumentByIdAsync(Guid documentId, Guid userId)
        {
            var doc = await _db.Documents.FirstOrDefaultAsync(d => d.Id == documentId && d.UserId == userId);
            if (doc == null)
            {
                throw new KeyNotFoundException("Document not found.");
            }

            return new DocumentListResponse
            {
                Id = doc.Id,
                OriginalFileName = doc.OriginalFileName,
                Status = doc.Status,
                chunkCount = doc.ChunkCount,
                FileSizeBytes = doc.FileSizeBytes,
                CreatedAt = doc.CreatedAt
            };
        }

        public async Task<bool> DeleteDocumentAsync(Guid documentId, Guid userId)
        {
            var document = await _db.Documents.FirstOrDefaultAsync(d => d.Id == documentId && d.UserId == userId);
            if (document == null)
            {
                throw new KeyNotFoundException("Document not found.");
            }

            // ── Delete Qdrant collection first ─────────────────────
            try
            {
                await _qdrantService.DeleteCollectionAsync(
                    document.QdrantCollectionName);

                await _qdrantService.DeleteImageCollectionAsync(
                    document.QdrantCollectionName);

                _logger.LogInformation(
                    "Deleted Qdrant collection {Collection} for doc {DocId}",
                    document.QdrantCollectionName, documentId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Failed to delete Qdrant collection {Collection} — continuing with DB delete",
                    document.QdrantCollectionName);
                // Don't block deletion if Qdrant fails
            }

            if (_cache != null)
                await _cache.InvalidateCacheAsync(documentId);

            // ── Delete chat messages for this document ─────────────
            var chatMessages = await _db.ChatMessages
                .Where(c => c.DocumentId == documentId)
                .ToListAsync();
            _db.ChatMessages.RemoveRange(chatMessages);

            // ── Delete document from PostgreSQL ────────────────────
            _db.Documents.Remove(document);
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Document {DocId} fully deleted — DB + Qdrant + ChatMessages",
                documentId);

            return true;
        }
    }
}
