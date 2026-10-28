import SwiftUI

@main
struct AleMacApp: App {
    @NSApplicationDelegateAdaptor(AleAppDelegate.self) private var appDelegate
    var body: some Scene {
        Window("Ale — Your listening space", id: "player") {
            ContentView()
                .frame(minWidth: 420, minHeight: 600)
                .background(Color(red: 19 / 255, green: 21 / 255, blue: 21 / 255))
        }
        .defaultSize(width: 1280, height: 880)
    }
}

final class AleAppDelegate: NSObject, NSApplicationDelegate {
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }
}
