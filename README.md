<div align="center">

![Ale — Your music. Your space.](docs/images/banner.svg)

**A Cider-inspired music player with its own name, code, and character.**

![Status: developer preview](https://img.shields.io/badge/status-developer_preview-EFB17D?style=flat-square&labelColor=20261B)
![Platform: Windows 11 x64](https://img.shields.io/badge/platform-Windows_11_x64-C9D8B5?style=flat-square&labelColor=20261B)
![React and TypeScript](https://img.shields.io/badge/interface-React_%2B_TypeScript-C9D8B5?style=flat-square&labelColor=20261B)
![.NET 10 and WebView2](https://img.shields.io/badge/desktop-.NET_10_%2B_WebView2-C9D8B5?style=flat-square&labelColor=20261B)

[Get started](#get-started) · [Apple Music setup](docs/apple-music.md) · [Build & test](docs/development.md) · [Privacy](docs/privacy.md)

</div>

---

Ale brings local audio and an official Apple Music® integration into a quiet, focused Windows app. It is built with React and TypeScript, hosted in a dedicated .NET / WebView2 desktop window, and can be developed on a Mac.

> [!IMPORTANT]
> **This is a developer preview.** Local audio playback has been tested in a browser, and the Windows executable compiles. Real Windows startup, Apple sign-in, and full protected Apple Music playback still need testing on a Windows PC. The native iPhone remote is planned for a later milestone.

![Ale desktop interface showing the listening space and playback controls](docs/images/ale-desktop.png)

## What’s inside

| Your music                                          | Your listening space                                         |
| --------------------------------------------------- | ------------------------------------------------------------ |
| Open local MP3, WAV, M4A, AAC, OGG, and FLAC files¹ | Play, pause, seek, skip, and adjust volume                   |
| Connect through Apple’s official MusicKit sign-in   | Queue tracks, shuffle, and repeat                            |
| Search the Apple Music catalog                      | Keyboard controls, visible focus, and screen-reader labels   |
| Browse catalog-backed songs from your library²      | Reduced motion, responsive layout, and high-contrast support |
| Keep local files on your computer                   | No Ale accounts, ads, analytics, or rented server            |

¹ Format support depends on the playback runtime. ² The preview reads the first 100 library songs and plays catalog-backed items; uploaded-only songs and pagination are not implemented.

## Get started

### Run the Windows preview

Build from source using the instructions below, or use an Actions artifact if one has been generated for the commit you want to test. A build workflow is included; no published release is promised by this README.

If you already have `Ale-win-x64-preview.zip` from a local build:

1. Transfer it to your **Windows 11 x64** PC.
2. Extract the **entire folder**; keep `wwwroot` and the DLLs beside `Ale.exe`.
3. Open **Ale.exe**, choose **Open files**, and try an unprotected audio file you own.
4. Follow the [Apple Music setup guide](docs/apple-music.md) to connect your account.

The [.NET runtime](https://dotnet.microsoft.com/download/dotnet/10.0) is bundled in the Windows build. The playback PC needs [Microsoft WebView2 Evergreen Runtime](https://developer.microsoft.com/microsoft-edge/webview2/). This preview is unsigned; follow your Windows and organization security policies.

### Run from source

Requires **Node.js 24**. Run these commands from the repository root:

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. This starts the interface in a browser; it does not launch the Windows executable.

<details>
<summary><strong>Build a dedicated Windows app</strong></summary>

Install the **.NET 10 SDK** on your build machine, then run:

```sh
npm run windows:build
```

The script builds the frontend, checks the native navigation policy, publishes the self-contained Windows x64 app, and gathers dependency notices into:

```text
release/Ale-win-x64/
```

Building on macOS is supported; running the resulting executable requires Windows. Apple credentials are not needed to compile. See the [development guide](docs/development.md) for requirements, commands, and CI details.

</details>

<details>
<summary><strong>Connect Apple Music</strong></summary>

You need an **Apple Developer account**, a MusicKit media identifier/private key, and an **active Apple Music subscription** for full tracks.

Generate a signed developer token locally, then enter it in **Ale → Settings → Developer token**. Finish authentication in Apple’s own window.

**Never commit a token or private key, and never paste your `.p8` signing key into Ale or an issue.** The [Apple Music guide](docs/apple-music.md) walks through setup, token generation, and the first Windows playback test.

</details>

## Built with care, still a preview

The initial verification record includes **14 unit tests, 8 production browser tests, and 12 native navigation-policy checks**. Tested Home, Settings, and Local files screens reported no axe violations for the selected WCAG rule tags at desktop and narrow widths. These are recorded test results, not a live CI badge or a full accessibility audit.

Real Windows playback, Apple’s own dialogs, Narrator, display scaling, and release-specific legal requirements remain open checks. Read the [verification record](docs/verification.md) and [compliance/release checklist](docs/compliance.md) for the exact limits.

## Vibe-code disclaimer

**Yes, Ale is vibe-coded.** This personal project was built with substantial AI assistance for implementation, documentation, and tests, including an AI code-review pass.

AI-generated code can contain mistakes, fragile assumptions, and security or accessibility problems. Passing tests does not establish that every feature works on every machine, and this project has not received a full human security, accessibility, or legal audit. Treat it as experimental software, review changes before relying on them, and report reproducible problems without sharing secrets. This disclosure does not waive legal obligations or establish that the output is non-infringing.

## Around the repository

```text
ale/
├── .github/          Windows build workflow and contribution guide
├── docs/             Setup guides, privacy, verification, and release review
│   └── images/       Original README banner and interface screenshot
├── public/           Ale’s original SVG app mark
├── scripts/          Windows packaging and local token generation
│   └── dev/          Development-only UI inspection helper
├── src/              React interface, components, and playback adapters
├── tests/            Unit, playback, and accessibility tests
└── windows/          Native Windows host and navigation-policy checks
```

Dependencies, build outputs, test reports, private keys, environment files, and local planning notes are excluded from Git. Standard Vite, TypeScript, lint, and formatting configuration stays at the root for tool discovery.

## Contributing

Small, focused fixes are welcome. Include reproduction steps, the affected platform, and relevant test results. For Apple Music issues, explain whether the failure occurs in Edge, the Windows app, or both. **Do not attach developer tokens, passwords, private keys, or browser profiles.**

See the [contribution guide](.github/CONTRIBUTING.md) for the development workflow.

## Credits & licensing

Ale is inspired by Cider’s purpose, with original Ale source, branding, and artwork. No Cider source, assets, binaries, or tokens are included. Ale is not affiliated with Apple or Cider. Apple and Apple Music are trademarks of Apple Inc., registered in the U.S. and other countries.

A license for **Ale’s own source code has not been selected yet**; do not assume an open-source license. Third-party terms and notices are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and included with packaged builds.

---

<div align="center">

**Less noise. More feeling.**

[Privacy](docs/privacy.md) · [Verification](docs/verification.md) · [Release review](docs/compliance.md)

</div>
