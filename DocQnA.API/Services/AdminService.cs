using DocQnA.API.DTOs;
using DocQnA.API.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DocQnA.API.Services;

public class AdminService
{
    private readonly AppDbContext _db;
    private readonly ILogger<AdminService> _logger;

    public AdminService(AppDbContext db, ILogger<AdminService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<AdminStatsResponse> GetStatsAsync()
    {
        var totalUsers = await _db.Users.CountAsync();
        var totalDocuments = await _db.Documents.CountAsync();
        var totalConversations = await _db.ChatMessages.CountAsync();
        var totalCollections = await _db.Collections.CountAsync();
        var readyDocs = await _db.Documents
            .CountAsync(d => d.Status == "ready");
        var processingDocs = await _db.Documents
            .CountAsync(d => d.Status == "processing");
        var failedDocs = await _db.Documents
            .CountAsync(d => d.Status == "failed");
        var totalStorage = await _db.Documents
            .SumAsync(d => d.FileSizeBytes);

        return new AdminStatsResponse
        {
            TotalUsers = totalUsers,
            TotalDocuments = totalDocuments,
            TotalConversations = totalConversations,
            TotalCollections = totalCollections,
            ReadyDocuments = readyDocs,
            ProcessingDocuments = processingDocs,
            FailedDocuments = failedDocs,
            TotalStorageBytes = totalStorage,
            ServerTime = DateTime.UtcNow
        };
    }

    public async Task<List<AdminUserResponse>> GetUsersAsync()
    {
        var users = await _db.Users
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        var result = new List<AdminUserResponse>();

        foreach (var user in users)
        {
            var docCount = await _db.Documents
                .CountAsync(d => d.UserId == user.Id);
            var convoCount = await _db.ChatMessages
                .CountAsync(c => c.UserId == user.Id);
            var colCount = await _db.Collections
                .CountAsync(c => c.UserId == user.Id);
            var storage = await _db.Documents
                .Where(d => d.UserId == user.Id)
                .SumAsync(d => (long?)d.FileSizeBytes) ?? 0;
            var lastActive = await _db.ChatMessages
                .Where(c => c.UserId == user.Id)
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => (DateTime?)c.CreatedAt)
                .FirstOrDefaultAsync();

            result.Add(new AdminUserResponse
            {
                Id = user.Id,
                Email = user.Email,
                CreatedAt = user.CreatedAt,
                DocumentCount = docCount,
                ConversationCount = convoCount,
                CollectionCount = colCount,
                TotalStorageBytes = storage,
                LastActive = lastActive
            });
        }

        return result;
    }

    public async Task<List<AdminDocumentResponse>> GetDocumentsAsync()
    {
        return await _db.Documents
            .Include(d => d.User)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new AdminDocumentResponse
            {
                Id = d.Id,
                OriginalFileName = d.OriginalFileName,
                Status = d.Status,
                ChunkCount = d.ChunkCount,
                FileSizeBytes = d.FileSizeBytes,
                CreatedAt = d.CreatedAt,
                UserEmail = d.User.Email,
                UserId = d.UserId
            })
            .ToListAsync();
    }

    public async Task<List<AdminConversationResponse>>
        GetConversationsAsync(int limit = 50)
    {
        var messages = await _db.ChatMessages
            .Include(c => c.User)
            .Include(c => c.Document)
            .OrderByDescending(c => c.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return messages.Select(m => new AdminConversationResponse
        {
            Id = m.Id,
            Question = m.Question,
            Answer = m.Answer.Length > 200
                ? m.Answer[..200] + "..."
                : m.Answer,
            UserEmail = m.User.Email,
            DocumentName = m.Document?.OriginalFileName,
            CreatedAt = m.CreatedAt,
            SourceCount = string.IsNullOrEmpty(m.SourceChunks)
                ? 0
                : System.Text.Json.JsonSerializer
                    .Deserialize<List<object>>(m.SourceChunks)?.Count ?? 0
        }).ToList();
    }

    public async Task<bool> DeleteUserAsync(Guid userId)
    {
        var user = await _db.Users.FindAsync(userId);
        if (user == null) return false;

        _db.Users.Remove(user);
        await _db.SaveChangesAsync();

        _logger.LogWarning(
            "Admin deleted user {UserId} ({Email})",
            userId, user.Email);

        return true;
    }

    public async Task<bool> DeleteDocumentAsync(Guid documentId)
    {
        var doc = await _db.Documents.FindAsync(documentId);
        if (doc == null) return false;

        _db.Documents.Remove(doc);
        await _db.SaveChangesAsync();

        _logger.LogWarning(
            "Admin deleted document {DocId} ({Name})",
            documentId, doc.OriginalFileName);

        return true;
    }
}