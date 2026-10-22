// Browser helpers for the end-to-end smoke tests. They drive the real app with the playwright library.
// E2E_URL picks the server: the dev server by default, or a preview build in CI.
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'

export const BASE = process.env.E2E_URL || 'http://localhost:5001'

export const launch = (): Promise<Browser> => chromium.launch()

/** A new profile with no data: every test starts from the first launch. */
export const newProfile = async (browser: Browser): Promise<{ context: BrowserContext; page: Page }> => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block',
    acceptDownloads: true,
  })
  const page = await context.newPage()
  return { context, page }
}

/** Clicks the last element whose own text is exactly `text`. Returns false when nothing matched. */
export const clickText = (page: Page, text: string): Promise<boolean> =>
  page.evaluate((t) => {
    const el = [...document.querySelectorAll('button,div,span,a')]
      .filter((e) => e.childElementCount === 0 && e.textContent?.trim() === t)
      .pop() as HTMLElement | undefined
    if (!el) return false
    el.click()
    return true
  }, text)

export const pageText = (page: Page): Promise<string> => page.evaluate(() => document.body.innerText)

/** Walks the first-launch setup with the default choices (Local Only, no account). */
export const finishSetup = async (page: Page): Promise<void> => {
  await page.goto(`${BASE}/`, { waitUntil: 'load', timeout: 120000 })
  await page.waitForTimeout(6000)
  for (let i = 0; i < 8; i++) {
    const text = await pageText(page)
    if (/Where would you like/.test(text)) {
      await page.getByText('Local Only', { exact: true }).first().click().catch(() => {})
    }
    const next = page.getByRole('button', { name: /^(Next|Skip|Begin)/ }).first()
    if (!(await next.count())) break
    await next.click().catch(() => {})
    await page.waitForTimeout(1200)
  }
}

/** Saves a plain note on Track. */
export const logNote = async (page: Page, note: string): Promise<void> => {
  await page.goto(`${BASE}/track`, { waitUntil: 'load', timeout: 120000 })
  await page.waitForTimeout(4000)
  const box = page.locator('textarea').first()
  await box.click()
  await box.fill(note)
  await page.waitForTimeout(800)
  await clickText(page, 'Save')
  await page.waitForTimeout(2000)
}
