"use client"

import * as React from "react"
import { FileText, Calendar, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { ExpeditionFormData } from "./ExpeditionForm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface InvoiceGroup {
  id: string
  title?: string
  date: string
  transactions: ExpeditionFormData[]
  total: number
  count: number
  createdAt?: string
}

interface InvoiceHistoryProps {
  invoiceGroups: InvoiceGroup[]
  selectedId?: string | null
  onSelectBatch?: (id: string) => void
}

export function InvoiceHistory({ invoiceGroups, selectedId, onSelectBatch }: InvoiceHistoryProps) {
  return (
    <Card className="w-full h-full shadow-md border-t-4 border-t-blue-600">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold">Riwayat Invoice</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0">
        {invoiceGroups.length === 0 ? (
          <div className="py-12 text-center px-4">
            <FileText className="h-12 w-12 mx-auto mb-3 text-slate-400" />
            <p className="text-sm text-slate-500">Belum ada invoice</p>
            <p className="text-xs text-slate-400 mt-1">Invoice yang sudah dibuat akan muncul di sini</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto px-4 pb-4">
            {invoiceGroups.map((group, index) => (
              <button
                key={group.id || index}
                type="button"
                onClick={() => onSelectBatch?.(group.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedId === group.id
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span className="font-bold text-sm text-blue-600">
                        {group.title || "Invoice"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {group.createdAt
                          ? format(new Date(group.createdAt), "dd MMM yyyy", { locale: id })
                          : group.date === "No Date"
                            ? "Tanpa Tanggal"
                            : format(new Date(group.date), "dd MMM yyyy", { locale: id })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mb-1">{group.count} transaksi</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Total Invoice
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-emerald-600" />
                    <span className="font-bold text-sm text-emerald-600">
                      Rp {group.total.toLocaleString("id-ID")}
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

