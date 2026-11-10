"use client"

import * as React from "react"
import { X, Printer, Loader2, Download, ChevronDown, ExternalLink, RefreshCw } from "lucide-react"
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
  normalizeInvoiceDateMode,
  type InvoiceDateMode,
} from "@/lib/invoice-date-mode"
import { downloadInvoicePdf } from "@/lib/api"
import { useUpdateInvoice } from "@/lib/hooks"
import { useInvoicePdfPreview } from "@/lib/hooks/useInvoicePdfPreview"
import type { InvoicePdfColumnWidths } from "@/lib/invoice-pdf-columns"
import type { InvoicePrintSettings, Transaksi, Signature } from "@/lib/types"
import { InvoiceColumnWidthEditor } from "./InvoiceColumnWidthEditor"
import { InvoiceDocument } from "./InvoiceDocument"

interface InvoicePdfPaginationOptions {
  pageContentHeight: number
  firstPageBeforeTableHeight: number
  tableHeaderHeight: number
  rowHeights: number[]
  finalPageReserveHeight: number
  safetyReserveHeight: number
  firstPageSafetyReserveHeight: number
}

const A4_PORTRAIT_WIDTH_MM = 210
const A4_PORTRAIT_HEIGHT_MM = 297
// Must match the @page margin (1.5cm) in the print window so measured page
// capacity equals what the browser actually fits when printing.
const PDF_MARGIN_MM = 15
const PDF_CONTINUATION_TOP_PADDING = 12
const PDF_MIN_MIDDLE_PAGE_ROWS = 8

function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const paginateInvoicePdfRows = (rows: Transaksi[], options: InvoicePdfPaginationOptions) => {
  if (rows.length === 0) {
    return [rows]
  }

  const chunks: Transaksi[][] = []
  let rowIndex = 0

  const getTableCapacity = (isFirstPage: boolean, includesFinalFooter: boolean) => {
    const beforeTableHeight = isFirstPage
      ? options.firstPageBeforeTableHeight
      : PDF_CONTINUATION_TOP_PADDING
    const tableCapacity =
      options.pageContentHeight -
      beforeTableHeight -
      options.tableHeaderHeight -
      options.safetyReserveHeight -
      (isFirstPage ? options.firstPageSafetyReserveHeight : 0)

    return includesFinalFooter ? tableCapacity - options.finalPageReserveHeight : tableCapacity
  }

  const getRowsHeight = (startIndex: number, endIndex: number) => {
    let height = 0
    for (let index = startIndex; index < endIndex; index += 1) {
      height += options.rowHeights[index] || 0
    }
    return height
  }

  const getPageEndIndex = (startIndex: number, capacity: number) => {
    let usedHeight = 0
    let endIndex = startIndex

    while (endIndex < rows.length) {
      const nextHeight = options.rowHeights[endIndex] || 0
      if (endIndex > startIndex && usedHeight + nextHeight > capacity) {
        break
      }

      usedHeight += nextHeight
      endIndex += 1
    }

    return endIndex
  }

  while (rowIndex < rows.length) {
    const isFirstPage = chunks.length === 0
    const finalCapacity = getTableCapacity(isFirstPage, true)

    if (getRowsHeight(rowIndex, rows.length) <= finalCapacity) {
      chunks.push(rows.slice(rowIndex))
      break
    }

    const normalCapacity = getTableCapacity(isFirstPage, false)
    let pageEndIndex = getPageEndIndex(rowIndex, normalCapacity)

    if (pageEndIndex >= rows.length) {
      const nextFinalCapacity = getTableCapacity(false, true)
      let finalStartIndex = rows.length - 1

      for (let index = rowIndex + 1; index < rows.length; index += 1) {
        if (getRowsHeight(index, rows.length) <= nextFinalCapacity) {
          finalStartIndex = index
          break
        }
      }

      const middlePageRows = finalStartIndex - rowIndex
      pageEndIndex = middlePageRows >= PDF_MIN_MIDDLE_PAGE_ROWS
        ? finalStartIndex
        : Math.max(rowIndex + 1, rows.length - 1)
    }

    chunks.push(rows.slice(rowIndex, pageEndIndex))
    rowIndex = pageEndIndex
  }

  return chunks
}

interface PrintInvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  data: Transaksi[]
  invoiceTitle?: string
  dateMode?: InvoiceDateMode
  showKeteranganColumn?: boolean
  invoiceId?: number | null
  printSettings?: InvoicePrintSettings | null
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

export function PrintInvoiceModal({ isOpen, onClose, data, invoiceTitle, dateMode, showKeteranganColumn, invoiceId, printSettings, invoiceKey }: PrintInvoiceModalProps) {
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
  // Table column widths the user changed (mm); the rest follow the defaults.
  const [columnWidths, setColumnWidths] = React.useState<InvoicePdfColumnWidths>({})

  // Signature selection state
  const [selectedSignatureKiri, setSelectedSignatureKiri] = React.useState<Signature | null>(null)
  const [selectedSignatureKanan, setSelectedSignatureKanan] = React.useState<Signature | null>(null)
  
  // Fetch available signatures
  const { data: signatures } = useSignatures()

  const currentDateMode = normalizeInvoiceDateMode(dateMode)
  const showDateColumn = isDateColumnVisible(currentDateMode)
  const currentShowKeteranganColumn = showKeteranganColumn !== false

  // Off-screen document rendering states
  const [logoBase64, setLogoBase64] = React.useState("")
  const [measuredChunks, setMeasuredChunks] = React.useState<Transaksi[][]>([])
  const [isPrintingActive, setIsPrintingActive] = React.useState(false)

  const measurementRef = React.useRef<HTMLDivElement>(null)
  const printRef = React.useRef<HTMLDivElement>(null)

  // Load logo as base64 on open
  React.useEffect(() => {
    if (!isOpen) return
    let isMounted = true
    const loadLogo = async () => {
      try {
        const response = await fetch('/klkexpress.png')
        const blob = await response.blob()
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
        if (isMounted) {
          setLogoBase64(base64)
        }
      } catch (error) {
        console.error('Failed to load logo:', error)
      }
    }
    loadLogo()
    return () => {
      isMounted = false
    }
  }, [isOpen])

  // Seed the form from the invoice's saved print settings every time the
  // modal opens, so previously entered data comes back automatically.
  const printSettingsRef = React.useRef(printSettings)
  printSettingsRef.current = printSettings
  const skipNextAutosaveRef = React.useRef(true)

  React.useEffect(() => {
    if (!isOpen) return
    const saved = printSettingsRef.current
    skipNextAutosaveRef.current = true
    setFormData({
      tanggalSurat: saved?.tanggalSurat || `Manado, ${format(new Date(), "dd MMMM yyyy", { locale: id })}`,
      nomorInvoice: saved?.nomorInvoice || "",
      namaPenerima: saved?.namaPenerima || "",
      lokasiPenerima: saved?.lokasiPenerima || "Jakarta",
      biayaKirimDoc: saved?.biayaKirimDoc || 0,
      penandatanganKiri: saved?.penandatanganKiri || "",
      penandatanganKanan: saved?.penandatanganKanan || "",
    })
    setBiayaKirimDocDisplay(saved?.biayaKirimDoc ? saved.biayaKirimDoc.toLocaleString("id-ID") : "")
    // printSettings is free-form JSON from the database: accept only a plain object.
    const savedWidths: unknown = saved?.columnWidths
    setColumnWidths(
      typeof savedWidths === "object" && savedWidths !== null && !Array.isArray(savedWidths)
        ? (savedWidths as InvoicePdfColumnWidths)
        : {}
    )
    setSelectedSignatureKiri(
      saved?.signatureKiriId ? signatures?.find((s) => s.id === saved.signatureKiriId) || null : null
    )
    setSelectedSignatureKanan(
      saved?.signatureKananId ? signatures?.find((s) => s.id === saved.signatureKananId) || null : null
    )
    setMeasuredChunks([])
    setIsPrintingActive(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, invoiceKey, signatures])

  // Calculate totals
  const biayaHandling = data.reduce((sum, item) => sum + item.total, 0)
  const totalTagihan = biayaHandling + formData.biayaKirimDoc

  const handleChange = (field: keyof PrintFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const formatRupiah = (num: number): string => {
    return num.toLocaleString("id-ID")
  }

  const handleBiayaKirimDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
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

  const waitForImagesToLoad = async (container: HTMLElement) => {
    const images = Array.from(container.querySelectorAll("img"))
    await Promise.all(images.map((image) => {
      if (image.complete) {
        return Promise.resolve()
      }

      return new Promise<void>((resolve) => {
        image.onload = () => resolve()
        image.onerror = () => resolve()
      })
    }))
  }

  const measureInvoicePdfChunks = async () => {
    const container = measurementRef.current
    if (!container) {
      return {
        rowChunks: [data],
        pageContentHeight: 0,
        firstPageBeforeTableHeight: 0,
        tableHeaderHeight: 0,
        rowHeights: [],
      }
    }

    await waitForImagesToLoad(container)

    const root = container.firstElementChild as HTMLElement | null
    const table = container.querySelector('[data-pdf-table="true"]') as HTMLTableElement | null
    const tableHeader = table?.querySelector("thead") as HTMLElement | null
    const tableFooter = table?.querySelector("tfoot") as HTMLElement | null
    const tableRows = Array.from(table?.querySelectorAll("tbody tr") || []) as HTMLTableRowElement[]
    const afterTable = container.querySelector('[data-pdf-after-table="true"]') as HTMLElement | null

    if (!root || !table || !tableHeader || tableRows.length !== data.length) {
      return {
        rowChunks: [data],
        pageContentHeight: 0,
        firstPageBeforeTableHeight: 0,
        tableHeaderHeight: 0,
        rowHeights: [],
      }
    }

    const rootRect = root.getBoundingClientRect()
    const tableRect = table.getBoundingClientRect()
    const tableStyle = window.getComputedStyle(table)
    const rootStyle = window.getComputedStyle(root)
    const pageInnerWidthMm = A4_PORTRAIT_WIDTH_MM - PDF_MARGIN_MM * 2
    const pageInnerHeightMm = A4_PORTRAIT_HEIGHT_MM - PDF_MARGIN_MM * 2
    const pageContentHeight = rootRect.width * (pageInnerHeightMm / pageInnerWidthMm)
    const tableBottomMargin = parseFloat(tableStyle.marginBottom) || 0
    const rootPaddingBottom = parseFloat(rootStyle.paddingBottom) || 0
    const finalPageReserveHeight =
      (tableFooter?.getBoundingClientRect().height || 0) +
      tableBottomMargin +
      (afterTable?.getBoundingClientRect().height || 0) +
      rootPaddingBottom

    const rowHeights = tableRows.map((row) => row.getBoundingClientRect().height)
    const safetyReserveHeight = Math.max(...rowHeights, 24)
    const firstPageSafetyReserveHeight = safetyReserveHeight * 3
    const firstPageBeforeTableHeight = tableRect.top - rootRect.top
    const tableHeaderHeight = tableHeader.getBoundingClientRect().height

    const computedChunks = paginateInvoicePdfRows(data, {
      pageContentHeight,
      firstPageBeforeTableHeight,
      tableHeaderHeight,
      rowHeights,
      finalPageReserveHeight,
      safetyReserveHeight,
      firstPageSafetyReserveHeight,
    })

    return {
      rowChunks: computedChunks,
      pageContentHeight,
      firstPageBeforeTableHeight,
      tableHeaderHeight,
      rowHeights,
    }
  }

  const handlePrint = async () => {
    persistSettings()
    setIsPrinting(true)
    const measurement = await measureInvoicePdfChunks()
    setMeasuredChunks(measurement.rowChunks)
    setIsPrintingActive(true)
  }

  // Handle printing asynchronously once paginated chunks are rendered
  React.useEffect(() => {
    const currentPrintEl = printRef.current
    if (!isPrintingActive || measuredChunks.length === 0 || !currentPrintEl) {
      return
    }

    const doPrint = () => {
      const printWindow = window.open("", "_blank")
      if (!printWindow) {
        setIsPrinting(false)
        setIsPrintingActive(false)
        setMeasuredChunks([])
        return
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice</title>
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
                background: #fff;
              }
              .pdf-keep-together {
                break-inside: avoid;
                page-break-inside: avoid;
              }
            </style>
          </head>
          <body>
            <div id="print-root"></div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.document.title = `Invoice - ${invoiceTitle || 'KLK Express'}`

      const printRoot = printWindow.document.getElementById("print-root")
      if (printRoot) {
        const cloned = currentPrintEl.cloneNode(true)
        printRoot.appendChild(printWindow.document.importNode(cloned, true))
      }

      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
        setIsPrinting(false)
        setIsPrintingActive(false)
        setMeasuredChunks([])
        onClose()
      }, 500)
    }

    doPrint()
  }, [isPrintingActive, measuredChunks, invoiceTitle, onClose])

  const updateInvoiceMutation = useUpdateInvoice()
  const hasColumnWidths = Object.keys(columnWidths).length > 0

  const buildPrintSettings = React.useCallback((): InvoicePrintSettings => ({
    tanggalSurat: formData.tanggalSurat,
    nomorInvoice: formData.nomorInvoice,
    namaPenerima: formData.namaPenerima,
    lokasiPenerima: formData.lokasiPenerima,
    biayaKirimDoc: formData.biayaKirimDoc,
    penandatanganKiri: formData.penandatanganKiri,
    penandatanganKanan: formData.penandatanganKanan,
    signatureKiriId: selectedSignatureKiri?.id ?? null,
    signatureKananId: selectedSignatureKanan?.id ?? null,
    ...(hasColumnWidths ? { columnWidths } : {}),
  }), [formData, selectedSignatureKiri, selectedSignatureKanan, hasColumnWidths, columnWidths])

  const persistSettings = React.useCallback(() => {
    if (!invoiceId) return
    updateInvoiceMutation.mutate({ id: invoiceId, payload: { printSettings: buildPrintSettings() } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId, buildPrintSettings])

  // Autosave (debounced) whenever the user edits the print form
  React.useEffect(() => {
    if (!isOpen || !invoiceId) return
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false
      return
    }
    const timer = setTimeout(persistSettings, 1200)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, selectedSignatureKiri, selectedSignatureKanan, columnWidths])

  const handleClose = () => {
    if (isOpen && invoiceId && !skipNextAutosaveRef.current) {
      persistSettings()
    }
    onClose()
  }

  const pdfPayload = React.useMemo(
    () => ({
      invoiceTitle,
      dateMode: currentDateMode,
      showKeteranganColumn: currentShowKeteranganColumn,
      formData,
      selectedSignatureKiri,
      selectedSignatureKanan,
      logoBase64,
      ...(hasColumnWidths ? { columnWidths } : {}),
      transactions: data,
    }),
    [
      invoiceTitle,
      currentDateMode,
      currentShowKeteranganColumn,
      formData,
      selectedSignatureKiri,
      selectedSignatureKanan,
      logoBase64,
      hasColumnWidths,
      columnWidths,
      data,
    ]
  )

  // The preview is the real PDF from the backend, refreshed as the form changes.
  const preview = useInvoicePdfPreview(pdfPayload, isOpen)

  const handleDownloadPdf = async () => {
    persistSettings()
    setIsDownloadingPdf(true)

    try {
      const sanitizedTitle = (invoiceTitle || 'Invoice_KLK')
        .replace(/[/\\?%*:|"<>]/g, '-')
        .replace(/\s+/g, '_')
        .trim()

      const pdf = await downloadInvoicePdf(pdfPayload)

      saveBlob(pdf, `${sanitizedTitle}.pdf`)
      onClose()
    } catch (error) {
      console.error("Error downloading PDF:", error)
    } finally {
      setIsDownloadingPdf(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Off-screen elements for measurement & printing */}
      {/* 180mm = printable width of A4 portrait with 1.5cm @page margins, so the
          off-screen layout wraps and measures exactly like the printed page. */}
      <div style={{ position: "absolute", left: "-10000px", top: "0px", width: "180mm", pointerEvents: "none", zIndex: -1, visibility: "hidden", background: "#fff" }}>
        <div ref={measurementRef}>
          <InvoiceDocument
            data={data}
            formData={formData}
            selectedSignatureKiri={selectedSignatureKiri}
            selectedSignatureKanan={selectedSignatureKanan}
            logoBase64={logoBase64}
            showDateColumn={showDateColumn}
            currentShowKeteranganColumn={currentShowKeteranganColumn}
            paginated={false}
          />
        </div>
        <div ref={printRef}>
          {measuredChunks.length > 0 ? (
            <InvoiceDocument
              data={data}
              formData={formData}
              selectedSignatureKiri={selectedSignatureKiri}
              selectedSignatureKanan={selectedSignatureKanan}
              logoBase64={logoBase64}
              showDateColumn={showDateColumn}
              currentShowKeteranganColumn={currentShowKeteranganColumn}
              paginated={true}
              rowChunks={measuredChunks}
            />
          ) : null}
        </div>
      </div>

      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative m-3 flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:m-4">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white p-4">
          <h2 className="text-lg font-bold text-slate-800">Editor PDF Invoice</h2>
          <button
            onClick={handleClose}
            aria-label="Tutup editor"
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body: settings on the left, live PDF preview on the right.
            Below lg the two stack and the body scrolls as one. */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        {/* Settings */}
        <div className="space-y-5 p-5 lg:w-[380px] lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-slate-200">
          {/* Tanggal & Nomor Invoice */}
          <div className="grid grid-cols-1 gap-4">
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
          <div className="grid grid-cols-1 gap-4">
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
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1">
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
              <div className="space-y-1">
                <Label className="text-xs text-slate-500">Total Tagihan</Label>
                <p className="text-xl font-bold text-blue-600">Rp {formatRupiah(totalTagihan)}</p>
                <p className="text-[10px] text-slate-400">Handling + Kirim Doc</p>
              </div>
            </div>
          </div>
          
          {/* Penandatangan */}
          <div className="grid grid-cols-1 gap-4">
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

          {/* Lebar kolom tabel pada PDF */}
          <InvoiceColumnWidthEditor
            showDate={showDateColumn}
            showKet={currentShowKeteranganColumn}
            value={columnWidths}
            onChange={setColumnWidths}
          />
        </div>
        
        {/* Preview */}
        <div className="flex h-[70vh] shrink-0 flex-col border-t border-slate-200 bg-klk-canvas lg:h-auto lg:min-w-0 lg:flex-1 lg:shrink lg:border-t-0">
          <div className="flex min-h-10 shrink-0 items-center justify-between gap-2 border-b border-klk-line bg-white px-4 py-2">
            <div className="flex min-w-0 items-center gap-2 text-[12.5px]" aria-live="polite">
              {preview.error ? (
                <>
                  <span className="font-medium text-klk-red">Preview gagal diperbarui</span>
                  <button
                    type="button"
                    onClick={preview.retry}
                    className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-klk-line-strong px-2.5 font-semibold text-klk-ink-2 transition-colors hover:bg-klk-canvas"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Coba lagi
                  </button>
                </>
              ) : preview.isLoading ? (
                <span className="inline-flex items-center gap-1.5 text-klk-ink-3">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {preview.url ? "Memperbarui..." : "Membuat preview..."}
                </span>
              ) : (
                <span className="text-klk-ink-3">Preview PDF</span>
              )}
            </div>
            {preview.url && (
              <a
                href={preview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border border-klk-line-strong px-2.5 text-[12.5px] font-semibold text-klk-ink-2 transition-colors hover:bg-klk-canvas"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Buka di tab baru
              </a>
            )}
          </div>
          {preview.url ? (
            // A fresh iframe per PDF: changing `src` in place would add a browser
            // history entry for every refresh, each pointing at a revoked blob.
            <iframe
              key={preview.url}
              src={preview.url}
              title="Preview PDF invoice"
              className="min-h-0 w-full flex-1 border-0"
            />
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-center text-sm text-klk-ink-3">
              {preview.error
                ? "Preview belum bisa dibuat. Periksa koneksi lalu coba lagi."
                : "Preview PDF akan muncul di sini."}
            </div>
          )}
        </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col-reverse justify-end gap-3 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto px-6"
          >
            Batal
          </Button>
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={isPrinting || !formData.nomorInvoice || !formData.namaPenerima}
            className="w-full sm:w-auto px-6"
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
          <Button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf || !formData.nomorInvoice || !formData.namaPenerima}
            className="w-full sm:w-auto px-6 bg-klk-green hover:bg-klk-green-hover text-white"
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
        </div>
      </div>
    </div>
  )
}
