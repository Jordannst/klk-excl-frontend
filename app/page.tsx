"use client"

import * as React from "react"
import { FileText, Plus } from "lucide-react"
import { toast } from "sonner"
import { ExpeditionForm, ExpeditionFormData, BatchPayload } from "@/components/ExpeditionForm"
import { TransactionTable } from "@/components/TransactionTable"
import { InvoiceHistory, InvoiceGroup } from "@/components/InvoiceHistory"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function Dashboard() {
  const [data, setData] = React.useState<ExpeditionFormData[]>([])
  // Invoice batches (riwayat per batch)
  const [invoiceBatches, setInvoiceBatches] = React.useState<InvoiceGroup[]>([])
  const [selectedBatchId, setSelectedBatchId] = React.useState<string | null>(null)
  const [showForm, setShowForm] = React.useState(true)
  const [formKey, setFormKey] = React.useState(0)
  const formRef = React.useRef<HTMLDivElement>(null)

  /**
   * Handle batch transaction submission from ExpeditionForm
   * Receives batch payload and adds it to the main data state + history
   */
  const handleAddTransaction = (payload: BatchPayload) => {
    if (!payload || !payload.transactions || payload.transactions.length === 0) {
      toast.error("Tidak ada data untuk disimpan")
      return
    }

    // Add all transactions from the batch to the main data state (flat list)
    setData(payload.transactions) // tampilkan batch baru di tabel

    // Simpan riwayat per invoice (per batch)
    const batchDate = payload.transactions[0]?.date || "No Date"
    const batchId = `${Date.now()}-${payload.transactions[0]?.stt || "batch"}`
    const batchEntry: InvoiceGroup = {
      id: batchId,
      title: payload.title,
      createdAt: payload.createdAt,
      date: batchDate,
      transactions: payload.transactions,
      total: payload.transactions.reduce((sum, t) => sum + t.total, 0),
      count: payload.transactions.length,
    }
    setInvoiceBatches((prev) => [batchEntry, ...prev])
    setSelectedBatchId(batchId)
    setShowForm(false)

    // Show success notification
    toast.success(`✅ Laporan berhasil disimpan!`, {
      description: `${payload.transactions.length} transaksi telah ditambahkan ke tabel`
    })
  }

  const handleCreateNew = () => {
    setShowForm(true)
    // Reset form dengan mengubah key
    setFormKey((prev) => prev + 1)
    // Scroll ke form
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)

    // Clear current table view (mulai invoice baru)
    setData([])
    setSelectedBatchId(null)
  }

  const handleRefresh = () => {
    // In a real app, this would re-fetch from API
    console.log("Refreshing data...")
  }

  const handleSelectBatch = (id: string) => {
    const batch = invoiceBatches.find((b) => b.id === id)
    if (!batch) return
    setData(batch.transactions)
    setSelectedBatchId(id)
    setShowForm(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar/Header - Fixed with blur */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm py-4 px-6 border-b border-white/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">KLK Invoice</h1>
          </div>
          <Button
            onClick={handleCreateNew}
            className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Buat Invoice Baru
          </Button>
        </div>
      </header>

      {/* Content Area */}
      <main className="max-w-7xl mx-auto pt-24 px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Invoice History */}
          <div className="lg:col-span-1">
            <InvoiceHistory
              invoiceGroups={invoiceBatches}
              selectedId={selectedBatchId}
              onSelectBatch={handleSelectBatch}
            />
          </div>

          {/* Right Side - Form and Table */}
          <div className="lg:col-span-3 space-y-6">
            {showForm && (
              <div ref={formRef}>
                <ExpeditionForm key={formKey} onSubmitSuccess={handleAddTransaction} />
                <div className="flex items-center mt-6">
                  <Separator />
                </div>
              </div>
            )}
            <TransactionTable data={data} onRefresh={handleRefresh} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 py-4 px-6 border-t border-slate-200 bg-white/50">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-slate-500">
            © 2025 KLK Invoice. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
