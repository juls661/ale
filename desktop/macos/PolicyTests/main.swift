import Foundation

var failures = 0
var assertions = 0
func check(_ condition: @autoclosure () -> Bool, _ label: String) {
    assertions += 1
    if !condition() { print("FAIL: \(label)"); failures += 1 }
}
check(NavigationPolicy.isLocal(URL(string: "ale://app/index.html")!), "bundled app origin")
for value in ["ale://evil/index.html", "ale://app.evil/index.html", "ale://user@app/index.html", "ale://app:80/index.html", "https://app/index.html", "file:///etc/passwd"] {
    check(!NavigationPolicy.isLocal(URL(string: value)!), "reject origin \(value)")
}
check(NavigationPolicy.isExternal(URL(string: "https://music.apple.com/us/song/123")!), "Apple music link")
for value in ["http://music.apple.com", "https://music.apple.com.evil.test", "https://user@music.apple.com", "https://music.apple.com:8443", "https://example.com", "javascript:alert(1)"] {
    check(!NavigationPolicy.isExternal(URL(string: value)!), "reject external \(value)")
}
let root = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent(UUID().uuidString)
try FileManager.default.createDirectory(at: root.appendingPathComponent("assets"), withIntermediateDirectories: true)
defer { try? FileManager.default.removeItem(at: root) }
try Data("ok".utf8).write(to: root.appendingPathComponent("assets/app.js"))
try FileManager.default.createSymbolicLink(at: root.appendingPathComponent("escape"), withDestinationURL: URL(fileURLWithPath: "/etc"))
check(NavigationPolicy.resource(URL(string: "ale://app/assets/app.js")!, root: root) != nil, "allow bundled asset")
for value in ["ale://app/../outside", "ale://app/%2e%2e/outside", "ale://app/escape/passwd", "ale://app/assets/missing.js", "ale://evil/assets/app.js"] {
    check(NavigationPolicy.resource(URL(string: value)!, root: root) == nil, "reject resource \(value)")
}
check(NavigationPolicy.acceptsBridge(url: URL(string: "ale://app/index.html"), mainFrame: true), "trusted main-frame bridge")
check(!NavigationPolicy.acceptsBridge(url: URL(string: "ale://app/index.html"), mainFrame: false), "subframe bridge rejected")
check(!NavigationPolicy.acceptsBridge(url: URL(string: "https://music.apple.com"), mainFrame: true), "remote bridge rejected")
if failures > 0 { exit(1) }
print("Native navigation/resource/bridge checks passed (\(assertions) assertions).")
