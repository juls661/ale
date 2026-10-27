import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
function wav(seconds = 4) {
  const samples = seconds * 8000,
    b = Buffer.alloc(44 + samples * 2)
  b.write('RIFF')
  b.writeUInt32LE(b.length - 8, 4)
  b.write('WAVEfmt ', 8)
  b.writeUInt32LE(16, 16)
  b.writeUInt16LE(1, 20)
  b.writeUInt16LE(1, 22)
  b.writeUInt32LE(8000, 24)
  b.writeUInt32LE(16000, 28)
  b.writeUInt16LE(2, 32)
  b.writeUInt16LE(16, 34)
  b.write('data', 36)
  b.writeUInt32LE(samples * 2, 40)
  for (let i = 0; i < samples; i++)
    b.writeInt16LE(Math.sin((i * 2 * Math.PI * 220) / 8000) * 1000, 44 + i * 2)
  return b
}
test.beforeEach(async ({ page }) => {
  await page.goto('/')
})
test('local files really play, pause, seek, advance and clear', async ({ page }) => {
  await page.locator('input[type=file]').setInputFiles([
    { name: 'First.wav', mimeType: 'audio/wav', buffer: wav() },
    { name: 'Second.wav', mimeType: 'audio/wav', buffer: wav() },
  ])
  await page.getByRole('button', { name: 'Play First', exact: true }).first().click()
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeEnabled()
  await expect
    .poll(() => page.getByRole('slider', { name: 'Playback position' }).inputValue())
    .not.toBe('0')
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeEnabled()
  await page.getByRole('slider', { name: 'Playback position' }).fill('2')
  await expect(page.getByRole('slider', { name: 'Playback position' })).toHaveValue('2')
  await page.getByRole('button', { name: 'Next track', exact: true }).click()
  await expect(page.getByTestId('now-playing')).toContainText('Second')
  await page.getByRole('button', { name: 'Show queue', exact: true }).click()
  await page.getByRole('button', { name: 'Clear queue', exact: true }).click()
  await expect(page.getByTestId('now-playing')).toContainText('Nothing playing')
})
test('private-key input shows an error without requesting Apple', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (r) => {
    if (r.url().includes('apple.com')) requests.push(r.url())
  })
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByLabel('Developer token').fill('-----BEGIN PRIVATE KEY-----')
  await page.getByRole('button', { name: 'Connect to Apple Music', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('private key')
  expect(requests).toEqual([])
})
test('settings reset removes local selections and storage', async ({ page }) => {
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'Personal.wav', mimeType: 'audio/wav', buffer: wav() })
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByRole('button', { name: 'Clear Ale data', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('cleared')
  await page.getByRole('button', { name: 'Local files', exact: true }).click()
  await expect(page.getByText('Personal', { exact: true })).toHaveCount(0)
})
test('home, settings and narrow layout pass automated WCAG checks', async ({ page }) => {
  for (const view of ['Home', 'Settings', 'Local files']) {
    await page.getByRole('button', { name: view, exact: true }).click()
    const a = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze()
    expect(a.violations).toEqual([])
  }
  await page.setViewportSize({ width: 390, height: 844 })
  for (const view of ['Home', 'Settings', 'Local files']) {
    await page.getByRole('button', { name: view, exact: true }).click()
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze()
      ).violations,
    ).toEqual([])
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})
test('keyboard skip link reaches main content', async ({ page }) => {
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
})

async function mockApple(page: import('@playwright/test').Page, failPlayback = false) {
  await page.addInitScript(
    ({ failPlayback }) => {
      const listeners: Record<string, ((event: { state?: number }) => void)[]> = {}
      const instance = {
        isAuthorized: false,
        storefrontId: 'gb',
        isPlaying: false,
        volume: 0.7,
        currentPlaybackTime: 0,
        currentPlaybackDuration: 180,
        authorize: async () => {
          instance.isAuthorized = true
          return 'test-user-token'
        },
        unauthorize: async () => {
          instance.isAuthorized = false
        },
        api: {
          music: async (_path: string, params?: Record<string, string | number>) => {
            const term = String(params?.term ?? 'Library')
            if (term === 'Old') await new Promise((r) => setTimeout(r, 600))
            const items = [
              {
                id: '123',
                attributes: {
                  name: `${term} song`,
                  artistName: 'Test artist',
                  durationInMillis: 180000,
                  url: 'https://music.apple.com/gb/song/123',
                },
              },
            ]
            return { data: { results: { songs: { data: items } }, data: items } }
          },
        },
        setQueue: async () => {},
        play: async () => {
          if (failPlayback) throw new Error('Protected playback is unavailable')
          instance.isPlaying = true
          listeners.playbackStateDidChange?.forEach((f) => f({ state: 2 }))
        },
        pause: () => {
          instance.isPlaying = false
        },
        stop: () => {
          instance.isPlaying = false
        },
        seekToTime: async (t: number) => {
          instance.currentPlaybackTime = t
        },
        addEventListener: (name: string, listener: (event: { state?: number }) => void) => {
          ;(listeners[name] ??= []).push(listener)
        },
        removeEventListener: () => {},
      }
      window.MusicKit = { configure: async () => instance }
    },
    { failPlayback },
  )
  await page.reload()
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  const jwt = `${btoa('{"alg":"ES256"}')}.${btoa('{"exp":4102444800,"iss":"TEAM"}')}.test`
  await page.getByLabel('Developer token').fill(jwt)
  await page.getByRole('button', { name: 'Connect to Apple Music', exact: true }).click()
  await expect(page.getByText('Connected to Apple Music', { exact: true })).toBeVisible()
}
test('Apple SDK failures never show fake playback', async ({ page }) => {
  await mockApple(page, true)
  await page.getByRole('searchbox', { name: 'Search Apple Music' }).fill('New')
  await page.getByRole('button', { name: 'Submit search' }).click()
  await page.getByRole('button', { name: 'Play New song', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Protected playback is unavailable')
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeEnabled()
})
test('late search results cannot replace the current query', async ({ page }) => {
  await mockApple(page)
  await page.getByRole('searchbox', { name: 'Search Apple Music' }).fill('Old')
  await page.getByRole('button', { name: 'Submit search' }).click()
  await page.getByRole('searchbox', { name: 'Search Apple Music' }).fill('New')
  await page.getByRole('button', { name: 'Submit search' }).click()
  await expect(page.getByRole('button', { name: 'Play New song', exact: true })).toBeVisible()
  // Wait for the deliberately delayed SDK response, then assert current UI remains correct.
  await expect
    .poll(async () => {
      await new Promise((r) => setTimeout(r, 650))
      return page.getByRole('button', { name: 'Play New song', exact: true }).count()
    })
    .toBe(1)
  await expect(page.getByRole('button', { name: 'Play Old song', exact: true })).toHaveCount(0)
})
test('volume stays available at narrow widths and failed connection does not stop local playback', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('slider', { name: 'Volume' })).toBeVisible()
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'Local.wav', mimeType: 'audio/wav', buffer: wav(15) })
  await page.getByRole('button', { name: 'Play Local', exact: true }).click()
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await page.getByLabel('Developer token').fill('invalid')
  await page.getByRole('button', { name: 'Connect to Apple Music', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeEnabled()
})
