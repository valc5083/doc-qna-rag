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

        //Max file size in bytes (e.g., 50 MB)
        private const long MaxFileSizeBytes = 50 * 1024 * 1024;

        public DocumentService(AppDbContext db, ILogger<DocumentService> logger, IngestionService ingestionService)
        {
            _db = db;
            _logger = logger;
            _ingestionService = ingestionService;
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
            // Copy stream to memory so it survives the request
            var memoryStream = new MemoryStream();
            await file.CopyToAsync(memoryStream);
            memoryStream.Position = 0;

            var docId = document.Id;
            _ = Task.Run(async () =>
            {
                try
                {
                    await _ingestionService.IngestAsync(docId, memoryStream);
                }
                finally
                {
                    await memoryStream.DisposeAsync();
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

            _db.Documents.Remove(document);
            await _db.SaveChangesAsync();

            _logger.LogInformation("Document {DocumentId} deleted by user {UserId}. Original file name: {FileName}", 
                document.Id, userId, document.OriginalFileName);

            return true;
        }
    }
}
