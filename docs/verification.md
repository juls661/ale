# Mac port verification — October 28, 2026

Scope: shared interface plus a new macOS 14+ Swift/WebKit/MusicKit host. No live Apple credentials were used and no MusicKit permission was granted by the agent.

| Check                                | Result                                                                                                                                                                                                                                                 |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Node unit/regression suite           | 22 passed, including native permission denial, playback rejection, revocation, unsafe artwork/links, stopped-track stale events and a status reply sampled during a pending play operation. The latter regression was observed failing before the fix. |
| TypeScript production build / ESLint | Passed. Shared Windows SDK flow remains covered by existing tests.                                                                                                                                                                                     |
| Production Chromium                  | 9 scenarios passed, including real synthesized WAV playback and the new Mac-native UI transport path.                                                                                                                                                  |
| Production WebKit                    | All 9 scenarios passed in the final serial run, including real WAV playback, keyboard navigation, native transport UI and accessibility checks.                                                                                                        |
| Native URL/resource/bridge policy    | 23 assertions passed: exact origin, spoofed/userinfo/port URLs, traversal, missing resources, symlink escape and subframe/remote bridge rejection.                                                                                                     |
| Universal Mac build                  | Both arm64 and x86_64 compiled with warnings treated as errors; Mach-O architectures and local ad-hoc signature verified.                                                                                                                              |
| Xcode integration                    | Portable `macos/Ale.xcodeproj` and the owner's original Documents project compiled with signing disabled. Standard Xcode resource copying includes frontend and dependency notices.                                                                    |
| Native app observation               | Home and Mac-specific Settings rendered in the actual app. The native file picker imported an original 30-second synthesized WAV; playback reached 0:30 and stopped at the end. This observation is separate from browser transport stubs.             |
| Independent AI review                | No additional confirmed major findings after identifying native lifecycle, termination and download controls. Native operations now invalidate stale completions; termination stops the player and navigation download requests are cancelled.         |

Remaining: real signed/provisioned native MusicKit connect/search/library and full subscription playback; natural Apple queue completion; native Apple media controls; interruption/network-error behavior; Intel runtime testing; older macOS runtime testing; VoiceOver and complete keyboard/display review; distribution signing/notarization and legal release clearance. Builds and stub transport tests do not prove these behaviors.

The first WebKit browser attempt could not launch because its runtime was absent. After installing the test runtime, eight scenarios passed and the skip-link test exposed a Safari keyboard convention: Option-Tab focuses links by default. The native host explicitly enables Tab-to-link focus. A later parallel attempt timed out during concurrent build activity; after the build finished, all nine scenarios passed serially in 24.5 seconds. No product timeout or OS keyboard preference was changed to obtain this result.

---

# Ale verification — 2026-10-27

Target: Windows 11 x64 developer preview. Build/check host: macOS ARM64, Node 24, .NET SDK 10.0.403. Source branch: `codex/ale-windows`. Original user starter files were retained and developed in this checkout; no merge, push, public release or GitHub Actions run was performed.

## Automated evidence

| Check                                                                | Result                                                                                                                                                                                                                                                                                          |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node unit/regression suite (`npm test`)                              | 14 tests passed; malformed/expired/private-key token screening, safe Apple URLs, queue edges, cryptographic developer JWT verification, SDK denial/error handling, sign-out after stop failure, deferred queue advance, muted first Apple play, accurate local state and idempotent media keys. |
| TypeScript + Vite production build                                   | Passed. Production CSP injected. No frontend build warnings.                                                                                                                                                                                                                                    |
| ESLint                                                               | Passed.                                                                                                                                                                                                                                                                                         |
| Production Playwright suite (`ALE_PRODUCTION=1 npx playwright test`) | 8 tests passed: real synthesized WAV playback/time advance, pause, seek, next, queue clear; credential rejection without Apple requests; reset; keyboard skip link; stale search isolation; SDK playback errors; narrow-screen volume.                                                          |
| axe accessibility checks                                             | Zero reported violations for selected WCAG A/AA/2.1 AA/2.2 AA rule tags in Home, Settings and Local files at desktop and 390px widths. This is automated coverage of tested states, not full WCAG conformance.                                                                                  |
| Native navigation policy                                             | 12 assertions passed on .NET: exact HTTPS local origin, Apple auth origin, rejection of spoofed hosts/userinfo, arbitrary ports, HTTP/file/JavaScript schemes and external domains.                                                                                                             |
| Windows cross-publish                                                | Self-contained `win-x64` executable compiled successfully with zero warnings/errors. `file` identifies Ale.exe as PE32+ GUI x86-64 for MS Windows. This verifies the build, not startup or audio on Windows.                                                                                    |
| Dependency audit                                                     | npm install reported zero known vulnerabilities at installation time. It is a point-in-time dependency report, not a security guarantee.                                                                                                                                                        |
| Visual inspection                                                    | Desktop Home, Settings and narrow Home captures inspected. No page JavaScript errors observed. Narrow empty-card text flow corrected.                                                                                                                                                           |
| Dependency notices                                                   | React, React DOM, Scheduler, .NET and WebView2 SDK license/notice texts included in `licenses/`.                                                                                                                                                                                                |

## AI code review

A separate read-only AI reviewer examined the implementation and reproduced two findings with a Node simulation. Five findings were addressed and regression-checked:

1. Narrow navigation buttons lost their accessible names: permanent names added; axe now runs after narrowing as well as on desktop.
2. A stop error skipped MusicKit deauthorization: finally-based cleanup ensures deauthorization is attempted and keeps the SDK reference if it remains authorized, permitting retry.
3. An ended event during another operation dropped automatic queue advance: deferred advancement is guarded by a playback epoch so stale completion cannot skip a newly started track.
4. Apple playback began before applying the selected volume: volume is now set before play, including zero.
5. OS play/pause commands incorrectly toggled state: handlers are now idempotent.

Tests for these failures were observed failing and then passing after correction. An additional direct regression caught inaccurate local-playing state after a failed connection attempt; this was also corrected. No review findings were deferred.

## Still unverified / required on the owner's Windows PC

- Launch/extract, window sizing/DPI, WebView2 runtime-present and runtime-missing paths, complete native-profile reset, file selection and media keys.
- Real developer token configuration, Apple authorization popup/opener flow, subscription entitlement/storefront, catalog/library API shape and network behavior.
- **Full protected Apple Music playback beyond preview length**, seek/skip/queue/volume; compare against Edge if WebView2 fails. No Apple credentials were available to this build session and no live account was used.
- Apple's own SDK dialogs and runtime CSP/CDN needs under a real account. A stub SDK is used only for transport/error-path tests.
- Windows Narrator, forced-colors/high-contrast mode, 200% and 400% scaling, reduced-motion preference and user testing. Browser reflow/axe coverage does not replace these.
- Installation/signing/SmartScreen, updates, public release licensing/publisher/privacy/jurisdiction review. Current output is a portable unsigned developer preview.
- Native iPhone remote, secure pairing and LAN server are not part of this release.

See the [Apple Music setup guide](apple-music.md) and [README](../README.md) for Windows test and local token generation steps; do not send secrets or private keys in chat.

## Second compliance pass

For the personal-now / future-free-U.S.-release scope, the second review corrected exact-version runtime notice collection and trademark/documentation presentation. The unit suite now has 16 tests, including exact runtime notice copying and missing-notice rejection. See [the dated compliance audit](legal-audit-2026-10-27.md) for evidence and release gates. Earlier counts above remain the initial milestone record.
