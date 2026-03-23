namespace DocQnA.API.DTOs
{
    public class DocumentUploadResponse
    {
        public Guid Id { get; set; }
        public string OriginalFileName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class  DocumentListResponse
    {
        public Guid Id { get; set; }
        public string OriginalFileName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int chunkCount { get; set; }
        public long FileSizeBytes { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
