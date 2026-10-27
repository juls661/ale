import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const output = resolve(process.env.ALE_SCREENSHOT_DIR || join(tmpdir(), 'ale-screenshots'))
mkdirSync(output, { recursive: true })
const browser = await chromium.launch()
try {
  const page = await browser.newPage({ viewport: { width: 1365, height: 1080 } })
  const failures = []
  const screenshots = []
  const capture = async (name, fullPage = false) => {
    const path = join(output, name)
    await page.screenshot({ path, fullPage })
    screenshots.push(path)
  }
  page.on('pageerror', (error) => failures.push(error.message))
  await page.goto(process.env.ALE_PREVIEW_URL || 'http://127.0.0.1:5173')
  await capture('ale-desktop.png')
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await capture('ale-settings.png', true)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await capture('ale-narrow.png', true)
  console.log(JSON.stringify({ pageErrors: failures, screenshots }))
  if (failures.length) process.exitCode = 1
} finally {
  await browser.close()
}
