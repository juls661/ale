# Build and develop Ale

[← Back to Ale](../README.md)

## Requirements

| Task                         | Required tools                                                          |
| ---------------------------- | ----------------------------------------------------------------------- |
| Develop the interface        | Node.js 24 and npm                                                      |
| Run browser tests            | Node.js 24 and Playwright Chromium / WebKit                             |
| Build/run the Mac app        | macOS 14+, Xcode and Node.js 24                                         |
| Build the Windows app        | Node.js 24 and .NET 10 SDK                                              |
| Run the Windows app          | Windows 11 x64 and WebView2 Evergreen Runtime                           |
| Play full Apple Music tracks | Platform-specific MusicKit setup, permission and an active subscription |

You can develop and cross-compile from macOS. The resulting `Ale.exe` must be tested on Windows. The .NET runtime is bundled with the self-contained build; the playback PC does not need the SDK.

## Start locally

Run from the repository root:

```sh
npm ci
npm run dev
```

Vite prints a loopback URL. Open it in your browser. The native Windows host loads built assets through a local HTTPS virtual host rather than opening a LAN listener.

## Commands

| Command                 | Purpose                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `npm run dev`           | Start the browser development interface                               |
| `npm test`              | Run Node unit and regression tests                                    |
| `npm run lint`          | Check TypeScript with ESLint                                          |
| `npm run build`         | Type-check and build the production interface                         |
| `npm run preview`       | Serve the production interface locally                                |
| `npm run test:e2e`      | Run Playwright playback and accessibility tests                       |
| `npm run check`         | Run unit tests, lint, production build and browser tests              |
| `npm run windows:build` | Check native navigation and publish Windows x64 output                |
| `npm run format:check`  | Check source and documentation formatting                             |
| `npm run format`        | Apply repository formatting                                           |
| `npm run screenshots`   | Capture desktop, settings and narrow layouts from a running local app |

Install the test browser once:

```sh
npx playwright install chromium
npm run check
```

Browser tests synthesize their own WAV and stub the external Apple SDK for error paths. They do not establish that real Apple authentication or protected streaming works. See the [verification record](verification.md).

To run browser tests against the built production interface and its CSP:

```sh
# macOS / Linux
ALE_PRODUCTION=1 npm run test:e2e
```

```powershell
# Windows PowerShell
$env:ALE_PRODUCTION = '1'
npm run test:e2e
Remove-Item Env:ALE_PRODUCTION
```

Build with `npm run build` first. Production tests use port 4173; development tests use port 5173.

## Windows package

Install a [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0), then run:

```sh
npm run windows:build
```

The script builds React, runs `windows/Ale.PolicyTests`, publishes the self-contained x64 host, and copies documentation and license notices to `release/Ale-win-x64/`. Set `ALE_DOTNET` to the SDK executable’s absolute path if `dotnet` is not on PATH.

Keep the output folder together when transferring it to Windows. Packaging cleans this generated directory first; do not store source files or personal files inside it. `release/`, `dist/`, test reports, native `bin/` and `obj/` directories and `node_modules/` are ignored by Git.

The preview is unsigned. Publisher signing, installer/update behavior, and real runtime testing remain release tasks. Do not disable Windows protections to run an unfamiliar binary.

## How it fits together

- `src/App.tsx` and `src/components/` render the interface.
- `src/player/controller.ts` coordinates playback and queue state.
- `src/player/musickit.ts` isolates the official Apple SDK.
- `src/player/model.ts` holds shared track, token and URL helpers.
- `windows/Ale.Windows/` hosts the frontend in a constrained WebView2 window.
- `windows/Ale.PolicyTests/` checks the platform-neutral navigation policy.
- `.github/workflows/windows.yml` runs verification and publishes a workflow artifact when triggered on GitHub.

There is no iPhone remote, LAN pairing service or developer-operated backend in this milestone.

## Screenshots

Start the app in one terminal, then run `npm run screenshots` in another. Captures go to your system temporary folder under `ale-screenshots/` by default. Set `ALE_PREVIEW_URL` to use a different local preview address or `ALE_SCREENSHOT_DIR` to choose the output folder. The committed `docs/images/ale-desktop.png` is a curated screenshot; generated settings and narrow captures are ignored.

## Secrets and local notes

Keep `.p8`, `.p12`, `.pfx`, tokens and `.env` files out of Git. Ignore rules reduce accidental additions but do not scan for secrets already embedded in source. Inspect changes before publishing and never attach browser profiles to issues.

Local implementation notes are preserved in the ignored `.planning/` directory. Public-facing guides and release records live in `docs/`.

## macOS development

The Mac port reuses the frontend in a sandboxed Swift/WebKit host and uses native MusicKit for Apple Music. Requires macOS 14+ and Xcode; Node.js 24 builds the interface.

```sh
npm ci
npm run macos:build
```

This runs the frontend production build, stages dependency notices, checks the native navigation/resource policy, compiles Apple silicon and Intel binaries, and assembles an ad-hoc signed development app at `release/Ale-mac-universal/Ale.app`.

For Xcode: `npm run macos:prepare`, then open `macos/Ale.xcodeproj`, choose Ale / My Mac and Run. Repeat preparation after frontend/dependency/privacy changes. Xcode uses standard resource copying, with build-script sandboxing left enabled. The repository Xcode project has no personal signing team. Account-dependent Apple Music setup and the owner's original-project integration are explained in [the Mac guide](macos.md).

Native checks: `npm run macos:test`. Browser checks: `ALE_PRODUCTION=1 npx playwright test --browser chromium` or `--browser webkit` after installing the corresponding Playwright runtime. The Mac CI workflow runs both and builds the Xcode target. Live MusicKit authorization/subscription playback cannot be tested with transport stubs.
