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
            topK: 12,
            scoreThreshold: 0.15f);

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

        // ── Step 4: Re-rank and filter results ────────────────
        var rerankedResults = ReRankResults(searchResults, request.Question)
            .Take(8)
            .ToList();

        // ── Step 4.5: Determine if we need AI fallback ────────
        var useAiFallback = false;
        var fallbackReason = "";
        
        // Check if we have insufficient relevant results
        if (rerankedResults.Count == 0)
        {
            useAiFallback = true;
            fallbackReason = "No relevant information found in document";
        }
        else if (rerankedResults.Count < 3 && rerankedResults.Max(r => r.Score) < 0.35f)
        {
            useAiFallback = true;
            fallbackReason = "Low confidence in document matches";
        }

        string answer;
        List<SourceChunk> sources;

        if (useAiFallback)
        {
            // ── AI Fallback Path ───────────────────────────────
            _logger.LogInformation(
                "Using AI fallback for question: {Question}, Reason: {Reason}",
                request.Question, fallbackReason);

            var aiFallbackPrompt = $"""
                You are a knowledgeable AI assistant. The user has uploaded a document titled "{document.OriginalFileName}" and is asking a question.
                
                The document does not contain sufficient information to answer this question: "{request.Question}"
                
                Please provide a helpful answer based on your general knowledge. Be informative and accurate.
                
                Important:
                1. Start with: "⚠️ This answer is from AI general knowledge (not found in your document)"
                2. Provide a comprehensive answer to the question
                3. If relevant, suggest how this might relate to the document topic
                4. Keep your response clear and concise
                """;

            answer = await _nimService.GetChatCompletionAsync(
                "You are a helpful AI assistant providing general knowledge answers.",
                aiFallbackPrompt);

            sources = new List<SourceChunk>();
        }
        else
        {
            // ── Document-Based Answer Path (Original) ─────────
            var context = string.Join("\n\n---\n\n",
                rerankedResults.Select((r, i) =>
                    $"[Source {i + 1}]\n{r.Text}"));

            var systemPrompt = """
                You are an expert document assistant. Your task is to provide comprehensive, accurate answers based on the provided context.
                
                Instructions:
                1. Carefully analyze ALL provided sources to extract relevant information
                2. Synthesize information from multiple sources when applicable
                3. Provide detailed answers when the context supports it
                4. If information is partially available, provide what you can and note what's missing
                5. Only say you don't have enough information if the context is completely unrelated to the question
                6. When citing sources, mention which source number(s) you used
                7. Be thorough but concise - prioritize completeness over brevity
                """;

            var userMessage = $"""
                Context:
                {context}

                Question: {request.Question}
                """;

            answer = await _nimService.GetChatCompletionAsync(systemPrompt, userMessage);
            sources = rerankedResults.Select(r => new SourceChunk
            {
                Text = r.Text,
                Score = r.Score,
                ChunkIndex = r.ChunkIndex
            }).ToList();
        }

        // ── Step 8: Save to chat history ──────────────────────
        var chatMessage = new ChatMessage
        {
            UserId = userId,
            DocumentId = document.Id,
            Question = request.Question,
            Answer = answer,
            SourceChunks = JsonSerializer.Serialize(sources),
            AnswerSource = useAiFallback ? "ai_fallback" : "document",
            FallbackReason = useAiFallback ? fallbackReason : null
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
            CreatedAt = chatMessage.CreatedAt,
            AnswerSource = useAiFallback ? "ai_fallback" : "document",
            FallbackReason = useAiFallback ? fallbackReason : null
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
                topK: 12,
                scoreThreshold: 0.15f);

            if (searchResults.Count == 0)
            {
                await WriteSSEAsync(response, "token",
                    "I couldn't find relevant information in this document.");
                await WriteSSEAsync(response, "done", "");
                return;
            }

            // ── Step 4: Re-rank results ────────────────────────────
            var rerankedResults = ReRankResults(searchResults, question)
                .Take(8)
                .ToList();

            // ── Step 4.5: Determine if we need AI fallback ────────
            var useAiFallback = false;
            var fallbackReason = "";
            
            if (rerankedResults.Count == 0)
            {
                useAiFallback = true;
                fallbackReason = "No relevant information found in document";
            }
            else if (rerankedResults.Count < 3 && rerankedResults.Max(r => r.Score) < 0.35f)
            {
                useAiFallback = true;
                fallbackReason = "Low confidence in document matches";
            }

            // ── Step 5: Send metadata ──────────────────────────────
            var metadata = new
            {
                answerSource = useAiFallback ? "ai_fallback" : "document",
                fallbackReason = useAiFallback ? fallbackReason : null
            };
            var metadataJson = System.Text.Json.JsonSerializer.Serialize(metadata);
            await response.WriteAsync($"event: metadata\ndata: {metadataJson}\n\n");
            await response.Body.FlushAsync();

            // ── Step 6: Send sources ───────────────────────────────
            var sources = rerankedResults.Select(r => new SourceChunk
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
            await response.WriteAsync($"event: sources\ndata: {sourcesJson}\n\n");
            await response.Body.FlushAsync();

            string systemPrompt;
            string userMessage;

            if (useAiFallback)
            {
                // ── AI Fallback Prompt ─────────────────────────────
                _logger.LogInformation(
                    "Using AI fallback streaming for question: {Question}",
                    question);

                systemPrompt = "You are a helpful AI assistant providing general knowledge answers.";
                userMessage = $"""
                    You are a knowledgeable AI assistant. The user has uploaded a document titled "{document.OriginalFileName}" and is asking a question.
                    
                    The document does not contain sufficient information to answer this question: "{question}"
                    
                    Please provide a helpful answer based on your general knowledge. Be informative and accurate.
                    
                    Important:
                    1. Start with: "⚠️ This answer is from AI general knowledge (not found in your document)"
                    2. Provide a comprehensive answer to the question
                    3. If relevant, suggest how this might relate to the document topic
                    4. Keep your response clear and concise
                    """;
            }
            else
            {
                // ── Document-Based Prompt ──────────────────────────
                var context = string.Join("\n\n---\n\n",
                    rerankedResults.Select((r, i) =>
                        $"[Source {i + 1}]\n{r.Text}"));

                systemPrompt = """
                You are an expert document assistant. Your task is to provide comprehensive, accurate answers based on the provided context.
                
                Instructions:
                1. Carefully analyze ALL provided sources to extract relevant information
                2. Synthesize information from multiple sources when applicable
                3. Provide detailed answers when the context supports it
                4. If information is partially available, provide what you can and note what's missing
                5. Only say you don't have enough information if the context is completely unrelated to the question
                6. When citing sources, mention which source number(s) you used
                7. Be thorough but concise - prioritize completeness over brevity
                """;

                userMessage = $"""
                Context:
                {context}

                Question: {question}
                """;
            }

            // ── Step 7: Stream tokens ──────────────────────────────
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

            // ── Step 8: Save to history ────────────────────────────
            var chatMessage = new ChatMessage
            {
                UserId = userId,
                DocumentId = document.Id,
                Question = question,
                Answer = fullAnswer.ToString(),
                SourceChunks = sourcesJson,
                AnswerSource = useAiFallback ? "ai_fallback" : "document",
                FallbackReason = useAiFallback ? fallbackReason : null
            };

            _db.ChatMessages.Add(chatMessage);
            await _db.SaveChangesAsync();

            // ── Step 9: Signal completion ──────────────────────────
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
            CreatedAt = m.CreatedAt,
            AnswerSource = m.AnswerSource,
            FallbackReason = m.FallbackReason
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

    public async Task DeleteOneAsync(Guid messageId, Guid userId)
    {
        var message = await _db.ChatMessages
            .FirstOrDefaultAsync(c =>
                c.Id == messageId && c.UserId == userId);

        if (message != null)
        {
            _db.ChatMessages.Remove(message);
            await _db.SaveChangesAsync();
        }
    }

    // ── Re-Ranking Logic ──────────────────────────────────────
    /// <summary>
    /// Re-ranks search results using keyword matching and position boosting
    /// </summary>
    private List<(string Text, float Score, int ChunkIndex)> ReRankResults(
        List<(string Text, float Score, int ChunkIndex)> results,
        string question)
    {
        // Extract key terms from question (simple approach)
        var questionTerms = question
            .ToLower()
            .Split(new[] { ' ', ',', '.', '?', '!' }, StringSplitOptions.RemoveEmptyEntries)
            .Where(w => w.Length > 3) // Filter out short words
            .Distinct()
            .ToList();

        var reranked = results.Select(r =>
        {
            var textLower = r.Text.ToLower();
            
            // Calculate keyword overlap score
            var keywordScore = questionTerms.Count(term => textLower.Contains(term)) / (float)Math.Max(questionTerms.Count, 1);
            
            // Boost based on position (earlier chunks often have important context)
            var positionBoost = 1.0f / (1.0f + r.ChunkIndex * 0.05f);
            
            // Combined score: 70% vector similarity + 20% keyword match + 10% position
            var finalScore = (r.Score * 0.7f) + (keywordScore * 0.2f) + (positionBoost * 0.1f);
            
            return (r.Text, finalScore, r.ChunkIndex);
        })
        .OrderByDescending(r => r.finalScore)
        .ToList();

        _logger.LogInformation(
            "Re-ranked {Count} results. Top score: {Score:F3}",
            reranked.Count,
            reranked.FirstOrDefault().finalScore);

        return reranked;
    }
}