namespace DocQnA.API.Models;

public class DocumentImage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid DocumentId { get; set; }
    public int PageNumber { get; set; }
    public int ImageIndex { get; set; }
    public string Base64Data { get; set; } = string.Empty;
    public string MediaType { get; set; } = "image/jpeg";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Document Document { get; set; } = null!;
}
