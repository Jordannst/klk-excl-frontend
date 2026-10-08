/* eslint-disable @typescript-eslint/no-require-imports -- Node browser test harness. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3101'
const out = path.join(__dirname, '../qa/landing')
const passed = []
const check = message => { passed.push(message); console.log('PASS', message) }

async function main() {
  fs.mkdirSync(out, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({ locale: 'en-US' })
    for (const [name, headers, locale] of [
      ['Indonesia overrides browser English', { 'x-vercel-ip-country': 'ID', 'accept-language': 'en-US' }, 'id'],
      ['Outside Indonesia overrides browser Indonesian', { 'x-vercel-ip-country': 'US', 'accept-language': 'id-ID' }, 'en'],
      ['Manual English overrides Indonesia', { cookie: 'klk_landing_locale=en', 'x-vercel-ip-country': 'ID' }, 'en'],
      ['Manual Indonesian overrides outside Indonesia', { cookie: 'klk_landing_locale=id', 'x-vercel-ip-country': 'GB' }, 'id'],
      ['Invalid preference ignored', { cookie: 'klk_landing_locale=fr', 'x-vercel-ip-country': 'ID' }, 'id'],
      ['Missing country uses browser Indonesian', { 'accept-language': 'id-ID,id;q=0.9,en;q=0.5' }, 'id'],
      ['Quality ordering', { 'accept-language': 'en;q=0.3,id;q=0.9' }, 'id'],
      ['Zero quality ignored', { 'accept-language': 'id;q=0,en;q=0.5' }, 'en'],
      ['Unknown country falls back', { 'x-vercel-ip-country': 'XX', 'accept-language': 'id-ID' }, 'id'],
      ['Malformed country falls back', { 'x-vercel-ip-country': 'invalid', 'accept-language': 'id' }, 'id'],
      ['Unsupported browser language defaults English', { 'accept-language': 'ja-JP' }, 'en'],
      ['No language defaults English', { 'accept-language': '' }, 'en'],
      ['Invalid quality ignored', { 'accept-language': 'id;q=garbage,en;q=0.5' }, 'en'],
    ]) {
      const response = await context.request.get(base + '/?utm_source=qa', { headers, maxRedirects: 0 })
      assert.equal(response.status(), 307, name)
      assert.equal(response.headers().location, `/${locale}?utm_source=qa`, name)
      assert.match(response.headers()['cache-control'], /private.*no-store/, name)
      assert.match(response.headers().vary, /Cookie/)
      assert.equal(response.headers()['set-cookie'], undefined, 'Automatic detection does not overwrite manual preference')
    }
    check('13 detection cases: cookie, country, weighted browser fallback, invalid input and cache isolation')
    const page = await context.newPage(), apiCalls = [], errors = []
    page.on('pageerror', error => errors.push(error.message))
    await context.route('**/api/**', route => {
      apiCalls.push(route.request().url())
      return route.fulfill({ status: 401, contentType: 'application/json', body: '{}' })
    })
    for (const locale of ['id', 'en']) {
      await context.setExtraHTTPHeaders({ 'x-vercel-ip-country': locale === 'id' ? 'US' : 'ID' })
      const response = await page.goto(`${base}/${locale}`, { waitUntil: 'networkidle' })
      assert.equal(response.status(), 200)
      assert.match(await response.text(), new RegExp(`<html[^>]*lang="${locale}"`), 'Correct language in server HTML')
      assert.equal(await page.locator('html').getAttribute('lang'), locale)
      assert.equal(await page.locator('h1').count(), 1)
      assert.match(await page.locator('h1').innerText(), locale === 'id' ? /cara kerja bisnis Anda/ : /the way you work/)
      assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'), `https://klkinvoice.my.id/${locale}`)
      for (const lang of ['id', 'en', 'x-default']) {
        assert.equal(await page.locator(`link[rel=alternate][hreflang="${lang}"]`).getAttribute('href'), `https://klkinvoice.my.id${lang === 'x-default' ? '' : '/' + lang}`)
      }
      assert.equal(await page.locator('meta[property="og:locale"]').getAttribute('content'), locale === 'id' ? 'id_ID' : 'en_US')
      assert.match(await page.locator('meta[name=description]').getAttribute('content'), locale === 'id' ? /Kelola transaksi/ : /Manage transactions/)
      const image = await context.request.get(`${base}/${locale}/opengraph-image`)
      assert.equal(image.status(), 200)
      assert.match(image.headers()['content-type'], /image\/png/)
      const anchors = await page.locator('a[href^="#"]').evaluateAll(links => links.map(a => a.hash))
      for (const anchor of anchors) assert.equal(await page.locator(anchor).count(), 1)
      for (const width of [320, 390, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: 1000 })
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${locale} overflow ${width}`)
        const items = []
        for (const item of await page.locator('header a, header summary').all()) {
          if (!(await item.isVisible())) continue
          const b = await item.boundingBox()
          assert.ok(b.x >= 0 && b.x + b.width <= width + 1, `${locale} clipped navigation ${width}`)
          items.push(b)
        }
        items.sort((a, b) => a.x - b.x)
        for (let i = 1; i < items.length; i++) assert.ok(items[i - 1].x + items[i - 1].width <= items[i].x + 1, `${locale} overlapping navigation ${width}`)
        if ([390, 1440].includes(width)) { await page.emulateMedia({ reducedMotion: 'reduce' }); await page.screenshot({ path: path.join(out, `locale-${locale}-${width}.png`), fullPage: true }); await page.emulateMedia({ reducedMotion: 'no-preference' }) }
      }
      if (locale === 'en') {
        assert.ok((await page.locator('main').innerText()).includes('The app interface is currently in Indonesian.'))
        assert.ok((await page.locator('#roadmap').innerText()).includes('Planned · Not yet available'))
        assert.match(await page.locator('#demo-caption').innerText(), /Recorded in Indonesian/)
      }
    }
    assert.deepEqual(apiCalls, [], 'Localized landing pages never call auth or business APIs')
    check('Both server-rendered languages, SEO/OG images, anchors, honest product copy and six viewport sizes')
    await page.goto(base + '/id')
    await page.getByRole('link', { name: 'English', exact: true }).click()
    await page.waitForURL(base + '/en')
    assert.equal((await context.cookies()).find(c => c.name === 'klk_landing_locale').value, 'en')
    await context.setExtraHTTPHeaders({ 'x-vercel-ip-country': 'ID' })
    await page.goto(base); await page.waitForURL(base + '/en')
    await page.reload(); assert.equal(await page.locator('html').getAttribute('lang'), 'en')
    await page.getByRole('link', { name: 'Bahasa Indonesia', exact: true }).click()
    await page.waitForURL(base + '/id')
    await context.setExtraHTTPHeaders({ 'x-vercel-ip-country': 'US' })
    await page.goto(base); await page.waitForURL(base + '/id')
    await page.goto(base + '/en'); assert.equal(await page.locator('html').getAttribute('lang'), 'en')
    await page.getByRole('link', { name: 'Log in', exact: true }).first().click()
    await page.waitForURL(base + '/login')
    await page.getByRole('heading', { name: 'Selamat datang kembali' }).waitFor()
    assert.equal(await page.locator('html').getAttribute('lang'), 'id')
    assert.equal(await page.getByRole('navigation', { name: 'Choose language' }).count(), 0)
    assert.match(await page.locator('meta[name=robots]').getAttribute('content'), /noindex/)
    check('Manual language persists, explicit URLs win, and app login stays Indonesian and noindex')
    assert.equal((await context.request.get(base + '/fr')).status(), 404)
    assert.equal((await context.request.get(base + '/en/login')).status(), 404)
    const sitemap = await (await context.request.get(base + '/sitemap.xml')).text()
    assert.match(sitemap, /https:\/\/klkinvoice.my.id\/id/); assert.match(sitemap, /https:\/\/klkinvoice.my.id\/en/)
    const noJS = await browser.newContext({ javaScriptEnabled: false })
    const staticPage = await noJS.newPage()
    await staticPage.goto(base + '/en')
    assert.match(await staticPage.locator('h1').innerText(), /the way you work/)
    await staticPage.getByRole('link', { name: 'Bahasa Indonesia', exact: true }).click()
    assert.equal(await staticPage.locator('html').getAttribute('lang'), 'id')
    await noJS.close()
    assert.deepEqual(errors, [])
    check('Unsupported locales return 404, bilingual sitemap, no-JavaScript navigation and no runtime errors')
    fs.writeFileSync(path.join(out, 'locale-results.json'), JSON.stringify({ base, passed, mode: 'Real local production build; simulated country headers; login API mocked; no production geolocation verification' }, null, 2))
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exit(1) })
