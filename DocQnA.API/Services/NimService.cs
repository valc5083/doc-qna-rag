using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace DocQnA.API.Services;

public class NimService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<NimService> _logger;

    public NimService(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<NimService> logger)
    {
        _httpClient = httpClientFactory.CreateClient("NvidiaNim");
        _config = config;
        _logger = logger;
    }

    // ── Get Embeddings ────────────────────────────────────────
    public async Task<List<float>> GetEmbeddingAsync(string text)
    {
        var apiKey = _config["Nvidianim:ApiKey"]!;
        var model = _config["Nvidianim:EmbeddingModel"]!;

        var requestBody = new
        {
            input = text,
            model = model,
            encoding_format = "float",
            input_type = "query",
            truncate = "END"
        };

        var request = new HttpRequestMessage(
            HttpMethod.Post,
            "https://integrate.api.nvidia.com/v1/embeddings");

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        request.Content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        var response = await _httpClient.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("NVIDIA NIM embedding error: {Body}", responseBody);
            throw new Exception($"Embedding API error: {responseBody}");
        }

        var result = JsonSerializer.Deserialize<NimEmbeddingResponse>(
            responseBody,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return result!.Data[0].Embedding;
    }

    // ── Batch Embeddings ──────────────────────────────────────────
    public async Task<List<List<float>>> GetEmbeddingsBatchAsync(
        List<string> texts)
    {
        var apiKey = _config["Nvidianim:ApiKey"]!;
        var model = _config["Nvidianim:EmbeddingModel"]!;

        var requestBody = new
        {
            input = texts,
            model = model,
            encoding_format = "float",
            input_type = "passage",
            truncate = "END"
        };

        var request = new HttpRequestMessage(
            HttpMethod.Post,
            "https://integrate.api.nvidia.com/v1/embeddings");

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        request.Content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        var response = await _httpClient.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError(
                "Batch embedding error: {Body}", responseBody);
            throw new Exception(
                $"Batch embedding failed: {responseBody}");
        }

        var result = JsonSerializer.Deserialize<NimEmbeddingResponse>(
            responseBody,
            new JsonSerializerOptions
            { PropertyNameCaseInsensitive = true });

        // Sort by index to preserve chunk order
        return result!.Data
            .OrderBy(d => d.Index)
            .Select(d => d.Embedding)
            .ToList();
    }

    // ── Chat Completion ───────────────────────────────────────
    public async Task<string> GetChatCompletionAsync(
        string systemPrompt, string userMessage)
    {
        var apiKey = _config["Nvidianim:ApiKey"]!;
        var model = _config["Nvidianim:ChatModel"]!;

        var requestBody = new
        {
            model = model,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            },
            temperature = 0.3,
            max_tokens = 2048
        };

        var request = new HttpRequestMessage(
            HttpMethod.Post,
            "https://integrate.api.nvidia.com/v1/chat/completions");

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        request.Content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        var response = await _httpClient.SendAsync(request);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogError("NVIDIA NIM chat error: {Body}", responseBody);
            throw new Exception($"Chat API error: {responseBody}");
        }

        var result = JsonSerializer.Deserialize<NimChatResponse>(
            responseBody,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        return result!.Choices[0].Message.Content;
    }

    // ── Streaming Chat ────────────────────────────────────────
    public async IAsyncEnumerable<string> GetStreamingChatAsync(
        string systemPrompt, string userMessage)
    {
        var apiKey = _config["Nvidianim:ApiKey"]!;
        var model = _config["Nvidianim:ChatModel"]!;

        var requestBody = new
        {
            model = model,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userMessage }
            },
            temperature = 0.3,
            max_tokens = 2048,
            stream = true
        };

        var request = new HttpRequestMessage(
            HttpMethod.Post,
            "https://integrate.api.nvidia.com/v1/chat/completions");

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        request.Content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        var response = await _httpClient.SendAsync(
            request, HttpCompletionOption.ResponseHeadersRead);

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var reader = new StreamReader(stream);

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync();
            if (string.IsNullOrEmpty(line)) continue;
            if (!line.StartsWith("data: ")) continue;

            var data = line["data: ".Length..];
            if (data == "[DONE]") break;

            NimChatResponse? chunk = null;
            try
            {
                chunk = JsonSerializer.Deserialize<NimChatResponse>(
                    data,
                    new JsonSerializerOptions
                    { PropertyNameCaseInsensitive = true });
            }
            catch { continue; }

            var content = chunk?.Choices?[0]?.Delta?.Content;
            if (!string.IsNullOrEmpty(content))
                yield return content;
        }
    }

    // ── Re-Ranking ────────────────────────────────────────────────
    // ── Cross-Encoder Re-Ranking ──────────────────────────────────
    public async Task<List<RerankResult>> RerankAsync(
        string query,
        List<string> documents)
    {
        var apiKey = _config["Nvidianim:ApiKey"]!;

        var requestBody = new
        {
            model = "nvidia/nv-rerankqa-mistral-4b-v3",
            query = new { text = query },
            passages = documents
                .Select(d => new { text = d })
                .ToList(),
            truncate = "END"
        };

        var request = new HttpRequestMessage(
            HttpMethod.Post,
            "https://ai.api.nvidia.com/v1/retrieval/nvidia/nv-rerankqa-mistral-4b-v3/reranking");

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        request.Content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        try
        {
            var response = await _httpClient.SendAsync(request);
            var responseBody =
                await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Re-ranker returned {Status} — falling back to keyword ranking. Body: {Body}",
                    response.StatusCode, responseBody);
                return FallbackRank(documents.Count);
            }

            var result = JsonSerializer.Deserialize<NimRerankResponse>(
                responseBody,
                new JsonSerializerOptions
                { PropertyNameCaseInsensitive = true });

            return result?.Rankings
                ?? FallbackRank(documents.Count);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Re-ranking failed — falling back to original order");
            return FallbackRank(documents.Count);
        }
    }

    // ← Fallback keeps original order if re-ranking fails
    private static List<RerankResult> FallbackRank(int count) =>
        Enumerable.Range(0, count)
            .Select(i => new RerankResult
            {
                Index = i,
                Score = 1.0f - (i * 0.05f)
            })
            .ToList();

    // ── Vision — Describe Image ───────────────────────────────────
    public async Task<string> DescribeImageAsync(
        string base64Image,
        string mediaType = "image/jpeg",
        string? contextHint = null)
    {
        var apiKey = _config["Nvidianim:ApiKey"]!;
        var visionModel = _config["Nvidianim:VisionModel"]
            ?? "meta/llama-3.2-11b-vision-instruct";

        var prompt = contextHint != null
            ? $"Describe this image in detail. It is from a document about '{contextHint}'. Focus on any text, charts, diagrams, tables, numbers or important visual information."
            : "Describe this image in detail. Focus on any text, charts, diagrams, tables, numbers or important visual information.";

        var requestBody = new
        {
            model = visionModel,
            messages = new[]
            {
            new
            {
                role = "user",
                content = new object[]
                {
                    new
                    {
                        type = "image_url",
                        image_url = new
                        {
                            url = $"data:{mediaType};base64,{base64Image}"
                        }
                    },
                    new { type = "text", text = prompt }
                }
            }
        },
            max_tokens = 512,
            temperature = 0.2
        };

        var request = new HttpRequestMessage(
            HttpMethod.Post,
            "https://integrate.api.nvidia.com/v1/chat/completions");

        request.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        request.Content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        try
        {
            var response = await _httpClient.SendAsync(request);
            var body = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "Vision API error {Status}: {Body}",
                    response.StatusCode, body);
                return string.Empty;
            }

            var result = JsonSerializer.Deserialize<NimChatResponse>(
                body,
                new JsonSerializerOptions
                { PropertyNameCaseInsensitive = true });

            return result?.Choices?[0]?.Message?.Content
                ?? string.Empty;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Vision description failed");
            return string.Empty;
        }
    }
}
// ── Response Models ───────────────────────────────────────────
public class NimEmbeddingResponse
{
    public List<NimEmbeddingData> Data { get; set; } = new();
}

public class NimEmbeddingData
{
    public int Index { get; set; }
    public List<float> Embedding { get; set; } = new();
}

public class NimChatResponse
{
    public List<NimChoice> Choices { get; set; } = new();
}

public class NimChoice
{
    public NimMessage Message { get; set; } = new();
    public NimDelta? Delta { get; set; }
}

public class NimMessage
{
    public string Content { get; set; } = string.Empty;
}

public class NimDelta
{
    public string? Content { get; set; }
}

// ── Rerank Response Models ────────────────────────────────────
public class NimRerankResponse
{
    public List<RerankResult>? Rankings { get; set; }
}

public class RerankResult
{
    public int Index { get; set; }
    public float Score { get; set; }
}