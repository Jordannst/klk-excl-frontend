/* eslint-disable @typescript-eslint/no-require-imports -- Node QA harness reuses the existing CommonJS capture tools. */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const { installMocks } = require('./fixtures/product-mock.cjs')
const D = require('./fixtures/product-data.cjs')
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:3100'
const passed = [], calls = [], errors = []
const check = name => { passed.push(name); console.log('PASS', name) }
async function main() {
  const browser = await chromium.launch({headless:true})
  const page = await browser.newPage({viewport:{width:1440,height:1000}})
  page.on('pageerror', error => errors.push(error.message))
  const ctx = {signatures:[],state:{saved:false}}
  const deletedIds = new Set(), deletes = []
  let rejectDelete = false
  await installMocks(page,ctx)
  await page.route('**/api/**', async route => {
    const req=route.request(),u=new URL(req.url()),p=u.pathname,m=req.method()
    calls.push({path:p,method:m,query:u.search})
    const json=body=>route.fulfill({contentType:'application/json',body:JSON.stringify(body)})
    if(p===`/api/invoice/${D.INVOICE_ID}` && m==='GET') return json({...D.savedInvoice,transactions:D.savedInvoice.transactions.filter(row=>!deletedIds.has(row.id))})
    if(p.startsWith('/api/transaksi/') && m==='DELETE') {
      const id=Number(p.split('/').pop());deletes.push(id)
      if(rejectDelete) return route.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'QA delete failure'})})
      deletedIds.add(id);return json({success:true})
    }
    if(p==='/api/transaksi/search') return json({results:[{...D.savedInvoice.transactions[0],invoice:{id:D.INVOICE_ID,title:D.TITLE,deletedAt:null}}]})
    if(p==='/api/signature'&&m==='POST') { const sig={...req.postDataJSON(),id:'qa-signature',createdAt:D.FIXED_NOW};ctx.signatures.push(sig);return json(sig) }
    if(p==='/api/invoice/trash/list') return json({data:ctx.restored?[]:[{...D.savedInvoice,deletedAt:D.FIXED_NOW}]})
    if(p===`/api/invoice/${D.INVOICE_ID}/restore`) {ctx.restored=true;return json({success:true,message:'Restored'})}
    return route.fallback()
  })
  try {
    await page.goto(base+'/dashboard')
    await page.locator('#title').fill(D.TITLE)
    await page.locator('#sender').fill(D.SENDER);await page.keyboard.press('Escape')
    await page.locator('#receiver').fill(D.RECEIVER);await page.keyboard.press('Escape')
    await page.getByRole('button',{name:'Gunakan sebagai default invoice ini'}).click()
    for(const r of D.allRows){
      for(const [selector,value] of Object.entries({stt:r.stt,coly:r.coly,kg:r.kg,min:r.min,tarif:r.tarif,keterangan:r.keterangan})) await page.locator('#'+selector).fill(String(value))
      await page.keyboard.press('Escape')
      await page.locator('div.text-4xl').filter({hasText:D.total(r).toLocaleString('id-ID')}).waitFor()
      await page.getByRole('button',{name:/Tambah Baris/}).click()
      await page.locator('tbody tr').filter({hasText:r.stt}).waitFor()
    }
    assert.match(await page.locator('tr',{hasText:'GRAND TOTAL'}).innerText(),/376.000/)
    check('Transaction entry calculates minimum weight/rate and draft total correctly')
    await page.getByRole('button',{name:'SIMPAN LAPORAN SELESAI'}).click()
    await page.getByText('Nilai Invoice',{exact:true}).waitFor()
    assert.equal(ctx.lastCreatePayload.transactions.length,3)
    assert.equal(ctx.lastCreatePayload.transactions.reduce((sum,row)=>sum+row.total,0),376000)
    check('Save sends all three transactions and opens invoice detail (mocked persistence)')
    await page.getByRole('button',{name:'Print / PDF',exact:true}).click()
    await page.getByText('Data Invoice untuk Print',{exact:true}).waitFor()
    ctx.onPdf=(payload,buffer)=>{ctx.pdf=buffer;ctx.pdfPayload=payload}
    await page.getByRole('button',{name:'Preview PDF',exact:true}).click()
    await page.getByText('Preview PDF Final',{exact:true}).waitFor()
    assert.equal(ctx.pdf.subarray(0,4).toString(),'%PDF')
    assert.equal(ctx.pdfPayload.transactions.length,3)
    assert.equal(ctx.pdfPayload.formData.biayaKirimDoc,24000)
    assert.ok(ctx.pdf.length>1000)
    await page.locator('iframe[title="Preview PDF invoice"]').waitFor()
    check('Invoice preview receives a real PDF generated in process by unchanged backend service')
    await page.goto(base+'/dashboard')
    const filtered = page.waitForResponse(r=>r.url().includes('/api/invoice?')&&r.url().includes('startDate='))
    await page.getByRole('button',{name:'Bulan',exact:true}).click()
    await filtered
    const search=page.getByPlaceholder('Cari No STT atau invoice…')
    await search.fill('10482')
    await page.getByRole('button',{name:/10482/}).click()
    await page.getByText('Nilai Invoice',{exact:true}).waitFor()
    assert.ok(calls.some(r=>r.path==='/api/transaksi/search'&&r.query.includes('10482')))
    check('History date filter and transaction search select an invoice')
    await page.clock.install()
    const row=D.savedInvoice.transactions[0]
    const deleteRow=async()=>{
      await page.getByRole('button',{name:`Hapus transaksi STT ${row.noResi}`,exact:true}).click()
      await page.getByRole('button',{name:'Hapus',exact:true}).click()
    }
    await deleteRow()
    assert.equal(deletes.length,0)
    await page.getByRole('button',{name:'Urungkan',exact:true}).click()
    await page.clock.runFor(5100)
    assert.equal(deletes.length,0)
    await page.getByRole('button',{name:`Hapus transaksi STT ${row.noResi}`,exact:true}).waitFor()
    rejectDelete=true
    await deleteRow()
    await page.clock.runFor(5100)
    await page.getByText(`STT ${row.noResi}: QA delete failure`,{exact:true}).waitFor()
    assert.deepEqual(deletes,[row.id])
    rejectDelete=false
    await deleteRow()
    const refreshedAfterDelete=page.waitForResponse(r=>r.url().includes(`/api/invoice/${D.INVOICE_ID}`))
    await page.clock.runFor(5100)
    await refreshedAfterDelete
    assert.deepEqual(deletes,[row.id,row.id])
    check('Transaction deletion supports undo, delayed commit and row restoration on failure')
    const nextRow=D.savedInvoice.transactions[1]
    await page.getByRole('button',{name:`Hapus transaksi STT ${nextRow.noResi}`,exact:true}).click()
    await page.getByRole('button',{name:'Hapus',exact:true}).click()
    await page.setViewportSize({width:900,height:1000})
    await page.getByRole('button',{name:'Buka navigasi',exact:true}).click()
    await page.getByRole('button',{name:'Invoice Baru',exact:true}).click()
    await page.locator('#title').waitFor()
    await page.clock.runFor(5100)
    assert.deepEqual(deletes,[row.id,row.id,nextRow.id],'Unmount commits pending deletion exactly once')
    check('Unmount commits a pending transaction deletion exactly once')
    assert.equal(await page.getByRole('button',{name:'Buka navigasi'}).getAttribute('aria-expanded'),'false')
    await page.setViewportSize({width:1440,height:1000})
    check('Tablet menu can start a new invoice after selecting an existing one')
    await page.goto(base+'/signatures')
    await page.getByRole('button',{name:'Tambah TTD',exact:true}).click()
    const canvas=page.locator('canvas');const b=await canvas.boundingBox()
    await page.mouse.move(b.x+30,b.y+60);await page.mouse.down();await page.mouse.move(b.x+100,b.y+30,{steps:6});await page.mouse.move(b.x+160,b.y+90,{steps:6});await page.mouse.up()
    await page.getByRole('button',{name:'Simpan',exact:true}).click()
    await page.locator('input').fill('Tanda tangan QA')
    await page.getByRole('button',{name:'Simpan Tanda Tangan',exact:true}).click()
    await page.getByText('Tanda tangan QA',{exact:true}).waitFor()
    assert.equal(ctx.signatures.length,1)
    assert.match(ctx.signatures[0].imageData,/^data:image\/png/)
    check('Draw and save a signature through existing UI (mocked persistence)')
    await page.goto(base+'/trash')
    await page.getByRole('button',{name:'Restore',exact:true}).click()
    await page.getByText('Invoice berhasil dipulihkan',{exact:true}).waitFor()
    assert.equal(ctx.restored,true)
    check('Restore invoice from trash (mocked persistence)')
    for (const p of ['/','/id','/en']) assert.equal(new URL((await page.goto(base+p)).url()).pathname,'/login',p)
    check('Landing hidden: /, /id and /en redirect to login')
    assert.deepEqual(errors, [], 'Product browser runtime errors')
    fs.writeFileSync(path.join(__dirname,'../qa/landing/product-results.json'),JSON.stringify({passed,calls,mode:'Mocked API; real frontend interactions and real in-process PDF generation; no database'},null,2))
  } finally {await browser.close()}
}
main().catch(e=>{console.error(e);process.exit(1)})
