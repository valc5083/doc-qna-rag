using System.Text;
using System.Text.Json;

namespace DocQnA.API.Services;

public class QdrantService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<QdrantService> _logger;
    private readonly int _vectorSize;
    private readonly string _endpoint;

    public QdrantService(IConfiguration config, ILogger<QdrantService> logger)
    {
        _logger = logger;
        _vectorSize = config.GetValue<int>("Qdrant:VectorSize", 1024);

        _endpoint = config["Qdrant:Endpoint"]!.TrimEnd('/');
        var apiKey = config["Qdrant:ApiKey"];

        _httpClient = new HttpClient();

        if (!string.IsNullOrEmpty(apiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("api-key", apiKey);
        }

        _logger.LogInformation("Using Qdrant REST at {Endpoint}", _endpoint);
    }

    // ─────────────────────────────────────────────
    // ✅ Create Collection
    // ─────────────────────────────────────────────
    public async Task CreateCollectionAsync(string collectionName)
    {
        var exists = await CollectionExistsAsync(collectionName);
        if (exists)
        {
            _logger.LogInformation("Collection {Name} already exists", collectionName);
            return;
        }

        var body = new
        {
            vectors = new
            {
                size = _vectorSize,
                distance = "Cosine"
            }
        };

        var content = new StringContent(
            JsonSerializer.Serialize(body),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _httpClient.PutAsync(
            $"{_endpoint}/collections/{collectionName}",
            content
        );

        response.EnsureSuccessStatusCode();

        _logger.LogInformation("Created collection {Name}", collectionName);
    }

    // ─────────────────────────────────────────────
    // ✅ Check Collection Exists
    // ─────────────────────────────────────────────
    public async Task<bool> CollectionExistsAsync(string collectionName)
    {
        var response = await _httpClient.GetAsync(
            $"{_endpoint}/collections/{collectionName}"
        );

        return response.IsSuccessStatusCode;
    }

    // ─────────────────────────────────────────────
    // ✅ Upsert Vectors
    // ─────────────────────────────────────────────
    public async Task UpsertVectorsAsync(
        string collectionName,
        List<(string Id, List<float> Vector, string Text, int ChunkIndex)> points)
    {
        var body = new
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
            })
        };

        var content = new StringContent(
            JsonSerializer.Serialize(body),
            Encoding.UTF8,
            "application/json"
        );

        var response = await _httpClient.PutAsync(
            $"{_endpoint}/collections/{collectionName}/points",
            content
        );

        response.EnsureSuccessStatusCode();

        _logger.LogInformation(
            "Upserted {Count} vectors into {Collection}",
            points.Count,
            collectionName
        );
    }

    // ─────────────────────────────────────────────
    // ✅ Search
    // ─────────────────────────────────────────────
    public async Task<List<string>> SearchAsync(string collectionName, List<float> queryVector, int topK)
    {
        var url = $"{_endpoint}/collections/{collectionName}/points/search";

        var requestBody = new
        {
            vector = queryVector,
            limit = topK,
            with_payload = true
        };

        var response = await _httpClient.PostAsJsonAsync(url, requestBody);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<JsonElement>();

        var results = new List<string>();

        // ✅ Handle BOTH formats safely
        if (json.TryGetProperty("result", out var result))
        {
            if (result.ValueKind == JsonValueKind.Array)
            {
                // Old format
                foreach (var item in result.EnumerateArray())
                {
                    ExtractPayloadText(item, results);
                }
            }
            else if (result.TryGetProperty("points", out var points))
            {
                // New format
                foreach (var item in points.EnumerateArray())
                {
                    ExtractPayloadText(item, results);
                }
            }
        }

        return results;
    }

    private void ExtractPayloadText(JsonElement item, List<string> results)
    {
        if (item.TryGetProperty("payload", out var payload))
        {
            // 🔥 safest extraction
            if (payload.TryGetProperty("text", out var text))
            {
                results.Add(text.GetString() ?? "");
            }
            else if (payload.ValueKind == JsonValueKind.String)
            {
                results.Add(payload.GetString() ?? "");
            }
            else
            {
                // fallback
                results.Add(payload.ToString());
            }
        }
    }

    // ─────────────────────────────────────────────
    // ✅ Delete Collection
    // ─────────────────────────────────────────────
    public async Task DeleteCollectionAsync(string collectionName)
    {
        var response = await _httpClient.DeleteAsync(
            $"{_endpoint}/collections/{collectionName}"
        );

        if (response.IsSuccessStatusCode)
        {
            _logger.LogInformation("Deleted collection {Name}", collectionName);
        }
    }
}