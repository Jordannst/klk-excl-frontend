/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS browser test fixtures. */
// Playwright route mocks: every /api call is answered locally. No backend, no DB.
// The invoice PDF is produced by the app's real backend generator (imported in-process).
const path = require('path')
const D = require('./product-data.cjs')

const BACKEND = process.env.BACKEND_DIR || path.resolve(__dirname, '../../../backend')
require(path.join(BACKEND, 'node_modules/ts-node')).register({
  project: path.join(BACKEND, 'tsconfig.json'),
  transpileOnly: true,
})
const { generateInvoicePdf } = require(path.join(BACKEND, 'src/services/pdf/invoicePdf.ts'))

function json(route, body, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

async function installMocks(page, ctx) {
  // ctx: { signatures, state: { saved: bool }, onPdf(payload, buffer) }
  await page.route('**/api/**', async (route) => {
    const req = route.request()
    const url = new URL(req.url())
    const p = url.pathname.replace(/^\/api/, '')
    const m = req.method()

    if (p === '/auth/me') return json(route, { user: { id: 1, username: 'Admin' } })
    if (p === '/auth/refresh') return json(route, { ok: true })
    if (p === '/signature' && m === 'GET') return json(route, ctx.signatures)
    if (p === '/transaksi/search') return json(route, { results: [] })

    if (p === '/invoice' && m === 'GET') {
      const items = ctx.state.saved
        ? [{ id: D.INVOICE_ID, title: D.TITLE, createdAt: D.FIXED_NOW, total: D.handlingTotal, count: D.allRows.length, showKeteranganColumn: true }, ...D.historyItems.slice(0, 4)]
        : D.historyItems.map((h) => ({ ...h, showKeteranganColumn: true }))
      return json(route, { data: items.slice(0, 5), pagination: { page: 1, limit: 5, total: items.length + 18, totalPages: 5 } })
    }
    if (p === '/invoice' && m === 'POST') {
      const body = req.postDataJSON()
      ctx.lastCreatePayload = body
      ctx.state.saved = true
      return json(route, D.savedInvoice, 201)
    }
    if (p === `/invoice/${D.INVOICE_ID}` && m === 'GET') return json(route, D.savedInvoice)
    if (p === `/invoice/${D.INVOICE_ID}` && m === 'PUT') return json(route, D.savedInvoice)

    if (p === '/pdf/invoice' && m === 'POST') {
      const payload = req.postDataJSON()
      const pdf = generateInvoicePdf(payload)
      if (ctx.onPdf) ctx.onPdf(payload, pdf)
      return route.fulfill({ status: 200, contentType: 'application/pdf', body: pdf })
    }

    console.warn('[mock] unhandled', m, p)
    return json(route, { error: 'not mocked' }, 404)
  })
}

module.exports = { installMocks, generateInvoicePdf }
