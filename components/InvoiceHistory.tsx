"use client"

import * as React from "react"
import { FileText, Calendar, DollarSign, Loader2, RefreshCw, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useInvoices } from "@/lib/hooks"
import type { InvoiceListItem } from "@/lib/types"

interface InvoiceHistoryProps {
  selectedId?: number | null
  onSelectInvoice?: (id: number) => void
}

export function InvoiceHistory({ selectedId, onSelectInvoice }: InvoiceHistoryProps) {
  const { data: invoices, isLoading, error, refetch } = useInvoices()

  return (
    <Card className="w-full h-full shadow-md border-t-4 border-t-blue-600">
      <CardHeader className="pb-4">
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
      </CardHeader>
      
      <CardContent className="p-0">
        {/* Loading State */}
        {isLoading && (
          <div className="py-12 text-center px-4">
            <Loader2 className="h-8 w-8 mx-auto mb-3 text-blue-500 animate-spin" />
            <p className="text-sm text-slate-500">Memuat riwayat...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="py-12 text-center px-4">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-red-400" />
            <p className="text-sm text-red-500 mb-2">Gagal memuat riwayat</p>
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
        {!isLoading && !error && (!invoices || invoices.length === 0) && (
          <div className="py-12 text-center px-4">
            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-400" />
            <p className="text-sm text-slate-500">Belum ada invoice</p>
            <p className="text-xs text-slate-400 mt-1">Invoice yang sudah dibuat akan muncul di sini</p>
          </div>
        )}

        {/* Invoice List */}
        {!isLoading && !error && invoices && invoices.length > 0 && (
          <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto px-4 pb-4">
            {invoices.map((invoice: InvoiceListItem) => (
              <button
                key={invoice.id}
                type="button"
                onClick={() => onSelectInvoice?.(invoice.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedId === invoice.id
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-bold text-sm text-blue-600">
                        {invoice.title || "Invoice"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {format(new Date(invoice.createdAt), "dd MMM yyyy HH:mm", { locale: id })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{invoice.count} transaksi</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Total Invoice
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-emerald-600" />
                    <span className="font-bold text-sm text-emerald-600">
                      Rp {invoice.total.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
