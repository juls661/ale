# Repository layout

Each top-level folder has one job. Run all npm commands from the repository root.

| Folder             | Contents                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------ |
| `src/`             | Shared React interface, components and playback adapters                                   |
| `desktop/macos/`   | Swift host, Xcode project, app resources and native policy checks                          |
| `desktop/windows/` | .NET/WebView2 host and native policy checks                                                |
| `scripts/`         | Build, packaging, Apple Music and development tools grouped by purpose                     |
| `tests/unit/`      | Node tests for player behavior, tokens, adapters and dependency notices                    |
| `tests/e2e/`       | Browser playback and accessibility scenarios                                               |
| `public/`          | Static assets bundled with the interface                                                   |
| `docs/`            | Guides, policies, architecture, verification and development records                       |
| `.github/`         | CI workflows and contribution instructions                                                 |
| `build/`           | Generated interface, desktop packages, Xcode data and browser test results; ignored by Git |
| `local/`           | Preserved exports, research, scratch files and local planning; ignored by Git              |

## Generated files

| Path                           | Created by / purpose                                              |
| ------------------------------ | ----------------------------------------------------------------- |
| `build/web/`                   | `npm run build`; production frontend                              |
| `build/macos/resources/`       | `npm run macos:prepare`; frontend and notices staged for Xcode    |
| `build/releases/macos/Ale.app` | `npm run macos:build`; universal development app                  |
| `build/releases/windows/`      | `npm run windows:build`; portable Windows package                 |
| `build/releases/archives/`     | Previously generated ZIP packages preserved during cleanup        |
| `build/xcode/`                 | Xcode derived data; the CI project uses `build/xcode/repository/` |
| `build/test-results/`          | Playwright traces and failure screenshots                         |

Local work is separated into `local/exports/`, `local/research/`, `local/scratch/` and `local/planning/`. Those folders are not published. Existing local files were moved, not deleted.

Package manifests and Vite, TypeScript, ESLint, Playwright and editor configuration remain at the root so their tools discover them normally. `node_modules/` stays in its conventional location and is ignored by Git. The npm commands retain their existing names after the cleanup.
