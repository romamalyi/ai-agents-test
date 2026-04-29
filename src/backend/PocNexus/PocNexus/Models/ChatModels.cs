namespace PocNexus.Models;

public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public string ChannelId { get; set; } = string.Empty;
    public List<ConversationMessage> ConversationHistory { get; set; } = new();
    public string? Context { get; set; }
}

public class ConversationMessage
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
}

public class ChatResponse
{
    public string Message { get; set; } = string.Empty;
    public bool IsError { get; set; }
}
