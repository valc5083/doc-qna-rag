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
            temperature = 0.2,
            max_tokens = 1024
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
            temperature = 0.2,
            max_tokens = 1024,
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
}

// ── Response Models ───────────────────────────────────────────
public class NimEmbeddingResponse
{
    public List<NimEmbeddingData> Data { get; set; } = new();
}

public class NimEmbeddingData
{
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