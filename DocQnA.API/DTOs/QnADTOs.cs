namespace DocQnA.API.DTOs;

public class AskRequest
{
    public string Question { get; set; } = string.Empty;
    public Guid DocumentId { get; set; }
}

public class SourceChunk
{
    public string Text { get; set; } = string.Empty;
    public float Score { get; set; }
    public int ChunkIndex { get; set; }
}

public class AskResponse
{
    public string Answer { get; set; } = string.Empty;
    public List<SourceChunk> Sources { get; set; } = new();
    public string Question { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string AnswerSource { get; set; } = "document"; // "document" or "ai_fallback"
    public string? FallbackReason { get; set; } // Why fallback was used
}

public class ChatHistoryResponse
{
    public Guid Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public List<SourceChunk> Sources { get; set; } = new();
    public Guid? DocumentId { get; set; }
    public string? DocumentName { get; set; }
    public DateTime CreatedAt { get; set; }
    public string AnswerSource { get; set; } = "document"; // "document" or "ai_fallback"
    public string? FallbackReason { get; set; }
}