import Foundation
import MusicKit
import WebKit
import AppKit

@MainActor
final class NativeMusicBridge: NSObject, WKScriptMessageHandlerWithReply {
    private var player: ApplicationMusicPlayer?
    private var songs: [String: Song] = [:]
    private var connected = false
    private var duration: TimeInterval = 0
    private var lastPosition: TimeInterval = 0
    private var awaitingEnd = false
    private var sessionGeneration = 0
    private var playbackGeneration = 0

    override init() {
        super.init()
        NotificationCenter.default.addObserver(self, selector: #selector(terminate), name: NSApplication.willTerminateNotification, object: nil)
    }

    @objc private func terminate() { shutdown() }

    private func requireSession(_ generation: Int) throws {
        guard generation == sessionGeneration else { throw failure("This Apple Music operation was cancelled.") }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
        guard NavigationPolicy.acceptsBridge(url: message.frameInfo.request.url, mainFrame: message.frameInfo.isMainFrame),
              let body = message.body as? [String: Any], let command = body["command"] as? String else {
            replyHandler(nil, "This page cannot access Ale's native player.")
            return
        }
        Task { @MainActor in
            do { replyHandler(try await execute(command, body: body), nil) }
            catch { replyHandler(nil, error.localizedDescription) }
        }
    }

    private func failure(_ text: String) -> NSError { NSError(domain: "Ale.Music", code: 1, userInfo: [NSLocalizedDescriptionKey: text]) }

    private func requirePlayer() throws -> ApplicationMusicPlayer {
        guard connected, MusicAuthorization.currentStatus == .authorized, let player else {
            throw failure("Connect Apple Music in Settings. If permission was denied, allow Ale in System Settings → Privacy & Security → Media & Apple Music.")
        }
        return player
    }

    private func tracks(_ items: [Song]) -> [[String: Any]] {
        for song in items { songs[song.id.rawValue] = song }
        return items.map { song in
            var track: [String: Any] = ["id": song.id.rawValue, "source": "apple", "title": song.title, "artist": song.artistName,
                                        "album": song.albumTitle ?? "", "duration": song.duration ?? 0]
            if let artwork = song.artwork?.url(width: 320, height: 320) { track["artwork"] = artwork.absoluteString }
            if let url = song.url { track["appleUrl"] = url.absoluteString }
            return track
        }
    }

    private func execute(_ command: String, body: [String: Any]) async throws -> Any {
        switch command {
        case "connect":
            sessionGeneration += 1
            let generation = sessionGeneration
            guard await MusicAuthorization.request() == .authorized else { throw failure("Apple Music access was not granted. You can allow Ale in System Settings → Privacy & Security → Media & Apple Music.") }
            try requireSession(generation)
            let subscription = try await MusicSubscription.current
            try requireSession(generation)
            guard subscription.canPlayCatalogContent else { throw failure("An active Apple Music subscription is required for full-song playback. Check your Apple account in the Music app.") }
            player = ApplicationMusicPlayer.shared
            player?.state.repeatMode = MusicPlayer.RepeatMode.none
            player?.state.shuffleMode = .off
            connected = true
            return ["connected": true]
        case "disconnect":
            shutdown()
            return ["connected": false]
        case "stop":
            playbackGeneration += 1
            awaitingEnd = false
            lastPosition = 0
            player?.stop()
            return [:] as [String: Any]
        case "search":
            _ = try requirePlayer()
            let generation = sessionGeneration
            guard let term = body["term"] as? String, !term.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty, term.count <= 500 else { throw failure("Enter a search of 1–500 characters.") }
            var request = MusicCatalogSearchRequest(term: term, types: [Song.self])
            request.limit = 25
            let response = try await request.response()
            try requireSession(generation)
            return tracks(Array(response.songs))
        case "library":
            _ = try requirePlayer()
            let generation = sessionGeneration
            var request = MusicLibraryRequest<Song>()
            request.limit = 100
            let response = try await request.response()
            try requireSession(generation)
            return tracks(Array(response.items).filter { $0.playParameters != nil })
        case "play":
            let music = try requirePlayer()
            guard let id = body["id"] as? String, let song = songs[id] else { throw failure("Find this song in Search or Library again before playing it.") }
            awaitingEnd = false
            playbackGeneration += 1
            let generation = playbackGeneration
            duration = song.duration ?? 0
            lastPosition = 0
            music.queue = ApplicationMusicPlayer.Queue(for: [song])
            try await music.play()
            guard generation == playbackGeneration else { music.stop(); throw failure("Playback was cancelled.") }
            awaitingEnd = true
            return [:] as [String: Any]
        case "resume":
            let music = try requirePlayer()
            playbackGeneration += 1
            let generation = playbackGeneration
            try await music.play()
            guard generation == playbackGeneration else { music.stop(); throw failure("Playback was cancelled.") }
            awaitingEnd = true
            return [:] as [String: Any]
        case "pause":
            playbackGeneration += 1
            player?.pause()
            return [:] as [String: Any]
        case "seek":
            let music = try requirePlayer()
            guard let value = body["time"] as? Double, value.isFinite else { throw failure("The playback position is invalid.") }
            music.playbackTime = max(0, min(duration, value))
            lastPosition = music.playbackTime
            return [:] as [String: Any]
        case "status":
            let authorized = connected && MusicAuthorization.currentStatus == .authorized
            if !authorized { shutdown() }
            let position = player?.playbackTime ?? 0
            let playing = player?.state.playbackStatus == .playing
            let ended = awaitingEnd && player?.state.playbackStatus == .stopped &&
                (player?.queue.currentEntry == nil || (duration > 0 && lastPosition >= duration - 1))
            if ended { awaitingEnd = false }
            if position > 0 { lastPosition = position }
            return ["connected": authorized, "playing": playing, "position": position.isFinite ? max(0, position) : 0,
                    "duration": duration, "ended": ended]
        default:
            throw failure("Unknown Ale player command.")
        }
    }

    func shutdown() {
        sessionGeneration += 1
        playbackGeneration += 1
        awaitingEnd = false
        player?.stop()
        player = nil
        connected = false
        songs.removeAll()
        duration = 0
        lastPosition = 0
    }
}
