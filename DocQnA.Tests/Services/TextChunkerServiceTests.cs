using DocQnA.API.Services;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;

namespace DocQnA.Tests.Services;

public class TextChunkerServiceTests
{
    private readonly TextChunkerService _chunker;

    public TextChunkerServiceTests()
    {
        var logger = new Mock<ILogger<TextChunkerService>>();
        _chunker = new TextChunkerService(logger.Object);
    }

    [Fact]
    public void ChunkText_EmptyString_ReturnsEmptyList()
    {
        var result = _chunker.ChunkText("");
        result.Should().BeEmpty();
    }

    [Fact]
    public void ChunkText_NullString_ReturnsEmptyList()
    {
        var result = _chunker.ChunkText(null!);
        result.Should().BeEmpty();
    }

    [Fact]
    public void ChunkText_ShortText_ReturnsSingleChunk()
    {
        var text = "This is a short document with less than 2000 characters.";
        var result = _chunker.ChunkText(text);

        result.Should().HaveCount(1);
        result[0].Text.Should().Contain("short document");
        result[0].Index.Should().Be(0);
    }

    [Fact]
    public void ChunkText_LongText_ReturnsMultipleChunks()
    {
        // Generate text longer than 2000 chars
        var text = string.Join(" ", Enumerable.Repeat(
            "This is a sentence that adds to the length of the document.", 50));

        var result = _chunker.ChunkText(text);

        result.Should().HaveCountGreaterThan(1);
        result.Should().AllSatisfy(chunk =>
        {
            chunk.Text.Should().NotBeNullOrEmpty();
            chunk.TokenEstimate.Should().BeGreaterThan(0);
        });
    }

    [Fact]
    public void ChunkText_ChunksHaveCorrectIndexes()
    {
        var text = string.Join(" ", Enumerable.Repeat(
            "Lorem ipsum dolor sit amet consectetur adipiscing elit.", 60));

        var result = _chunker.ChunkText(text);

        for (int i = 0; i < result.Count; i++)
        {
            result[i].Index.Should().Be(i);
        }
    }

    [Fact]
    public void ChunkText_TokenEstimate_IsReasonable()
    {
        var text = string.Join(" ", Enumerable.Repeat("word", 100));
        var result = _chunker.ChunkText(text);

        result.Should().AllSatisfy(chunk =>
        {
            // Token estimate should be roughly text length / 4
            var expectedMin = (int)(chunk.Text.Length / 5.0);
            var expectedMax = (int)(chunk.Text.Length / 3.0);
            chunk.TokenEstimate.Should().BeInRange(expectedMin, expectedMax);
        });
    }

    [Fact]
    public void ChunkText_WhitespaceOnly_ReturnsEmptyList()
    {
        var result = _chunker.ChunkText("   \n\n\t  ");
        result.Should().BeEmpty();
    }
}