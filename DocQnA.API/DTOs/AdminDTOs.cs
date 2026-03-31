namespace DocQnA.API.DTOs;

public class AdminStatsResponse
{
    public int TotalUsers { get; set; }
    public int TotalDocuments { get; set; }
    public int TotalConversations { get; set; }
    public int TotalCollections { get; set; }
    public int ReadyDocuments { get; set; }
    public int ProcessingDocuments { get; set; }
    public int FailedDocuments { get; set; }
    public long TotalStorageBytes { get; set; }
    public DateTime ServerTime { get; set; }
}

public class AdminUserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public int DocumentCount { get; set; }
    public int ConversationCount { get; set; }
    public int CollectionCount { get; set; }
    public long TotalStorageBytes { get; set; }
    public DateTime? LastActive { get; set; }
}

public class AdminDocumentResponse
{
    public Guid Id { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int ChunkCount { get; set; }
    public long FileSizeBytes { get; set; }
    public DateTime CreatedAt { get; set; }
    public string UserEmail { get; set; } = string.Empty;
    public Guid UserId { get; set; }
}

public class AdminConversationResponse
{
    public Guid Id { get; set; }
    public string Question { get; set; } = string.Empty;
    public string Answer { get; set; } = string.Empty;
    public string UserEmail { get; set; } = string.Empty;
    public string? DocumentName { get; set; }
    public DateTime CreatedAt { get; set; }
    public int SourceCount { get; set; }
}

public class SystemHealthResponse
{
    public string DatabaseStatus { get; set; } = string.Empty;
    public string QdrantStatus { get; set; } = string.Empty;
    public string AppVersion { get; set; } = string.Empty;
    public DateTime ServerTime { get; set; }
    public string Environment { get; set; } = string.Empty;
}