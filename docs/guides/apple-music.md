# Connect Apple Music

[← Back to Ale](../../README.md)

Ale uses Apple’s official MusicKit JS SDK for authorization and streaming. You need an Apple Developer account, a MusicKit media identifier/private key, and an active Apple Music subscription for full tracks. Real subscription playback in the Windows host still needs verification.

## Create your developer token

1. In your Apple Developer account, [create a MusicKit media identifier and private key](https://developer.apple.com/help/account/capabilities/create-a-media-identifier-and-private-key).
2. Keep the downloaded `.p8` signing key **outside this repository**. Note the 10-character Team ID and Key ID.
3. From the repository root (or the extracted Windows package, which includes the standalone helper), use Node.js 24 to generate a signed developer JWT locally:

   ```sh
   node scripts/apple-music/developer-token.mjs TEAMID1234 KEYID12345 /absolute/path/to/AuthKey.p8
   ```

   Replace the example identifiers and path with your own. The helper makes no network request; it prints a signed token valid for 30 days. Keep the token private. Do not commit it or paste it into chat or GitHub issues.

You can generate the token on your Mac and enter the signed token into Ale on Windows. The private key does not need to leave your Mac. Generate a new token when the old one expires; no rented server is required for this personal setup.

## Sign in

1. Open **Ale → Settings**.
2. Paste the signed JWT into **Developer token**.
3. Choose **Connect to Apple Music**, then complete authorization in Apple’s window.
4. Search for a song and press its play button.

Ale does not ask for your Apple password directly. Never paste the `.p8` key into the token field. The developer token is kept in Ale’s application memory for the session; Apple’s SDK may manage its own retained browser state.

## First test on Windows

- First confirm that a local audio file plays through your PC speakers.
- Sign in and play a full Apple Music track, including beyond the preview portion.
- Try pause/resume, seek, previous/next, queue, volume, and mute.
- Check that playback never overlaps when switching between local files and Apple Music.
- Check the library. This preview reads the first 100 library songs and plays catalog-backed items; uploaded-only songs and pagination are not implemented.

If protected playback fails in the Windows app, run `npm run dev` on Windows and try the same frontend in Microsoft Edge. Record the Windows version, WebView2 version, error message, and whether Edge works. Do not include credentials in the report. Browser success alone does not verify WebView2 playback. No DRM bypass or replacement decryption component is included.

## Disconnect and clear data

- **Disconnect Apple Music** asks MusicKit to stop and deauthorize.
- **Clear Ale data** stops playback, releases selected local files, removes the queue and clears Ale’s origin storage.
- **Clear Apple browser session & close** in the desktop app clears the entire dedicated Ale WebView2 profile and closes Ale.

Apple may retain sign-in in another browser context. See the [privacy notice](../legal/privacy.md) for profile location, retention and manual clearing instructions.
