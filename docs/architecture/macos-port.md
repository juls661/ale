# Ale for macOS

The owner requested a faithful Mac port of the existing Windows Ale player, verification, compliance work, and GitHub pushes after major changes. They delegated implementation and repository choices. Keep the existing repository and React interface; add a macOS 14+ Swift host using WebKit and native MusicKit. The owner is creating an Xcode project; keep reusable host sources independent of that project until it appears.

## Approach and behavior

Reusing the interface preserves Home, Search, Library, Local files, Queue, Settings, styling, keyboard navigation, and queue semantics. A full SwiftUI rewrite would duplicate the interface and increase visual drift. MusicKit JS inside an embedded WebKit view would need separate DRM/authentication compatibility proof; use Apple's recommended native MusicKit instead.

Bundle the production frontend under an app-only URL scheme. No web server, private WebKit preferences, arbitrary native execution, remote navigation, or authentication pages receive a native bridge. Only the exact main app frame may call a finite command set. Resolve bundle resources within their root, reject traversal, deny permissions/downloads, and open approved Apple HTTPS links in the default browser. Use a nonpersistent website store.

Apple Music authorization is requested only after Connect. Native MusicKit manages credentials; no pasted JWT or signing key is needed on Mac. Search returns 25 songs; library shows up to 100 playable songs. Native playback uses ApplicationMusicPlayer, never captured audio or DRM bypass. Disconnect stops Ale playback and clears Ale's connection state; macOS owns authorization revocation. Apple Music's native player has no public per-app volume property: explain use of Mac volume controls and disable the Ale slider for native Apple playback. Keep the slider working for local audio.

Local audio remains explicit file selection and session-only blob URLs. Support depends on WebKit's decoders. Handle unsupported formats visibly. Share the frontend and preserve Windows behavior. Use Mac-specific setup/privacy/accessibility copy where appropriate.

## Delivery and validation

Provide reusable Xcode-ready sources and a reproducible development .app builder, dependency license collection, Mac build CI, setup instructions and a platform comparison in the README. Do not overwrite user-created Xcode files. Work on codex/macos-port and push verified milestones to origin.

Verify native URL/resource/message security policies with executable Swift checks, adapter authorization/error/stale-event behavior with Node tests, the shared interface with existing production browser tests plus Mac-specific integration tests, and compile the actual Mac host. Inspect the running app when possible. Keep live subscription playback, signing/provisioning, VoiceOver and public distribution approval explicitly unverified until observed.

Use original Ale assets and existing dependency notices. Record current Apple requirements and remaining publisher/license/privacy/signing/notarization work. Engineering checks cannot certify universal legal compliance. Public release, App Store submission, trademark clearance, a source-license selection and signing-account changes are outside this implementation.
