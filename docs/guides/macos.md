# Ale for Mac

Ale for Mac keeps the Windows interface and queue behavior in a native Swift/WebKit host. Local audio plays through WebKit; Apple Music uses Apple's native MusicKit framework. Requires macOS 14 or later on Apple silicon or Intel.

## Build a development app

Install Node.js 24 and Xcode with the macOS SDK. From the repository root:

```sh
npm ci
npm run macos:build
```

The universal app is `build/releases/macos/Ale.app`. This build is ad-hoc signed for local development, not Developer ID signed or notarized for distribution. It can test local files; real Apple Music needs the Xcode signing/app-service setup below. Do not disable Gatekeeper or other security protections.

## Run in Xcode

```sh
npm run macos:prepare
open desktop/macos/Ale.xcodeproj
```

Choose the **Ale** scheme and **My Mac**, then Run. Run `npm run macos:prepare` again after frontend, privacy or dependency changes; it rebuilds the frontend and stages `build/macos/resources/` with exact dependency licenses. Xcode uses its standard resource-copy phase. Generated resources are excluded from Git.

The owner's original Documents project has also been connected to these same repository sources and generated resources. Its original `project.pbxproj` was preserved beside it as `project.pbxproj.before-ale-port`. Its template source files were retained outside target membership. The portable project above is the shared version; the original project depends on its current relative location beside `Documents/ChatGPT/ale`.

## Enable real Apple Music

1. In Xcode, choose your own development team and a unique bundle identifier registered to your developer account. The repository uses the development placeholder `com.ale.player.development` and stores no team identity.
2. Enable the **MusicKit App Service** on that app identifier in Apple's developer portal and let Xcode manage appropriate signing/provisioning. Follow [Apple's automatic-token setup](https://developer.apple.com/documentation/musickit/using-automatic-token-generation-for-apple-music-api). Do not invent a MusicKit entitlement or embed a private key; this is an app service.
3. Keep App Sandbox, outgoing network access and user-selected read-only files enabled. The included entitlements provide those controls. `NSAppleMusicUsageDescription` explains why access is requested.
4. Sign in to your subscribed Apple Music account in the Music app. Run Ale, open Settings, and choose **Connect to Apple Music**. Grant permission yourself in the macOS prompt.
5. Verify search, library, full-song playback beyond preview length, natural queue advance, pause/resume, seek, switching between local and Apple tracks, and system media controls. Build success and bridge tests do not prove these account-dependent behaviors.

Ale does not ask for a developer JWT on Mac. The Windows/browser app retains its existing session-only token flow. Apple's recommended [native integration](https://developer.apple.com/documentation/applemusicapi/user-authentication-for-musickit) and [MusicKit terms](https://developer.apple.com/support/terms/apple-developer-program-license-agreement/) apply.

## Platform details

- Native MusicKit has no public per-app volume setter. Ale disables its volume slider for Apple Music and asks you to use Mac volume controls. Local playback retains the slider.
- Catalog searches return up to 25 songs. Library is limited to the first 100 playable songs; pagination is not implemented.
- Files, queue, preferences and Ale's connection state last for the session. Disconnect does not revoke system permission; use System Settings → Privacy & Security → Media & Apple Music. See [privacy](../legal/privacy.md).
- Tab navigation includes links in the native app. Safari/WebKit browser previews may require Option-Tab according to [Apple's keyboard conventions](https://support.apple.com/en-ie/guide/safari/cpsh003/27.0/mac/27). VoiceOver and complete manual accessibility review are still required.
- No remote-control server, iPhone pairing, downloader, audio capture or DRM bypass is added by this port.

## Verification and distribution

`npm test`, `npm run lint`, `npm run macos:test`, and `npm run macos:build` cover the shared code, native boundary and both Mac architectures. Browser tests can run in Chromium or WebKit. See the dated record in [verification](../verification.md) for exact observations and limits.

Before a public release, supply publisher/contact details, select explicit source/binary licensing terms, complete Apple agreement and identity review, test live subscription playback, perform manual accessibility/security testing, and obtain distribution signing/notarization. This engineering work does not certify legal compliance in every jurisdiction. No App Store submission or public binary release has been made.
