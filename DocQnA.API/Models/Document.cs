namespace DocQnA.API.Models;

public class Document
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string QdrantCollectionName { get; set; } = string.Empty;
    public int ChunkCount { get; set; }
    public string Status { get; set; } = "processing"; // processing / ready / failed
    public long FileSizeBytes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
}