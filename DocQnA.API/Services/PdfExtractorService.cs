using UglyToad.PdfPig;
using UglyToad.PdfPig.Content;

namespace DocQnA.API.Services;

public class PdfExtractorService
{
    private readonly ILogger<PdfExtractorService> _logger;

    public PdfExtractorService(ILogger<PdfExtractorService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Extracts all text from a PDF file stream
    /// </summary>
    public string ExtractText(Stream pdfStream)
    {
        try
        {
            using var pdf = PdfDocument.Open(pdfStream);
            var textBuilder = new System.Text.StringBuilder();

            foreach (var page in pdf.GetPages())
            {
                // Extract words and preserve reading order
                var words = page.GetWords();
                var pageText = string.Join(" ", words.Select(w => w.Text));

                if (!string.IsNullOrWhiteSpace(pageText))
                {
                    textBuilder.AppendLine(pageText);
                    textBuilder.AppendLine(); // blank line between pages
                }
            }

            var fullText = textBuilder.ToString().Trim();

            _logger.LogInformation(
                "Extracted {CharCount} characters from PDF",
                fullText.Length);

            return fullText;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract text from PDF");
            throw new InvalidOperationException($"PDF extraction failed: {ex.Message}");
        }
    }

    /// <summary>
    /// Returns page count without reading all content
    /// </summary>
    public int GetPageCount(Stream pdfStream)
    {
        using var pdf = PdfDocument.Open(pdfStream);
        return pdf.NumberOfPages;
    }
}