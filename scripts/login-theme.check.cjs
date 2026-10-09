/* eslint-disable @typescript-eslint/no-require-imports -- Node browser checks. */
const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3101'
const theme = page => page.locator('html').getAttribute('data-landing-theme')

async function main() {
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({ colorScheme: 'dark', reducedMotion: 'reduce' })
    await context.route('**/api/**', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }))
    const page = await context.newPage(), errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(base, { waitUntil: 'networkidle' })
    assert.equal(page.url(), base + '/login')
    assert.equal(await theme(page), 'dark')
    await page.emulateMedia({ colorScheme: 'light' })
    await page.waitForFunction(() => document.documentElement.dataset.landingTheme === 'light')
    await page.getByRole('button', { name: 'Gunakan tema gelap', exact: true }).focus()
    await page.keyboard.press('Enter')
    assert.equal(await theme(page), 'dark')
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await theme(page), 'dark')
    const second = await context.newPage()
    await second.goto(base + '/login')
    await second.waitForFunction(() => document.querySelector('button[aria-label="Gunakan tema terang"]:not(:disabled)'))
    await page.getByRole('button', { name: 'Ikuti tema sistem', exact: true }).click()
    assert.equal(await theme(page), 'light')
    await second.waitForFunction(() => document.documentElement.dataset.landingPreference === 'system')
    assert.equal(await theme(second), 'dark')
    await second.close()
    console.log('PASS Login follows system; keyboard override persists on reload and syncs across tabs')
    for (const colorScheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' })
      await page.waitForFunction(value => document.documentElement.dataset.landingTheme === value, colorScheme)
      for (const width of [320, 390, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1000 })
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${colorScheme} overflow ${width}`)
        if (width > 900) {
          const panel = await page.locator('aside').boundingBox()
          assert.equal(panel.x, 0); assert.equal(panel.y, 0)
        }
      }
      await page.getByRole('button', { name: 'Lupa password?' }).click()
      assert.equal(await page.locator('dialog input').first().evaluate(el => getComputedStyle(el).backgroundColor), colorScheme === 'dark' ? 'rgb(8, 15, 28)' : 'rgb(255, 255, 255)')
      await page.keyboard.press('Escape')
      assert.equal(await page.locator('button svg').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s')
    }
    assert.deepEqual(errors, [])
    console.log('PASS Both themes fit six widths; panel touches top/left; reset dialog and reduced motion work')
    const blocked = await browser.newContext({ colorScheme: 'dark' })
    await blocked.route('**/api/**', route => route.fulfill({ status: 401, body: '{}' }))
    await blocked.addInitScript(() => {
      Storage.prototype.getItem = () => { throw new Error('Storage blocked') }
      Storage.prototype.setItem = () => { throw new Error('Storage blocked') }
    })
    const blockedPage = await blocked.newPage()
    await blockedPage.goto(base + '/login')
    assert.equal(await theme(blockedPage), 'dark')
    await blockedPage.getByRole('button', { name: 'Gunakan tema terang', exact: true }).click()
    assert.equal(await theme(blockedPage), 'light')
    await blocked.close()
    const boot = await browser.newContext({ colorScheme: 'dark' })
    await boot.addInitScript(() => localStorage.setItem('klk_landing_theme', 'light'))
    await boot.route('**/_next/**/*.js*', route => route.abort())
    const initial = await boot.newPage()
    await initial.goto(base + '/login')
    assert.equal(await theme(initial), 'light')
    await boot.close()
    console.log('PASS Blocked storage permits toggling; stored preference applies before hydration')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exit(1) })
