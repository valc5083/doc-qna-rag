using DocQnA.API.DTOs;
using StackExchange.Redis;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace DocQnA.API.Services;

public class SemanticCacheService
{
    private readonly IDatabase? _redis;
    private readonly QdrantService _qdrant;
    private readonly ILogger<SemanticCacheService> _logger;
    private readonly float _similarityThreshold;
    private readonly int _cacheTtlHours;
    private const string CacheCollectionPrefix = "cache_";

    public SemanticCacheService(
        IConnectionMultiplexer? redis,
        QdrantService qdrant,
        IConfiguration config,
        ILogger<SemanticCacheService> logger)
    {
        _redis = redis?.GetDatabase();
        _qdrant = qdrant;
        _logger = logger;
        _similarityThreshold = config
            .GetValue<float>("Redis:SimilarityThreshold", 0.95f);
        _cacheTtlHours = config
            .GetValue<int>("Redis:CacheTtlHours", 24);
    }

    public virtual async Task<CachedAnswer?> GetCachedAnswerAsync(
        string question,
        List<float> questionEmbedding,
        Guid documentId)
    {
        if (_redis == null) return null;

        try
        {
            var cacheCollection =
                CacheCollectionPrefix + documentId.ToString("N");

            // Search for similar questions in Qdrant
            var similar = await _qdrant.SearchAsync(
                cacheCollection,
                questionEmbedding,
                topK: 1,
                scoreThreshold: _similarityThreshold);

            if (!similar.Any()) return null;

            var topResult = similar[0];
            if (topResult.Score < _similarityThreshold)
                return null;

            // Get cached answer from Redis
            var cacheKey =
                $"answer:{documentId}:{QuestionCacheKey(topResult.Text)}";
            var cached = await _redis.StringGetAsync(cacheKey);

            if (!cached.HasValue) return null;

            var cachedAnswer =
                JsonSerializer.Deserialize<CachedAnswer>(
                    cached.ToString());

            if (cachedAnswer != null)
            {
                _logger.LogInformation(
                    "🎯 Cache HIT for '{Question}' " +
                    "(similarity: {Score:F3})",
                    question, topResult.Score);

                cachedAnswer.FromCache = true;
                cachedAnswer.CacheSimilarity = topResult.Score;
            }

            return cachedAnswer;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Cache lookup failed — continuing without cache");
            return null;
        }
    }

    public virtual async Task CacheAnswerAsync(
        string question,
        List<float> questionEmbedding,
        string answer,
        List<SourceChunk> sources,
        Guid documentId,
        string answerSource)
    {
        if (_redis == null) return;

        try
        {
            var cacheCollection =
                CacheCollectionPrefix + documentId.ToString("N");

            // Create collection if needed
            var exists = await _qdrant
                .CollectionExistsAsync(cacheCollection);
            if (!exists)
                await _qdrant.CreateCollectionAsync(cacheCollection);

            // Store question embedding; ChunkIndex is unused for key
            // derivation — the Redis key is derived from the SHA256 of
            // the question text stored in the Qdrant payload.
            await _qdrant.UpsertVectorsAsync(
                cacheCollection,
                new List<(string, List<float>, string, int)>
                {
                    (
                        Guid.NewGuid().ToString(),
                        questionEmbedding,
                        question,
                        0
                    )
                });

            // Store answer in Redis with TTL
            var cacheKey =
                $"answer:{documentId}:{QuestionCacheKey(question)}";

            var cachedAnswer = new CachedAnswer
            {
                Answer = answer,
                Sources = sources,
                AnswerSource = answerSource,
                CachedAt = DateTime.UtcNow
            };

            await _redis.StringSetAsync(
                cacheKey,
                JsonSerializer.Serialize(cachedAnswer),
                TimeSpan.FromHours(_cacheTtlHours));

            _logger.LogInformation(
                "💾 Cached answer for '{Question}'", question);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Cache store failed — ignoring");
        }
    }

    public virtual async Task InvalidateCacheAsync(Guid documentId)
    {
        if (_redis == null) return;

        try
        {
            var cacheCollection =
                CacheCollectionPrefix + documentId.ToString("N");
            await _qdrant.DeleteCollectionAsync(cacheCollection);
            _logger.LogInformation(
                "Cache invalidated for document {DocId}", documentId);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Cache invalidation failed");
        }
    }

    /// <summary>
    /// Returns a collision-resistant, deterministic hex key derived from
    /// the SHA256 hash of the question text. Safe against GetHashCode()
    /// collisions and the Math.Abs(int.MinValue) edge case.
    /// </summary>
    private static string QuestionCacheKey(string question)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(question));
        return Convert.ToHexString(hash).ToLowerInvariant();
    }
}

public class CachedAnswer
{
    public string Answer { get; set; } = string.Empty;
    public List<SourceChunk> Sources { get; set; } = new();
    public string AnswerSource { get; set; } = "document";
    public DateTime CachedAt { get; set; }
    public bool FromCache { get; set; }
    public float CacheSimilarity { get; set; }
}