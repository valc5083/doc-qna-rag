using DocQnA.API.DTOs;

public class CreateShareRequest
{
    public Guid DocumentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public List<ShareChatMessage> Messages { get; set; } = new();
    public int ExpiryDays { get; set; } = 30;
}

public class ShareChatMessage
{
    public string Type { get; set; } = string.Empty;
    // "user" or "assistant"
    public string Content { get; set; } = string.Empty;
    public List<SourceChunk> Sources { get; set; } = new();
}

public class ShareResponse
{
    public string ShareToken { get; set; } = string.Empty;
    public string ShareUrl { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
}

public class SharedChatResponse
{
    public string Title { get; set; } = string.Empty;
    public string DocumentName { get; set; } = string.Empty;
    public List<ShareChatMessage> Messages { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public int ViewCount { get; set; }
}