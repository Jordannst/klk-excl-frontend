/* eslint-disable @typescript-eslint/no-require-imports -- Node browser checks. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3101'
const out = path.join(__dirname, '../qa/landing')
const passed = []
const check = message => { passed.push(message); console.log('PASS', message) }
const theme = page => page.locator('html').getAttribute('data-landing-theme')
const luminance = rgb => {
  const values = rgb.match(/[\d.]+/g).slice(0, 3).map(Number).map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
  return values[0] * .2126 + values[1] * .7152 + values[2] * .0722
}
async function main() {
  fs.mkdirSync(out, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({ colorScheme: 'dark' })
    const errors = [], apiCalls = []
    await context.route('**/api/**', route => {
      apiCalls.push(route.request().url())
      return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
    })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(base + '/en', { waitUntil: 'networkidle' })
    assert.equal(await theme(page), 'dark')
    assert.equal(await page.evaluate(() => localStorage.getItem('klk_landing_theme')), null)
    await page.emulateMedia({ colorScheme: 'light' })
    await page.waitForFunction(() => document.documentElement.dataset.landingTheme === 'light')
    await page.emulateMedia({ colorScheme: 'dark' })
    await page.waitForFunction(() => document.documentElement.dataset.landingTheme === 'dark')
    check('Fresh visit follows system theme and tracks live system changes without storing an override')
    await page.getByRole('button', { name: 'Use light theme', exact: true }).click()
    assert.equal(await theme(page), 'light')
    await page.reload()
    assert.equal(await theme(page), 'light')
    await page.getByRole('link', { name: 'Bahasa Indonesia', exact: true }).click()
    await page.waitForURL(base + '/id')
    await page.waitForLoadState('load')
    assert.equal(await theme(page), 'light')
    await page.getByRole('button', { name: 'Gunakan tema gelap', exact: true }).focus()
    await page.keyboard.press('Enter')
    assert.equal(await theme(page), 'dark')
    await page.emulateMedia({ colorScheme: 'light' })
    assert.equal(await theme(page), 'dark')
    const second = await context.newPage()
    await second.goto(base + '/en')
    assert.equal(await theme(second), 'dark')
    await page.getByRole('button', { name: 'Ikuti tema sistem', exact: true }).click()
    await page.waitForFunction(() => document.documentElement.dataset.landingTheme === 'light')
    await second.waitForFunction(() => document.documentElement.dataset.landingPreference === 'system')
    assert.equal(await theme(second), 'dark', 'Other tab follows its own system preference')
    await second.close()
    check('Keyboard toggle persists across reload/language, overrides system, syncs tabs and can return to system')
    for (const locale of ['id', 'en']) {
      await page.goto(`${base}/${locale}`)
      await page.emulateMedia({ colorScheme: 'dark' })
      await page.waitForFunction(() => document.documentElement.dataset.landingTheme === 'dark')
      for (const width of [320, 390, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1000 })
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale} overflow ${width}`)
        const boxes = []
        for (const item of await page.locator('header a, header button, header summary').all()) {
          if (!(await item.isVisible())) continue
          const b = await item.boundingBox()
          assert.ok(b.x >= 0 && b.x + b.width <= width + 1, `${locale} clipped navigation ${width}`)
          boxes.push(b)
        }
        boxes.sort((a, b) => a.x - b.x)
        for (let i = 1; i < boxes.length; i++) assert.ok(boxes[i - 1].x + boxes[i - 1].width <= boxes[i].x + 1, `${locale} overlapping controls ${width}`)
        if ([390, 1440].includes(width)) { await page.emulateMedia({ reducedMotion: 'reduce' }); await page.screenshot({ path: path.join(out, `dark-${locale}-${width}.png`), fullPage: true }); await page.emulateMedia({ reducedMotion: 'no-preference' }) }
      }
      const colors = await page.locator('main').evaluate(main => {
        const description = main.querySelector('h1 + p')
        const canvas = getComputedStyle(main.parentElement).backgroundColor
        return { canvas, heading: getComputedStyle(main.querySelector('h1')).color, paragraph: getComputedStyle(description).color }
      })
      for (const foreground of [colors.heading, colors.paragraph]) assert.ok((luminance(foreground) + .05) / (luminance(colors.canvas) + .05) >= 4.5, 'Main text contrast')
      await page.setViewportSize({ width: 390, height: 844 })
      await page.locator('header summary').click()
      assert.equal(await page.locator('header details').getAttribute('open'), '')
      await page.locator('header summary').click()
    }
    assert.deepEqual(apiCalls, [])
    await page.emulateMedia({ reducedMotion: 'reduce' })
    assert.equal(await page.locator('header button svg').first().evaluate(el => getComputedStyle(el).transitionDuration), '0s')
    check('Dark ID/EN at six widths, accessible main-text contrast, mobile menu, reduced motion and zero landing API calls')
    await page.getByRole('link', { name: 'Log in', exact: true }).first().click()
    await page.getByRole('heading', { name: 'Selamat datang kembali' }).waitFor()
    assert.equal(await theme(page), 'dark')
    await page.getByRole('button', { name: 'Gunakan tema terang', exact: true }).click()
    assert.equal(await theme(page), 'light')
    await page.reload()
    await page.getByRole('heading', { name: 'Selamat datang kembali' }).waitFor()
    assert.equal(await theme(page), 'light')
    await page.getByRole('button', { name: 'Ikuti tema sistem', exact: true }).click()
    assert.equal(await theme(page), 'dark')
    await page.waitForFunction(() => getComputedStyle(document.querySelector('h1')).color === 'rgb(250, 249, 245)')
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Login overflow ${width}`)
      if ([390, 1440].includes(width)) await page.screenshot({ path: path.join(out, `login-dark-${width}.png`), fullPage: true })
    }
    await page.getByRole('button', { name: 'Lupa password?' }).click()
    assert.equal(await page.locator('dialog input').first().evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(20, 20, 19)')
    await page.screenshot({ path: path.join(out, 'login-dark-reset.png'), fullPage: true })
    await page.keyboard.press('Escape')
    await page.emulateMedia({ colorScheme: 'light' })
    await page.waitForFunction(() => document.documentElement.dataset.landingTheme === 'light')
    await page.getByRole('link', { name: 'KLK Invoice — Beranda', exact: true }).first().click()
    await page.waitForURL(/\/(id|en)$/)
    assert.equal(await theme(page), 'light')
    const dashboardHTML = await (await context.request.get(base + '/dashboard')).text()
    assert.ok(!dashboardHTML.includes('<html lang="id" data-landing'), 'Workspace remains unthemed')
    assert.deepEqual(errors, [])
    check('Login shares theme, persists override, follows system, fits five widths and themes reset dialog; workspace stays isolated')
    const blocked = await browser.newContext({ colorScheme: 'dark' })
    await blocked.addInitScript(() => {
      Storage.prototype.getItem = () => { throw new Error('Storage blocked') }
      Storage.prototype.setItem = () => { throw new Error('Storage blocked') }
      Storage.prototype.removeItem = () => { throw new Error('Storage blocked') }
    })
    const blockedPage = await blocked.newPage()
    await blockedPage.goto(base + '/en')
    assert.equal(await theme(blockedPage), 'dark')
    await blockedPage.getByRole('button', { name: 'Use light theme', exact: true }).click()
    assert.equal(await theme(blockedPage), 'light')
    await blocked.close()
    const noJS = await browser.newContext({ javaScriptEnabled: false, colorScheme: 'dark' })
    const staticPage = await noJS.newPage()
    await staticPage.goto(base + '/en')
    assert.equal(await staticPage.locator('main').evaluate(el => getComputedStyle(el.parentElement).backgroundColor), 'rgb(20, 20, 19)')
    await noJS.close()
    check('Blocked storage still allows toggling; no-JavaScript visitors get system dark through CSS')
    const beforeHydration = await browser.newContext({ colorScheme: 'dark' })
    await beforeHydration.addInitScript(() => localStorage.setItem('klk_landing_theme', 'light'))
    await beforeHydration.route('**/_next/**/*.js*', route => route.abort())
    const initialPage = await beforeHydration.newPage()
    await initialPage.goto(base + '/en')
    assert.equal(await theme(initialPage), 'light')
    assert.equal(await initialPage.locator('main').evaluate(el => getComputedStyle(el.parentElement).backgroundColor), 'rgb(250, 249, 245)')
    await beforeHydration.close()
    check('Stored override is applied by the head script before React bundles load')
    fs.writeFileSync(path.join(out, 'theme-results.json'), JSON.stringify({ passed, mode: 'Local production build; browser system-theme emulation; login API mocked' }, null, 2))
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exit(1) })
