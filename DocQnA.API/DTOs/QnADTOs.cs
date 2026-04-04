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
    public List<ImageSourceChunk> ImageSources { get; set; } = new();
    public string Question { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public string AnswerSource { get; set; } = "document"; // "document" or "ai_fallback"
    public string? FallbackReason { get; set; } // Why fallback was used
    public bool FromCache { get; set; }
    public float CacheSimilarity { get; set; }
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

public class AskCollectionRequest
{
    public string Question { get; set; } = string.Empty;
    public Guid CollectionId { get; set; }
}

public class CollectionSourceChunk
{
    public string Text { get; set; } = string.Empty;
    public float Score { get; set; }
    public int ChunkIndex { get; set; }
    public string DocumentName { get; set; } = string.Empty;
    public Guid DocumentId { get; set; }
}

public class CollectionAskResponse
{
    public string Answer { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public List<CollectionSourceChunk> Sources { get; set; } = new();
    public int DocumentsSearched { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ImageSourceChunk
{
    public string Description { get; set; } = string.Empty;
    public float Score { get; set; }
    public int PageNumber { get; set; }
    public int ImageIndex { get; set; }
    public string Base64Data { get; set; } = string.Empty;
}

public class UserAnalyticsResponse
{
    public int TotalQuestions { get; set; }
    public int QuestionsThisMonth { get; set; }
    public int QuestionsThisWeek { get; set; }
    public int DocumentAnswers { get; set; }
    public int AiFallbackAnswers { get; set; }
    public int TotalDocuments { get; set; }
    public int ReadyDocuments { get; set; }
    public long TotalStorageBytes { get; set; }
    public List<DailyUsage> DailyActivity { get; set; } = new();
    public List<TopDocument> TopDocuments { get; set; } = new();
}

public class DailyUsage
{
    public string Date { get; set; } = string.Empty;
    public int Questions { get; set; }
}

public class TopDocument
{
    public string DocumentName { get; set; } = string.Empty;
    public int QuestionCount { get; set; }
    public Guid DocumentId { get; set; }
}