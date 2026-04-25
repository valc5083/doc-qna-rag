namespace DocQnA.API.Models;

public class SharedChat
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string ShareToken { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public Guid DocumentId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ChatDataJson { get; set; } = "[]";
    // Serialized list of Q&A pairs
    public bool IsPublic { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
        = DateTime.UtcNow.AddDays(30);
    public int ViewCount { get; set; } = 0;

    // Navigation
    public User User { get; set; } = null!;
    public Document Document { get; set; } = null!;
}