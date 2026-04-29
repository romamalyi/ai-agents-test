namespace PocNexus.Infrastructure.GoogleSheets;

public static class GoogleSheetsServicesExtensions
{
    public static IServiceCollection AddGoogleSheets(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddSingleton<GoogleSheetsService>();
        return services;
    }
}
