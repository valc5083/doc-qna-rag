using Qdrant.Client;
using Qdrant.Client.Grpc;

namespace DocQnA.API.Services;

public class QdrantService
{
    private readonly QdrantClient _client;
    private readonly ILogger<QdrantService> _logger;
    private readonly int _vectorSize;

    public QdrantService(IConfiguration config, ILogger<QdrantService> logger)
    {
        _logger = logger;
        _vectorSize = config.GetValue<int>("Qdrant:VectorSize", 1024);

        var endpoint = config["Qdrant:Endpoint"] ?? "http://localhost:6333";
        var apiKey = config["Qdrant:ApiKey"];
        var uri = new Uri(endpoint);

        _logger.LogInformation(
        "Connecting to Qdrant at {Endpoint}, HasApiKey: {HasKey}",
        endpoint, !string.IsNullOrEmpty(apiKey));

        if (!string.IsNullOrEmpty(apiKey))
        {
            // ← Qdrant Cloud — uses HTTPS port 6333 with API key
            _client = new QdrantClient
            (
               host: uri.Host,
                port: uri.Port == -1 ? 443 : uri.Port,
                https: uri.Scheme == "https",
                apiKey: apiKey
            );
        }
        else
        {
            // ← Local Docker — uses gRPC port 6334
            _client = new QdrantClient("localhost", 6334);
        }
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

        await _client.CreateCollectionAsync(collectionName,
            new VectorParams
            {
                Size = (ulong)_vectorSize,
                Distance = Distance.Cosine
            });

        _logger.LogInformation(
            "Created Qdrant collection: {Name}", collectionName);
    }

    // ── Upsert Vectors ────────────────────────────────────────
    public async Task UpsertVectorsAsync(
        string collectionName,
        List<(string Id, List<float> Vector, string Text, int ChunkIndex)> points)
    {
        var qdrantPoints = points.Select(p =>
            new PointStruct
            {
                Id = new PointId { Uuid = p.Id },
                Vectors = p.Vector.ToArray(),
                Payload =
                {
                    ["text"] = p.Text,
                    ["chunk_index"] = p.ChunkIndex
                }
            }).ToList();

        await _client.UpsertAsync(collectionName, qdrantPoints);

        _logger.LogInformation(
            "Upserted {Count} vectors to {Name}",
            points.Count, collectionName);
    }

    // ── Search Similar Vectors ────────────────────────────────
    public async Task<List<(string Text, float Score, int ChunkIndex)>>
        SearchAsync(string collectionName, List<float> queryVector, int topK = 5)
    {
        var results = await _client.SearchAsync(
            collectionName,
            queryVector.ToArray(),
            limit: (ulong)topK,
            scoreThreshold: 0.3f);

        return results.Select(r => (
            Text: r.Payload["text"].StringValue,
            Score: r.Score,
            ChunkIndex: (int)r.Payload["chunk_index"].IntegerValue
        )).ToList();
    }

    // ── Delete Collection ─────────────────────────────────────
    public async Task DeleteCollectionAsync(string collectionName)
    {
        var exists = await CollectionExistsAsync(collectionName);
        if (!exists) return;

        await _client.DeleteCollectionAsync(collectionName);

        _logger.LogInformation(
            "Deleted Qdrant collection: {Name}", collectionName);
    }

    // ── Check Collection Exists ───────────────────────────────
    public async Task<bool> CollectionExistsAsync(string collectionName)
    {
        var collections = await _client.ListCollectionsAsync();
        return collections.Any(c => c == collectionName);
    }
}