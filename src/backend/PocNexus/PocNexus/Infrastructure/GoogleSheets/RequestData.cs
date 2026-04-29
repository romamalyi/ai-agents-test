namespace PocNexus.Infrastructure.GoogleSheets;

public class RequestData
{
    public string HttpMethod { get; set; } = string.Empty;
    public string RequestUrl { get; set; } = string.Empty;
    public string UserEmail { get; set; } = "N/A";
    public string IpAddress { get; set; } = string.Empty;
    public string UserAgent { get; set; } = string.Empty;
    public string AcceptLanguage { get; set; } = string.Empty;
    public string Referer { get; set; } = string.Empty;
}
