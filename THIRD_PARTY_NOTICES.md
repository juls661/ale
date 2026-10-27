# Ale third-party notices

Ale is original software inspired by the purpose of Cider; no Cider code, logo, assets or proprietary components are included. Apple and Apple Music are trademarks of Apple Inc., registered in the U.S. and other countries. Ale is not affiliated with Apple or Cider.

The packaged frontend uses React, React DOM and Scheduler (Meta Platforms, Inc. and affiliates; MIT). Complete license texts are included in the package's licenses directory, generated directly from the installed dependency packages.

The Windows host uses Microsoft .NET and Microsoft Edge WebView2 SDK under their respective license terms. WebView2 Evergreen is obtained separately from Microsoft; its runtime is not bundled. Package generation reads the published Ale.deps.json and includes the license/notice files from the exact .NET Runtime, Windows Desktop Runtime and WebView2 SDK NuGet versions shipped. The native-license-manifest.json file records those versions, filenames and SHA-256 hashes. SDK notices are not substituted for runtime notices.

MusicKit JS is loaded on request from Apple, not redistributed in the Ale frontend. Its use is governed by Apple's developer/service terms and Apple Music identity requirements. A valid developer token and user authorization are required. Ale includes no music recordings, album covers or fonts obtained from third parties. The record illustration and icon are original CSS/SVG; system fonts are used.

Development-only tools and their licenses remain documented in package-lock.json and their installed package LICENSE files. They are not included in the Windows wwwroot bundle.
