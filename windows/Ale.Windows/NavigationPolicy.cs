namespace Ale.Windows;
internal static class NavigationPolicy
{
    public const string Origin = "https://ale.example";
    public static bool IsLocal(string value) => Uri.TryCreate(value, UriKind.Absolute, out var uri)
        && uri.Scheme == "https" && uri.Host == "ale.example" && uri.IsDefaultPort && uri.UserInfo.Length == 0;
    public static bool IsApple(string value) => Uri.TryCreate(value, UriKind.Absolute, out var uri)
        && uri.Scheme == "https" && uri.IsDefaultPort && uri.UserInfo.Length == 0
        && (uri.Host == "apple.com" || uri.Host.EndsWith(".apple.com", StringComparison.OrdinalIgnoreCase));
    public static bool IsExternalLink(string value) => Uri.TryCreate(value, UriKind.Absolute, out var uri)
        && uri.Scheme == "https" && uri.IsDefaultPort && uri.UserInfo.Length == 0
        && new[] { "music.apple.com", "developer.apple.com", "www.apple.com" }.Contains(uri.Host);
}
