"use client"

import * as React from "react"
import { RefreshCw, FileText, Package as PackageIcon, Download, Printer, Pencil, Check, X, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import * as XLSX from "xlsx"
import { toast } from "sonner"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { InvoiceDateModeField } from "@/components/InvoiceDateModeField"
import { PrintInvoiceModal } from "@/components/PrintInvoiceModal"
import { useUpdateInvoice, useUpdateTransaksi } from "@/lib/hooks"
import {
  isDateColumnVisible,
  isDateInputEnabled,
  normalizeInvoiceDateMode,
  type InvoiceDateMode,
} from "@/lib/invoice-date-mode"
import type { Transaksi } from "@/lib/types"

const escapeHtml = (value: string | number | null | undefined) => {
  const stringValue = String(value ?? "")
  return stringValue
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

interface TransactionTableProps {
  data: Transaksi[]
  onRefresh?: () => void
  title?: string
  invoiceId?: number | null
  dateMode?: InvoiceDateMode
}

export function TransactionTable({
  data,
  onRefresh,
  title,
  invoiceId,
  dateMode,
}: TransactionTableProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editDraft, setEditDraft] = React.useState<Transaksi | null>(null)
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false)
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = React.useState(false)
  const [pdfHtmlContent, setPdfHtmlContent] = React.useState<string>("")
  const [currentDateMode, setCurrentDateMode] = React.useState<InvoiceDateMode>(() =>
    normalizeInvoiceDateMode(dateMode)
  )

  const updateTransaksiMutation = useUpdateTransaksi()
  const updateInvoiceMutation = useUpdateInvoice()

  React.useEffect(() => {
    setCurrentDateMode(normalizeInvoiceDateMode(dateMode))
  }, [dateMode])

  const isSelectedInvoiceDetail = invoiceId !== null && invoiceId !== undefined
  const showDateColumn = isDateColumnVisible(currentDateMode)
  const canEditRowDate = isDateInputEnabled(currentDateMode)
  const summaryLabelColSpan = showDateColumn ? 9 : 8

  const formatNumber = (num: number): string => {
    return num.toLocaleString("id-ID")
  }

  const formatVisibleDate = React.useCallback(
    (tanggal: string | null | undefined, emptyText = "-"): string => {
      if (!showDateColumn || !canEditRowDate) {
        return ""
      }

      return tanggal ? format(new Date(tanggal), "dd MMM yyyy", { locale: id }) : emptyText
    },
    [canEditRowDate, showDateColumn]
  )

  const formatTableDate = (tanggal: string | null | undefined): string => {
    return formatVisibleDate(tanggal)
  }

  const formatOutputDate = (tanggal: string | null | undefined): string => {
    return formatVisibleDate(tanggal)
  }

  const getDraftTotal = (item: Transaksi) => {
    return Math.max(item.berat, item.min) * item.tarif
  }

  const handleDateModeChange = async (nextMode: InvoiceDateMode) => {
    if (
      !isSelectedInvoiceDetail ||
      !invoiceId ||
      nextMode === currentDateMode ||
      updateInvoiceMutation.isPending
    ) {
      return
    }

    const previousMode = currentDateMode
    setCurrentDateMode(nextMode)

    try {
      await updateInvoiceMutation.mutateAsync({
        id: invoiceId,
        payload: {
          dateMode: nextMode,
        },
      })
      toast.success("Mode tanggal invoice berhasil diperbarui")
    } catch (error: unknown) {
      setCurrentDateMode(previousMode)
      const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui mode tanggal invoice"
      if (typeof error === "object" && error !== null && "response" in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        toast.error(axiosError.response?.data?.error || errorMessage)
      } else {
        toast.error(errorMessage)
      }
    }
  }

  // API mutation for updating

  const handleRefresh = () => {
    if (!onRefresh) return
    setIsRefreshing(true)
    onRefresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const startEdit = (item: Transaksi) => {
    setEditingId(item.id)
    setEditDraft({ ...item })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft(null)
  }

  const saveEdit = async () => {
    if (!editingId || !editDraft) return

    const calculatedTotal = getDraftTotal(editDraft)

    try {
      await updateTransaksiMutation.mutateAsync({
        id: editingId,
        payload: {
          tanggal: editDraft.tanggal,
          pengirim: editDraft.pengirim,
          penerima: editDraft.penerima,
          coly: editDraft.coly,
          berat: editDraft.berat,
          min: editDraft.min,
          tarif: editDraft.tarif,
          total: calculatedTotal,
          noResi: editDraft.noResi,
          keterangan: editDraft.keterangan ?? "",
        },
      })
      toast.success("Transaksi berhasil diperbarui")
      cancelEdit()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui transaksi"
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        toast.error(axiosError.response?.data?.error || errorMessage)
      } else {
        toast.error(errorMessage)
      }
    }
  }

  const handleEditChange = (field: keyof Transaksi, value: string | number) => {
    if (!editDraft) return
    setEditDraft((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  // Export to Excel
  const exportToExcel = () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diekspor")
      return
    }

    const excelData: Record<string, string | number>[] = data.map((item) => ({
      ...(showDateColumn ? { "Hari/Tgl": formatOutputDate(item.tanggal) } : {}),
      "No Stt": item.noResi,
      Pengirim: item.pengirim,
      Penerima: item.penerima,
      C: item.coly,
      Kg: item.berat,
      Min: item.min || "",
      Tarif: formatNumber(item.tarif || 0),
      Jumlah: formatNumber(item.total),
      Ket: item.keterangan || "",
    }))

    const totalRevenue = data.reduce((sum, item) => sum + item.total, 0)
    excelData.push({
      ...(showDateColumn ? { "Hari/Tgl": "" } : {}),
      "No Stt": "",
      Pengirim: "",
      Penerima: "",
      C: "",
      Kg: "",
      Min: "",
      Tarif: "",
      Jumlah: formatNumber(totalRevenue),
      Ket: "",
    })

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Perhitungan Pengiriman Barang")

    // Generate filename with current date
    const filename = `Perhitungan_Pengiriman_Barang_${format(new Date(), "yyyy-MM-dd")}.xlsx`

    // Save file
    XLSX.writeFile(wb, filename)
  }

  const generatePdfHtml = React.useCallback(() => {
    const totalRevenue = data.reduce((sum, item) => sum + item.total, 0)

    return `
      <div style="font-family: Arial, sans-serif; font-size: 11px; padding: 20px; box-sizing: border-box; background: #fff;">
        <h2 class="pdf-keep-together" style="text-align: center; margin-bottom: 20px; break-inside: avoid; page-break-inside: avoid;">${escapeHtml(title || "Perhitungan Pengiriman Barang")}</h2>
        <p class="pdf-keep-together" style="margin-bottom: 10px; break-inside: avoid; page-break-inside: avoid;">Tanggal: ${format(new Date(), "dd MMMM yyyy", { locale: id })}</p>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead style="display: table-header-group;">
            <tr class="pdf-keep-together" style="background-color: #f0f0f0; break-inside: avoid; page-break-inside: avoid;">
              <th style="border: 1px solid #000; padding: 6px; text-align: center;">No</th>
              ${showDateColumn ? '<th style="border: 1px solid #000; padding: 6px;">Hari/Tgl</th>' : ""}
              <th style="border: 1px solid #000; padding: 6px;">No Stt</th>
              <th style="border: 1px solid #000; padding: 6px;">Pengirim</th>
              <th style="border: 1px solid #000; padding: 6px;">Penerima</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: center;">C</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: center;">Kg</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: center;">Min</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: right;">Tarif</th>
              <th style="border: 1px solid #000; padding: 6px; text-align: right;">Jumlah</th>
              <th style="border: 1px solid #000; padding: 6px;">Ket</th>
            </tr>
          </thead>
          <tbody>
            ${data.map((item, index) => {
              const outputDate = formatVisibleDate(item.tanggal, "")

              return `
                <tr class="pdf-keep-together" style="break-inside: avoid; page-break-inside: avoid;">
                  <td style="border: 1px solid #000; padding: 4px; text-align: center;">${index + 1}</td>
                  ${showDateColumn ? `<td style="border: 1px solid #000; padding: 4px;">${escapeHtml(outputDate)}</td>` : ""}
                  <td style="border: 1px solid #000; padding: 4px;">${escapeHtml(item.noResi)}</td>
                  <td style="border: 1px solid #000; padding: 4px;">${escapeHtml(item.pengirim)}</td>
                  <td style="border: 1px solid #000; padding: 4px;">${escapeHtml(item.penerima)}</td>
                  <td style="border: 1px solid #000; padding: 4px; text-align: center;">${item.coly}</td>
                  <td style="border: 1px solid #000; padding: 4px; text-align: center;">${item.berat}</td>
                  <td style="border: 1px solid #000; padding: 4px; text-align: center;">${item.min || ""}</td>
                  <td style="border: 1px solid #000; padding: 4px; text-align: right;">${escapeHtml((item.tarif || 0).toLocaleString("id-ID"))}</td>
                  <td style="border: 1px solid #000; padding: 4px; text-align: right;">${escapeHtml(item.total.toLocaleString("id-ID"))}</td>
                  <td style="border: 1px solid #000; padding: 4px;">${escapeHtml(item.keterangan || "")}</td>
                </tr>
              `
            }).join("")}
          </tbody>
          <tfoot>
            <tr class="pdf-keep-together" style="break-inside: avoid; page-break-inside: avoid;">
              <td colspan="${showDateColumn ? 9 : 8}" style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">TOTAL</td>
              <td style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">${totalRevenue.toLocaleString("id-ID")}</td>
              <td style="border: 1px solid #000; padding: 6px;"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    `
  }, [data, formatVisibleDate, showDateColumn, title])

  const openPdfPreview = () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diekspor")
      return
    }
    setPdfHtmlContent(generatePdfHtml())
    setIsPdfPreviewOpen(true)
  }

  // Download PDF from preview
  React.useEffect(() => {
    if (!isPdfPreviewOpen) {
      return
    }

    setPdfHtmlContent(generatePdfHtml())
  }, [generatePdfHtml, isPdfPreviewOpen])

  const downloadPdf = async () => {
    toast.loading("Membuat file PDF...", { id: "pdf-export" })

    try {
      const html2pdf = (await import('html2pdf.js')).default

      const element = document.createElement('div')
      element.innerHTML = pdfHtmlContent
      document.body.appendChild(element)

      const opt = {
        margin: 10,
        filename: `${title || "Perhitungan_Pengiriman_Barang"}_${format(new Date(), "yyyy-MM-dd")}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'] as const,
          avoid: ['tr', 'thead', 'tfoot', '.pdf-keep-together']
        },
        jsPDF: { unit: 'mm' as const, format: 'a4', orientation: 'landscape' as const }
      }

      await html2pdf().set(opt).from(element).save()
      document.body.removeChild(element)

      toast.success("PDF berhasil diunduh!", { id: "pdf-export" })
      setIsPdfPreviewOpen(false)
    } catch (error) {
      console.error("Error exporting PDF:", error)
      toast.error("Gagal mengexport PDF", { id: "pdf-export" })
    }
  }


  return (
    <Card className="w-full shadow-elevation border-0 overflow-hidden bg-gradient-to-br from-white to-slate-50/50">
      {/* Gradient Header */}
      <div className="h-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500"></div>
      
      <CardHeader className="pb-4">
        <div className="space-y-4">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            <div className="space-y-1.5 w-full xl:w-auto">
              <CardTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/30 flex-shrink-0">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <span className="truncate">{title || 'Laporan Transaksi'}</span>
              </CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="flex-1 sm:flex-none gap-2 border-2 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                disabled={data.length === 0}
                className="flex-1 sm:flex-none gap-2 border-2 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Excel</span>
                <span className="sm:hidden">Excel</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={openPdfPreview}
                disabled={data.length === 0}
                className="flex-1 sm:flex-none gap-2 border-2 hover:border-red-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Preview PDF</span>
                <span className="sm:hidden">Preview</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPrintModalOpen(true)}
                disabled={data.length === 0}
                className="flex-1 sm:flex-none gap-2 border-2 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print / PDF</span>
                <span className="sm:hidden">Print/PDF</span>
              </Button>
            </div>
          </div>

          {isSelectedInvoiceDetail && (
            <div className="rounded-xl border border-slate-200 bg-white/80 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Mode tanggal invoice</h3>
                  <p className="text-xs text-slate-500">
                    Atur tampilan tanggal untuk detail invoice, print, dan PDF.
                  </p>
                </div>
                {updateInvoiceMutation.isPending && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan mode tanggal...
                  </div>
                )}
              </div>
              <InvoiceDateModeField
                value={currentDateMode}
                onChange={handleDateModeChange}
                disabled={updateInvoiceMutation.isPending}
              />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {data.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-slate-100 to-slate-200">
              <PackageIcon className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Belum Ada Transaksi</h3>
            <p className="text-sm text-slate-500">
              Transaksi yang Anda input akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-50 border-b-2 border-slate-200">
                    <TableHead className="font-bold text-slate-700 text-center">No</TableHead>
                    {showDateColumn && <TableHead className="font-bold text-slate-700">Tgl</TableHead>}
                    <TableHead className="font-bold text-slate-700">No STT</TableHead>
                    <TableHead className="font-bold text-slate-700">Pengirim</TableHead>
                    <TableHead className="font-bold text-slate-700">Penerima</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Coly</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Kg</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Min</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Tarif</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Total</TableHead>
                    <TableHead className="font-bold text-slate-700">Ket</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => {
                    const isEditing = editingId === item.id
                    const draft = isEditing ? editDraft : item
                    const rowTotal = draft ? getDraftTotal(draft) : item.total

                    return (
                      <TableRow
                        key={item.id || index}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 border-b border-slate-100"
                      >
                        <TableCell className="text-center text-slate-600 font-medium">
                          {index + 1}
                        </TableCell>
                        {showDateColumn && (
                          <TableCell className="text-slate-600">
                            {isEditing && canEditRowDate ? (
                              <Input
                                value={draft?.tanggal ? format(new Date(draft.tanggal), "yyyy-MM-dd") : ""}
                                type="date"
                                className="w-32"
                                onChange={(e) => handleEditChange("tanggal", e.target.value)}
                              />
                            ) : (
                              <span>{formatTableDate(draft?.tanggal)}</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="font-mono font-bold text-blue-600 group-hover:text-blue-700">
                          {isEditing ? (
                            <Input
                              value={draft?.noResi || ""}
                              className="w-28"
                              onChange={(e) => handleEditChange("noResi", e.target.value)}
                            />
                          ) : (
                            item.noResi
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {isEditing ? (
                            <Input
                              value={draft?.pengirim || ""}
                              className="w-32"
                              onChange={(e) => handleEditChange("pengirim", e.target.value)}
                            />
                          ) : (
                            item.pengirim
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {isEditing ? (
                            <Input
                              value={draft?.penerima || ""}
                              className="w-32"
                              onChange={(e) => handleEditChange("penerima", e.target.value)}
                            />
                          ) : (
                            item.penerima
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">
                          {isEditing ? (
                            <Input
                              value={draft?.coly ?? 0}
                              type="number"
                              className="w-16 text-right"
                              onChange={(e) => handleEditChange("coly", Number(e.target.value))}
                            />
                          ) : (
                            item.coly
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700">
                          {isEditing ? (
                            <Input
                              value={draft?.berat ?? 0}
                              type="number"
                              step="0.1"
                              className="w-16 text-right"
                              onChange={(e) => handleEditChange("berat", Number(e.target.value))}
                            />
                          ) : (
                            item.berat
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-orange-600">
                          {isEditing ? (
                            <Input
                              value={draft?.min ?? 0}
                              type="number"
                              className="w-16 text-right"
                              onChange={(e) => handleEditChange("min", Number(e.target.value))}
                            />
                          ) : (
                            item.min
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-600">
                          {isEditing ? (
                            <Input
                              value={draft?.tarif ?? 0}
                              type="number"
                              className="w-20 text-right"
                              onChange={(e) => handleEditChange("tarif", Number(e.target.value))}
                            />
                          ) : (
                            `Rp ${(item.tarif || 0).toLocaleString("id-ID")}`
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-lg text-emerald-600">
                            Rp {rowTotal.toLocaleString("id-ID")}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {isEditing ? (
                            <Input
                              value={draft?.keterangan || ""}
                              placeholder="Ket..."
                              className="w-24"
                              onChange={(e) => handleEditChange("keterangan", e.target.value)}
                            />
                          ) : (
                            item.keterangan || "-"
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-green-700 border-green-200 hover:bg-green-50"
                                onClick={saveEdit}
                                disabled={updateTransaksiMutation.isPending}
                              >
                                {updateTransaksiMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-slate-600 hover:bg-slate-100"
                                onClick={cancelEdit}
                                disabled={updateTransaksiMutation.isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-blue-600 hover:bg-blue-50"
                              onClick={() => startEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}

                  <TableRow className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-t-2 border-emerald-200 font-bold hover:from-emerald-100 hover:to-emerald-50">
                    <TableCell colSpan={summaryLabelColSpan} className="text-right text-emerald-800 text-base">
                      Grand Total:
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-xl text-emerald-700">
                        Rp {data.reduce((sum, item) => sum + item.total, 0).toLocaleString("id-ID")}
                      </span>
                    </TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>

      {/* Print Invoice Modal */}
      <PrintInvoiceModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        data={data}
        invoiceTitle={title}
        dateMode={currentDateMode}
        invoiceKey={invoiceId ? String(invoiceId) : title || "new-invoice"}
      />

      {/* PDF Preview Modal */}
      {isPdfPreviewOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-slate-800">Preview PDF</h2>
              <div className="flex gap-2">
                <Button 
                  onClick={downloadPdf}
                  className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setIsPdfPreviewOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-100">
              <div 
                className="bg-white shadow-lg mx-auto p-6" 
                style={{ maxWidth: '1100px' }}
                dangerouslySetInnerHTML={{ __html: pdfHtmlContent }} 
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
