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
    private readonly ImageExtractorService _imageExtractor;

    public IngestionService(
        AppDbContext db,
        PdfExtractorService pdfExtractor,
        TextChunkerService chunker,
        NimService nimService,
        QdrantService qdrantService,
        ILogger<IngestionService> logger,
        ImageExtractorService imageExtractor
        )
    {
        _db = db;
        _pdfExtractor = pdfExtractor;
        _chunker = chunker;
        _nimService = nimService;
        _qdrantService = qdrantService;
        _logger = logger;
        _imageExtractor = imageExtractor;
    }

    public async Task IngestFromFileAsync(Guid documentId, string filePath)
    {
        using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read);
        await IngestAsync(documentId, stream);
    }

    public async Task IngestAsync(Guid documentId, Stream pdfStream)
    {
        _logger.LogInformation("[{DocId}] Stream length: {Length}", documentId, pdfStream.Length);
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

            // ── Step 4: Batch embed all chunks ────────────────────────────
            _logger.LogInformation(
                "[{DocId}] Step 4: Batch embedding {Count} chunks...",
                documentId, chunks.Count);

            var chunkTexts = chunks.Select(c => c.Text).ToList();
            List<List<float>> allEmbeddings;

            try
            {
                // Send all chunks in one API call — much faster!
                allEmbeddings = await _nimService
                    .GetEmbeddingsBatchAsync(chunkTexts);

                _logger.LogInformation(
                    "[{DocId}] Batch embedding complete — {Count} vectors",
                    documentId, allEmbeddings.Count);
            }
            catch (Exception ex)
            {
                // Graceful fallback to sequential if batch fails
                _logger.LogWarning(ex,
                    "[{DocId}] Batch embedding failed, falling back to sequential",
                    documentId);

                allEmbeddings = new List<List<float>>();
                foreach (var chunk in chunks)
                {
                    var emb = await _nimService.GetEmbeddingAsync(chunk.Text);
                    allEmbeddings.Add(emb);
                    _logger.LogInformation(
                        "[{DocId}] Embedded chunk {Index}/{Total}",
                        documentId, allEmbeddings.Count, chunks.Count);
                }
            }

            // Build Qdrant points from batch results
            var points = chunks.Select((chunk, i) =>
                (
                    Id: Guid.NewGuid().ToString(),
                    Vector: allEmbeddings[i],
                    Text: chunk.Text,
                    ChunkIndex: chunk.Index
                )).ToList();

            // ── Step 5: Store in Qdrant ────────────────────────────────────
            _logger.LogInformation(
                "[{DocId}] Step 5: Storing vectors in Qdrant...", documentId);
            await _qdrantService.UpsertVectorsAsync(
                document.QdrantCollectionName, points);

            // ── Step 6: Extract + embed images ────────────────────────────
            _logger.LogInformation(
                "[{DocId}] Step 6: Extracting images...", documentId);

            await _qdrantService.CreateImageCollectionAsync(
                document.QdrantCollectionName);

            pdfStream.Position = 0;
            var images = _imageExtractor.ExtractImages(pdfStream);

            if (images.Count > 0)
            {
                _logger.LogInformation(
                    "[{DocId}] Describing {Count} images via vision AI...",
                    documentId, images.Count);

                var imagePoints = new List<(string Id, List<float> Vector,
                    string Description, int PageNumber,
                    int ImageIndex, string Base64Data)>();

                foreach (var image in images)
                {
                    try
                    {
                        var description = await _nimService.DescribeImageAsync(
                            image.Base64Data,
                            image.MediaType,
                            contextHint: document.OriginalFileName);

                        if (string.IsNullOrWhiteSpace(description))
                            continue;

                        var embedding = await _nimService
                            .GetEmbeddingAsync(description);

                        imagePoints.Add((
                            Id: Guid.NewGuid().ToString(),
                            Vector: embedding,
                            Description: description,
                            PageNumber: image.PageNumber,
                            ImageIndex: image.ImageIndex,
                            Base64Data: image.Base64Data
                        ));

                        _logger.LogInformation(
                            "[{DocId}] Described image {I} on page {P}",
                            documentId, image.ImageIndex, image.PageNumber);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex,
                            "[{DocId}] Failed image {I}",
                            documentId, image.ImageIndex);
                    }
                }

                if (imagePoints.Count > 0)
                {
                    await _qdrantService.UpsertImageVectorsAsync(
                        document.QdrantCollectionName, imagePoints);

                    _logger.LogInformation(
                        "[{DocId}] Stored {Count} image vectors",
                        documentId, imagePoints.Count);
                }
            }

            // ── Step 7: Update document status ─────────────────
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