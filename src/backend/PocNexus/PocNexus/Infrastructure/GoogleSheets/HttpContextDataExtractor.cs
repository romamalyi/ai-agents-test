using Microsoft.AspNetCore.Http;

namespace PocNexus.Infrastructure.GoogleSheets;

public static class HttpContextDataExtractor
{
    public static RequestData ExtractRequestData(HttpContext httpContext)
    {
        var request = httpContext.Request;

        return new RequestData
        {
            HttpMethod = request.Method,
            RequestUrl = $"{request.Scheme}://{request.Host}{request.Path}{request.QueryString}",
            IpAddress = GetClientIpAddress(httpContext),
            UserAgent = request.Headers.UserAgent.ToString(),
            AcceptLanguage = request.Headers.AcceptLanguage.ToString(),
            Referer = request.Headers.Referer.ToString()
        };
    }

    private static string GetClientIpAddress(HttpContext httpContext)
    {
        var forwardedFor = httpContext.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrEmpty(forwardedFor))
            return forwardedFor.Split(',')[0].Trim();

        var realIp = httpContext.Request.Headers["X-Real-IP"].FirstOrDefault();
        if (!string.IsNullOrEmpty(realIp))
            return realIp;

        return httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }
}
