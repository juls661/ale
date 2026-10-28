# Tests

- `unit/`: Node tests for queue/controller behavior, MusicKit adapters, token handling and dependency notice collection. Run `npm test`.
- `e2e/`: Playwright scenarios for real synthesized local audio, keyboard navigation, accessibility and Apple transport/error handling. Run `npm run test:e2e`.

Native policy checks live beside their app projects in `desktop/macos/PolicyTests/` and `desktop/windows/Ale.PolicyTests/`.

Browser traces and failure screenshots go to the ignored `build/test-results/` folder. Browser stubs test transport and error behavior; they do not establish live Apple Music subscription playback. See the [verification record](../docs/verification.md).
