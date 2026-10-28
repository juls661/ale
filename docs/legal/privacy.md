# Ale privacy notice — personal preview 0.1.0

Effective date: October 28, 2026. Current scope: personal testing on Windows and macOS; any later public release is intended to be free and offered in the United States.

Ale has no developer-operated account system, telemetry, advertisements, crash reporting or cloud database. The developer does not receive your files, searches, tokens or playback history through an Ale service.

## Local audio

Only files you explicitly select are opened. Their names, contents and temporary playback URLs remain on your device for this session. Closing Ale releases the file selections and queue. Clear Ale data stops playback and releases all selected-file URLs. No music is uploaded. Runtime decoding/format support varies.

## Apple Music

The following JavaScript SDK and browser-token description applies to Windows and ordinary browsers. The Mac app uses the native integration described below.

Before connecting, Ale makes no Apple Music network requests. Clicking Connect loads Apple's official MusicKit JavaScript SDK from Apple, configures it with your signed developer token and opens Apple's authorization window. Apple, rather than Ale's developer, receives sign-in, network/device information, searches, library requests and playback activity. Apple artwork is loaded from Apple's servers. Your active Apple Music subscription and service terms govern full playback.

The developer token entered into Ale is kept in application memory for this session, never placed in Ale's own logs, source, localStorage, or a server. Apple's SDK can manage its own authentication and browser storage. Do not paste your private .p8 signing key; Ale rejects private-key text. Ale never requests or handles your Apple password directly. Apple's SDK, sign-in window and retained session are governed by [Apple's privacy policy](https://www.apple.com/legal/privacy/).

## Clear data

Clear Ale data stops playback, disconnects the MusicKit instance, releases selected files and clears this application's origin localStorage/sessionStorage. This does not guarantee sign-out from your Apple account in other browser contexts. Use “Clear Apple browser session & close” in the Windows app to clear the entire dedicated Ale WebView2 profile and close the app. In a normal browser, clear Ale's site data through browser settings. Uninstall/remove the portable application and remove `%LOCALAPPDATA%\Ale\WebView2` with Ale closed to remove its profile manually.

## Windows runtime

Ale stores its dedicated WebView2 browser profile under `%LOCALAPPDATA%\Ale\WebView2`. Microsoft supplies and updates WebView2 independently under its own terms; operating-system and browser runtime diagnostics are governed by your Windows/Microsoft settings. Ale does not add an analytics service. Ale does not open a LAN listener; phone pairing is not implemented in this release.

## macOS runtime and Apple Music

The Mac app bundles Ale's interface in a sandboxed WebKit host with a nonpersistent website-data store. It opens no listener and loads no remote executable interface or MusicKit JavaScript SDK. Explicitly selected local files are read through the native file picker and temporary browser URLs. The Mac's supported audio decoders determine format support.

Connect requests macOS MusicKit authorization and checks subscription access. Apple receives account, catalog/library and playback requests under its own policies. Native MusicKit manages credentials; Ale asks for no password, private key or developer token and does not operate a credential server. System frameworks, the Music app and macOS may keep account/authorization data and diagnostics outside Ale's web session. Those are governed by Apple and your system settings.

Disconnect and Clear Ale data stop Ale's native player and discard Ale's in-memory song references and connection state. They do not sign out your Apple account or revoke macOS MusicKit permission. Revoke access in System Settings → Privacy & Security → Media & Apple Music. Closing the final Ale window quits the Mac app; the native player is stopped on termination. Ale's own temporary web store is discarded when its web view is released. No claim is made that clearing Ale removes data held by Apple or system services.

This notice describes the current personal preview. Before distribution, identify the publisher/contact, territories, applicable privacy obligations, retention and request procedures and update the notice for actual deployment. No contact address or legal entity has been invented.

## Policy changes and publication

This file is the versioned privacy notice for the current build. A material change to Ale’s own data collection or sharing should be disclosed in an updated notice and release notes before that behavior is introduced; obtain consent where required. A future public release needs a real publisher identity and contact method, a stable public policy link, and a check of applicable privacy requirements. Those details are not yet supplied and have not been invented.

## GitHub documentation

The repository README displays status badges hosted by Shields.io and a local screenshot. GitHub and its image proxy, or the image host when a renderer requests it directly, may receive normal request information when the README is viewed. Those documentation images are not loaded by the installed Ale player. GitHub, Microsoft and Apple operate their own services under their own policies.
