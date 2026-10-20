// Takes screenshots of the main screens, in light and dark mode, at phone and desktop width.
// Usage: node scripts/ui-screenshots.mjs [outputDir] [baseUrl]
// Defaults: outputDir = ./screenshots, baseUrl = http://localhost:5001
// Note: a fresh browser profile has no data, so screens show their empty states.
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const outDir = process.argv[2] || 'screenshots'
const baseUrl = process.argv[3] || 'http://localhost:5001'

const screens = ['/track', '/timeline', '/dashboard', '/goals', '/experiments', '/settings']
const viewports = {
  phone: { width: 390, height: 844 },
  desktop: { width: 1280, height: 800 },
}
const schemes = ['light', 'dark']

mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()

for (const [viewportName, size] of Object.entries(viewports)) {
  for (const scheme of schemes) {
    const context = await browser.newContext({ viewport: size, colorScheme: scheme })
    const page = await context.newPage()
    for (const route of screens) {
      const name = `${viewportName}-${scheme}-${route.replace(/\//g, '') || 'home'}.png`
      try {
        await page.goto(baseUrl + route, { waitUntil: 'networkidle', timeout: 30000 })
        await page.waitForTimeout(1000)
        await page.screenshot({ path: join(outDir, name) })
        console.log('saved', name)
      } catch (e) {
        console.error('failed', name, e.message)
      }
    }
    await context.close()
  }
}
await browser.close()
