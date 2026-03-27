using DocQnA.API.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace DocQnA.API.Services;

public class IngestionService
{
    private readonly AppDbContext _db;
    private readonly PdfExtractorService _pdfExtractor;
    private readonly TextChunkerService _chunker;
    private readonly ILogger<IngestionService> _logger;

    public IngestionService(
        AppDbContext db,
        PdfExtractorService pdfExtractor,
        TextChunkerService chunker,
        ILogger<IngestionService> logger)
    {
        _db = db;
        _pdfExtractor = pdfExtractor;
        _chunker = chunker;
        _logger = logger;
    }

    /// <summary>
    /// Full ingestion pipeline — extract → chunk → (embed in Day 5)
    /// </summary>
    public async Task IngestAsync(Guid documentId, Stream pdfStream)
    {
        var document = await _db.Documents.FindAsync(documentId);
        if (document == null)
        {
            _logger.LogWarning("Document {DocId} not found for ingestion", documentId);
            return;
        }

        try
        {
            _logger.LogInformation(
                "Starting ingestion for document {DocId}", documentId);

            // ── Step 1: Extract text from PDF ─────────────────
            _logger.LogInformation("Step 1: Extracting text from PDF...");
            var extractedText = _pdfExtractor.ExtractText(pdfStream);

            if (string.IsNullOrWhiteSpace(extractedText))
            {
                document.Status = "failed";
                await _db.SaveChangesAsync();
                _logger.LogWarning(
                    "No text extracted from document {DocId}", documentId);
                return;
            }

            // ── Step 2: Chunk the text ─────────────────────────
            _logger.LogInformation("Step 2: Chunking text...");
            var chunks = _chunker.ChunkText(extractedText);

            if (chunks.Count == 0)
            {
                document.Status = "failed";
                await _db.SaveChangesAsync();
                _logger.LogWarning(
                    "No chunks created for document {DocId}", documentId);
                return;
            }

            // ── Step 3: Update document metadata ──────────────
            document.ChunkCount = chunks.Count;
            document.Status = "ready"; // Will change to "embedding" in Day 5
            await _db.SaveChangesAsync();

            _logger.LogInformation(
                "Ingestion complete for {DocId}. " +
                "Extracted {CharCount} chars → {ChunkCount} chunks",
                documentId, extractedText.Length, chunks.Count);

            // Log chunk summary
            foreach (var chunk in chunks.Take(3))
            {
                _logger.LogDebug(
                    "Chunk {Index}: {TokenCount} tokens | Preview: {Preview}",
                    chunk.Index,
                    chunk.TokenEstimate,
                    chunk.Text[..Math.Min(100, chunk.Text.Length)]);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Ingestion failed for document {DocId}", documentId);

            document.Status = "failed";
            await _db.SaveChangesAsync();
        }
    }
}