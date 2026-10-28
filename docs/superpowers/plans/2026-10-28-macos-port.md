# Ale macOS Port Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. The owner delegated choices and execution; continue without additional design checkpoints.

**Goal:** Ship a faithful, verifiable macOS developer port alongside Windows.

**Architecture:** Shared React UI in a local WebKit host, with a typed finite native MusicKit bridge. macOS owns permission and credentials; WebKit owns local-file decoding.

**Tech Stack:** React, TypeScript, Swift, AppKit, SwiftUI, WebKit, MusicKit; macOS 14+.

**Spec:** docs/superpowers/specs/2026-10-28-macos-port-design.md

## Global Constraints

- macOS 14+; existing Windows behavior preserved.
- No secrets, private APIs, LAN listeners, audio capture or DRM bypass.
- Exact main-frame bridge trust and bounded bundle-resource resolution.
- Original Ale interface and branding; package exact installed frontend licenses.
- Push verified major milestones to origin on codex/macos-port.

## Review Focus

- Malicious URL traversal, spoofed origins and subframe messages must be rejected.
- Denied authorization and failed playback must not report connection/playback success.
- Late native state replies must not restart or advance a stopped/newer track.
- Apple playback must expose native volume limits honestly; local volume stays functional.
- Missing resources/notices and failed build commands must fail packaging rather than publish an incomplete app.

### Task 1: Native host and bounded bridge

**Files:** macos/AleMac/*.swift, macos/PolicyTests/main.swift, scripts/build-macos.mjs, scripts/test-macos.mjs, package.json, vite.config.ts.

**Interfaces:** `NativeMusicBridge` handles `connect`, `disconnect`, `search`, `library`, `play`, `resume`, `pause`, `stop`, `seek`, `status`; WebKit replies contain JSON objects. Native tracks match the existing Track type. `NavigationPolicy` validates local URLs, external Apple links and resource paths.

- [x] Write native security checks with literal allowed/denied URL and traversal fixtures; run and observe failure before implementation.
- [x] Implement the Swift host, resource handler, permission boundary and native MusicKit adapter.
- [x] Add relative frontend bundle paths and reproducible unsigned development app packaging with frontend notices.
- [x] Run native checks and compile the complete host; inspect packaged resources.

### Task 2: Shared frontend Mac adapter

**Files:** src/player/native.ts, src/player/service.ts, src/player/controller.ts, src/App.tsx, tests/native.test.ts, tests/app.spec.ts.

**Interfaces:** `MusicService` preserves the existing AppleMusicService contract. `NativeAppleMusicService` maps bridge commands to that contract. `createMusicService()` selects the native adapter only when the host bridge exists.

- [x] Test denied authorization, playback failure, state/ended delivery, stale reply isolation and disconnect handling; observe RED.
- [x] Implement the adapter and platform selection, keeping the Windows SDK path intact.
- [x] Update Mac connection/privacy/accessibility/volume copy and controls.
- [x] Run unit/lint/build, production browser checks and native compile; commit and push the working port.

### Task 3: Repository presentation, release record and integration

**Files:** README.md, docs/macos.md, docs/privacy.md, docs/compliance.md, docs/verification.md, THIRD_PARTY_NOTICES.md, .github/workflows/macos.yml, .gitignore.

- [x] Document Mac setup, the owner-created Xcode integration and exact verification limits.
- [x] Add Mac build CI and ignore generated Xcode user/build state.
- [x] Review full diff and native trust/lifecycle boundaries; resolve significant findings with regression coverage.
- [x] Run final checks, update the verification record, commit and push the documentation milestone.
