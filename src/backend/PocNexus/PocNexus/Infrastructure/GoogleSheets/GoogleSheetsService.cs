using Google.Apis.Auth.OAuth2;
using Google.Apis.Services;
using Google.Apis.Sheets.v4;
using Google.Apis.Sheets.v4.Data;

namespace PocNexus.Infrastructure.GoogleSheets;

public class GoogleSheetsService
{
    private readonly ILogger<GoogleSheetsService> _logger;
    private readonly bool _enabled;
    private readonly string _spreadsheetId;
    private readonly string _sheetName;
    private readonly SheetsService? _sheetsService;

    private const string PocCodeName = "poc-nexus";

    public GoogleSheetsService(IConfiguration configuration, ILogger<GoogleSheetsService> logger)
    {
        _logger = logger;

        _enabled = configuration.GetValue<bool>("GoogleSheets:EnabledLogging");
        _spreadsheetId = configuration["GoogleSheets:SpreadsheetId"] ?? string.Empty;
        _sheetName = configuration["GoogleSheets:EventsSheetName"] ?? "Events";
        var credentialsPath = configuration["GoogleSheets:CredentialsPath"] ?? string.Empty;

        if (_enabled && !string.IsNullOrWhiteSpace(credentialsPath) && File.Exists(credentialsPath))
        {
            try
            {
                using var stream = new FileStream(credentialsPath, FileMode.Open, FileAccess.Read);
                var credential = GoogleCredential.FromStream(stream)
                    .CreateScoped(SheetsService.Scope.Spreadsheets);

                _sheetsService = new SheetsService(new BaseClientService.Initializer
                {
                    HttpClientInitializer = credential,
                    ApplicationName = PocCodeName
                });

                _logger.LogInformation("Google Sheets logging enabled for spreadsheet: {SpreadsheetId}", _spreadsheetId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to initialize Google Sheets service. Logging will be disabled.");
                _enabled = false;
            }
        }
        else if (_enabled)
        {
            _logger.LogWarning("Google Sheets logging is enabled but credentials file not found at: {Path}", credentialsPath);
            _enabled = false;
        }
    }

    public void LogChatMessageFireAndForget(RequestData requestData, string eventType, string eventInfo)
    {
        if (!_enabled || _sheetsService == null)
            return;

        _ = Task.Run(async () =>
        {
            try
            {
                var timestamp = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss");

                var row = new List<object>
                {
                    timestamp,
                    requestData.HttpMethod,
                    requestData.RequestUrl,
                    requestData.UserEmail,
                    requestData.IpAddress,
                    requestData.UserAgent,
                    requestData.AcceptLanguage,
                    requestData.Referer,
                    requestData.HttpMethod,
                    PocCodeName,
                    eventType,
                    eventInfo
                };

                var valueRange = new ValueRange
                {
                    Values = new List<IList<object>> { row }
                };

                var request = _sheetsService.Spreadsheets.Values.Append(
                    valueRange,
                    _spreadsheetId,
                    $"{_sheetName}!A:L");

                request.ValueInputOption = SpreadsheetsResource.ValuesResource.AppendRequest.ValueInputOptionEnum.USERENTERED;

                await request.ExecuteAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log interaction to Google Sheets: {EventType}", eventType);
            }
        });
    }
}
