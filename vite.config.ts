import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const csp = [
  "default-src 'self'",
  "script-src 'self' https://js-cdn.music.apple.com 'wasm-unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.mzstatic.com https://*.apple.com",
  "connect-src 'self' https://*.apple.com https://*.mzstatic.com",
  "media-src 'self' blob: https://*.apple.com https://*.mzstatic.com",
  "frame-src 'self' https://*.apple.com",
  "worker-src 'self' blob:",
  "font-src 'self' data: https://*.apple.com",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self' https://*.apple.com",
].join('; ')
export default defineConfig(({ command }) => ({
  base: './',
  plugins: [
    react(),
    ...(command === 'build'
      ? [
          {
            name: 'ale-production-security',
            transformIndexHtml() {
              return [
                {
                  tag: 'meta',
                  attrs: { 'http-equiv': 'Content-Security-Policy', content: csp },
                  injectTo: 'head' as const,
                },
              ]
            },
          },
        ]
      : []),
  ],
  server: { host: '127.0.0.1' },
}))
