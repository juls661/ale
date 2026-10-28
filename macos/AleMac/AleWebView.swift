import AppKit
import SwiftUI
import WebKit
import UniformTypeIdentifiers

struct ContentView: NSViewRepresentable {
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.preferences.tabFocusesLinks = true
        configuration.mediaTypesRequiringUserActionForPlayback = []
        configuration.setURLSchemeHandler(context.coordinator, forURLScheme: "ale")
        configuration.userContentController.addScriptMessageHandler(context.coordinator.music, contentWorld: .page, name: "aleNative")
        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsMagnification = true
        webView.underPageBackgroundColor = NSColor(red: 19 / 255, green: 21 / 255, blue: 21 / 255, alpha: 1)
        context.coordinator.webView = webView
        webView.load(URLRequest(url: URL(string: "ale://app/index.html")!))
        return webView
    }

    func updateNSView(_ nsView: WKWebView, context: Context) {}

    static func dismantleNSView(_ view: WKWebView, coordinator: Coordinator) {
        coordinator.music.shutdown()
        view.configuration.userContentController.removeScriptMessageHandler(forName: "aleNative", contentWorld: .page)
        view.stopLoading()
        view.navigationDelegate = nil
        view.uiDelegate = nil
    }

    @MainActor
    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate, WKURLSchemeHandler {
        let music = NativeMusicBridge()
        weak var webView: WKWebView?
        private let root = Bundle.main.resourceURL!.appendingPathComponent("wwwroot", isDirectory: true)

        func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
            guard let url = urlSchemeTask.request.url, let file = NavigationPolicy.resource(url, root: root),
                  let data = try? Data(contentsOf: file) else {
                urlSchemeTask.didFailWithError(NSError(domain: NSURLErrorDomain, code: NSURLErrorFileDoesNotExist))
                return
            }
            let mime: String
            switch file.pathExtension {
            case "js": mime = "text/javascript"
            case "css": mime = "text/css"
            case "html": mime = "text/html"
            case "svg": mime = "image/svg+xml"
            default: mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
            }
            urlSchemeTask.didReceive(URLResponse(url: url, mimeType: mime, expectedContentLength: data.count, textEncodingName: "utf-8"))
            urlSchemeTask.didReceive(data)
            urlSchemeTask.didFinish()
        }

        func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

        func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
            guard let url = action.request.url else { decisionHandler(.cancel); return }
            guard !action.shouldPerformDownload else { decisionHandler(.cancel); return }
            if NavigationPolicy.isLocal(url), action.targetFrame?.isMainFrame == true {
                decisionHandler(.allow)
            } else {
                if action.navigationType == .linkActivated, NavigationPolicy.isExternal(url) { NSWorkspace.shared.open(url) }
                decisionHandler(.cancel)
            }
        }

        func webView(_ webView: WKWebView, decidePolicyFor response: WKNavigationResponse, decisionHandler: @escaping (WKNavigationResponsePolicy) -> Void) {
            decisionHandler(response.canShowMIMEType ? .allow : .cancel)
        }

        func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? { nil }

        func webView(_ webView: WKWebView, requestMediaCapturePermissionFor origin: WKSecurityOrigin, initiatedByFrame frame: WKFrameInfo, type: WKMediaCaptureType, decisionHandler: @escaping (WKPermissionDecision) -> Void) { decisionHandler(.deny) }

        func webView(_ webView: WKWebView, runOpenPanelWith parameters: WKOpenPanelParameters, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping ([URL]?) -> Void) {
            guard NavigationPolicy.acceptsBridge(url: frame.request.url, mainFrame: frame.isMainFrame) else { completionHandler(nil); return }
            let panel = NSOpenPanel()
            panel.canChooseDirectories = false
            panel.canChooseFiles = true
            panel.allowsMultipleSelection = parameters.allowsMultipleSelection
            panel.allowedContentTypes = ["mp3", "wav", "m4a", "aac", "ogg", "flac"].compactMap { UTType(filenameExtension: $0) }
            guard let window = webView.window else { completionHandler(nil); return }
            panel.beginSheetModal(for: window) { result in completionHandler(result == .OK ? panel.urls : nil) }
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) { showFailure(error) }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) { showFailure(error) }
        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            music.shutdown()
            showFailure(NSError(domain: "Ale", code: 1, userInfo: [NSLocalizedDescriptionKey: "Ale's web process stopped. Close and reopen Ale to reload its interface."]))
        }
        private func showFailure(_ error: Error) {
            guard (error as NSError).code != NSURLErrorCancelled else { return }
            let alert = NSAlert()
            alert.messageText = "Ale could not load its interface"
            alert.informativeText = error.localizedDescription + " Rebuild the Mac app with npm run macos:build if its bundled interface is missing."
            alert.runModal()
        }
    }
}
