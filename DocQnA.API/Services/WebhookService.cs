using System.Text;
using System.Text.Json;

namespace DocQnA.API.Services;

public class WebhookService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WebhookService> _logger;

    public WebhookService(
        IHttpClientFactory factory,
        ILogger<WebhookService> logger)
    {
        _httpClient = factory.CreateClient("Webhook");
        _logger = logger;
    }

    public async Task SendAsync(
        string webhookUrl,
        string eventType,
        object payload)
    {
        if (string.IsNullOrEmpty(webhookUrl)) return;

        try
        {
            var body = JsonSerializer.Serialize(new
            {
                @event = eventType,
                timestamp = DateTime.UtcNow,
                data = payload
            });

            var request = new HttpRequestMessage(
                HttpMethod.Post, webhookUrl);

            request.Content = new StringContent(
                body, Encoding.UTF8, "application/json");

            // Add signature for security
            var signature = ComputeSignature(body);
            request.Headers.Add(
                "X-DocQnA-Signature", signature);
            request.Headers.Add(
                "X-DocQnA-Event", eventType);

            var response = await _httpClient
                .SendAsync(request);

            _logger.LogInformation(
                "Webhook {Event} sent to {Url}: {Status}",
                eventType, webhookUrl,
                response.StatusCode);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex,
                "Webhook delivery failed for {Event}",
                eventType);
        }
    }

    private static string ComputeSignature(string body)
    {
        using var hmac =
            new System.Security.Cryptography.HMACSHA256(
                Encoding.UTF8.GetBytes("docqna-webhook-secret"));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
        return Convert.ToHexString(hash).ToLower();
    }
}