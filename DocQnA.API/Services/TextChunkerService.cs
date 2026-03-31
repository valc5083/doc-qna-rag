namespace DocQnA.API.Services;

public class TextChunk
{
    public int Index { get; set; }
    public string Text { get; set; } = string.Empty;
    public int StartChar { get; set; }
    public int EndChar { get; set; }
    public int TokenEstimate { get; set; }
}

public class TextChunkerService
{
    private readonly ILogger<TextChunkerService> _logger;

    // Chunk size in characters (~750 tokens ≈ 3000 chars)
    private const int ChunkSize = 3000;

    // Overlap between chunks to preserve context (increased for better continuity)
    private const int ChunkOverlap = 500;

    public TextChunkerService(ILogger<TextChunkerService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Splits text into overlapping chunks with sentence boundary awareness
    /// </summary>
    public List<TextChunk> ChunkText(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return new List<TextChunk>();

        _logger.LogInformation("Starting text cleanup for {CharCount} characters", text.Length);

        // Clean up the text first
        text = CleanText(text);

        _logger.LogInformation("Text cleanup completed. New length: {CharCount}", text.Length);

        var chunks = new List<TextChunk>();
        int position = 0;
        int chunkIndex = 0;

        _logger.LogInformation("Starting chunking process");

        while (position < text.Length)
        {
            _logger.LogInformation("Processing chunk at position {Position} of {TextLength}", position, text.Length);

            // Calculate end position
            int end = Math.Min(position + ChunkSize, text.Length);

            // If not at the end of text, find a good break point
            if (end < text.Length)
            {
                end = FindBreakPoint(text, position, end);
            }

            var chunkText = text[position..end].Trim();

            if (!string.IsNullOrWhiteSpace(chunkText))
            {
                chunks.Add(new TextChunk
                {
                    Index = chunkIndex++,
                    Text = chunkText,
                    StartChar = position,
                    EndChar = end,
                    TokenEstimate = EstimateTokens(chunkText)
                });

                _logger.LogInformation("Added chunk {ChunkIndex} with {CharCount} characters", chunkIndex - 1, chunkText.Length);
            }

            // Move forward with overlap
            int newPosition = end - ChunkOverlap;

            // Prevent infinite loop: if we're not making progress, exit
            if (newPosition <= position)
            {
                position = end;
            }
            else
            {
                position = newPosition;
            }

            // Safety check: if we're at or past the end, break
            if (position >= text.Length)
            {
                break;
            }
        }

        _logger.LogInformation(
            "Chunked text into {ChunkCount} chunks from {CharCount} characters",
            chunks.Count, text.Length);

        return chunks;
    }

    /// <summary>
    /// Find a sentence or word boundary to break at
    /// </summary>
    private static int FindBreakPoint(string text, int start, int end)
    {
        // Try to break at sentence boundary (. ! ?)
        for (int i = end; i > start + ChunkSize / 2; i--)
        {
            if (i < text.Length &&
                (text[i] == '.' || text[i] == '!' || text[i] == '?') &&
                i + 1 < text.Length && text[i + 1] == ' ')
            {
                return i + 1;
            }
        }

        // Fall back to word boundary (space)
        for (int i = end; i > start + ChunkSize / 2; i--)
        {
            if (text[i] == ' ')
                return i;
        }

        // Last resort — just cut at end
        return end;
    }

    /// <summary>
    /// Clean extracted text — remove excessive whitespace, fix line breaks
    /// Uses character-by-character processing for better performance
    /// </summary>
    private static string CleanText(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return string.Empty;

        var sb = new System.Text.StringBuilder(text.Length);
        int consecutiveNewlines = 0;
        int consecutiveSpaces = 0;
        bool lastWasWhitespace = false;

        foreach (char c in text)
        {
            if (c == '\n' || c == '\r')
            {
                if (c == '\n') consecutiveNewlines++;

                // Allow max 2 consecutive newlines (empty line)
                if (consecutiveNewlines <= 2)
                {
                    sb.Append('\n');
                }
                lastWasWhitespace = true;
                consecutiveSpaces = 0;
            }
            else if (c == ' ' || c == '\t')
            {
                consecutiveSpaces++;
                // Allow only single space
                if (consecutiveSpaces == 1)
                {
                    sb.Append(' ');
                }
                lastWasWhitespace = true;
            }
            else if ((c >= '\x20' && c <= '\x7E'))  // Printable ASCII
            {
                sb.Append(c);
                lastWasWhitespace = false;
                consecutiveNewlines = 0;
                consecutiveSpaces = 0;
            }
            else
            {
                // Skip non-printable characters
                if (!lastWasWhitespace)
                {
                    sb.Append(' ');
                    lastWasWhitespace = true;
                }
            }
        }

        return sb.ToString().Trim();
    }

    /// <summary>
    /// Rough token estimate — 1 token ≈ 4 characters
    /// </summary>
    private static int EstimateTokens(string text)
        => (int)Math.Ceiling(text.Length / 4.0);
}