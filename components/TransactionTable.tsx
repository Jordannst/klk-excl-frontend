"use client"

import * as React from "react"
import { RefreshCw, Package as PackageIcon, Download, Printer, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
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
import { EditTransactionDialog } from "@/components/EditTransactionDialog"
import { InvoiceDateModeField } from "@/components/InvoiceDateModeField"
import { PrintInvoiceModal } from "@/components/PrintInvoiceModal"
import { useDeleteTransaksi, useUpdateInvoice, useUpdateTransaksi } from "@/lib/hooks"
import {
  isDateColumnVisible,
  isDateInputEnabled,
  normalizeInvoiceDateMode,
  type InvoiceDateMode,
} from "@/lib/invoice-date-mode"
import type { Transaksi, UpdateTransaksiPayload } from "@/lib/types"


interface TransactionTableProps {
  data: Transaksi[]
  onRefresh?: () => void
  title?: string
  invoiceId?: number | null
  dateMode?: InvoiceDateMode
  showKeteranganColumn?: boolean
  highlightNoResi?: string
}

export function TransactionTable({
  data,
  onRefresh,
  title,
  invoiceId,
  dateMode,
  showKeteranganColumn,
  highlightNoResi,
}: TransactionTableProps) {
  const highlightRowRef = React.useRef<HTMLTableRowElement | null>(null)
  const [isFlashing, setIsFlashing] = React.useState(false)

  // Rows hidden optimistically while their delete can still be undone
  const [pendingDeleteIds, setPendingDeleteIds] = React.useState<Set<number>>(new Set())
  const pendingTimersRef = React.useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const rows = React.useMemo(
    () => (pendingDeleteIds.size === 0 ? data : data.filter((item) => !pendingDeleteIds.has(item.id))),
    [data, pendingDeleteIds]
  )

  const highlightIndex = highlightNoResi
    ? rows.findIndex((item) => item.noResi === highlightNoResi)
    : -1
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Transaksi | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Transaksi | null>(null)
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false)
  const [currentDateMode, setCurrentDateMode] = React.useState<InvoiceDateMode>(() =>
    normalizeInvoiceDateMode(dateMode)
  )
  const [currentShowKeteranganColumn, setCurrentShowKeteranganColumn] = React.useState<boolean>(
    showKeteranganColumn !== false
  )

  const updateTransaksiMutation = useUpdateTransaksi()
  const updateInvoiceMutation = useUpdateInvoice()
  const deleteTransaksiMutation = useDeleteTransaksi()

  React.useEffect(() => {
    setCurrentDateMode(normalizeInvoiceDateMode(dateMode))
  }, [dateMode])

  React.useEffect(() => {
    setCurrentShowKeteranganColumn(showKeteranganColumn !== false)
  }, [showKeteranganColumn])

  const isSelectedInvoiceDetail = invoiceId !== null && invoiceId !== undefined
  const showDateColumn = isDateColumnVisible(currentDateMode)
  const canEditRowDate = isDateInputEnabled(currentDateMode)

  // Client-side pagination (design_handoff_dashboard)
  const PAGE_SIZE = 10
  const [page, setPage] = React.useState(1)
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))

  React.useEffect(() => {
    setPage(1)
  }, [invoiceId])

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // Jump to the page containing the highlighted resi (global search)
  React.useEffect(() => {
    if (!highlightNoResi) return
    const idx = rows.findIndex((item) => item.noResi === highlightNoResi)
    if (idx >= 0) setPage(Math.floor(idx / PAGE_SIZE) + 1)
  }, [highlightNoResi, rows])

  const pageStart = (page - 1) * PAGE_SIZE
  const pageRows = rows.slice(pageStart, pageStart + PAGE_SIZE)
  const totalColy = rows.reduce((sum, item) => sum + (item.coly || 0), 0)
  const totalKg = rows.reduce((sum, item) => sum + (item.berat || 0), 0)
  const grandTotal = rows.reduce((sum, item) => sum + item.total, 0)

  const pageItems = React.useMemo<(number | "…")[]>(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const items: (number | "…")[] = [1]
    const lo = Math.max(2, page - 1)
    const hi = Math.min(totalPages - 1, page + 1)
    if (lo > 2) items.push("…")
    for (let p = lo; p <= hi; p += 1) items.push(p)
    if (hi < totalPages - 1) items.push("…")
    items.push(totalPages)
    return items
  }, [page, totalPages])

  // Flash + scroll to the highlighted row once its page is rendered
  React.useEffect(() => {
    if (!highlightNoResi) return
    setIsFlashing(true)
    highlightRowRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    const timer = setTimeout(() => setIsFlashing(false), 2000)
    return () => clearTimeout(timer)
  }, [highlightNoResi, rows, page])

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
    if (rows.length === 0) {
      toast.error("Tidak ada data untuk diekspor")
      return
    }

    const excelData: Record<string, string | number>[] = rows.map((item) => ({
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

    const totalRevenue = rows.reduce((sum, item) => sum + item.total, 0)
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

  const cancelDelete = () => {
    if (!deleteTransaksiMutation.isPending) {
      setDeleteTarget(null)
    }
  }

  const unhideRow = (id: number) => {
    setPendingDeleteIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const commitDelete = (id: number, noResi: string) => {
    pendingTimersRef.current.delete(id)
    deleteTransaksiMutation.mutate(id, {
      onSuccess: () => {
        unhideRow(id) // server data no longer contains the row after invalidation
      },
      onError: (error: unknown) => {
        unhideRow(id)
        const errorMessage = error instanceof Error ? error.message : "Gagal menghapus transaksi"
        if (typeof error === "object" && error !== null && "response" in error) {
          const axiosError = error as { response?: { data?: { error?: string } } }
          toast.error(`STT ${noResi}: ${axiosError.response?.data?.error || errorMessage}`)
        } else {
          toast.error(`STT ${noResi}: ${errorMessage}`)
        }
      },
    })
  }

  const undoDelete = (id: number, noResi: string) => {
    const timer = pendingTimersRef.current.get(id)
    if (!timer) return // already committed
    clearTimeout(timer)
    pendingTimersRef.current.delete(id)
    unhideRow(id)
    toast.success(`Penghapusan STT ${noResi} dibatalkan`)
  }

  // Delayed-commit delete: hide the row immediately, send the DELETE only
  // after the undo window closes.
  const confirmDelete = () => {
    if (!deleteTarget) return
    const { id: targetId, noResi } = deleteTarget
    setDeleteTarget(null)

    setPendingDeleteIds((prev) => new Set(prev).add(targetId))
    const timer = setTimeout(() => commitDelete(targetId, noResi), 5000)
    pendingTimersRef.current.set(targetId, timer)

    toast("Transaksi dihapus", {
      description: `STT ${noResi}`,
      duration: 5000,
      action: {
        label: "Urungkan",
        onClick: () => undoDelete(targetId, noResi),
      },
    })
  }

  // If the table unmounts mid-window, commit the pending deletes right away
  // so a confirmed delete is never silently lost.
  const commitDeleteRef = React.useRef(commitDelete)
  commitDeleteRef.current = commitDelete
  React.useEffect(() => {
    const timers = pendingTimersRef.current
    return () => {
      for (const [id, timer] of timers) {
        clearTimeout(timer)
        commitDeleteRef.current(id, "")
      }
      timers.clear()
    }
  }, [])

  return (
    <div className="w-full overflow-hidden rounded-xl border border-klk-line bg-white shadow-[0_1px_2px_rgba(16,24,40,.05)]">
      <div className="border-b border-klk-line px-4 py-3.5 sm:px-[18px]">
        <div className="space-y-4">
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
            <div className="min-w-0 w-full xl:w-auto">
              <h2 className="truncate text-[15.5px] font-semibold tracking-[-.01em] text-klk-ink">
                {title || 'Laporan Transaksi'}
              </h2>
              <p className="mt-0.5 font-klk-mono text-[10px] uppercase tracking-[.12em] text-klk-ink-3">
                {rows.length} transaksi
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
              {onRefresh && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  className="flex-1 sm:flex-none h-[33px] gap-1.5 rounded-lg border border-klk-line-strong bg-white text-[12.5px] font-semibold text-klk-ink-2 shadow-none hover:border-klk-green/40 hover:bg-klk-green-tint hover:text-klk-green transition-colors"
                >
                  <RefreshCw className={`h-[15px] w-[15px] ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={exportToExcel}
                disabled={rows.length === 0}
                className="flex-1 sm:flex-none h-[33px] gap-1.5 rounded-lg border border-klk-line-strong bg-white text-[12.5px] font-semibold text-klk-ink-2 shadow-none hover:border-klk-green/40 hover:bg-klk-green-tint hover:text-klk-green transition-colors"
              >
                <Download className="h-[15px] w-[15px]" />
                <span className="hidden sm:inline">Excel</span>
                <span className="sm:hidden">Excel</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPrintModalOpen(true)}
                disabled={rows.length === 0}
                className="flex-1 sm:flex-none h-[33px] gap-1.5 rounded-lg border border-klk-green bg-klk-green text-[12.5px] font-semibold text-white shadow-none hover:bg-klk-green-hover hover:border-klk-green-hover transition-colors"
              >
                <Printer className="h-[15px] w-[15px]" />
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
      </div>

      {/* KPI strip */}
      {rows.length > 0 && (
        <div className="grid grid-cols-2 border-b border-klk-line sm:grid-cols-4">
          {[
            { label: "Transaksi", value: rows.length.toLocaleString("id-ID"), accent: false },
            { label: "Total Coly", value: totalColy.toLocaleString("id-ID"), accent: false },
            { label: "Total Kg", value: totalKg.toLocaleString("id-ID"), accent: false },
            { label: "Nilai Invoice", value: `Rp ${grandTotal.toLocaleString("id-ID")}`, accent: true },
          ].map((kpi, i) => (
            <div key={kpi.label} className={`px-[18px] py-[13px] ${i > 0 ? "sm:border-l sm:border-klk-line" : ""}`}>
              <div className={`text-[19px] font-semibold tabular-nums tracking-[-.01em] ${kpi.accent ? "text-klk-green" : "text-klk-ink"}`}>
                {kpi.value}
              </div>
              <div className="mt-0.5 font-klk-mono text-[9.5px] uppercase tracking-[.1em] text-klk-ink-3">
                {kpi.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        {rows.length === 0 ? (
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
          <div>
            <div className="transaction-table-scroll overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow className="border-b border-klk-line bg-klk-canvas hover:bg-klk-canvas">
                    <TableHead className="h-9 px-3 text-center font-klk-mono text-[9.5px] font-medium uppercase tracking-[.1em] text-klk-ink-3">No</TableHead>
                    {showDateColumn && <TableHead className="h-9 px-3 font-klk-mono text-[9.5px] font-medium uppercase tracking-[.1em] text-klk-ink-3">Tgl</TableHead>}
                    <TableHead className="h-9 px-3 font-klk-mono text-[9.5px] font-medium uppercase tracking-[.1em] text-klk-ink-3">No STT</TableHead>
                    <TableHead className="h-9 px-3 font-klk-mono text-[9.5px] font-medium uppercase tracking-[.1em] text-klk-ink-3">Pengirim</TableHead>
                    <TableHead className="h-9 px-3 font-klk-mono text-[9.5px] font-medium uppercase tracking-[.1em] text-klk-ink-3">Penerima</TableHead>
                    <TableHead className="h-9 px-3 text-center font-klk-mono text-[9.5px] font-medium uppercase tracking-[.1em] text-klk-ink-3">Coly</TableHead>
                    <TableHead className="h-9 px-3 text-center font-klk-mono text-[9.5px] font-medium uppercase tracking-[.1em] text-klk-ink-3">Kg</TableHead>
                    <TableHead className="h-9 px-3 text-center font-klk-mono text-[9.5px] font-medium uppercase tracking-[.1em] text-klk-ink-3">Min</TableHead>
                    <TableHead className="h-9 px-3 text-right font-klk-mono text-[9.5px] font-medium uppercase tracking-[.1em] text-klk-ink-3">Tarif</TableHead>
                    <TableHead className="h-9 px-3 text-right font-klk-mono text-[9.5px] font-medium uppercase tracking-[.1em] text-klk-ink-3">Jumlah</TableHead>
                    {currentShowKeteranganColumn && <TableHead className="h-9 px-3 font-klk-mono text-[9.5px] font-medium uppercase tracking-[.1em] text-klk-ink-3">Ket</TableHead>}
                    <TableHead className="h-9 px-3"><span className="sr-only">Aksi</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((item, i) => {
                    const index = pageStart + i

                    return (
                      <TableRow
                        key={item.id || index}
                        ref={index === highlightIndex ? highlightRowRef : undefined}
                        className={`group border-b border-klk-line transition-colors hover:bg-klk-canvas ${
                          index === highlightIndex && isFlashing ? "bg-amber-100" : ""
                        }`}
                      >
                        <TableCell className="px-3 py-2.5 text-center text-[12.5px] tabular-nums text-klk-ink-3">
                          {index + 1}
                        </TableCell>
                        {showDateColumn && (
                          <TableCell className="px-3 py-2.5 text-[12.5px] tabular-nums text-klk-ink-2">
                            {formatTableDate(item.tanggal)}
                          </TableCell>
                        )}
                        <TableCell className="px-3 py-2.5 font-klk-mono text-[11.5px] text-klk-blue">
                          {item.noResi}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-[12.5px] text-klk-ink-2">
                          {item.pengirim}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-[12.5px] text-klk-ink-2">
                          {item.penerima}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-center text-[12.5px] tabular-nums text-klk-ink-2">
                          {item.coly}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-center text-[12.5px] tabular-nums text-klk-ink-2">
                          {item.berat}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-center text-[12.5px] tabular-nums text-klk-ink-2">
                          {item.min}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-right text-[12.5px] tabular-nums text-klk-ink-2">
                          {(item.tarif || 0).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="px-3 py-2.5 text-right text-[12.5px] font-semibold tabular-nums text-klk-ink">
                          {item.total.toLocaleString("id-ID")}
                        </TableCell>
                        {currentShowKeteranganColumn && (
                          <TableCell className="px-3 py-2.5 text-[12.5px] text-klk-ink-2">
                            {item.keterangan || "-"}
                          </TableCell>
                        )}
                        <TableCell className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity duration-[.12s] focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                            <button
                              type="button"
                              className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-klk-ink-3 transition-colors hover:bg-klk-green-tint hover:text-klk-green"
                              onClick={() => startEdit(item)}
                              aria-label={`Edit transaksi STT ${item.noResi}`}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-klk-ink-3 transition-colors hover:bg-klk-red-tint hover:text-klk-red disabled:opacity-40"
                              onClick={() => setDeleteTarget(item)}
                              disabled={deleteTransaksiMutation.isPending}
                              aria-label={`Hapus transaksi STT ${item.noResi}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Footer: range, pagination, total */}
            <div className="flex flex-col gap-2 border-t border-klk-line px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-klk-mono text-[10px] uppercase tracking-[.1em] text-klk-ink-3">
                Menampilkan {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, rows.length)} dari {rows.length}
              </span>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-klk-line text-klk-ink-2 transition-colors hover:bg-klk-canvas disabled:opacity-40"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {pageItems.map((item, i) =>
                    item === "…" ? (
                      <span key={`e${i}`} className="px-1 text-[12px] text-klk-ink-3">…</span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setPage(item)}
                        className={`h-7 min-w-7 rounded-[7px] px-1.5 text-[12px] font-semibold tabular-nums transition-colors ${
                          page === item
                            ? "bg-klk-green text-white"
                            : "border border-klk-line text-klk-ink-2 hover:bg-klk-canvas"
                        }`}
                        aria-label={`Halaman ${item}`}
                        aria-current={page === item ? "page" : undefined}
                      >
                        {item}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-klk-line text-klk-ink-2 transition-colors hover:bg-klk-canvas disabled:opacity-40"
                    aria-label="Halaman berikutnya"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
              <span className="text-[13px] font-semibold text-klk-green-deep">
                TOTAL&ensp;Rp {grandTotal.toLocaleString("id-ID")}
              </span>
            </div>
          </div>
        )}
      </div>

      <PrintInvoiceModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        data={rows}
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

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-transaction-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelDelete}
            aria-label="Tutup konfirmasi hapus"
          />
          <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-7 w-7 text-red-600" />
                </div>
              </div>
              <h3 id="delete-transaction-title" className="mb-2 text-lg font-bold text-slate-800">
                Hapus Transaksi?
              </h3>
              <p className="mb-1 text-sm text-slate-500">Transaksi ini akan dihapus permanen:</p>
              <p className="mb-4 font-semibold text-slate-700">STT {deleteTarget.noResi}</p>
              {rows.length === 1 && (
                <p className="mb-6 rounded-lg bg-amber-50 p-3 text-xs font-medium text-amber-700">
                  Ini transaksi terakhir. Menghapusnya juga akan menghapus invoice ini secara permanen.
                </p>
              )}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelDelete}
                  className="flex-1"
                  disabled={deleteTransaksiMutation.isPending}
                >
                  Batal
                </Button>
                <Button
                  type="button"
                  onClick={confirmDelete}
                  disabled={deleteTransaksiMutation.isPending}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700"
                >
                  {deleteTransaksiMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    "Hapus"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
