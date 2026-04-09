"use client"

import * as React from "react"
import { FileText, Plus, Loader2 } from "lucide-react"
import { ExpeditionForm } from "@/components/ExpeditionForm"
import { TransactionTable } from "@/components/TransactionTable"
import { InvoiceHistory } from "@/components/InvoiceHistory"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Navbar } from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useInvoice } from "@/lib/hooks"
import type { Invoice } from "@/lib/types"

function DashboardContent() {
  // Selected invoice ID from history
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<number | null>(null)
  const [showForm, setShowForm] = React.useState(true)
  const [formKey, setFormKey] = React.useState(0)
  const formRef = React.useRef<HTMLDivElement>(null)

  // Fetch selected invoice details
  const { data: selectedInvoice, isLoading: isLoadingInvoice } = useInvoice(selectedInvoiceId)

  /**
   * Handle successful invoice creation from ExpeditionForm
   * The form already saves to API, we just need to update UI state
   */
  const handleInvoiceCreated = (invoice: Invoice) => {
    // Select the newly created invoice
    setSelectedInvoiceId(invoice.id)
    // Hide form and show the table with the new invoice
    setShowForm(false)
  }

  const handleCreateNew = () => {
    setShowForm(true)
    // Reset form dengan mengubah key
    setFormKey((prev) => prev + 1)
    // Scroll ke form
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)

    // Clear selection (mulai invoice baru)
    setSelectedInvoiceId(null)
  }

  const handleSelectInvoice = (id: number) => {
    setSelectedInvoiceId(id)
    setShowForm(false)
  }

  const handleRefresh = () => {
    // Refetch is handled by React Query automatically on mutations
    // This is just for manual refresh if needed
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Shared Navbar */}
      <Navbar />

      {/* Content Area */}
      <main className="max-w-7xl mx-auto pt-20 sm:pt-24 px-4 sm:px-6 pb-8">
        {/* Page Header with Action */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Daftar Invoice</h2>
            <p className="text-sm text-slate-500">Kelola invoice dan transaksi pengiriman</p>
          </div>
          <Button
            onClick={handleCreateNew}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Buat Invoice Baru</span>
            <span className="sm:hidden">Baru</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Invoice History */}
          <div className="lg:col-span-1">
            <InvoiceHistory
              selectedId={selectedInvoiceId}
              onSelectInvoice={handleSelectInvoice}
            />
          </div>

          {/* Right Side - Form and Table */}
          <div className="lg:col-span-3 space-y-6">
            {showForm && (
              <div ref={formRef}>
                <ExpeditionForm key={formKey} onSubmitSuccess={handleInvoiceCreated} />
                <div className="flex items-center mt-6">
                  <Separator />
                </div>
              </div>
            )}

            {/* Loading state when fetching invoice */}
            {!showForm && isLoadingInvoice && (
              <div className="py-16 text-center">
                <Loader2 className="h-12 w-12 mx-auto mb-4 text-blue-500 animate-spin" />
                <p className="text-slate-500">Memuat data invoice...</p>
              </div>
            )}

            {/* Show selected invoice transactions */}
            {!showForm && !isLoadingInvoice && selectedInvoice && (
              <TransactionTable
                data={selectedInvoice.transactions}
                onRefresh={handleRefresh}
                title={selectedInvoice.title}
                invoiceId={selectedInvoice.id}
                dateMode={selectedInvoice.dateMode}
              />
            )}

            {/* Empty state when no invoice selected and form hidden */}
            {!showForm && !isLoadingInvoice && !selectedInvoice && (
              <div className="py-16 text-center">
                <FileText className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-600 mb-2">Pilih Invoice</h3>
                <p className="text-slate-400 mb-4">
                  Pilih invoice dari riwayat di sebelah kiri atau buat invoice baru
                </p>
                <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Invoice Baru
                </Button>
              </div>
            )}

            {/* Show empty table when form is visible but no data yet */}
            {showForm && (
              <TransactionTable 
                data={[]} 
                onRefresh={handleRefresh}
              />
            )}
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

// Wrap with ProtectedRoute for authentication
export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
