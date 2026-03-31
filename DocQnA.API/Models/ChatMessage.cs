namespace DocQnA.API.Models;

public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid? DocumentId { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string SourceChunks { get; set; } = "[]"; // JSON array
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string AnswerSource { get; set; } = "document"; // "document" or "ai_fallback"
    public string? FallbackReason { get; set; }

    // Navigation
    public User User { get; set; } = null!;
    public Document? Document { get; set; }
}