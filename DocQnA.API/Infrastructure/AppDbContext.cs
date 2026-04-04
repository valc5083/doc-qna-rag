using DocQnA.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DocQnA.API.Infrastructure;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<Collection> Collections => Set<Collection>();           // ← add
    public DbSet<CollectionDocument> CollectionDocuments               // ← add
        => Set<CollectionDocument>();
    public DbSet<DocumentImage> DocumentImages => Set<DocumentImage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Document → User relationship
        modelBuilder.Entity<Document>()
            .HasOne(d => d.User)
            .WithMany(u => u.Documents)
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ChatMessage → User relationship
        modelBuilder.Entity<ChatMessage>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ChatMessage → Document relationship (optional)
        modelBuilder.Entity<ChatMessage>()
            .HasOne(c => c.Document)
            .WithMany()
            .HasForeignKey(c => c.DocumentId)
            .OnDelete(DeleteBehavior.SetNull);

        // ── Collections ────────────────────────────────────────
        modelBuilder.Entity<Collection>()
            .HasOne(c => c.User)
            .WithMany()
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── CollectionDocument (join table) ────────────────────
        modelBuilder.Entity<CollectionDocument>()
            .HasKey(cd => new { cd.CollectionId, cd.DocumentId });

        modelBuilder.Entity<CollectionDocument>()
            .HasOne(cd => cd.Collection)
            .WithMany(c => c.CollectionDocuments)
            .HasForeignKey(cd => cd.CollectionId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CollectionDocument>()
            .HasOne(cd => cd.Document)
            .WithMany()
            .HasForeignKey(cd => cd.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);

        // ── DocumentImage ───────────────────────────────────────
        modelBuilder.Entity<DocumentImage>()
            .HasOne(i => i.Document)
            .WithMany()
            .HasForeignKey(i => i.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}