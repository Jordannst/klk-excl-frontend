"use client"

import * as React from "react"
import { FileText, Loader2, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Search, X, Trash2 } from "lucide-react"
import { format, startOfDay, startOfWeek, startOfMonth } from "date-fns"
import { id } from "date-fns/locale"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useInvoices, useDeleteInvoice } from "@/lib/hooks"
import type { InvoiceListItem } from "@/lib/types"

interface InvoiceHistoryProps {
  selectedId?: number | null
  onSelectInvoice?: (id: number) => void
  /** When provided, the internal search input is hidden and this query is used instead. */
  searchOverride?: string
}

const ITEMS_PER_PAGE = 5

type DateFilter = 'all' | 'today' | 'week' | 'month'

export function InvoiceHistory({ selectedId, onSelectInvoice, searchOverride }: InvoiceHistoryProps) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [dateFilter, setDateFilter] = React.useState<DateFilter>('all')
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<number | null>(null)

  const deleteInvoiceMutation = useDeleteInvoice()
  const usesExternalSearch = searchOverride !== undefined

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to page 1 when search changes
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // External (merged) search resets pagination too
  React.useEffect(() => {
    if (usesExternalSearch) setCurrentPage(1)
  }, [searchOverride, usesExternalSearch])

  const effectiveSearch = usesExternalSearch ? searchOverride : debouncedSearch

  // Calculate date range based on filter
  const getDateRange = () => {
    const now = new Date()
    switch (dateFilter) {
      case 'today':
        return {
          startDate: format(startOfDay(now), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd'),
        }
      case 'week':
        return {
          startDate: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd'),
        }
      case 'month':
        return {
          startDate: format(startOfMonth(now), 'yyyy-MM-dd'),
          endDate: format(now, 'yyyy-MM-dd'),
        }
      default:
        return { startDate: undefined, endDate: undefined }
    }
  }

  const { startDate, endDate } = getDateRange()
  const { data, isLoading, error, refetch } = useInvoices(
    currentPage,
    ITEMS_PER_PAGE,
    effectiveSearch,
    startDate,
    endDate
  )

  const invoices = data?.data || []
  const pagination = data?.pagination

  // Group the current page's invoices by month (design_handoff_dashboard)
  const monthGroups = React.useMemo(() => {
    const groups: { label: string; items: InvoiceListItem[] }[] = []
    for (const invoice of invoices) {
      const label = format(new Date(invoice.createdAt), "MMMM yyyy", { locale: id }).toUpperCase()
      const last = groups[groups.length - 1]
      if (last && last.label === label) {
        last.items.push(invoice)
      } else {
        groups.push({ label, items: [invoice] })
      }
    }
    return groups
  }, [invoices])

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setDateFilter('all')
    setCurrentPage(1)
  }

  const hasActiveFilters = (!usesExternalSearch && searchQuery !== "") || dateFilter !== 'all'

  const handleDeleteClick = (invoiceId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirmId(invoiceId)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return
    try {
      await deleteInvoiceMutation.mutateAsync(deleteConfirmId)
      toast.success("Invoice dipindahkan ke Sampah", {
        description: "Kamu dapat memulihkannya dari halaman Sampah",
      })
      // Clear selection if deleted invoice was selected
      if (selectedId === deleteConfirmId) {
        onSelectInvoice?.(0)
      }
    } catch {
      toast.error("Gagal menghapus invoice")
    }
    setDeleteConfirmId(null)
  }

  const invoiceToDelete = invoices.find(inv => inv.id === deleteConfirmId)

  return (
    <>
    <div className="flex w-full flex-col">
      {/* Header row */}
      <div className="mb-2 flex items-center justify-between">
        <span className="font-klk-mono text-[9.5px] uppercase tracking-[.12em] text-klk-ink-3">
          Riwayat Invoice
        </span>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex h-7 w-7 items-center justify-center rounded-md text-klk-ink-3 transition-colors hover:bg-klk-green-tint hover:text-klk-green"
          aria-label="Muat ulang riwayat"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Search Input (hidden when the page provides a merged search) */}
      {!usesExternalSearch && (
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-klk-ink-3" />
          <input
            placeholder="Cari invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-klk-line-strong bg-white pl-9 pr-8 text-[12.5px] text-klk-ink shadow-[0_1px_2px_rgba(16,24,40,.05)] outline-none placeholder:text-klk-ink-3 focus:border-klk-green focus:ring-[3px] focus:ring-klk-green/15"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-klk-ink-3 hover:text-klk-ink-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Date Filter Chips */}
      <div className="mb-3 flex flex-wrap gap-1">
        {[
          { key: 'all', label: 'Semua' },
          { key: 'today', label: 'Hari ini' },
          { key: 'week', label: 'Minggu' },
          { key: 'month', label: 'Bulan' },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => handleDateFilterChange(filter.key as DateFilter)}
            className={`h-6 rounded-md px-2 text-[11px] font-semibold transition-colors ${
              dateFilter === filter.key
                ? "bg-klk-green text-white"
                : "border border-klk-line bg-white text-klk-ink-2 hover:border-klk-green/40 hover:text-klk-green"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="mb-2 flex items-center justify-between text-[11px] text-klk-ink-3">
          <span>{pagination?.total || 0} hasil ditemukan</span>
          <button onClick={clearFilters} className="font-semibold text-klk-green hover:underline">
            Reset filter
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Loader2 className="mb-2 h-5 w-5 animate-spin text-klk-green" />
          <p className="text-xs text-klk-ink-3">Memuat...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <AlertCircle className="mb-2 h-8 w-8 text-klk-red" />
          <p className="mb-2 text-xs text-klk-red">Gagal memuat</p>
          <button
            onClick={() => refetch()}
            className="rounded-lg border border-klk-line px-3 py-1.5 text-xs font-semibold text-klk-ink-2 hover:bg-klk-red-tint hover:text-klk-red"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && invoices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <FileText className="mb-2 h-8 w-8 text-klk-ink-3" />
          <p className="text-xs text-klk-ink-3">
            {hasActiveFilters || (usesExternalSearch && searchOverride) ? "Tidak ada hasil" : "Belum ada invoice"}
          </p>
        </div>
      )}

      {/* Invoice List, grouped per month */}
      {!isLoading && !error && invoices.length > 0 && (
        <>
          <div className="space-y-3">
            {monthGroups.map((group) => (
              <div key={group.label}>
                <div className="mb-1.5 font-klk-mono text-[9.5px] uppercase tracking-[.12em] text-klk-ink-3">
                  {group.label}
                </div>
                <div className="space-y-2">
                  {group.items.map((invoice) => {
                    const isActive = selectedId === invoice.id
                    return (
                      <div
                        key={invoice.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectInvoice?.(invoice.id)}
                        onKeyDown={(e) => e.key === 'Enter' && onSelectInvoice?.(invoice.id)}
                        className={`group relative w-full cursor-pointer rounded-[9px] border px-3 py-2.5 text-left transition-colors ${
                          isActive
                            ? "border-klk-green/45 bg-klk-green-tint"
                            : "border-klk-line bg-white hover:border-klk-green/30"
                        }`}
                      >
                        {isActive && (
                          <span className="absolute bottom-[9px] left-0 top-[9px] w-[3px] rounded-r bg-klk-green" />
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[12.5px] font-semibold text-klk-ink">
                              {invoice.title || "Invoice"}
                            </div>
                            <div className="mt-0.5 font-klk-mono text-[9.5px] uppercase tracking-[.04em] text-klk-ink-3">
                              {invoice.count} trx · Rp {invoice.total.toLocaleString("id-ID")}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDeleteClick(invoice.id, e)}
                            disabled={deleteInvoiceMutation.isPending}
                            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-klk-ink-3 opacity-0 transition-all hover:bg-klk-red-tint hover:text-klk-red focus:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                            title="Hapus invoice"
                            aria-label={`Hapus invoice ${invoice.title || ""}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between border-t border-klk-line pt-2.5">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-klk-line text-klk-ink-2 transition-colors hover:bg-klk-canvas disabled:opacity-40"
                aria-label="Halaman sebelumnya"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-klk-mono text-[10px] uppercase tracking-[.08em] text-klk-ink-3">
                {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === pagination.totalPages}
                className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-klk-line text-klk-ink-2 transition-colors hover:bg-klk-canvas disabled:opacity-40"
                aria-label="Halaman berikutnya"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>

    {/* Delete Confirmation Modal */}
    {deleteConfirmId && (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setDeleteConfirmId(null)}
        />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm m-4 p-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-7 w-7 text-red-600" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Invoice?</h3>
            <p className="text-sm text-slate-500 mb-1">
              Invoice ini akan dipindahkan ke Sampah:
            </p>
            <p className="font-semibold text-slate-700 mb-4">
              {invoiceToDelete?.title || "Invoice"}
            </p>
            <p className="text-xs text-emerald-600 mb-6">
              💡 Invoice dapat dipulihkan dari halaman Sampah.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1"
                disabled={deleteInvoiceMutation.isPending}
              >
                Batal
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={deleteInvoiceMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteInvoiceMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
    </>
  )
}
