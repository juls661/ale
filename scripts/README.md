# Project tools

Use the npm commands from the repository root; each script resolves paths from its own location.

| Folder         | Tool                                                             | Command                                                    |
| -------------- | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| `macos/`       | Stage Xcode resources                                            | `npm run macos:prepare`                                    |
| `macos/`       | Check native navigation/resource policy                          | `npm run macos:test`                                       |
| `macos/`       | Compile and package the universal app                            | `npm run macos:build`                                      |
| `windows/`     | Compile/package the host and collect exact runtime notices       | `npm run windows:build`                                    |
| `apple-music/` | Generate a session developer JWT locally for Windows/browser use | See the [Apple Music guide](../docs/guides/apple-music.md) |
| `dev/`         | Inspect the shared UI and capture screenshots                    | `npm run screenshots`                                      |

Build output belongs under `build/`. These tools do not modify the shared player implementation.
