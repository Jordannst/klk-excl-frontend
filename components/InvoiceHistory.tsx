"use client"

import * as React from "react"
import { FileText, Calendar, DollarSign, Loader2, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Search, X, Trash2 } from "lucide-react"
import { format, startOfDay, startOfWeek, startOfMonth } from "date-fns"
import { id } from "date-fns/locale"
import { toast } from "sonner"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useInvoices, useDeleteInvoice } from "@/lib/hooks"
import type { InvoiceListItem } from "@/lib/types"

interface InvoiceHistoryProps {
  selectedId?: number | null
  onSelectInvoice?: (id: number) => void
}

const ITEMS_PER_PAGE = 5

type DateFilter = 'all' | 'today' | 'week' | 'month'

export function InvoiceHistory({ selectedId, onSelectInvoice }: InvoiceHistoryProps) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [dateFilter, setDateFilter] = React.useState<DateFilter>('all')
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<number | null>(null)

  const deleteInvoiceMutation = useDeleteInvoice()

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1) // Reset to page 1 when search changes
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

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
    debouncedSearch,
    startDate,
    endDate
  )

  const invoices = data?.data || []
  const pagination = data?.pagination

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

  const hasActiveFilters = searchQuery || dateFilter !== 'all'

  const handleDeleteClick = (invoiceId: number, invoiceTitle: string, e: React.MouseEvent) => {
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
    <Card className="w-full shadow-md border-t-4 border-t-blue-600 flex flex-col h-auto lg:h-[620px] max-h-[80vh] lg:max-h-none">
      <CardHeader className="pb-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">Riwayat Invoice</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Search Input */}
        <div className="relative mt-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Cari invoice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Date Filter Buttons */}
        <div className="flex flex-wrap gap-1 mt-2">
          {[
            { key: 'all', label: 'Semua' },
            { key: 'today', label: 'Hari ini' },
            { key: 'week', label: 'Minggu' },
            { key: 'month', label: 'Bulan' },
          ].map((filter) => (
            <Button
              key={filter.key}
              variant={dateFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => handleDateFilterChange(filter.key as DateFilter)}
              className={`h-7 px-2 text-xs min-w-0 ${
                dateFilter === filter.key 
                  ? "bg-blue-600 hover:bg-blue-700" 
                  : "hover:bg-blue-50"
              }`}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span>
              {pagination?.total || 0} hasil ditemukan
            </span>
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-700 hover:underline"
            >
              Reset filter
            </button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        {/* Loading State */}
        {isLoading && (
          <div className="py-8 text-center px-4 flex-1 flex flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 mx-auto mb-2 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-500">Memuat...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="py-8 text-center px-4 flex-1 flex flex-col items-center justify-center">
            <AlertCircle className="h-10 w-10 mx-auto mb-2 text-red-400" />
            <p className="text-sm text-red-500 mb-2">Gagal memuat</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Coba Lagi
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && invoices.length === 0 && (
          <div className="py-8 text-center px-4 flex-1 flex flex-col items-center justify-center">
            <FileText className="h-10 w-10 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-500">
              {hasActiveFilters ? "Tidak ada hasil" : "Belum ada invoice"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-blue-600 hover:underline mt-1"
              >
                Reset filter
              </button>
            )}
          </div>
        )}

        {/* Invoice List */}
        {!isLoading && !error && invoices.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {invoices.map((invoice: InvoiceListItem) => (
                <div
                  key={invoice.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectInvoice?.(invoice.id)}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectInvoice?.(invoice.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    selectedId === invoice.id
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="font-bold text-sm text-blue-600 truncate">
                          {invoice.title || "Invoice"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        <span>
                          {format(new Date(invoice.createdAt), "dd MMM yyyy", { locale: id })}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span>{invoice.count} transaksi</span>
                      </div>
                    </div>
                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDeleteClick(invoice.id, invoice.title, e)}
                      disabled={deleteInvoiceMutation.isPending}
                      className="p-1.5 rounded-md transition-all flex-shrink-0 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white"
                      title="Hapus invoice"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                    <div className="text-xs text-slate-500">Total</div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-emerald-600" />
                      <span className="font-bold text-sm text-emerald-600">
                        Rp {invoice.total.toLocaleString("id-ID")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex-shrink-0 px-4 py-2 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="h-7 px-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-slate-600">
                    {currentPage} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage === pagination.totalPages}
                    className="h-7 px-2"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>

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
