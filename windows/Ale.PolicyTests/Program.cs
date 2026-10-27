using Ale.Windows;
var assertions = new (bool Actual, bool Expected)[] {
  (NavigationPolicy.IsLocal("https://ale.example/index.html"),true),
  (NavigationPolicy.IsLocal("https://ale.example.evil.com/"),false),
  (NavigationPolicy.IsLocal("http://ale.example/"),false),
  (NavigationPolicy.IsLocal("https://ale.example:8888/"),false),
  (NavigationPolicy.IsApple("https://idmsa.apple.com/auth"),true),
  (NavigationPolicy.IsApple("https://apple.com.evil.test/auth"),false),
  (NavigationPolicy.IsApple("https://apple.com@evil.test/auth"),false),
  (NavigationPolicy.IsApple("http://appleid.apple.com/auth"),false),
  (NavigationPolicy.IsExternalLink("file:///C:/Windows/System32/cmd.exe"),false),
  (NavigationPolicy.IsExternalLink("javascript:alert(1)"),false),
  (NavigationPolicy.IsExternalLink("https://music.apple.com/us/song/123"),true),
  (NavigationPolicy.IsExternalLink("https://developer.apple.com/help/account"),true),
};
foreach(var (actual,expected) in assertions) if(actual!=expected) throw new Exception("Navigation policy check failed.");
Console.WriteLine($"Passed {assertions.Length} native navigation policy checks.");
