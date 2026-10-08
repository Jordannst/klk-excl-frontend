"use client"

import * as React from "react"
import { Trash2, RotateCcw, AlertTriangle, Loader2, FileText } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { id } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Navbar } from "@/components/Navbar"
import { useTrashInvoices, useRestoreInvoice, usePermanentDeleteInvoice } from "@/lib/hooks/useInvoice"
import type { TrashInvoiceItem } from "@/lib/types"

// =============================================================================
// Permanent Delete Confirmation Dialog
// =============================================================================
interface DeleteDialogProps {
  isOpen: boolean
  invoiceTitle: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

function PermanentDeleteDialog({ isOpen, invoiceTitle, onConfirm, onCancel, isDeleting }: DeleteDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Hapus Permanen?</h3>
            <p className="text-sm text-slate-500">Tindakan ini tidak dapat dibatalkan</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          Invoice <span className="font-semibold">&quot;{invoiceTitle}&quot;</span> beserta semua transaksi di dalamnya akan dihapus secara permanen dan tidak dapat dipulihkan.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting} className="flex-1">
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Permanen
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// Trash Invoice Card Component
// =============================================================================
interface TrashCardProps {
  invoice: TrashInvoiceItem
  onRestore: (invoice: TrashInvoiceItem) => void
  onPermanentDelete: (invoice: TrashInvoiceItem) => void
  isRestoring: boolean
}

function TrashCard({ invoice, onRestore, onPermanentDelete, isRestoring }: TrashCardProps) {
  const formatRupiah = (num: number): string => {
    return num.toLocaleString("id-ID")
  }

  const deletedAgo = formatDistanceToNow(new Date(invoice.deletedAt), {
    addSuffix: true,
    locale: id,
  })

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-800 truncate mb-1">
            {invoice.title}
          </h3>
          <p className="text-sm text-red-500 mb-2">
            Dihapus {deletedAgo}
          </p>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span>Rp {formatRupiah(invoice.total)}</span>
            <span>•</span>
            <span>{invoice.count} transaksi</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onRestore(invoice)}
          disabled={isRestoring}
          className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
        >
          {isRestoring ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4 mr-2" />
          )}
          Restore
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPermanentDelete(invoice)}
          className="flex-1 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Hapus Permanen
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// Main Page Content
// =============================================================================
function TrashContent() {
  const [deleteTarget, setDeleteTarget] = React.useState<TrashInvoiceItem | null>(null)
  const [restoringId, setRestoringId] = React.useState<number | null>(null)

  // Hooks
  const { data: trashData, isLoading } = useTrashInvoices()
  const restoreInvoice = useRestoreInvoice()
  const permanentDelete = usePermanentDeleteInvoice()

  const trashItems = trashData?.data || []

  // Handle restore
  const handleRestore = async (invoice: TrashInvoiceItem) => {
    setRestoringId(invoice.id)
    try {
      await restoreInvoice.mutateAsync(invoice.id)
      toast.success("Invoice berhasil dipulihkan", {
        description: `"${invoice.title}" telah dikembalikan ke daftar invoice`,
      })
    } catch (error) {
      console.error("Failed to restore:", error)
      toast.error("Gagal memulihkan invoice", {
        description: "Silakan coba lagi",
      })
    } finally {
      setRestoringId(null)
    }
  }

  // Handle permanent delete
  const handlePermanentDelete = async () => {
    if (!deleteTarget) return

    try {
      await permanentDelete.mutateAsync(deleteTarget.id)
      toast.success("Invoice dihapus permanen", {
        description: `"${deleteTarget.title}" telah dihapus selamanya`,
      })
      setDeleteTarget(null)
    } catch (error) {
      console.error("Failed to permanently delete:", error)
      toast.error("Gagal menghapus invoice", {
        description: "Silakan coba lagi",
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Shared Navbar */}
      <Navbar />

      {/* Content */}
      <main className="max-w-4xl mx-auto pt-20 sm:pt-24 px-4 sm:px-6 pb-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Sampah</h2>
            <p className="text-sm text-slate-500">
              Invoice yang dihapus dapat dipulihkan atau dihapus permanen
            </p>
          </div>
          {trashItems.length > 0 && (
            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {trashItems.length} item
            </span>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-3 text-slate-400 animate-spin" />
            <p className="text-sm text-slate-500">Memuat sampah...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && trashItems.length === 0 && (
          <div className="py-16 text-center">
            <Trash2 className="h-16 w-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">Sampah Kosong</h3>
            <p className="text-sm text-slate-400">
              Invoice yang dihapus akan muncul di sini
            </p>
          </div>
        )}

        {/* Trash Items */}
        {!isLoading && trashItems.length > 0 && (
          <div className="grid gap-4">
            {trashItems.map((invoice) => (
              <TrashCard
                key={invoice.id}
                invoice={invoice}
                onRestore={handleRestore}
                onPermanentDelete={setDeleteTarget}
                isRestoring={restoringId === invoice.id}
              />
            ))}
          </div>
        )}
      </main>

      {/* Permanent Delete Dialog */}
      <PermanentDeleteDialog
        isOpen={!!deleteTarget}
        invoiceTitle={deleteTarget?.title || ""}
        onConfirm={handlePermanentDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={permanentDelete.isPending}
      />
    </div>
  )
}

// =============================================================================
// Export with Protected Route
// =============================================================================
export default function TrashPage() {
  return (
    <ProtectedRoute>
      <TrashContent />
    </ProtectedRoute>
  )
}
