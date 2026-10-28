# Repository cleanup

The owner requested meaningful folders and a verified GitHub push, with implementation choices delegated earlier in this chat. This is a path/layout refactor; playback behavior stays unchanged.

## Layout

- `src/`: shared React interface and player logic.
- `desktop/macos/` and `desktop/windows/`: platform app projects and native policy checks.
- `scripts/macos/`, `scripts/windows/`, `scripts/apple-music/`, `scripts/dev/`: task-specific tooling.
- `tests/unit/` and `tests/e2e/`: Node regressions and browser scenarios.
- `docs/guides/`, `docs/legal/`, `docs/architecture/`, `docs/plans/`, `docs/images/`: documentation by purpose, with a documentation index.
- `build/web/`, `build/releases/{macos,windows}/`, `build/macos/resources/`, `build/xcode/`, `build/test-results/`: generated files, excluded from Git.
- `local/exports/`, `local/scratch/`, `local/planning/`, `local/research/`: preserved local work, excluded from Git.

Conventional package, TypeScript, Vite, lint and editor configuration stays at the root. Existing npm commands stay the same. Keep the current branch and push the cleanup to the existing remote. The original Documents Xcode project keeps a backup and follows the moved shared sources/resources.

## Execution

1. Move tracked source/tool/test/docs files and preserve local outputs without deleting them.
2. Update imports, project content references, npm scripts, CI paths, documentation links and output locations. Add folder-purpose documentation and ignore generated/local data.
3. Run the existing 22 Node regressions, lint/production build, 23 native Mac policy checks, universal Mac build and both Xcode builds; run production browser checks in Chromium and WebKit. Check local Markdown links and publish only this cleanup's files.
4. Review the full diff, commit, push and verify the remote commit.

Primary risks: scripts resolving the repository root from a new depth; Windows content globs; Xcode source/resource paths; test imports; broken relative documentation links; accidentally publishing unrelated local exports. Verification must cover these boundaries.
