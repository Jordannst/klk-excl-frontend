/* eslint-disable @typescript-eslint/no-require-imports -- Node browser checks. */
const assert = require('node:assert/strict')
const { chromium } = require('playwright')
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3101'

async function main() {
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' })
    const errors = [], apiCalls = []
    await context.route('**/api/**', route => { apiCalls.push(route.request().url()); return route.abort() })
    const page = await context.newPage()
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(base + '/en', { waitUntil: 'networkidle' })
    assert.equal(await page.locator('h1').evaluate(el => getComputedStyle(el).opacity), '1')
    assert.ok(await page.locator('[data-reveal="pending"]').count() > 0)
    assert.equal(await page.locator('[data-reveal-order="1"]').first().evaluate(el => getComputedStyle(el).transitionDelay), '0.07s')
    const cards = page.locator('article[data-reveal]')
    await cards.first().scrollIntoViewIfNeeded()
    await page.waitForFunction(() => document.querySelector('article[data-reveal]').dataset.reveal === 'visible')
    await page.waitForFunction(() => getComputedStyle(document.querySelector('article[data-reveal]')).opacity === '1')
    await page.evaluate(() => scrollTo(0, 0))
    assert.equal(await cards.first().getAttribute('data-reveal'), 'visible')
    console.log('PASS Hero stays visible; offscreen content reveals once with staggered cards')
    await page.locator('header a[href="#tentang"]').first().click()
    await page.waitForFunction(() => document.querySelector('#tentang [data-reveal]').dataset.reveal === 'visible')
    assert.ok(await page.locator('[data-reveal="pending"]').count() > 0)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.waitForFunction(() => !document.querySelector('[data-reveal="pending"]'))
    assert.equal(await cards.first().evaluate(el => getComputedStyle(el).transitionDuration), '0s')
    console.log('PASS Anchor navigation reveals its destination; live reduced-motion setting stops reveals')
    await page.reload({ waitUntil: 'networkidle' })
    assert.equal(await page.locator('[data-reveal="pending"]').count(), 0)
    assert.deepEqual(errors, [])
    assert.deepEqual(apiCalls, [])
    const staticContext = await browser.newContext({ javaScriptEnabled: false })
    const staticPage = await staticContext.newPage()
    await staticPage.goto(base + '/id')
    assert.equal(await staticPage.locator('[data-reveal="pending"]').count(), 0)
    assert.ok(await staticPage.locator('[data-reveal]').evaluateAll(nodes => nodes.every(el => getComputedStyle(el).opacity === '1')))
    console.log('PASS Reduced motion and no-JavaScript visits keep all content visible; no runtime errors or API requests')
  } finally { await browser.close() }
}
main().catch(error => { console.error(error); process.exit(1) })
