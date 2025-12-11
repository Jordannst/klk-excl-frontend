"use client"

import * as React from "react"
import { RefreshCw, FileText, TrendingUp, Package as PackageIcon } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ExpeditionFormData } from "./ExpeditionForm"

interface TransactionTableProps {
  data: ExpeditionFormData[]
  onRefresh: () => void
}

export function TransactionTable({ data, onRefresh }: TransactionTableProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    onRefresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <Card className="w-full shadow-elevation border-0 overflow-hidden bg-gradient-to-br from-white to-slate-50/50">
      {/* Gradient Header */}
      <div className="h-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500"></div>
      
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-lg shadow-emerald-500/30">
                <FileText className="h-5 w-5 text-white" />
              </div>
              Laporan Transaksi
            </CardTitle>
            <CardDescription className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Daftar transaksi hari ini - {data.length} transaksi
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="default"
            onClick={handleRefresh}
            className="gap-2 border-2 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
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
                    <TableHead className="font-bold text-slate-700">Tanggal</TableHead>
                    <TableHead className="font-bold text-slate-700">No. STT</TableHead>
                    <TableHead className="font-bold text-slate-700">Pengirim</TableHead>
                    <TableHead className="font-bold text-slate-700">Penerima</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">C</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Kg</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Min</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Tarif</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Jumlah</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => {
                    const effectiveKg = Math.max(item.kg || 0, item.min || 0)
                    return (
                      <TableRow 
                        key={index} 
                        className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 border-b border-slate-100"
                      >
                        <TableCell className="text-slate-600">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-700">
                              {item.date ? format(new Date(item.date), "dd MMM yyyy", { locale: id }) : "-"}
                            </span>
                            <span className="text-xs text-slate-500">
                              {item.date ? format(new Date(item.date), "EEEE", { locale: id }) : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono font-bold text-blue-600 group-hover:text-blue-700">
                          {item.stt}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">{item.sender}</TableCell>
                        <TableCell className="font-medium text-slate-700">{item.receiver}</TableCell>
                        <TableCell className="text-center font-semibold text-amber-600">
                          {item.coly}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700">
                          {item.kg}
                        </TableCell>
                        <TableCell className="text-right font-medium text-orange-600">
                          {item.min}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-600">
                          Rp {(item.tarif || 0).toLocaleString("id-ID")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-lg text-emerald-600">
                              Rp {item.total.toLocaleString("id-ID")}
                            </span>
                            <span className="text-xs text-slate-400">
                              ({effectiveKg} kg)
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  
                  {/* Summary Row */}
                  <TableRow className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-t-2 border-emerald-200 font-bold hover:from-emerald-100 hover:to-emerald-50">
                    <TableCell colSpan={8} className="text-right text-emerald-800 text-base">
                      Total Pendapatan:
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-bold text-xl text-emerald-700">
                          Rp {data.reduce((sum, item) => sum + item.total, 0).toLocaleString("id-ID")}
                        </span>
                        <span className="text-xs text-emerald-600">
                          dari {data.length} transaksi
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
