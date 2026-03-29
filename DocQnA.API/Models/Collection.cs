namespace DocQnA.API.Models;

public class Collection
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public ICollection<CollectionDocument> CollectionDocuments { get; set; }
        = new List<CollectionDocument>();
}

public class CollectionDocument
{
    public Guid CollectionId { get; set; }
    public Guid DocumentId { get; set; }
    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Collection Collection { get; set; } = null!;
    public Document Document { get; set; } = null!;
}