using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace DocQnA.API.Services;

public class QdrantService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<QdrantService> _logger;
    private readonly int _vectorSize;
    private readonly string _endpoint;

    public QdrantService(
        IConfiguration config,
        ILogger<QdrantService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _vectorSize = config.GetValue<int>("Qdrant:VectorSize", 1024);
        _endpoint = (config["Qdrant:Endpoint"] ?? "http://localhost:6333")
            .TrimEnd('/');

        var apiKey = config["Qdrant:ApiKey"];

        _httpClient = httpClientFactory.CreateClient("Qdrant");
        _httpClient.BaseAddress = new Uri(_endpoint);

        if (!string.IsNullOrEmpty(apiKey))
            _httpClient.DefaultRequestHeaders.Add("api-key", apiKey);

        _httpClient.DefaultRequestHeaders.Accept.Add(
            new MediaTypeWithQualityHeaderValue("application/json"));

        _logger.LogInformation(
            "QdrantService using REST at {Endpoint}, HasApiKey: {HasKey}",
            _endpoint, !string.IsNullOrEmpty(apiKey));
    }

    // ── Create Collection ─────────────────────────────────────
    public async Task CreateCollectionAsync(string collectionName)
    {
        var exists = await CollectionExistsAsync(collectionName);
        if (exists)
        {
            _logger.LogInformation(
                "Collection {Name} already exists", collectionName);
            return;
        }

        var body = JsonSerializer.Serialize(new
        {
            vectors = new
            {
                size = _vectorSize,
                distance = "Cosine"
            }
        });

        var response = await _httpClient.PutAsync(
            $"/collections/{collectionName}",
            new StringContent(body, Encoding.UTF8, "application/json"));

        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new Exception(
                $"Failed to create collection: {response.StatusCode} — {content}");

        _logger.LogInformation(
            "Created Qdrant collection: {Name}", collectionName);
    }

    // ── Upsert Vectors ────────────────────────────────────────
    public async Task UpsertVectorsAsync(
        string collectionName,
        List<(string Id, List<float> Vector, string Text, int ChunkIndex)> points)
    {
        var payload = new
        {
            points = points.Select(p => new
            {
                id = p.Id,
                vector = p.Vector,
                payload = new
                {
                    text = p.Text,
                    chunk_index = p.ChunkIndex
                }
            }).ToList()
        };

        var body = JsonSerializer.Serialize(payload);

        var response = await _httpClient.PutAsync(
            $"/collections/{collectionName}/points",
            new StringContent(body, Encoding.UTF8, "application/json"));

        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new Exception(
                $"Failed to upsert vectors: {response.StatusCode} — {content}");

        _logger.LogInformation(
            "Upserted {Count} vectors to {Name}",
            points.Count, collectionName);
    }

    // ── Search Similar Vectors ────────────────────────────────
    public async Task<List<(string Text, float Score, int ChunkIndex)>>
        SearchAsync(
            string collectionName,
            List<float> queryVector,
            int topK = 5,
            float scoreThreshold = 0.15f)
    {
        var payload = new
        {
            vector = queryVector,
            limit = topK,
            score_threshold = scoreThreshold,
            with_payload = true
        };

        var body = JsonSerializer.Serialize(payload);

        var response = await _httpClient.PostAsync(
            $"/collections/{collectionName}/points/search",
            new StringContent(body, Encoding.UTF8, "application/json"));

        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            throw new Exception(
                $"Search failed: {response.StatusCode} — {content}");

        var result = JsonSerializer.Deserialize<QdrantSearchResponse>(
            content,
            new JsonSerializerOptions
            { PropertyNameCaseInsensitive = true });

        return result?.Result?.Select(r => (
            Text: r.Payload?.Text ?? "",
            Score: r.Score,
            ChunkIndex: r.Payload?.ChunkIndex ?? 0
        )).ToList() ?? new List<(string, float, int)>();
    }

    // ── Search Multiple Collections ───────────────────────────────
    public async Task<List<(string Text, float Score,
        int ChunkIndex, string CollectionName)>>
        SearchMultipleAsync(
            List<string> collectionNames,
            List<float> queryVector,
            int topKPerCollection = 3,
            float scoreThreshold = 0.15f)
    {
        // Search all collections in parallel
        var tasks = collectionNames.Select(async name =>
        {
            try
            {
                var results = await SearchAsync(
                    name, queryVector,
                    topKPerCollection, scoreThreshold);

                return results.Select(r =>
                    (r.Text, r.Score, r.ChunkIndex, name)).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "Search failed for collection {Col}", name);
                return new List<(string, float, int, string)>();
            }
        });

        var allResults = await Task.WhenAll(tasks);

        return allResults
            .SelectMany(r => r)
            .OrderByDescending(r => r.Item2)
            .Take(10)
            .ToList();
    }

    // ── Delete Collection ─────────────────────────────────────
    public async Task DeleteCollectionAsync(string collectionName)
    {
        var exists = await CollectionExistsAsync(collectionName);
        if (!exists) return;

        var response = await _httpClient.DeleteAsync(
            $"/collections/{collectionName}");

        if (!response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            _logger.LogWarning(
                "Failed to delete collection {Name}: {Status} — {Content}",
                collectionName, response.StatusCode, content);
            return;
        }

        _logger.LogInformation(
            "Deleted Qdrant collection: {Name}", collectionName);
    }

    // ── Check Collection Exists ───────────────────────────────
    public async Task<bool> CollectionExistsAsync(string collectionName)
    {
        var response = await _httpClient.GetAsync(
            $"/collections/{collectionName}");

        return response.IsSuccessStatusCode;
    }

    // ── Create Image Collection ───────────────────────────────────
    public async Task CreateImageCollectionAsync(
        string collectionName)
    {
        var imgCollection = collectionName + "_img";
        if (await CollectionExistsAsync(imgCollection)) return;

        var body = JsonSerializer.Serialize(new
        {
            vectors = new { size = _vectorSize, distance = "Cosine" }
        });

        var response = await _httpClient.PutAsync(
            $"/collections/{imgCollection}",
            new StringContent(body, Encoding.UTF8,
                "application/json"));

        if (!response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            _logger.LogWarning(
                "Failed to create image collection: {C}", content);
            return;
        }

        _logger.LogInformation(
            "Created image collection: {Name}", imgCollection);
    }

    // ── Upsert Image Vectors ──────────────────────────────────────
    public async Task UpsertImageVectorsAsync(
        string collectionName,
        List<(string Id, List<float> Vector, string Description,
            int PageNumber, int ImageIndex,
            Guid ImageId)> points)
    {
        var imgCollection = collectionName + "_img";

        var payload = new
        {
            points = points.Select(p => new
            {
                id = p.Id,
                vector = p.Vector,
                payload = new
                {
                    description = p.Description,
                    page_number = p.PageNumber,
                    image_index = p.ImageIndex,
                    image_id = p.ImageId.ToString()
                }
            }).ToList()
        };

        var body = JsonSerializer.Serialize(payload);
        var response = await _httpClient.PutAsync(
            $"/collections/{imgCollection}/points",
            new StringContent(body, Encoding.UTF8,
                "application/json"));

        if (!response.IsSuccessStatusCode)
        {
            var content = await response.Content.ReadAsStringAsync();
            _logger.LogWarning(
                "Failed to upsert image vectors: {C}", content);
            return;
        }

        _logger.LogInformation(
            "Upserted {Count} image vectors", points.Count);
    }

    // ── Search Image Collection ───────────────────────────────────
    public async Task<List<(string Description, float Score,
        int PageNumber, int ImageIndex, Guid ImageId)>>
        SearchImagesAsync(
            string collectionName,
            List<float> queryVector,
            int topK = 2,
            float scoreThreshold = 0.30f)
    {
        var imgCollection = collectionName + "_img";

        if (!await CollectionExistsAsync(imgCollection))
            return new List<(string, float, int, int, Guid)>();

        var payload = new
        {
            vector = queryVector,
            limit = topK,
            score_threshold = scoreThreshold,
            with_payload = true
        };

        var body = JsonSerializer.Serialize(payload);
        var response = await _httpClient.PostAsync(
            $"/collections/{imgCollection}/points/search",
            new StringContent(body, Encoding.UTF8,
                "application/json"));

        var content = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return new List<(string, float, int, int, Guid)>();

        var result = JsonSerializer.Deserialize<QdrantImageSearchResponse>(
            content,
            new JsonSerializerOptions
            { PropertyNameCaseInsensitive = true });

        return result?.Result?.Select(r => (
            Description: r.Payload?.Description ?? "",
            Score: r.Score,
            PageNumber: r.Payload?.PageNumber ?? 0,
            ImageIndex: r.Payload?.ImageIndex ?? 0,
            ImageId: Guid.TryParse(r.Payload?.ImageId, out var id) ? id : Guid.Empty
        )).ToList()
        ?? new List<(string, float, int, int, Guid)>();
    }

    // ── Delete Image Collection ───────────────────────────────────
    public async Task DeleteImageCollectionAsync(
        string collectionName)
        => await DeleteCollectionAsync(collectionName + "_img");
}

// ── Response Models ───────────────────────────────────────────
public class QdrantSearchResponse
{
    public List<QdrantSearchResult>? Result { get; set; }
}

public class QdrantSearchResult
{
    public float Score { get; set; }
    public QdrantPayload? Payload { get; set; }
}

public class QdrantPayload
{
    public string? Text { get; set; }

    [JsonPropertyName("chunk_index")]
    public int ChunkIndex { get; set; }
}
public class QdrantImageSearchResponse
{
    public List<QdrantImageSearchResult>? Result { get; set; }
}

public class QdrantImageSearchResult
{
    public float Score { get; set; }
    public QdrantImagePayload? Payload { get; set; }
}

public class QdrantImagePayload
{
    public string? Description { get; set; }

    [JsonPropertyName("page_number")]
    public int PageNumber { get; set; }

    [JsonPropertyName("image_index")]
    public int ImageIndex { get; set; }

    [JsonPropertyName("image_id")]
    public string? ImageId { get; set; }
}