using Azure;
using Azure.AI.OpenAI;
using OpenAI.Chat;
using PocNexus.Models;
using PocNexus.Prompts;

namespace PocNexus.Services;

public interface IChatService
{
    Task<ChatResponse> GetResponseAsync(ChatRequest request);
}

public class ChatService : IChatService
{
    private readonly ChatClient? _chatClient;
    private readonly ILogger<ChatService> _logger;
    private readonly bool _isConfigured;

    public ChatService(IConfiguration configuration, ILogger<ChatService> logger)
    {
        _logger = logger;

        var endpoint = configuration["AzureOpenAI:Endpoint"];
        var apiKey = configuration["AzureOpenAI:ApiKey"];
        var deploymentName = configuration["AzureOpenAI:DeploymentName"];

        if (!string.IsNullOrWhiteSpace(endpoint)
            && !string.IsNullOrWhiteSpace(apiKey)
            && !string.IsNullOrWhiteSpace(deploymentName))
        {
            var azureClient = new AzureOpenAIClient(
                new Uri(endpoint),
                new AzureKeyCredential(apiKey));
            _chatClient = azureClient.GetChatClient(deploymentName);
            _isConfigured = true;
            _logger.LogInformation("Azure OpenAI configured with deployment: {Deployment}", deploymentName);
        }
        else
        {
            _isConfigured = false;
            _logger.LogWarning("Azure OpenAI is not configured. Chat will return fallback responses.");
        }
    }

    public async Task<ChatResponse> GetResponseAsync(ChatRequest request)
    {
        if (!_isConfigured || _chatClient == null)
        {
            return new ChatResponse
            {
                Message = "I'm Leo, your AI assistant. Azure OpenAI is not yet configured for this environment. " +
                          "Please set the AzureOpenAI:Endpoint, ApiKey, and DeploymentName in appsettings.json to enable real AI responses.",
                IsError = true
            };
        }

        try
        {
            var systemPrompt = SystemPrompts.GetPrompt(request.ChannelId);

            if (!string.IsNullOrWhiteSpace(request.Context))
                systemPrompt += "\n\nAdditional context for this query:\n" + request.Context;

            var messages = new List<ChatMessage>
            {
                new SystemChatMessage(systemPrompt)
            };

            foreach (var msg in request.ConversationHistory.TakeLast(20))
            {
                if (msg.Role == "user")
                    messages.Add(new UserChatMessage(msg.Content));
                else if (msg.Role == "assistant")
                    messages.Add(new AssistantChatMessage(msg.Content));
            }

            messages.Add(new UserChatMessage(request.Message));

            var options = new ChatCompletionOptions
            {
                MaxOutputTokenCount = 1024,
                Temperature = 0.7f
            };

            var completion = await _chatClient.CompleteChatAsync(messages, options);

            return new ChatResponse
            {
                Message = completion.Value.Content[0].Text,
                IsError = false
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Azure OpenAI");
            return new ChatResponse
            {
                Message = "I encountered an error processing your request. Please try again or contact support if the issue persists.",
                IsError = true
            };
        }
    }
}
