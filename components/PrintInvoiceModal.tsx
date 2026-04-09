"use client"

import * as React from "react"
import { X, Printer, Loader2, Download, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import { SegmentedInvoiceInput } from "@/components/ui/segmented-invoice-input"
import { useSignatures } from "@/lib/hooks/useSignature"
import {
  isDateColumnVisible,
  isDateInputEnabled,
  normalizeInvoiceDateMode,
  type InvoiceDateMode,
} from "@/lib/invoice-date-mode"
import type { Transaksi, Signature } from "@/lib/types"

const escapeHtml = (value: string | number | null | undefined) => {
  const stringValue = String(value ?? "")
  return stringValue
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

interface PrintInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  data: Transaksi[]
  invoiceTitle?: string
  dateMode?: InvoiceDateMode
  invoiceKey?: string
}

interface PrintFormData {
  tanggalSurat: string
  nomorInvoice: string
  namaPenerima: string
  lokasiPenerima: string
  biayaKirimDoc: number
  penandatanganKiri: string
  penandatanganKanan: string
}

export function PrintInvoiceModal({ isOpen, onClose, data, invoiceTitle, dateMode, invoiceKey }: PrintInvoiceModalProps) {
  const [isPrinting, setIsPrinting] = React.useState(false)
  const [formData, setFormData] = React.useState<PrintFormData>({
    tanggalSurat: `Manado, ${format(new Date(), "dd MMMM yyyy", { locale: id })}`,
    nomorInvoice: "",
    namaPenerima: "",
    lokasiPenerima: "Jakarta",
    biayaKirimDoc: 0,
    penandatanganKiri: "",
    penandatanganKanan: "",
  })
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false)
  const [biayaKirimDocDisplay, setBiayaKirimDocDisplay] = React.useState("")
  
  // Signature selection state
  const [selectedSignatureKiri, setSelectedSignatureKiri] = React.useState<Signature | null>(null)
  const [selectedSignatureKanan, setSelectedSignatureKanan] = React.useState<Signature | null>(null)
  
  // Fetch available signatures
  const { data: signatures } = useSignatures()

  const currentDateMode = normalizeInvoiceDateMode(dateMode)
  const showDateColumn = isDateColumnVisible(currentDateMode)
  const isDateEnabled = isDateInputEnabled(currentDateMode)

  React.useEffect(() => {
    setFormData({
      tanggalSurat: `Manado, ${format(new Date(), "dd MMMM yyyy", { locale: id })}`,
      nomorInvoice: "",
      namaPenerima: "",
      lokasiPenerima: "Jakarta",
      biayaKirimDoc: 0,
      penandatanganKiri: "",
      penandatanganKanan: "",
    })
    setBiayaKirimDocDisplay("")
    setSelectedSignatureKiri(null)
    setSelectedSignatureKanan(null)
  }, [invoiceKey])

  // Calculate totals
  const biayaHandling = data.reduce((sum, item) => sum + item.total, 0)
  const totalTagihan = biayaHandling + formData.biayaKirimDoc

  const formatTransactionDate = (tanggal: string | null | undefined) => {
    if (!showDateColumn || !isDateEnabled) {
      return ""
    }

    return tanggal ? format(new Date(tanggal), "dd MMM yyyy", { locale: id }) : "-"
  }

  const getTableTotalColSpan = () => (showDateColumn ? 9 : 8)

  const handleChange = (field: keyof PrintFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatRupiah = (num: number): string => {
    return num.toLocaleString("id-ID")
  }

  const handleBiayaKirimDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Remove all non-digit characters
    const cleanedValue = inputValue.replace(/\D/g, '')
    
    if (cleanedValue === '' || cleanedValue === '0') {
      setBiayaKirimDocDisplay("")
      handleChange("biayaKirimDoc", 0)
      return
    }

    const numericValue = parseFloat(cleanedValue) || 0
    setBiayaKirimDocDisplay(formatRupiah(numericValue))
    handleChange("biayaKirimDoc", numericValue)
  }

  const handlePrint = async () => {
    setIsPrinting(true)

    // Fetch logo and convert to base64
    let logoBase64 = ''
    try {
      const response = await fetch('/klkexpress.png')
      const blob = await response.blob()
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Failed to load logo:', error)
    }

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      setIsPrinting(false)
      return
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${escapeHtml(invoiceTitle || 'KLK Express')}</title>
          <style>
            @media print {
              @page {
                margin: 1.5cm;
                size: A4 portrait;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.4;
              color: #000;
              word-spacing: normal;
              white-space: normal;
              letter-spacing: normal;
            }
            .container {
              max-width: 21cm;
              margin: 0 auto;
              padding: 10px;
            }
            
            /* Header */
            .header {
              display: flex;
              align-items: center;
              margin-bottom: 15px;
              padding-bottom: 10px;
              border-bottom: 2px solid #000;
            }
            .header-info {
              text-align: center;
              flex: 1;
              padding-right: 100px; /* Offset for logo width to truly center */
            }
            .header-info .branch {
              font-weight: bold;
              font-size: 13px;
              margin-bottom: 3px;
            }
            .header-info .contact {
              font-size: 10px;
              font-weight: bold;
            }
            .logo {
              width: 140px;
              height: auto;
              margin-right: 15px;
            }
            
            /* Letter Info */
            .letter-info {
              margin-bottom: 15px;
            }
            .letter-info p {
              margin-bottom: 3px;
            }
            
            /* Recipient */
            .recipient {
              margin-bottom: 15px;
            }
            .recipient p {
              margin-bottom: 2px;
            }
            
            /* Intro */
            .intro {
              margin-bottom: 15px;
            }
            .intro p {
              margin-bottom: 5px;
            }
            
            /* Table */
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 10px;
            }
            th, td {
              border: 1px solid #000;
              padding: 4px 6px;
              vertical-align: middle;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
              text-align: center;
            }
            td {
              text-align: left;
            }
            td.number {
              text-align: right;
            }
            td.center {
              text-align: center;
            }
            
            /* Calculations */
            .calculations {
              margin-bottom: 15px;
            }
            .calc-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 3px;
              max-width: 350px;
            }
            .calc-row .label {
              flex: 1;
            }
            .calc-row .value {
              text-align: right;
              min-width: 120px;
            }
            .calc-row.total {
              font-weight: bold;
              border-top: 1px solid #000;
              padding-top: 3px;
              margin-top: 5px;
            }
            
            /* Payment Info */
            .payment-info {
              margin-bottom: 15px;
              font-size: 10px;
            }
            
            /* Closing */
            .closing {
              margin-bottom: 25px;
            }
            .closing p {
              margin-bottom: 5px;
            }
            
            /* Signatures */
            .signatures {
              display: flex;
              justify-content: space-between;
              margin-top: 40px;
              margin-bottom: 20px;
            }
            .signature-box {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              border-bottom: 1px solid #000;
              height: 80px;
              margin-bottom: 5px;
            }
            .signature-name {
              font-weight: bold;
            }
            
            /* Footer */
            .footer {
              position: absolute;
              bottom: 2cm;
              left: 10px;
              font-size: 10px;
            }
            
            /* Container needs relative positioning for footer */
            .container {
              max-width: 21cm;
              min-height: 26cm;
              margin: 0 auto;
              padding: 10px;
              position: relative;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Header -->
            <div class="header">
              <img src="${logoBase64}" alt="Logo KLK" class="logo" />
              <div class="header-info">
                <p class="branch">Branch Manado: Permata Klabat Blok E1 No 17 Manado</p>
                <p class="contact">No. Tlp. : (0431) 7242432 HP : 085395549100</p>
                <p class="contact">Email : klk.express.mdc@gmail.com</p>
              </div>
            </div>
            
            <!-- Letter Info -->
            <div class="letter-info">
              <p>${escapeHtml(formData.tanggalSurat)}</p>
              <p>No. ${escapeHtml(formData.nomorInvoice)}</p>
            </div>
            
            <!-- Recipient -->
            <div class="recipient">
              <p>Kepada Yth :</p>
              <p><strong>${escapeHtml(formData.namaPenerima)}</strong></p>
              <p>Di. ${escapeHtml(formData.lokasiPenerima)}</p>
            </div>
            
            <!-- Intro -->
            <div class="intro">
              <p>Dengan Hormat,</p>
              <p>Terlampir Jasa Handling dari PT. Kemilau Lintas Khatulistiwa Manado Dikirim sesuai perhitungan Jasa handling di bawah ini :</p>
            </div>
            
            <!-- Table -->
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  ${showDateColumn ? '<th>Hari/Tgl</th>' : ''}
                  <th>No Stt</th>
                  <th>Pengirim</th>
                  <th>Penerima</th>
                  <th>Coly</th>
                  <th>Kg</th>
                  <th>Min</th>
                  <th>Tarif</th>
                  <th>Jumlah</th>
                  <th>Ket</th>
                </tr>
              </thead>
              <tbody>
                ${data.map((item, index) => `
                  <tr>
                    <td class="center">${index + 1}</td>
                    ${showDateColumn ? `<td>${escapeHtml(formatTransactionDate(item.tanggal))}</td>` : ''}
                    <td>${escapeHtml(item.noResi)}</td>
                    <td>${escapeHtml(item.pengirim)}</td>
                    <td>${escapeHtml(item.penerima)}</td>
                    <td class="center">${item.coly}</td>
                    <td class="center">${item.berat}</td>
                    <td class="center">${item.min}</td>
                    <td class="number">${escapeHtml(formatRupiah(item.tarif || 0))}</td>
                    <td class="number">${escapeHtml(formatRupiah(item.total))}</td>
                    <td>${escapeHtml(item.keterangan || "")}</td>
                  </tr>
                `).join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="${getTableTotalColSpan()}" style="text-align: right; font-weight: bold; border: 1px solid #000;">TOTAL</td>
                  <td class="number" style="font-weight: bold; border: 1px solid #000;">Rp ${formatRupiah(biayaHandling)}</td>
                  <td style="border: 1px solid #000;"></td>
                </tr>
              </tfoot>
            </table>
            
            <!-- Calculations -->
            <div class="calculations">
              <div class="calc-row">
                <span class="label">1. Biaya handling</span>
                <span class="value">Rp ${formatRupiah(biayaHandling)}</span>
              </div>
              <div class="calc-row">
                <span class="label">2. Biaya Kirim Doc</span>
                <span class="value">Rp ${formatRupiah(formData.biayaKirimDoc)}</span>
              </div>
              <div class="calc-row total">
                <span class="label">3. Total tagihan</span>
                <span class="value">Rp ${formatRupiah(totalTagihan)}</span>
              </div>
            </div>
            
            <!-- Payment Info -->
            <div class="payment-info">
              <p>Jumlah tagihan bisa ditransfer melalui :</p>
              <p><strong>Rek mandiri, 1500010112710 a/n. Janti Feine Rundengan</strong></p>
            </div>
            
            <!-- Closing -->
            <div class="closing">
              <p>Demikian di sampaikan, Atas perhatian dan kerjasama yang baik, Kami ucapkan Terima Kasih</p>
              <p>Hormat Kami,</p>
            </div>
            
            <!-- Signatures -->
            <div class="signatures">
              <div class="signature-box">
                ${selectedSignatureKiri 
                  ? `<div class="signature-image"><img src="${selectedSignatureKiri.imageData}" alt="Signature" style="max-height: 60px; max-width: 150px;" /></div>`
                  : `<div class="signature-line"></div>`
                }
                <p>PT. KLK Mdc</p>
                <p class="signature-name">${escapeHtml(formData.penandatanganKiri)}</p>
              </div>
              <div class="signature-box">
                ${selectedSignatureKanan 
                  ? `<div class="signature-image"><img src="${selectedSignatureKanan.imageData}" alt="Signature" style="max-height: 60px; max-width: 150px;" /></div>`
                  : `<div class="signature-line"></div>`
                }
                <p>Diketahui,</p>
                <p class="signature-name">${escapeHtml(formData.penandatanganKanan)}</p>
              </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
              <p>Cc. Klk mdc</p>
            </div>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
      setIsPrinting(false)
      onClose()
    }, 500)
  }

  // Handle PDF download - uses same template as print
  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true)

    // Fetch logo and convert to base64
    let logoBase64 = ''
    try {
      const response = await fetch('/klkexpress.png')
      const blob = await response.blob()
      logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Failed to load logo:', error)
    }

    try {
      const html2pdf = (await import('html2pdf.js')).default

      // Use the SAME template as print (without @media print)
      const pdfContent = `
        <div style="font-family: Arial, sans-serif; font-size: 11px; line-height: 1.4; color: #000; max-width: 21cm; margin: 0 auto; padding: 20px; word-spacing: normal; white-space: normal; letter-spacing: normal; box-sizing: border-box; background: #fff;">
          <!-- Header -->
          <div class="pdf-keep-together" style="display: flex; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #000; break-inside: avoid; page-break-inside: avoid;">
            ${logoBase64 ? `<img src="${logoBase64}" alt="Logo KLK" style="width: 140px; height: auto; margin-right: 15px;" />` : ''}
            <div style="text-align: center; flex: 1; padding-right: 100px;">
              <p style="font-weight: bold; font-size: 13px; margin-bottom: 3px;">Branch Manado: Permata Klabat Blok E1 No 17 Manado</p>
              <p style="font-size: 10px; font-weight: bold;">No. Tlp. : (0431) 7242432 HP : 085395549100</p>
              <p style="font-size: 10px; font-weight: bold;">Email : klk.express.mdc@gmail.com</p>
            </div>
          </div>
          
          <!-- Letter Info -->
          <div class="pdf-keep-together" style="margin-bottom: 15px; break-inside: avoid; page-break-inside: avoid;">
            <p style="margin-bottom: 3px;">${escapeHtml(formData.tanggalSurat)}</p>
            <p style="margin-bottom: 3px;">No. ${escapeHtml(formData.nomorInvoice)}</p>
          </div>

          <!-- Recipient -->
          <div class="pdf-keep-together" style="margin-bottom: 15px; break-inside: avoid; page-break-inside: avoid;">
            <p style="margin-bottom: 2px;">Kepada Yth :</p>
            <p style="margin-bottom: 2px; font-weight: bold;">${escapeHtml(formData.namaPenerima)}</p>
            <p style="margin-bottom: 2px;">Di. ${escapeHtml(formData.lokasiPenerima)}</p>
          </div>

          <!-- Intro -->
          <div class="pdf-keep-together" style="margin-bottom: 15px; break-inside: avoid; page-break-inside: avoid;">
            <p style="margin-bottom: 5px;">Dengan Hormat,</p>
            <p style="margin-bottom: 5px;">Terlampir Jasa Handling dari PT. Kemilau Lintas Khatulistiwa Manado Dikirim sesuai perhitungan Jasa handling di bawah ini :</p>
          </div>

          <!-- Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10px;">
            <thead style="display: table-header-group;">
              <tr class="pdf-keep-together" style="break-inside: avoid; page-break-inside: avoid;">
                <th style="border: 1px solid #000; padding: 8px 6px; background-color: #f0f0f0; font-weight: bold; text-align: center; line-height: 20px;">No</th>
                ${showDateColumn ? '<th style="border: 1px solid #000; padding: 8px 6px; background-color: #f0f0f0; font-weight: bold; text-align: center; line-height: 20px;">Hari/Tgl</th>' : ''}
                <th style="border: 1px solid #000; padding: 8px 6px; background-color: #f0f0f0; font-weight: bold; text-align: center; line-height: 20px;">No Stt</th>
                <th style="border: 1px solid #000; padding: 8px 6px; background-color: #f0f0f0; font-weight: bold; text-align: center; line-height: 20px;">Pengirim</th>
                <th style="border: 1px solid #000; padding: 8px 6px; background-color: #f0f0f0; font-weight: bold; text-align: center; line-height: 20px;">Penerima</th>
                <th style="border: 1px solid #000; padding: 8px 6px; background-color: #f0f0f0; font-weight: bold; text-align: center; line-height: 20px;">Coly</th>
                <th style="border: 1px solid #000; padding: 8px 6px; background-color: #f0f0f0; font-weight: bold; text-align: center; line-height: 20px;">Kg</th>
                <th style="border: 1px solid #000; padding: 8px 6px; background-color: #f0f0f0; font-weight: bold; text-align: center; line-height: 20px;">Min</th>
                <th style="border: 1px solid #000; padding: 8px 6px; background-color: #f0f0f0; font-weight: bold; text-align: center; line-height: 20px;">Tarif</th>
                <th style="border: 1px solid #000; padding: 8px 6px; background-color: #f0f0f0; font-weight: bold; text-align: center; line-height: 20px;">Jumlah</th>
                <th style="border: 1px solid #000; padding: 8px 6px; background-color: #f0f0f0; font-weight: bold; text-align: center; line-height: 20px;">Ket</th>
              </tr>
            </thead>
            <tbody>
              ${data.map((item, index) => `
                <tr class="pdf-keep-together" style="break-inside: avoid; page-break-inside: avoid;">
                  <td style="border: 1px solid #000; padding: 8px 6px; text-align: center; line-height: 20px;">${index + 1}</td>
                  ${showDateColumn ? `<td style="border: 1px solid #000; padding: 8px 6px; line-height: 20px;">${escapeHtml(formatTransactionDate(item.tanggal))}</td>` : ''}
                  <td style="border: 1px solid #000; padding: 8px 6px; line-height: 20px;">${escapeHtml(item.noResi)}</td>
                  <td style="border: 1px solid #000; padding: 8px 6px; line-height: 20px;">${escapeHtml(item.pengirim)}</td>
                  <td style="border: 1px solid #000; padding: 8px 6px; line-height: 20px;">${escapeHtml(item.penerima)}</td>
                  <td style="border: 1px solid #000; padding: 8px 6px; text-align: center; line-height: 20px;">${item.coly}</td>
                  <td style="border: 1px solid #000; padding: 8px 6px; text-align: center; line-height: 20px;">${item.berat}</td>
                  <td style="border: 1px solid #000; padding: 8px 6px; text-align: center; line-height: 20px;">${item.min}</td>
                  <td style="border: 1px solid #000; padding: 8px 6px; text-align: right; line-height: 20px;">${escapeHtml(formatRupiah(item.tarif || 0))}</td>
                  <td style="border: 1px solid #000; padding: 8px 6px; text-align: right; line-height: 20px;">${escapeHtml(formatRupiah(item.total))}</td>
                  <td style="border: 1px solid #000; padding: 8px 6px; line-height: 20px;">${escapeHtml(item.keterangan || "")}</td>
                </tr>
              `).join("")}
            </tbody>
            <tfoot>
              <tr class="pdf-keep-together" style="break-inside: avoid; page-break-inside: avoid;">
                <td colspan="${getTableTotalColSpan()}" style="border: 1px solid #000; padding: 8px 6px; text-align: right; font-weight: bold; line-height: 20px;">TOTAL</td>
                <td style="border: 1px solid #000; padding: 8px 6px; text-align: right; font-weight: bold; line-height: 20px;">Rp ${formatRupiah(biayaHandling)}</td>
                <td style="border: 1px solid #000; padding: 8px 6px; line-height: 20px;"></td>
              </tr>
            </tfoot>
          </table>
          
          <!-- Calculations -->
          <div class="pdf-keep-together" style="margin-bottom: 15px; break-inside: avoid; page-break-inside: avoid;">
            <div style="display: flex; max-width: 350px; margin-bottom: 3px;">
              <span style="flex: 1;">1. Biaya handling</span>
              <span style="text-align: right; min-width: 120px;">Rp ${formatRupiah(biayaHandling)}</span>
            </div>
            <div style="display: flex; max-width: 350px; margin-bottom: 3px;">
              <span style="flex: 1;">2. Biaya Kirim Doc</span>
              <span style="text-align: right; min-width: 120px;">Rp ${formatRupiah(formData.biayaKirimDoc)}</span>
            </div>
            <div style="display: flex; max-width: 350px; font-weight: bold; border-top: 1px solid #000; padding-top: 3px; margin-top: 5px;">
              <span style="flex: 1;">TOTAL TAGIHAN</span>
              <span style="text-align: right; min-width: 120px;">Rp ${formatRupiah(totalTagihan)}</span>
            </div>
          </div>

          <!-- Payment Info -->
          <div class="pdf-keep-together" style="margin-bottom: 15px; font-size: 10px; break-inside: avoid; page-break-inside: avoid;">
            <p>Jumlah tagihan bisa ditransfer melalui :</p>
            <p><strong>Rek mandiri, 1500010112710 a/n. Janti Feine Rundengan</strong></p>
          </div>

          <!-- Closing -->
          <div class="pdf-keep-together" style="margin-bottom: 15px; break-inside: avoid; page-break-inside: avoid;">
            <p>Demikian di sampaikan, Atas perhatian dan kerjasama yang baik, Kami ucapkan Terima Kasih</p>
            <p>Hormat Kami,</p>
          </div>

          <!-- Signatures -->
          <div class="pdf-keep-together" style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 60px; break-inside: avoid; page-break-inside: avoid;">
            <div style="width: 45%; text-align: center;">
              ${selectedSignatureKiri 
                ? `<div style="height: 70px; display: flex; align-items: flex-end; justify-content: center;"><img src="${selectedSignatureKiri.imageData}" alt="Signature" style="max-height: 60px; max-width: 150px;" /></div>`
                : `<div style="border-bottom: 1px solid #000; width: 60%; margin: 0 auto 5px; margin-top: 70px;"></div>`
              }
              <p>PT. KLK Mdc</p>
              <p style="font-weight: bold;">${escapeHtml(formData.penandatanganKiri)}</p>
            </div>
            <div style="width: 45%; text-align: center;">
              ${selectedSignatureKanan 
                ? `<div style="height: 70px; display: flex; align-items: flex-end; justify-content: center;"><img src="${selectedSignatureKanan.imageData}" alt="Signature" style="max-height: 60px; max-width: 150px;" /></div>`
                : `<div style="border-bottom: 1px solid #000; width: 60%; margin: 0 auto 5px; margin-top: 70px;"></div>`
              }
              <p>Diketahui,</p>
              <p style="font-weight: bold;">${escapeHtml(formData.penandatanganKanan)}</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="pdf-keep-together" style="margin-top: 80px; font-size: 10px; break-inside: avoid; page-break-inside: avoid;">
            <p>Cc. Klk mdc</p>
          </div>
        </div>
      `

      const element = document.createElement('div')
      element.innerHTML = pdfContent
      document.body.appendChild(element)

      // Sanitize invoiceTitle for valid filename (remove special chars)
      const sanitizedTitle = (invoiceTitle || 'Invoice_KLK')
        .replace(/[/\\?%*:|"<>]/g, '-')
        .replace(/\s+/g, '_')
        .trim()
      
      const opt = {
        margin: 10,
        filename: `${sanitizedTitle}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'] as const,
          avoid: ['tr', 'thead', 'tfoot', '.pdf-keep-together']
        },
        jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'portrait' as const }
      }

      await html2pdf().set(opt).from(element).save()
      document.body.removeChild(element)

      setIsDownloadingPdf(false)
      onClose()
    } catch (error) {
      console.error("Error downloading PDF:", error)
      setIsDownloadingPdf(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">Data Invoice untuk Print</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Tanggal & Nomor Invoice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Tanggal Surat</Label>
              <Input
                value={formData.tanggalSurat}
                onChange={(e) => handleChange("tanggalSurat", e.target.value)}
                placeholder="Manado, 13 Desember 2025"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Nomor Invoice</Label>
              <SegmentedInvoiceInput
                value={formData.nomorInvoice}
                onChange={(value) => handleChange("nomorInvoice", value)}
              />
            </div>
          </div>
          
          {/* Penerima */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Nama Penerima</Label>
              <AutocompleteInput
                value={formData.namaPenerima}
                onChange={(value) => handleChange("namaPenerima", value)}
                storageKey="print_nama_penerima"
                placeholder="PT. ABC"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">Lokasi Penerima</Label>
              <AutocompleteInput
                value={formData.lokasiPenerima}
                onChange={(value) => handleChange("lokasiPenerima", value)}
                storageKey="print_lokasi_penerima"
                placeholder="Jakarta"
                className="h-10"
              />
            </div>
          </div>
          
          {/* Biaya */}
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <Label className="text-xs text-slate-500">Biaya Handling</Label>
                <p className="text-xl font-bold text-emerald-600">Rp {formatRupiah(biayaHandling)}</p>
                <p className="text-[10px] text-slate-400">Otomatis dari tabel</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Biaya Kirim Doc</Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-medium text-slate-500">Rp</span>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={biayaKirimDocDisplay}
                    onChange={handleBiayaKirimDocChange}
                    placeholder="0"
                    className="h-10 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-1 text-center sm:text-right">
                <Label className="text-xs text-slate-500">Total Tagihan</Label>
                <p className="text-xl font-bold text-blue-600">Rp {formatRupiah(totalTagihan)}</p>
                <p className="text-[10px] text-slate-400">Handling + Kirim Doc</p>
              </div>
            </div>
          </div>
          
          {/* Penandatangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Penandatangan (PT. KLK Mdc)</Label>
                <AutocompleteInput
                  value={formData.penandatanganKiri}
                  onChange={(value) => handleChange("penandatanganKiri", value)}
                  storageKey="print_penandatangan_klk"
                  placeholder="Nama penandatangan"
                  className="h-10"
                />
              </div>
              {/* Signature selector */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Tanda Tangan (opsional)</Label>
                <div className="relative">
                  <select
                    value={selectedSignatureKiri?.id || ""}
                    onChange={(e) => {
                      const sig = signatures?.find(s => s.id === e.target.value) || null
                      setSelectedSignatureKiri(sig)
                    }}
                    className="w-full h-9 px-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tanpa tanda tangan</option>
                    {signatures?.map((sig) => (
                      <option key={sig.id} value={sig.id}>{sig.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                {/* Preview */}
                {selectedSignatureKiri && (
                  <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 flex justify-center">
                    <img src={selectedSignatureKiri.imageData} alt="Preview" className="max-h-10 object-contain" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Diketahui oleh</Label>
                <AutocompleteInput
                  value={formData.penandatanganKanan}
                  onChange={(value) => handleChange("penandatanganKanan", value)}
                  storageKey="print_penandatangan_diketahui"
                  placeholder="Nama yang mengetahui"
                  className="h-10"
                />
              </div>
              {/* Signature selector */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-500">Tanda Tangan (opsional)</Label>
                <div className="relative">
                  <select
                    value={selectedSignatureKanan?.id || ""}
                    onChange={(e) => {
                      const sig = signatures?.find(s => s.id === e.target.value) || null
                      setSelectedSignatureKanan(sig)
                    }}
                    className="w-full h-9 px-3 pr-8 text-sm border border-slate-200 rounded-lg bg-white appearance-none cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Tanpa tanda tangan</option>
                    {signatures?.map((sig) => (
                      <option key={sig.id} value={sig.id}>{sig.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
                {/* Preview */}
                {selectedSignatureKanan && (
                  <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 flex justify-center">
                    <img src={selectedSignatureKanan.imageData} alt="Preview" className="max-h-10 object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto px-6"
          >
            Batal
          </Button>
          <Button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf || !formData.nomorInvoice || !formData.namaPenerima}
            className="w-full sm:w-auto px-6 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Membuat PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </>
            )}
          </Button>
          <Button
            onClick={handlePrint}
            disabled={isPrinting || !formData.nomorInvoice || !formData.namaPenerima}
            className="w-full sm:w-auto px-6 bg-blue-600 hover:bg-blue-700"
          >
            {isPrinting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Print Invoice
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
