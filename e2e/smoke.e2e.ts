import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Browser } from 'playwright'
import { BASE, clickText, finishSetup, launch, logNote, newProfile, pageText } from './helpers'

// Smoke tests (F9): the note path and the backup round trip, in a real browser.
// Run with `npm run e2e`; the dev server must be running, or set E2E_URL to a preview build.
let browser: Browser
beforeAll(async () => {
  browser = await launch()
}, 120000)
afterAll(async () => {
  await browser?.close()
})

describe('smoke', () => {
  it('a note logged on Track shows on Timeline', async () => {
    const { context, page } = await newProfile(browser)
    try {
      await finishSetup(page)
      await logNote(page, 'Smoke note one')
      await page.goto(`${BASE}/timeline`, { waitUntil: 'load', timeout: 120000 })
      await page.waitForTimeout(5000)
      expect(await pageText(page)).toContain('Smoke note one')
    } finally {
      await context.close()
    }
  }, 180000)

  it('a backup restores into a new profile with its notes', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'nomie-e2e-'))
    const file = join(dir, 'backup.json')

    // 1. back up a profile that has a note
    const first = await newProfile(browser)
    try {
      await finishSetup(first.page)
      await logNote(first.page, 'Smoke note two')
      await first.page.goto(`${BASE}/settings`, { waitUntil: 'load', timeout: 120000 })
      await first.page.waitForTimeout(5000)
      const download = first.page.waitForEvent('download', { timeout: 30000 })
      await first.page.getByText('Back up now', { exact: true }).first().click()
      await first.page.waitForTimeout(1500)
      await clickText(first.page, 'Ok')
      const d = await download
      await d.saveAs(file)
    } finally {
      await first.context.close()
    }

    // 2. restore it into a profile with no data
    const second = await newProfile(browser)
    try {
      await finishSetup(second.page)
      await second.page.goto(`${BASE}/settings`, { waitUntil: 'load', timeout: 120000 })
      await second.page.waitForTimeout(5000)
      await second.page.getByText('Import Data', { exact: true }).first().click()
      await second.page.waitForTimeout(2000)
      const chooser = second.page.waitForEvent('filechooser', { timeout: 15000 })
      await second.page.getByText('Select File...', { exact: false }).first().click()
      await (await chooser).setFiles(file)
      await second.page.waitForTimeout(3000)
      await clickText(second.page, 'Ok') // Restore backup?
      await second.page.waitForTimeout(1500)
      if ((await pageText(second.page)).includes('Keep this device')) {
        await second.page.evaluate(() => [...document.querySelectorAll('button,div,span')].filter((e) => e.childElementCount === 0 && /^Keep this device/.test(e.textContent?.trim() ?? '')).pop()?.click())
        await second.page.waitForTimeout(1500)
      }
      await clickText(second.page, 'Ok') // Successfully restored
      await second.page.waitForTimeout(3000)
      await second.page.goto(`${BASE}/timeline`, { waitUntil: 'load', timeout: 120000 })
      await second.page.waitForTimeout(5000)
      expect(await pageText(second.page)).toContain('Smoke note two')
    } finally {
      await second.context.close()
    }
  }, 300000)
})
