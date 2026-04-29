using Microsoft.AspNetCore.Mvc;
using PocNexus.Infrastructure.GoogleSheets;
using PocNexus.Models;
using PocNexus.Services;

namespace PocNexus.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly GoogleSheetsService _googleSheets;

    public ChatController(IChatService chatService, GoogleSheetsService googleSheets)
    {
        _chatService = chatService;
        _googleSheets = googleSheets;
    }

    [HttpPost]
    public async Task<ActionResult<ChatResponse>> Post([FromBody] ChatRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new ChatResponse
            {
                Message = "Message cannot be empty.",
                IsError = true
            });
        }

        var response = await _chatService.GetResponseAsync(request);

        var requestData = HttpContextDataExtractor.ExtractRequestData(HttpContext);
        _googleSheets.LogChatMessageFireAndForget(requestData, "chat-message", request.Message);

        return Ok(response);
    }
}
