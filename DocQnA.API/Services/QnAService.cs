using System.Text.Json;
using DocQnA.API.DTOs;
using DocQnA.API.Infrastructure;
using DocQnA.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DocQnA.API.Services;

public class QnAService
{
    private readonly AppDbContext _db;
    private readonly NimService _nimService;
    private readonly QdrantService _qdrantService;
    private readonly ILogger<QnAService> _logger;

    public QnAService(
        AppDbContext db,
        NimService nimService,
        QdrantService qdrantService,
        ILogger<QnAService> logger)
    {
        _db = db;
        _nimService = nimService;
        _qdrantService = qdrantService;
        _logger = logger;
    }

    public async Task<AskResponse> AskAsync(
        AskRequest request, Guid userId)
    {
        // ── Step 1: Get document + verify ownership ────────────
        var document = await _db.Documents
            .FirstOrDefaultAsync(d =>
                d.Id == request.DocumentId &&
                d.UserId == userId);

        if (document == null)
            throw new KeyNotFoundException("Document not found.");

        if (document.Status != "ready")
            throw new InvalidOperationException(
                "Document is still processing. Please wait.");

        _logger.LogInformation(
            "Q&A request for doc {DocId}: {Question}",
            request.DocumentId, request.Question);

        // ── Step 2: Embed the question ─────────────────────────
        _logger.LogInformation("Embedding question...");
        var questionVector = await _nimService
            .GetEmbeddingAsync(request.Question);

        // ── Step 3: Search Qdrant for relevant chunks ──────────
        _logger.LogInformation("Searching Qdrant for relevant chunks...");
        var searchResults = await _qdrantService.SearchAsync(
            document.QdrantCollectionName,
            questionVector,
            topK: 5);

        if (searchResults.Count == 0)
        {
            return new AskResponse
            {
                Question = request.Question,
                Answer = "I couldn't find relevant information in this document to answer your question.",
                Sources = new List<SourceChunk>(),
                CreatedAt = DateTime.UtcNow
            };
        }

        // ── Step 4: Build context + prompt ────────────────────
        var context = string.Join("\n\n---\n\n",
            searchResults.Select((r, i) =>
                $"[Source {i + 1}]\n{r.Text}"));

        var systemPrompt = """
            You are a helpful document assistant. 
            Answer the user's question based ONLY on the provided context.
            If the answer is not in the context, say "I don't have enough information in this document to answer that."
            Be concise, accurate, and cite which source you used when possible.
            """;

        var userMessage = $"""
            Context:
            {context}

            Question: {request.Question}
            """;

        // ── Step 5: Get answer from LLM ───────────────────────
        _logger.LogInformation("Sending to NVIDIA NIM LLM...");
        var answer = await _nimService
            .GetChatCompletionAsync(systemPrompt, userMessage);

        // ── Step 6: Build source chunks ───────────────────────
        var sources = searchResults.Select(r => new SourceChunk
        {
            Text = r.Text,
            Score = r.Score,
            ChunkIndex = r.ChunkIndex
        }).ToList();

        // ── Step 7: Save to chat history ──────────────────────
        var chatMessage = new ChatMessage
        {
            UserId = userId,
            DocumentId = document.Id,
            Question = request.Question,
            Answer = answer,
            SourceChunks = JsonSerializer.Serialize(sources)
        };

        _db.ChatMessages.Add(chatMessage);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "Q&A complete. Answer length: {Length} chars",
            answer.Length);

        return new AskResponse
        {
            Question = request.Question,
            Answer = answer,
            Sources = sources,
            CreatedAt = chatMessage.CreatedAt
        };
    }

    public async Task AskStreamAsync(
    string question,
    Guid documentId,
    Guid userId,
    HttpResponse response)
    {
        var fullAnswer = new System.Text.StringBuilder();

        try
        {
            // ── Step 1: Get document ───────────────────────────────
            var document = await _db.Documents
                .FirstOrDefaultAsync(d =>
                    d.Id == documentId &&
                    d.UserId == userId);

            if (document == null)
            {
                await WriteSSEAsync(response,
                    "error", "Document not found.");
                return;
            }

            if (document.Status != "ready")
            {
                await WriteSSEAsync(response,
                    "error", "Document is still processing.");
                return;
            }

            // ── Step 2: Embed question ─────────────────────────────
            await WriteSSEAsync(response, "status", "Searching document...");
            var questionVector = await _nimService
                .GetEmbeddingAsync(question);

            // ── Step 3: Search Qdrant ──────────────────────────────
            var searchResults = await _qdrantService.SearchAsync(
                document.QdrantCollectionName,
                questionVector,
                topK: 5);

            if (searchResults.Count == 0)
            {
                await WriteSSEAsync(response, "token",
                    "I couldn't find relevant information in this document.");
                await WriteSSEAsync(response, "done", "");
                return;
            }

            // ── Step 4: Send sources first ─────────────────────────
            var sources = searchResults.Select(r => new SourceChunk
            {
                Text = r.Text,
                Score = r.Score,
                ChunkIndex = r.ChunkIndex
            }).ToList();

            var sourcesJson = System.Text.Json.JsonSerializer
                .Serialize(
                sources,
                new System.Text.Json.JsonSerializerOptions
                {
                    PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
                });
            // Send sources as single line (no newlines in JSON)
            await response.WriteAsync($"event: sources\ndata: {sourcesJson}\n\n");
            await response.Body.FlushAsync();

            // ── Step 5: Build prompt ───────────────────────────────
            var context = string.Join("\n\n---\n\n",
                searchResults.Select((r, i) =>
                    $"[Source {i + 1}]\n{r.Text}"));

            var systemPrompt = """
            You are a helpful document assistant.
            Answer the user's question based ONLY on the provided context.
            If the answer is not in the context, say "I don't have enough information in this document to answer that."
            Be concise and accurate.
            """;

            var userMessage = $"""
            Context:
            {context}

            Question: {question}
            """;

            // ── Step 6: Stream tokens ──────────────────────────────
            await WriteSSEAsync(response, "status", "Generating answer...");

            await foreach (var token in _nimService
            .GetStreamingChatAsync(systemPrompt, userMessage))
            {
                fullAnswer.Append(token);
                // Only escape newlines for token events
                var escapedToken = token
                    .Replace("\\", "\\\\")
                    .Replace("\n", "\\n")
                    .Replace("\r", "");
                await response.WriteAsync(
                    $"event: token\ndata: {escapedToken}\n\n");
                await response.Body.FlushAsync();
            }

            // ── Step 7: Save to history ────────────────────────────
            var chatMessage = new ChatMessage
            {
                UserId = userId,
                DocumentId = document.Id,
                Question = question,
                Answer = fullAnswer.ToString(),
                SourceChunks = sourcesJson
            };

            _db.ChatMessages.Add(chatMessage);
            await _db.SaveChangesAsync();

            // ── Step 8: Signal completion ──────────────────────────
            await WriteSSEAsync(response, "done", "");

            _logger.LogInformation(
                "Streaming Q&A complete. {TokenCount} chars streamed.",
                fullAnswer.Length);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Streaming Q&A failed");
            await WriteSSEAsync(response, "error",
                "Something went wrong. Please try again.");
            await WriteSSEAsync(response, "done", "");
        }
    }

    // ── SSE Helper ────────────────────────────────────────────────
    private static async Task WriteSSEAsync(
    HttpResponse response, string eventType, string data)
    {
        // ← For sources (JSON), don't escape — write raw
        await response.WriteAsync($"event: {eventType}\ndata: {data}\n\n");
        await response.Body.FlushAsync();
    }

    public async Task<List<ChatHistoryResponse>> GetHistoryAsync(
        Guid userId, int limit = 20)
    {
        var messages = await _db.ChatMessages
            .Where(c => c.UserId == userId)
            .Include(c => c.Document)
            .OrderByDescending(c => c.CreatedAt)
            .Take(limit)
            .ToListAsync();

        return messages.Select(m => new ChatHistoryResponse
        {
            Id = m.Id,
            Question = m.Question,
            Answer = m.Answer,
            Sources = JsonSerializer
                .Deserialize<List<SourceChunk>>(m.SourceChunks)
                ?? new List<SourceChunk>(),
            DocumentId = m.DocumentId,
            DocumentName = m.Document?.OriginalFileName,
            CreatedAt = m.CreatedAt
        }).ToList();
    }

    public async Task ClearHistoryAsync(Guid userId)
    {
        var messages = await _db.ChatMessages
            .Where(c => c.UserId == userId)
            .ToListAsync();

        _db.ChatMessages.RemoveRange(messages);
        await _db.SaveChangesAsync();
    }
}