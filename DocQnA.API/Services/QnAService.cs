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
    private readonly SemanticCacheService? _cache;

    public QnAService(
        AppDbContext db,
        NimService nimService,
        QdrantService qdrantService,
        ILogger<QnAService> logger,
        SemanticCacheService? cache = null
        )
    {
        _db = db;
        _nimService = nimService;
        _qdrantService = qdrantService;
        _logger = logger;
        _cache = cache;
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

        // ── Step 2: Embed the question ─────────────────────────────────
        _logger.LogInformation("Embedding question...");
        var questionVector = await _nimService
            .GetEmbeddingAsync(request.Question);

        // ── Step 2b: Fetch recent conversation history ─────────────────
        if (_cache != null)
        {
            var cached = await _cache.GetCachedAnswerAsync(
                request.Question, questionVector, request.DocumentId);

            if (cached != null)
            {
                _logger.LogInformation(
                    "Returning cached answer (similarity: {S:F3})",
                    cached.CacheSimilarity);

                return new AskResponse
                {
                    Question = request.Question,
                    Answer = cached.Answer,
                    Sources = cached.Sources,
                    ImageSources = cached.ImageSources,
                    CreatedAt = DateTime.UtcNow,
                    AnswerSource = cached.AnswerSource,
                    FromCache = true,
                    CacheSimilarity = cached.CacheSimilarity
                };
            }
        }

        var recentHistory = await _db.ChatMessages
            .Where(c =>
                c.UserId == userId &&
                c.DocumentId == document.Id)
            .OrderByDescending(c => c.CreatedAt)
            .Take(3)
            .OrderBy(c => c.CreatedAt) // chronological for prompt
            .ToListAsync();

        var conversationContext = recentHistory.Any()
            ? "\n\nPrevious conversation:\n" + string.Join("\n\n",
                recentHistory.Select(h =>
                    $"User: {h.Question}\n" +
                    $"Assistant: {h.Answer[..Math.Min(300, h.Answer.Length)]}"))
            : string.Empty;

        // ── Step 3: Search Qdrant ──────────────────────────────────────
        _logger.LogInformation("Searching Qdrant...");
        var searchResults = await _qdrantService.SearchAsync(
            document.QdrantCollectionName,
            questionVector,
            topK: 12,           // fetch more candidates
            scoreThreshold: 0.10f); // lower threshold for re-ranker

        if (searchResults.Count == 0)
        {
            return new AskResponse
            {
                Question = request.Question,
                Answer = "I couldn't find relevant information in this document.",
                Sources = new List<SourceChunk>(),
                CreatedAt = DateTime.UtcNow,
                AnswerSource = "document"
            };
        }

        // ── Step 4: NVIDIA Cross-Encoder Re-Ranking ────────────────────
        _logger.LogInformation(
            "Re-ranking {Count} candidates with NVIDIA cross-encoder...",
            searchResults.Count);

        var chunkTexts = searchResults.Select(r => r.Text).ToList();
        var rerankResults = await _nimService
            .RerankAsync(request.Question, chunkTexts);

        // Sort by re-rank score and take top 6
        var rerankedResults = rerankResults
            .OrderByDescending(r => r.Score)
            .Take(6)
            .Select(r => searchResults[r.Index])
            .ToList();

        _logger.LogInformation(
            "Re-ranking complete. Top score: {Score:F3}",
            rerankResults.FirstOrDefault()?.Score);

        // ── Step 5: Search images ──────────────────────────────────────
        var imageResults = await _qdrantService.SearchImagesAsync(
            document.QdrantCollectionName,
            questionVector,
            topK: 2,
            scoreThreshold: 0.30f);

        // Fetch base64 data from DB for matched images
        var imageIds = imageResults
            .Where(r => r.ImageId != Guid.Empty)
            .Select(r => r.ImageId)
            .ToList();
        var imageDataMap = imageIds.Count > 0
            ? await _db.DocumentImages
                .Where(i => imageIds.Contains(i.Id))
                .ToDictionaryAsync(i => i.Id, i => i.Base64Data)
            : new Dictionary<Guid, string>();

        var imageSources = imageResults.Select(r => new ImageSourceChunk
        {
            Description = r.Description,
            Score = r.Score,
            PageNumber = r.PageNumber,
            ImageIndex = r.ImageIndex,
            Base64Data = imageDataMap.GetValueOrDefault(r.ImageId, string.Empty)
        }).ToList();

        // Include image descriptions in context
        var imageContext = imageSources.Any()
            ? "\n\n--- Visual Content ---\n" + string.Join("\n\n",
                imageSources.Select(r =>
                    $"[Image on page {r.PageNumber}]: {r.Description}"))
            : string.Empty;

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
                                    $"[Source {i + 1}]\n{r.Text}"))
                                + imageContext;

            var systemPrompt = """
                                You are an expert document assistant. Your task is to provide 
                                comprehensive, accurate answers based on the provided context.
    
                                Instructions:
                                1. Carefully analyze ALL provided sources to extract relevant information
                                2. Synthesize information from multiple sources when applicable
                                3. Use the conversation history to understand follow-up questions
                                4. Provide detailed answers when the context supports it
                                5. If information is partially available, provide what you can and note what's missing
                                6. Only say you don't have enough information if the context is completely unrelated
                                7. When citing sources, mention which source number(s) you used
                                8. Be thorough but concise - prioritize completeness over brevity
                                """;

            var userMessage = $"""
                                Context from document:
                                {context}
                                {conversationContext}

                                Current Question: {request.Question}
                                """;

            answer = await _nimService.GetChatCompletionAsync(systemPrompt, userMessage);
            sources = rerankedResults.Select(r => new SourceChunk
            {
                Text = r.Text,
                Score = r.Score,
                ChunkIndex = r.ChunkIndex
            }).ToList();
        }

        // ── Cache the answer ───────────────────────────────────────────
        if (_cache != null && !useAiFallback)
        {
            await _cache.CacheAnswerAsync(
                request.Question,
                questionVector,
                answer,
                sources,
                imageSources,
                document.Id,
                "document");
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
            ImageSources = imageSources,
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

            // ── Step 4: NVIDIA Cross-Encoder Re-Ranking ────────────────────
            await WriteSSEAsync(response, "status", "Re-ranking results...");

            var chunkTexts = searchResults.Select(r => r.Text).ToList();
            var rerankResults = await _nimService
                .RerankAsync(question, chunkTexts);

            var rerankedResults = rerankResults
                .OrderByDescending(r => r.Score)
                .Take(6)
                .Select(r => searchResults[r.Index])
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

            var imageResults = await _qdrantService.SearchImagesAsync(
                document.QdrantCollectionName,
                questionVector, topK: 2, scoreThreshold: 0.30f);

            // Fetch base64 data from DB for matched images
            var imageIds = imageResults
                .Where(r => r.ImageId != Guid.Empty)
                .Select(r => r.ImageId)
                .ToList();
            var imageDataMap = imageIds.Count > 0
                ? await _db.DocumentImages
                    .Where(i => imageIds.Contains(i.Id))
                    .ToDictionaryAsync(i => i.Id, i => i.Base64Data)
                : new Dictionary<Guid, string>();

            var imageSources = imageResults.Select(r => new ImageSourceChunk
            {
                Description = r.Description,
                Score = r.Score,
                PageNumber = r.PageNumber,
                ImageIndex = r.ImageIndex,
                Base64Data = imageDataMap.GetValueOrDefault(r.ImageId, string.Empty)
            }).ToList();

            if (imageSources.Any())
            {
                var imgJson = System.Text.Json.JsonSerializer.Serialize(
                    imageSources,
                    new System.Text.Json.JsonSerializerOptions
                    {
                        PropertyNamingPolicy =
                            System.Text.Json.JsonNamingPolicy.CamelCase
                    });

                await response.WriteAsync(
                    $"event: image_sources\ndata: {imgJson}\n\n");
                await response.Body.FlushAsync();
            }

            // Image descriptions to include in the prompt context
            var imageContext = imageSources.Any()
                ? "\n\n--- Visual Content ---\n" + string.Join("\n\n",
                    imageSources.Select(r =>
                        $"[Image on page {r.PageNumber}]: {r.Description}"))
                : string.Empty;

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
                        $"[Source {i + 1}]\n{r.Text}"))
                    + imageContext;

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

                var recentHistory = await _db.ChatMessages
                                    .Where(c =>
                                    c.UserId == userId &&
                                    c.DocumentId == document.Id)
                                    .OrderByDescending(c => c.CreatedAt)
                                    .Take(3)
                                    .OrderBy(c => c.CreatedAt)
                                    .ToListAsync();

                var conversationContext = recentHistory.Any()
                    ? "\n\nPrevious conversation:\n" + string.Join("\n\n",
                        recentHistory.Select(h =>
                            $"User: {h.Question}\n" +
                            $"Assistant: {h.Answer[..Math.Min(300, h.Answer.Length)]}"))
                    : string.Empty;

                userMessage = $"""
                                Context from document:
                                {context}
                                {conversationContext}

                                Current Question: {question}
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


    public async Task<CollectionAskResponse> AskCollectionAsync(
    AskCollectionRequest request, Guid userId)
    {
        // ── Get all ready documents in collection ──────────────────
        var collectionDocs = await _db.CollectionDocuments
            .Include(cd => cd.Document)
            .Where(cd =>
                cd.CollectionId == request.CollectionId &&
                cd.Document.UserId == userId &&
                cd.Document.Status == "ready")
            .ToListAsync();

        if (!collectionDocs.Any())
            throw new KeyNotFoundException(
                "No ready documents found in this collection.");

        _logger.LogInformation(
            "Multi-doc Q&A across {Count} documents",
            collectionDocs.Count);

        // ── Embed question ─────────────────────────────────────────
        var questionVector = await _nimService
            .GetEmbeddingAsync(request.Question);

        // ── Search all document collections in parallel ────────────
        var collectionNames = collectionDocs
            .Select(cd => cd.Document.QdrantCollectionName)
            .ToList();

        var multiResults = await _qdrantService.SearchMultipleAsync(
            collectionNames, questionVector,
            topKPerCollection: 3, scoreThreshold: 0.15f);

        if (!multiResults.Any())
        {
            return new CollectionAskResponse
            {
                Question = request.Question,
                Answer = "I couldn't find relevant information across the documents in this collection.",
                Sources = new List<CollectionSourceChunk>(),
                DocumentsSearched = collectionDocs.Count,
                CreatedAt = DateTime.UtcNow
            };
        }

        // ── Re-rank combined results ───────────────────────────────────
        var allTexts = multiResults.Select(r => r.Text).ToList();
        var rerankResults = await _nimService
            .RerankAsync(request.Question, allTexts);

        var reranked = rerankResults
            .OrderByDescending(r => r.Score)
            .Take(6)
            .Select(r => (
                multiResults[r.Index].Text,
                r.Score,
                multiResults[r.Index].ChunkIndex,
                multiResults[r.Index].CollectionName
            ))
            .ToList();

        // ── Build context with document attribution ────────────────
        var context = string.Join("\n\n---\n\n",
            reranked.Select((r, i) =>
            {
                var doc = collectionDocs.FirstOrDefault(cd =>
                    cd.Document.QdrantCollectionName == r.CollectionName);
                return $"[Source {i + 1} — from '{doc?.Document.OriginalFileName}']\n{r.Text}";
            }));

        // ── Get answer ─────────────────────────────────────────────
        var systemPrompt = """
        You are an expert document assistant searching across multiple documents.
        Answer based ONLY on the provided context.
        Always cite which document (Source number and filename) your answer comes from.
        If information comes from multiple documents, synthesize it clearly.
        """;

        var userMessage = $"""
        Context from multiple documents:
        {context}

        Question: {request.Question}
        """;

        var answer = await _nimService
            .GetChatCompletionAsync(systemPrompt, userMessage);

        // ── Build sources ──────────────────────────────────────────
        var sources = reranked.Select(r =>
         {
             var doc = collectionDocs.FirstOrDefault(cd =>
                 cd.Document.QdrantCollectionName == r.CollectionName);
             return new CollectionSourceChunk
             {
                 Text = r.Text,
                 Score = r.Score,
                 ChunkIndex = r.ChunkIndex,
                 DocumentName = doc?.Document.OriginalFileName ?? "",
                 DocumentId = doc?.DocumentId ?? Guid.Empty
             };
         }).ToList();

        return new CollectionAskResponse
        {
            Question = request.Question,
            Answer = answer,
            Sources = sources,
            DocumentsSearched = collectionDocs.Count,
            CreatedAt = DateTime.UtcNow
        };
    }

    public async Task<UserAnalyticsResponse>
    GetAnalyticsAsync(Guid userId)
    {
        var now = DateTime.UtcNow;
        var monthStart = new DateTime(now.Year, now.Month, 1);
        var weekStart = now.AddDays(-7);
        var last30Days = now.AddDays(-30);

        // Push scalar counts into SQL
        var totalQuestions = await _db.ChatMessages
            .Where(c => c.UserId == userId)
            .CountAsync();

        var questionsThisMonth = await _db.ChatMessages
            .Where(c => c.UserId == userId && c.CreatedAt >= monthStart)
            .CountAsync();

        var questionsThisWeek = await _db.ChatMessages
            .Where(c => c.UserId == userId && c.CreatedAt >= weekStart)
            .CountAsync();

        var documentAnswers = await _db.ChatMessages
            .Where(c => c.UserId == userId && c.AnswerSource == "document")
            .CountAsync();

        var aiFallbackAnswers = await _db.ChatMessages
            .Where(c => c.UserId == userId && c.AnswerSource == "ai_fallback")
            .CountAsync();

        var totalDocuments = await _db.Documents
            .Where(d => d.UserId == userId)
            .CountAsync();

        var readyDocuments = await _db.Documents
            .Where(d => d.UserId == userId && d.Status == "ready")
            .CountAsync();

        var totalStorageBytes = await _db.Documents
            .Where(d => d.UserId == userId)
            .SumAsync(d => d.FileSizeBytes);

        // Daily activity: group by date in DB, materialize small result set
        var rawDaily = await _db.ChatMessages
            .Where(c => c.UserId == userId && c.CreatedAt >= last30Days)
            .GroupBy(c => c.CreatedAt.Date)
            .OrderBy(g => g.Key)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync();

        var dailyActivity = rawDaily.Select(d => new DailyUsage
        {
            Date = d.Date.ToString("MMM dd"),
            Questions = d.Count
        }).ToList();

        // Top documents: group by DocumentId in DB, fetch names separately
        var topDocGroups = await _db.ChatMessages
            .Where(c => c.UserId == userId && c.DocumentId.HasValue)
            .GroupBy(c => c.DocumentId!.Value)
            .Select(g => new { DocumentId = g.Key, Count = g.Count() })
            .OrderByDescending(g => g.Count)
            .Take(5)
            .ToListAsync();

        var topDocIds = topDocGroups.Select(d => d.DocumentId).ToList();
        var docNames = await _db.Documents
            .Where(d => topDocIds.Contains(d.Id))
            .Select(d => new { d.Id, d.OriginalFileName })
            .ToDictionaryAsync(d => d.Id, d => d.OriginalFileName);

        var topDocuments = topDocGroups.Select(d => new TopDocument
        {
            DocumentId = d.DocumentId,
            DocumentName = docNames.GetValueOrDefault(d.DocumentId, "Unknown"),
            QuestionCount = d.Count
        }).ToList();

        return new UserAnalyticsResponse
        {
            TotalQuestions = totalQuestions,
            QuestionsThisMonth = questionsThisMonth,
            QuestionsThisWeek = questionsThisWeek,
            DocumentAnswers = documentAnswers,
            AiFallbackAnswers = aiFallbackAnswers,
            TotalDocuments = totalDocuments,
            ReadyDocuments = readyDocuments,
            TotalStorageBytes = totalStorageBytes,
            DailyActivity = dailyActivity,
            TopDocuments = topDocuments
        };
    }
}