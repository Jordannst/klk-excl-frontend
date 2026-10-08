// Fictional, consistent sample data for product regression tests.
// Every number here follows the app rule: total = max(kg, min) * tarif.
const FIXED_NOW = '2026-10-05T10:24:00+08:00' // browser clock during capture
const ROW_DATE = '2026-10-05'

const SENDER = 'CV Nusa Bahari'
const RECEIVER = 'PT Sinar Jaya'
const TITLE = 'Invoice KLK 05 Okt'

const draftRows = [
  { stt: '10482', coly: 2, kg: 12, min: 10, tarif: 8000, keterangan: 'Part' }, // 12 * 8000 = 96.000
  { stt: '10483', coly: 1, kg: 6, min: 10, tarif: 8000, keterangan: 'Arsip' }, // min 10 -> 80.000
]
const newRow = { stt: '10484', coly: 3, kg: 25, min: 10, tarif: 8000, keterangan: 'Mesin' } // 25 * 8000 = 200.000

const total = (r) => Math.max(r.kg, r.min) * r.tarif
const allRows = [...draftRows, newRow]
const handlingTotal = allRows.reduce((s, r) => s + total(r), 0) // 376.000
const biayaKirimDoc = 24000
const totalTagihan = handlingTotal + biayaKirimDoc // 400.000

const INVOICE_ID = 129
const printSettings = {
  tanggalSurat: 'Manado, 05 Oktober 2026',
  nomorInvoice: '129/INV/KLK/MDC/2026',
  namaPenerima: RECEIVER,
  lokasiPenerima: 'Jakarta',
  biayaKirimDoc,
  penandatanganKiri: 'Raka Pratama',
  penandatanganKanan: 'Dewi Lestari',
  signatureKiriId: 'sig-raka',
  signatureKananId: null,
}

const historyItems = [
  { id: 128, title: 'Invoice KLK 28 Sep', createdAt: '2026-09-28T09:10:00+08:00', total: 1240000, count: 9 },
  { id: 127, title: 'Invoice KLK 21 Sep', createdAt: '2026-09-21T09:10:00+08:00', total: 856000, count: 6 },
  { id: 126, title: 'Invoice KLK 14 Sep', createdAt: '2026-09-14T09:10:00+08:00', total: 1512000, count: 11 },
  { id: 125, title: 'Invoice KLK 07 Sep', createdAt: '2026-09-07T09:10:00+08:00', total: 640000, count: 5 },
]

function toTransaksi(r, i) {
  return {
    id: 9000 + i,
    tanggal: `${ROW_DATE}T00:00:00.000Z`,
    pengirim: SENDER,
    penerima: RECEIVER,
    coly: r.coly,
    berat: r.kg,
    min: r.min,
    tarif: r.tarif,
    total: total(r),
    noResi: r.stt,
    keterangan: r.keterangan,
    invoiceId: INVOICE_ID,
    createdAt: FIXED_NOW,
  }
}

const savedInvoice = {
  id: INVOICE_ID,
  title: TITLE,
  createdAt: FIXED_NOW,
  total: handlingTotal,
  count: allRows.length,
  dateMode: 'enabled',
  showKeteranganColumn: true,
  printSettings,
  transactions: allRows.map(toTransaksi),
}

function draftStorage() {
  return JSON.stringify({
    items: draftRows.map((r) => ({
      title: TITLE,
      dateMode: 'enabled',
      showKeteranganColumn: true,
      date: ROW_DATE,
      stt: r.stt,
      sender: SENDER,
      receiver: RECEIVER,
      coly: r.coly,
      kg: r.kg,
      min: r.min,
      tarif: r.tarif,
      total: total(r),
      keterangan: r.keterangan,
    })),
    title: TITLE,
    dateMode: 'enabled',
    showKeteranganColumn: true,
    defaultSender: SENDER,
    defaultReceiver: RECEIVER,
  })
}

module.exports = {
  FIXED_NOW, ROW_DATE, SENDER, RECEIVER, TITLE, draftRows, newRow, total, allRows,
  handlingTotal, biayaKirimDoc, totalTagihan, INVOICE_ID, printSettings, historyItems,
  savedInvoice, draftStorage,
}
