# Contributing to Ale

Thanks for helping improve Ale. It is an experimental personal project built with substantial AI assistance. Please review generated changes and test their actual behavior; a test run or AI review is not a substitute for human judgment.

## Work locally

Use Node.js 24. See the [development guide](../docs/guides/development.md) for .NET and Windows requirements.

```sh
npm ci
npx playwright install chromium
npm run dev
```

Before proposing code changes:

```sh
npm run check
npm run format:check
```

For Windows host or packaging changes, also run `npm run windows:build` and describe what was tested on a real Windows PC. Keep changes focused and include regression coverage for meaningful behavior changes.

## Report a problem

Include reproduction steps, expected and actual behavior, Ale version/commit, OS, and relevant error text. For Apple Music issues, include whether Edge and the Windows app behave differently and the WebView2 version if available.

**Never include tokens, passwords, signing keys, browser profiles or private music files.** Use an original or otherwise shareable test fixture if an audio sample is necessary. Do not publish sensitive vulnerability details or exploit material in a public issue; an official private reporting contact has not been configured yet.

## Source and licenses

Do not copy Cider source, assets or proprietary components into Ale without first reviewing the exact license and obtaining any necessary permission. Preserve third-party notices. There is not yet an open-source license selected for Ale’s own source; public source visibility should not be treated as permission to redistribute it.
