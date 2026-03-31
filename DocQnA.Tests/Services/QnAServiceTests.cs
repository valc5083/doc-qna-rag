using DocQnA.API.DTOs;
using DocQnA.API.Infrastructure;
using DocQnA.API.Models;
using DocQnA.API.Services;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;

namespace DocQnA.Tests.Services;

public class QnAServiceTests : IDisposable
{
    private readonly AppDbContext _db;
    private readonly QnAService _qnAService;

    public QnAServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);

        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Nvidianim:ApiKey"] = "test-key",
                ["Nvidianim:EmbeddingModel"] = "test-model",
                ["Nvidianim:ChatModel"] = "test-model",
            })
            .Build();

        var httpClientFactory = new Mock<IHttpClientFactory>();
        httpClientFactory
            .Setup(f => f.CreateClient(It.IsAny<string>()))
            .Returns(new HttpClient());

        var nimLogger = new Mock<ILogger<NimService>>();
        var nimService = new NimService(
            httpClientFactory.Object, config, nimLogger.Object);

        var qdrantLogger = new Mock<ILogger<QdrantService>>();
        httpClientFactory
            .Setup(f => f.CreateClient(It.IsAny<string>()))
            .Returns(new HttpClient
            {
                BaseAddress = new Uri("http://localhost:6333")
            });

        var qdrantService = new QdrantService(
            config, qdrantLogger.Object, httpClientFactory.Object);

        var qnaLogger = new Mock<ILogger<QnAService>>();
        _qnAService = new QnAService(
            _db, nimService, qdrantService, qnaLogger.Object);
    }

    [Fact]
    public async Task AskAsync_DocumentNotFound_ThrowsKeyNotFoundException()
    {
        var request = new AskRequest
        {
            Question = "What is this about?",
            DocumentId = Guid.NewGuid()
        };

        var act = async () =>
            await _qnAService.AskAsync(request, Guid.NewGuid());

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    [Fact]
    public async Task AskAsync_DocumentNotReady_ThrowsInvalidOperation()
    {
        var userId = Guid.NewGuid();
        var docId = Guid.NewGuid();

        _db.Documents.Add(new Document
        {
            Id = docId,
            UserId = userId,
            Status = "processing",
            OriginalFileName = "test.pdf",
            QdrantCollectionName = "test_collection"
        });
        await _db.SaveChangesAsync();

        var request = new AskRequest
        {
            Question = "What is this about?",
            DocumentId = docId
        };

        var act = async () => await _qnAService.AskAsync(request, userId);

        await act.Should()
            .ThrowAsync<InvalidOperationException>()
            .WithMessage("*processing*");
    }

    [Fact]
    public async Task GetHistoryAsync_ReturnsUserHistoryOnly()
    {
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();

        _db.ChatMessages.AddRange(
            new ChatMessage
            {
                UserId = userId1,
                Question = "Q1",
                Answer = "A1",
                SourceChunks = "[]"
            },
            new ChatMessage
            {
                UserId = userId1,
                Question = "Q2",
                Answer = "A2",
                SourceChunks = "[]"
            },
            new ChatMessage
            {
                UserId = userId2,
                Question = "Q3",
                Answer = "A3",
                SourceChunks = "[]"
            }
        );
        await _db.SaveChangesAsync();

        var result = await _qnAService.GetHistoryAsync(userId1);

        result.Should().HaveCount(2);
        result.Should().AllSatisfy(h =>
            h.Question.Should().BeOneOf("Q1", "Q2"));
    }

    [Fact]
    public async Task ClearHistoryAsync_RemovesOnlyUserMessages()
    {
        var userId1 = Guid.NewGuid();
        var userId2 = Guid.NewGuid();

        _db.ChatMessages.AddRange(
            new ChatMessage
            {
                UserId = userId1,
                Question = "Q1",
                Answer = "A1",
                SourceChunks = "[]"
            },
            new ChatMessage
            {
                UserId = userId2,
                Question = "Q2",
                Answer = "A2",
                SourceChunks = "[]"
            }
        );
        await _db.SaveChangesAsync();

        await _qnAService.ClearHistoryAsync(userId1);

        var remaining = _db.ChatMessages.ToList();
        remaining.Should().HaveCount(1);
        remaining[0].UserId.Should().Be(userId2);
    }

    public void Dispose()
    {
        _db.Dispose();
        GC.SuppressFinalize(this);
    }
}