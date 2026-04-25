using DocQnA.API.DTOs;
using DocQnA.API.Infrastructure;
using DocQnA.API.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace DocQnA.API.Services;

public class ShareService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;
    private readonly ILogger<ShareService> _logger;

    public ShareService(
        AppDbContext db,
        IConfiguration config,
        ILogger<ShareService> logger)
    {
        _db = db;
        _config = config;
        _logger = logger;
    }

    public async Task<ShareResponse> CreateShareAsync(
        CreateShareRequest request, Guid userId)
    {
        // Verify document ownership
        var document = await _db.Documents
            .FirstOrDefaultAsync(d =>
                d.Id == request.DocumentId &&
                d.UserId == userId);

        if (document == null)
            throw new KeyNotFoundException("Document not found.");

        // Generate unique share token
        var token = GenerateToken();

        var shared = new SharedChat
        {
            ShareToken = token,
            UserId = userId,
            DocumentId = request.DocumentId,
            Title = string.IsNullOrEmpty(request.Title)
                ? $"Chat about {document.OriginalFileName}"
                : request.Title,
            ChatDataJson = JsonSerializer.Serialize(
                request.Messages),
            ExpiresAt = DateTime.UtcNow.AddDays(
                Math.Clamp(request.ExpiryDays, 1, 90))
        };

        _db.SharedChats.Add(shared);
        await _db.SaveChangesAsync();

        var frontendUrl = _config["FrontendUrl"]
            ?? "http://localhost:5173";

        _logger.LogInformation(
            "Created share link {Token} for doc {DocId}",
            token, request.DocumentId);

        return new ShareResponse
        {
            ShareToken = token,
            ShareUrl = $"{frontendUrl}/share/{token}",
            ExpiresAt = shared.ExpiresAt
        };
    }

    public async Task<SharedChatResponse> GetSharedChatAsync(
        string token)
    {
        var shared = await _db.SharedChats
            .Include(s => s.Document)
            .FirstOrDefaultAsync(s =>
                s.ShareToken == token &&
                s.IsPublic &&
                s.ExpiresAt > DateTime.UtcNow);

        if (shared == null)
            throw new KeyNotFoundException(
                "Share link not found or expired.");

        // Increment view count
        shared.ViewCount++;
        await _db.SaveChangesAsync();

        var messages = JsonSerializer
            .Deserialize<List<ShareChatMessage>>(
                shared.ChatDataJson)
            ?? new List<ShareChatMessage>();

        return new SharedChatResponse
        {
            Title = shared.Title,
            DocumentName = shared.Document.OriginalFileName,
            Messages = messages,
            CreatedAt = shared.CreatedAt,
            ExpiresAt = shared.ExpiresAt,
            ViewCount = shared.ViewCount
        };
    }

    public async Task<bool> DeleteShareAsync(
        string token, Guid userId)
    {
        var shared = await _db.SharedChats
            .FirstOrDefaultAsync(s =>
                s.ShareToken == token &&
                s.UserId == userId);

        if (shared == null) return false;

        _db.SharedChats.Remove(shared);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<List<ShareResponse>>
        GetUserSharesAsync(Guid userId)
    {
        var frontendUrl = _config["FrontendUrl"]
            ?? "http://localhost:5173";

        return await _db.SharedChats
            .Where(s => s.UserId == userId &&
                        s.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new ShareResponse
            {
                ShareToken = s.ShareToken,
                ShareUrl = $"{frontendUrl}/share/{s.ShareToken}",
                ExpiresAt = s.ExpiresAt
            })
            .ToListAsync();
    }

    private static string GenerateToken()
    {
        var bytes = new byte[12];
        using var rng =
            System.Security.Cryptography.RandomNumberGenerator
                .Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes)
            .Replace('+', '-')
            .Replace('/', '_')
            .TrimEnd('=');
    }
}