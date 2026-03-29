namespace DocQnA.API.DTOs;

public class CreateCollectionRequest
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class AddDocumentToCollectionRequest
{
    public Guid DocumentId { get; set; }
}

public class CollectionResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int DocumentCount { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<CollectionDocumentResponse> Documents { get; set; } = new();
}

public class CollectionDocumentResponse
{
    public Guid Id { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int ChunkCount { get; set; }
    public long FileSizeBytes { get; set; }
    public DateTime AddedAt { get; set; }
}