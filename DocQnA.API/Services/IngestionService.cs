using DocQnA.API.Infrastructure;

namespace DocQnA.API.Services;

public class IngestionService
{
    private readonly AppDbContext _db;
    private readonly PdfExtractorService _pdfExtractor;
    private readonly TextChunkerService _chunker;
    private readonly NimService _nimService;
    private readonly QdrantService _qdrantService;
    private readonly ILogger<IngestionService> _logger;

    public IngestionService(
        AppDbContext db,
        PdfExtractorService pdfExtractor,
        TextChunkerService chunker,
        NimService nimService,
        QdrantService qdrantService,
        ILogger<IngestionService> logger)
    {
        _db = db;
        _pdfExtractor = pdfExtractor;
        _chunker = chunker;
        _nimService = nimService;
        _qdrantService = qdrantService;
        _logger = logger;
    }

    public async Task IngestAsync(Guid documentId, Stream pdfStream)
    {
        var document = await _db.Documents.FindAsync(documentId);
        if (document == null) return;

        try
        {
            document.Status = "processing";
            await _db.SaveChangesAsync();

            // ── Step 1: Extract text ───────────────────────────
            _logger.LogInformation("[{DocId}] Step 1: Extracting text...", documentId);
            var extractedText = _pdfExtractor.ExtractText(pdfStream);

            if (string.IsNullOrWhiteSpace(extractedText))
            {
                document.Status = "failed";
                await _db.SaveChangesAsync();
                return;
            }

            // ── Step 2: Chunk text ─────────────────────────────
            _logger.LogInformation("[{DocId}] Step 2: Chunking text...", documentId);
            var chunks = _chunker.ChunkText(extractedText);

            if (chunks.Count == 0)
            {
                document.Status = "failed";
                await _db.SaveChangesAsync();
                return;
            }

            // ── Step 3: Create Qdrant collection ───────────────
            _logger.LogInformation("[{DocId}] Step 3: Creating Qdrant collection...", documentId);
            await _qdrantService.CreateCollectionAsync(
                document.QdrantCollectionName);

            // ── Step 4: Embed each chunk + store in Qdrant ─────
            _logger.LogInformation(
                "[{DocId}] Step 4: Embedding {Count} chunks...", documentId, chunks.Count);

            var points = new List<(string Id, List<float> Vector, string Text, int ChunkIndex)>();

            foreach (var chunk in chunks)
            {
                var embedding = await _nimService.GetEmbeddingAsync(chunk.Text);

                points.Add((
                    Id: Guid.NewGuid().ToString(),
                    Vector: embedding,
                    Text: chunk.Text,
                    ChunkIndex: chunk.Index
                ));

                _logger.LogInformation(
                    "[{DocId}] Embedded chunk {Index}/{Total}",
                    documentId, chunk.Index + 1, chunks.Count);
            }

            // ── Step 5: Batch upsert to Qdrant ─────────────────
            _logger.LogInformation("[{DocId}] Step 5: Storing vectors in Qdrant...", documentId);
            await _qdrantService.UpsertVectorsAsync(
                document.QdrantCollectionName, points);

            // ── Step 6: Update document status ─────────────────
            document.ChunkCount = chunks.Count;
            document.Status = "ready";
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "[{DocId}] ✅ Ingestion complete! {ChunkCount} chunks embedded.",
                documentId, chunks.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[{DocId}] Ingestion failed", documentId);
            document.Status = "failed";
            await _db.SaveChangesAsync();
        }
    }
}