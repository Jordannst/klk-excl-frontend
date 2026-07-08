"use client"

import * as React from "react"
import { RefreshCw, FileText, Package as PackageIcon, Download, Printer, Pencil, X, Loader2 } from "lucide-react"
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
import { EditTransactionDialog } from "@/components/EditTransactionDialog"
import { InvoiceDateModeField } from "@/components/InvoiceDateModeField"
import { PrintInvoiceModal } from "@/components/PrintInvoiceModal"
import { downloadTransactionsPdf } from "@/lib/api"
import { useUpdateInvoice, useUpdateTransaksi } from "@/lib/hooks"
import {
  isDateColumnVisible,
  isDateInputEnabled,
  normalizeInvoiceDateMode,
  type InvoiceDateMode,
} from "@/lib/invoice-date-mode"
import type { Transaksi, UpdateTransaksiPayload } from "@/lib/types"

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

interface TransactionTableProps {
  data: Transaksi[]
  onRefresh?: () => void
  title?: string
  invoiceId?: number | null
  dateMode?: InvoiceDateMode
  showKeteranganColumn?: boolean
}

export function TransactionTable({
  data,
  onRefresh,
  title,
  invoiceId,
  dateMode,
  showKeteranganColumn,
}: TransactionTableProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Transaksi | null>(null)
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false)
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = React.useState(false)
  const [currentDateMode, setCurrentDateMode] = React.useState<InvoiceDateMode>(() =>
    normalizeInvoiceDateMode(dateMode)
  )
  const [currentShowKeteranganColumn, setCurrentShowKeteranganColumn] = React.useState<boolean>(
    showKeteranganColumn !== false
  )

  const updateTransaksiMutation = useUpdateTransaksi()
  const updateInvoiceMutation = useUpdateInvoice()

  React.useEffect(() => {
    setCurrentDateMode(normalizeInvoiceDateMode(dateMode))
  }, [dateMode])

  React.useEffect(() => {
    setCurrentShowKeteranganColumn(showKeteranganColumn !== false)
  }, [showKeteranganColumn])

  const isSelectedInvoiceDetail = invoiceId !== null && invoiceId !== undefined
  const showDateColumn = isDateColumnVisible(currentDateMode)
  const canEditRowDate = isDateInputEnabled(currentDateMode)
  const summaryLabelColSpan = showDateColumn ? 10 : 9

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

  const handleKeteranganColumnChange = async (nextValue: boolean) => {
    if (!isSelectedInvoiceDetail || !invoiceId || nextValue === currentShowKeteranganColumn || updateInvoiceMutation.isPending) {
      return
    }

    const previousValue = currentShowKeteranganColumn
    setCurrentShowKeteranganColumn(nextValue)

    try {
      await updateInvoiceMutation.mutateAsync({
        id: invoiceId,
        payload: {
          showKeteranganColumn: nextValue,
        },
      })
      toast.success("Visibilitas kolom Ket berhasil diperbarui")
    } catch (error: unknown) {
      setCurrentShowKeteranganColumn(previousValue)
      const errorMessage = error instanceof Error ? error.message : "Gagal memperbarui visibilitas kolom Ket"
      if (typeof error === "object" && error !== null && "response" in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        toast.error(axiosError.response?.data?.error || errorMessage)
      } else {
        toast.error(errorMessage)
      }
    }
  }

  const handleRefresh = () => {
    if (!onRefresh) return
    setIsRefreshing(true)
    onRefresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const startEdit = (item: Transaksi) => {
    setEditingItem(item)
  }

  const cancelEdit = () => {
    setEditingItem(null)
  }

  const saveEdit = async (payload: UpdateTransaksiPayload) => {
    if (!editingItem) return

    try {
      await updateTransaksiMutation.mutateAsync({
        id: editingItem.id,
        payload,
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
      ...(currentShowKeteranganColumn ? { Ket: item.keterangan || "" } : {}),
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
      ...(currentShowKeteranganColumn ? { Ket: "" } : {}),
    })

    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Perhitungan Pengiriman Barang")

    const filename = `Perhitungan_Pengiriman_Barang_${format(new Date(), "yyyy-MM-dd")}.xlsx`
    XLSX.writeFile(wb, filename)
  }

  const openPdfPreview = () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diekspor")
      return
    }
    setIsPdfPreviewOpen(true)
  }

  const downloadPdf = async () => {
    toast.loading("Membuat file PDF...", { id: "pdf-export" })

    try {
      const sanitizedTitle = (title || "Perhitungan_Pengiriman_Barang")
        .replace(/[/\\?%*:|"<>]/g, "-")
        .replace(/\s+/g, "_")
        .trim()

      const pdf = await downloadTransactionsPdf({
        title: title || "Perhitungan Pengiriman Barang",
        dateMode: currentDateMode,
        showKeteranganColumn: currentShowKeteranganColumn,
        transactions: data,
      })

      saveBlob(pdf, `${sanitizedTitle}_${format(new Date(), "yyyy-MM-dd")}.pdf`)
      toast.success("PDF berhasil diunduh!", { id: "pdf-export" })
    } catch (error) {
      console.error("Error downloading PDF:", error)
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
                  <h3 className="text-sm font-semibold text-slate-800">Pengaturan tampilan invoice</h3>
                  <p className="text-xs text-slate-500">
                    Atur tampilan tanggal dan kolom Ket untuk detail invoice, print/PDF, dan Excel.
                  </p>
                </div>
                {updateInvoiceMutation.isPending && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan mode tanggal...
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <InvoiceDateModeField
                  value={currentDateMode}
                  onChange={handleDateModeChange}
                  disabled={updateInvoiceMutation.isPending}
                />

                <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Tampilkan kolom Ket</p>
                    <p className="text-xs text-slate-500">
                      Kolom Keterangan bersifat opsional dan setting ini disimpan per invoice.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant={currentShowKeteranganColumn ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleKeteranganColumnChange(!currentShowKeteranganColumn)}
                    disabled={updateInvoiceMutation.isPending}
                  >
                    {currentShowKeteranganColumn ? "Kolom Ket tampil" : "Kolom Ket disembunyikan"}
                  </Button>
                </div>

                <p className="text-xs text-slate-500">
                  {currentShowKeteranganColumn
                    ? "Kolom Ket akan ditampilkan pada detail invoice, print/PDF, dan Excel."
                    : "Kolom Ket disembunyikan pada detail invoice, print/PDF, dan Excel, tetapi data keterangannya tetap tersimpan."}
                </p>
              </div>
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
            <div className="transaction-table-scroll overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-50 border-b-2 border-slate-200">
                    <TableHead className="font-bold text-slate-700 text-center">No</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Edit</TableHead>
                    {showDateColumn && <TableHead className="font-bold text-slate-700">Tgl</TableHead>}
                    <TableHead className="font-bold text-slate-700">No STT</TableHead>
                    <TableHead className="font-bold text-slate-700">Pengirim</TableHead>
                    <TableHead className="font-bold text-slate-700">Penerima</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Coly</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Kg</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Min</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Tarif</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Total</TableHead>
                    {currentShowKeteranganColumn && <TableHead className="font-bold text-slate-700">Ket</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => {
                    const rowTotal = item.total

                    return (
                      <TableRow
                        key={item.id || index}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 border-b border-slate-100"
                      >
                        <TableCell className="text-center text-slate-600 font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-blue-600 hover:bg-blue-50"
                            onClick={() => startEdit(item)}
                            aria-label={`Edit transaksi STT ${item.noResi}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                        {showDateColumn && (
                          <TableCell className="text-slate-600">
                            <span>{formatTableDate(item.tanggal)}</span>
                          </TableCell>
                        )}
                        <TableCell className="font-mono font-bold text-blue-600 group-hover:text-blue-700">
                          {item.noResi}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {item.pengirim}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {item.penerima}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">
                          {item.coly}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700">
                          {item.berat}
                        </TableCell>
                        <TableCell className="text-right font-medium text-orange-600">
                          {item.min}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-600">
                          Rp {(item.tarif || 0).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-lg text-emerald-600">
                            Rp {rowTotal.toLocaleString("id-ID")}
                          </span>
                        </TableCell>
                        {currentShowKeteranganColumn && (
                          <TableCell className="text-slate-600">
                            {item.keterangan || "-"}
                          </TableCell>
                        )}
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
                    {currentShowKeteranganColumn && <TableCell></TableCell>}
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>

      <PrintInvoiceModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        data={data}
        invoiceTitle={title}
        dateMode={currentDateMode}
        showKeteranganColumn={currentShowKeteranganColumn}
        invoiceKey={invoiceId ? String(invoiceId) : title || "new-invoice"}
      />

      <EditTransactionDialog
        isOpen={editingItem !== null}
        transaction={editingItem}
        canEditDate={canEditRowDate}
        showDateField={showDateColumn}
        showKeteranganField={currentShowKeteranganColumn}
        isSaving={updateTransaksiMutation.isPending}
        onClose={cancelEdit}
        onSave={saveEdit}
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
              >
                <div style={{ fontFamily: "Arial, sans-serif", fontSize: "11px", padding: "20px", boxSizing: "border-box", background: "#fff" }}>
                  <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
                    {title || "Perhitungan Pengiriman Barang"}
                  </h2>
                  <p style={{ marginBottom: "10px" }}>
                    Tanggal: {format(new Date(), "dd MMMM yyyy", { locale: id })}
                  </p>
                  <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f0f0f0" }}>
                        <th style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>No</th>
                        {showDateColumn && <th style={{ border: "1px solid #000", padding: "6px" }}>Hari/Tgl</th>}
                        <th style={{ border: "1px solid #000", padding: "6px" }}>No Stt</th>
                        <th style={{ border: "1px solid #000", padding: "6px" }}>Pengirim</th>
                        <th style={{ border: "1px solid #000", padding: "6px" }}>Penerima</th>
                        <th style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>C</th>
                        <th style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>Kg</th>
                        <th style={{ border: "1px solid #000", padding: "6px", textAlign: "center" }}>Min</th>
                        <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>Tarif</th>
                        <th style={{ border: "1px solid #000", padding: "6px", textAlign: "right" }}>Jumlah</th>
                        {currentShowKeteranganColumn && <th style={{ border: "1px solid #000", padding: "6px" }}>Ket</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item, index) => (
                        <tr key={item.id || item.noResi}>
                          <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{index + 1}</td>
                          {showDateColumn && <td style={{ border: "1px solid #000", padding: "4px" }}>{formatVisibleDate(item.tanggal, "")}</td>}
                          <td style={{ border: "1px solid #000", padding: "4px" }}>{item.noResi}</td>
                          <td style={{ border: "1px solid #000", padding: "4px" }}>{item.pengirim}</td>
                          <td style={{ border: "1px solid #000", padding: "4px" }}>{item.penerima}</td>
                          <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{item.coly}</td>
                          <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{item.berat}</td>
                          <td style={{ border: "1px solid #000", padding: "4px", textAlign: "center" }}>{item.min || ""}</td>
                          <td style={{ border: "1px solid #000", padding: "4px", textAlign: "right" }}>{formatNumber(item.tarif || 0)}</td>
                          <td style={{ border: "1px solid #000", padding: "4px", textAlign: "right" }}>{formatNumber(item.total)}</td>
                          {currentShowKeteranganColumn && <td style={{ border: "1px solid #000", padding: "4px" }}>{item.keterangan || ""}</td>}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={showDateColumn ? 9 : 8} style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>TOTAL</td>
                        <td style={{ border: "1px solid #000", padding: "6px", textAlign: "right", fontWeight: "bold" }}>
                          {formatNumber(data.reduce((sum, item) => sum + item.total, 0))}
                        </td>
                        {currentShowKeteranganColumn && <td style={{ border: "1px solid #000", padding: "6px" }}></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
