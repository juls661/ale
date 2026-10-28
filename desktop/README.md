# Desktop app projects

Both native hosts load the shared frontend from `src/`. They contain platform integration, not a second copy of the React interface.

| Platform | App project                                                  | Native checks              | Build                   |
| -------- | ------------------------------------------------------------ | -------------------------- | ----------------------- |
| macOS    | [Ale.xcodeproj](macos/Ale.xcodeproj) / `macos/AleMac/`       | `macos/PolicyTests/`       | `npm run macos:build`   |
| Windows  | [Ale.Windows.csproj](windows/Ale.Windows/Ale.Windows.csproj) | `windows/Ale.PolicyTests/` | `npm run windows:build` |

Run commands from the repository root. For Xcode, run `npm run macos:prepare` first; generated resources live under `build/macos/resources/`. See the [Mac guide](../docs/guides/macos.md) and [development guide](../docs/guides/development.md).
