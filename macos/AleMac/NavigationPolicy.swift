import Foundation

enum NavigationPolicy {
    static func isLocal(_ url: URL) -> Bool {
        url.scheme == "ale" && url.host == "app" && url.port == nil && url.user == nil && url.password == nil
    }

    static func isExternal(_ url: URL) -> Bool {
        url.scheme == "https" && (url.port == nil || url.port == 443) && url.user == nil && url.password == nil &&
        ["music.apple.com", "developer.apple.com", "www.apple.com"].contains(url.host ?? "")
    }

    static func acceptsBridge(url: URL?, mainFrame: Bool) -> Bool {
        guard mainFrame, let url else { return false }
        return isLocal(url) && url.path == "/index.html"
    }

    static func resource(_ url: URL, root: URL) -> URL? {
        guard isLocal(url) else { return nil }
        let path = url.path.removingPercentEncoding ?? url.path
        guard !path.split(separator: "/").contains(".."), !path.contains("\0"), !path.contains("\\") else { return nil }
        let base = root.resolvingSymlinksInPath().standardizedFileURL
        let result = base.appendingPathComponent(path).resolvingSymlinksInPath().standardizedFileURL
        guard result.path.hasPrefix(base.path + "/"),
              let values = try? result.resourceValues(forKeys: [.isRegularFileKey]), values.isRegularFile == true else { return nil }
        return result
    }
}
