using System.Net;
using System.Text;
using System.Text.Json;
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
    private readonly IConfiguration _config;
    private readonly QdrantService _qdrantService;

    public QnAServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _db = new AppDbContext(options);

        _config = new ConfigurationBuilder()
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
            httpClientFactory.Object, _config, nimLogger.Object);

        var qdrantLogger = new Mock<ILogger<QdrantService>>();
        httpClientFactory
            .Setup(f => f.CreateClient(It.IsAny<string>()))
            .Returns(new HttpClient
            {
                BaseAddress = new Uri("http://localhost:6333")
            });

        _qdrantService = new QdrantService(
            _config, qdrantLogger.Object, httpClientFactory.Object);

        var qnaLogger = new Mock<ILogger<QnAService>>();
        _qnAService = new QnAService(
            _db, nimService, _qdrantService, qnaLogger.Object);
    }

    // ── Helper: NimService with a stubbed embedding endpoint ───────
    private NimService CreateNimServiceWithFakeEmbedding(List<float> embedding)
    {
        var embeddingJson = JsonSerializer.Serialize(new
        {
            data = new[] { new { index = 0, embedding } }
        });

        var handler = new FakeHttpMessageHandler(_ =>
            new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    embeddingJson, Encoding.UTF8, "application/json")
            });

        var factory = new Mock<IHttpClientFactory>();
        factory.Setup(f => f.CreateClient(It.IsAny<string>()))
            .Returns(new HttpClient(handler));

        return new NimService(
            factory.Object, _config,
            new Mock<ILogger<NimService>>().Object);
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

    // ── Analytics Tests ────────────────────────────────────────────

    [Fact]
    public async Task GetAnalyticsAsync_NoData_ReturnsZeroCounts()
    {
        var userId = Guid.NewGuid();

        var result = await _qnAService.GetAnalyticsAsync(userId);

        result.TotalQuestions.Should().Be(0);
        result.QuestionsThisMonth.Should().Be(0);
        result.QuestionsThisWeek.Should().Be(0);
        result.DocumentAnswers.Should().Be(0);
        result.AiFallbackAnswers.Should().Be(0);
        result.TotalDocuments.Should().Be(0);
        result.DailyActivity.Should().BeEmpty();
        result.TopDocuments.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAnalyticsAsync_MixedAnswerSources_CountsCorrectly()
    {
        var userId = Guid.NewGuid();

        _db.ChatMessages.AddRange(
            new ChatMessage
            {
                UserId = userId, Question = "Q1", Answer = "A1",
                SourceChunks = "[]", AnswerSource = "document"
            },
            new ChatMessage
            {
                UserId = userId, Question = "Q2", Answer = "A2",
                SourceChunks = "[]", AnswerSource = "document"
            },
            new ChatMessage
            {
                UserId = userId, Question = "Q3", Answer = "A3",
                SourceChunks = "[]", AnswerSource = "ai_fallback"
            }
        );
        await _db.SaveChangesAsync();

        var result = await _qnAService.GetAnalyticsAsync(userId);

        result.TotalQuestions.Should().Be(3);
        result.DocumentAnswers.Should().Be(2);
        result.AiFallbackAnswers.Should().Be(1);
    }

    [Fact]
    public async Task GetAnalyticsAsync_DailyActivity_ExcludesMessagesOlderThan30Days()
    {
        var userId = Guid.NewGuid();
        var recentDate = DateTime.UtcNow.AddDays(-5);
        var oldDate = DateTime.UtcNow.AddDays(-35);

        _db.ChatMessages.AddRange(
            new ChatMessage
            {
                UserId = userId, Question = "Recent", Answer = "A",
                SourceChunks = "[]", CreatedAt = recentDate
            },
            new ChatMessage
            {
                UserId = userId, Question = "Old", Answer = "A",
                SourceChunks = "[]", CreatedAt = oldDate
            }
        );
        await _db.SaveChangesAsync();

        var result = await _qnAService.GetAnalyticsAsync(userId);

        result.TotalQuestions.Should().Be(2);
        result.DailyActivity.Should().HaveCount(1);
        result.DailyActivity[0].Questions.Should().Be(1);
        result.DailyActivity[0].Date.Should()
            .Be(recentDate.Date.ToString("MMM dd"));
    }

    [Fact]
    public async Task GetAnalyticsAsync_TopDocuments_GroupsByDocumentAndLimitsToFive()
    {
        var userId = Guid.NewGuid();
        var docIds = Enumerable.Range(0, 6)
            .Select(_ => Guid.NewGuid()).ToArray();

        foreach (var id in docIds)
        {
            _db.Documents.Add(new Document
            {
                Id = id, UserId = userId, Status = "ready",
                OriginalFileName = $"doc_{id}.pdf",
                QdrantCollectionName = $"col_{id}"
            });
        }

        // First document has the most questions (5)
        for (int i = 0; i < 5; i++)
        {
            _db.ChatMessages.Add(new ChatMessage
            {
                UserId = userId, DocumentId = docIds[0],
                Question = $"Q{i}", Answer = "A", SourceChunks = "[]"
            });
        }

        // Remaining 5 documents each have 1 question
        for (int i = 1; i < 6; i++)
        {
            _db.ChatMessages.Add(new ChatMessage
            {
                UserId = userId, DocumentId = docIds[i],
                Question = "Q", Answer = "A", SourceChunks = "[]"
            });
        }
        await _db.SaveChangesAsync();

        var result = await _qnAService.GetAnalyticsAsync(userId);

        result.TopDocuments.Should().HaveCount(5);
        result.TopDocuments[0].QuestionCount.Should().Be(5);
        result.TopDocuments[0].DocumentId.Should().Be(docIds[0]);
    }

    // ── Cache Behavior Tests ────────────────────────────────────────

    [Fact]
    public async Task AskAsync_WithCacheHit_ReturnsCachedAnswerImmediately()
    {
        var userId = Guid.NewGuid();
        var docId = Guid.NewGuid();

        _db.Documents.Add(new Document
        {
            Id = docId, UserId = userId, Status = "ready",
            OriginalFileName = "cached.pdf",
            QdrantCollectionName = "cached_col"
        });
        await _db.SaveChangesAsync();

        var expectedSources = new List<SourceChunk>
        {
            new() { Text = "source text", Score = 0.9f, ChunkIndex = 0 }
        };
        var hit = new CachedAnswer
        {
            Answer = "Cached answer text",
            Sources = expectedSources,
            AnswerSource = "document",
            CachedAt = DateTime.UtcNow,
            FromCache = true,
            CacheSimilarity = 0.97f
        };

        var fakeCache = new FakeSemanticCacheService(hit, _qdrantService, _config);
        var nimService = CreateNimServiceWithFakeEmbedding(
            Enumerable.Repeat(0.1f, 3).ToList());
        var logger = new Mock<ILogger<QnAService>>();
        var service = new QnAService(
            _db, nimService, _qdrantService, logger.Object, fakeCache);

        var result = await service.AskAsync(
            new AskRequest { Question = "What is this?", DocumentId = docId },
            userId);

        result.Answer.Should().Contain("Cached answer text");
        result.Sources.Should().HaveCount(1);
        result.Sources[0].Text.Should().Be("source text");
        result.AnswerSource.Should().Be("document");
        // Cache hit path does not populate ImageSources
        result.ImageSources.Should().BeEmpty();
        fakeCache.CacheAnswerWasCalled.Should().BeFalse();
    }

    [Fact]
    public async Task AskAsync_WithNullCache_DoesNotThrowOnCachePath()
    {
        // QnAService with no cache should still throw on document not found
        // (ensuring null cache doesn't cause NullReferenceException)
        var act = async () => await _qnAService.AskAsync(
            new AskRequest
            {
                Question = "What is this?",
                DocumentId = Guid.NewGuid()
            },
            Guid.NewGuid());

        await act.Should().ThrowAsync<KeyNotFoundException>();
    }

    // ── Test doubles ───────────────────────────────────────────────

    private sealed class FakeHttpMessageHandler : HttpMessageHandler
    {
        private readonly Func<HttpRequestMessage, HttpResponseMessage> _factory;

        public FakeHttpMessageHandler(
            Func<HttpRequestMessage, HttpResponseMessage> factory)
            => _factory = factory;

        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
            => Task.FromResult(_factory(request));
    }

    private sealed class FakeSemanticCacheService : SemanticCacheService
    {
        private readonly CachedAnswer? _returnValue;
        public bool CacheAnswerWasCalled { get; private set; }

        public FakeSemanticCacheService(
            CachedAnswer? returnValue,
            QdrantService qdrant,
            IConfiguration config)
            : base(null, qdrant, config,
                new Mock<ILogger<SemanticCacheService>>().Object)
        {
            _returnValue = returnValue;
        }

        public override Task<CachedAnswer?> GetCachedAnswerAsync(
            string question,
            List<float> questionEmbedding,
            Guid documentId)
            => Task.FromResult(_returnValue);

        public override Task CacheAnswerAsync(
            string question,
            List<float> questionEmbedding,
            string answer,
            List<SourceChunk> sources,
            Guid documentId,
            string answerSource)
        {
            CacheAnswerWasCalled = true;
            return Task.CompletedTask;
        }
    }
}