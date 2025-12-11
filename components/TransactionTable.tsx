"use client"

import * as React from "react"
import { RefreshCw, FileText, Package as PackageIcon, Download, Printer } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import * as XLSX from "xlsx"

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

  // Format number with dot separator (Indonesian format)
  const formatNumber = (num: number): string => {
    return num.toLocaleString("id-ID")
  }

  // Export to Excel
  const exportToExcel = () => {
    if (data.length === 0) {
      alert("Tidak ada data untuk diekspor")
      return
    }

    // Prepare data for Excel - format sesuai gambar
    const excelData = data.map((item, index) => ({
      "Hari/Tgl": item.date ? format(new Date(item.date), "dd MMM yyyy", { locale: id }) : "",
      "No Stt": item.stt,
      Pengirim: item.sender,
      Penerima: item.receiver,
      C: item.coly,
      Kg: item.kg,
      Min: item.min || "",
      Tarif: formatNumber(item.tarif || 0),
      Jumlah: formatNumber(item.total),
    }))

    // Add summary row - semua kolom kosong kecuali Jumlah
    const totalRevenue = data.reduce((sum, item) => sum + item.total, 0)
    excelData.push({
      "Hari/Tgl": "",
      "No Stt": "",
      Pengirim: "",
      Penerima: "",
      C: "",
      Kg: "",
      Min: "",
      Tarif: "",
      Jumlah: formatNumber(totalRevenue),
    })

    // Create workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Perhitungan Pengiriman Barang")

    // Generate filename with current date
    const filename = `Perhitungan_Pengiriman_Barang_${format(new Date(), "yyyy-MM-dd")}.xlsx`

    // Save file
    XLSX.writeFile(wb, filename)
  }

  // Print function
  const handlePrint = () => {
    if (data.length === 0) {
      alert("Tidak ada data untuk dicetak")
      return
    }

    // Create print window content
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    const totalRevenue = data.reduce((sum, item) => sum + item.total, 0)

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Perhitungan Pengiriman Barang - KLK Invoice</title>
          <style>
            @media print {
              @page {
                margin: 1cm;
                size: A4 landscape;
              }
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 12px;
              margin: 20px;
            }
            h1 {
              text-align: center;
              margin-bottom: 20px;
              color: #1e293b;
              font-size: 18px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 1px solid #000;
              padding: 6px;
              text-align: left;
            }
            th {
              background-color: #e5e7eb;
              font-weight: bold;
              text-align: center;
            }
            td {
              text-align: right;
            }
            td:first-child, td:nth-child(2), td:nth-child(3), td:nth-child(4), td:nth-child(5) {
              text-align: left;
            }
            .summary-row td {
              text-align: right;
            }
            .summary-row td:last-child {
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <h1>perhitungan Pengiriman Barang</h1>
          <table>
            <thead>
              <tr>
                <th>Hari/Tgl</th>
                <th>No Stt</th>
                <th>Pengirim</th>
                <th>Penerima</th>
                <th>C</th>
                <th>Kg</th>
                <th>Min</th>
                <th>Tarif</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (item, index) => `
                <tr>
                  <td>${item.date ? format(new Date(item.date), "dd MMM yyyy", { locale: id }) : ""}</td>
                  <td>${item.stt}</td>
                  <td>${item.sender}</td>
                  <td>${item.receiver}</td>
                  <td>${item.coly}</td>
                  <td>${item.kg}</td>
                  <td>${item.min || ""}</td>
                  <td>${formatNumber(item.tarif || 0)}</td>
                  <td>${formatNumber(item.total)}</td>
                </tr>
              `
                )
                .join("")}
              <tr class="summary-row">
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td>${formatNumber(totalRevenue)}</td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
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
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="default"
              onClick={handleRefresh}
              className="gap-2 border-2 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
            <Button 
              variant="outline" 
              size="default"
              onClick={exportToExcel}
              disabled={data.length === 0}
              className="gap-2 border-2 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
            <Button 
              variant="outline" 
              size="default"
              onClick={handlePrint}
              disabled={data.length === 0}
              className="gap-2 border-2 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300"
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
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
                    <TableHead className="font-bold text-slate-700 text-center">No</TableHead>
                    <TableHead className="font-bold text-slate-700">Tgl</TableHead>
                    <TableHead className="font-bold text-slate-700">No STT</TableHead>
                    <TableHead className="font-bold text-slate-700">Pengirim → Penerima</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Coly</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Kg</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Min</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Tarif</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Total</TableHead>
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
                        <TableCell className="text-center text-slate-600 font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {item.date ? format(new Date(item.date), "dd MMM yyyy", { locale: id }) : "-"}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-blue-600 group-hover:text-blue-700">
                          {item.stt}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {item.sender} → {item.receiver}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">
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
                          <span className="font-bold text-lg text-emerald-600">
                            Rp {item.total.toLocaleString("id-ID")}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  
                  {/* Summary Row */}
                  <TableRow className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-t-2 border-emerald-200 font-bold hover:from-emerald-100 hover:to-emerald-50">
                    <TableCell colSpan={8} className="text-right text-emerald-800 text-base">
                      Grand Total:
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-xl text-emerald-700">
                        Rp {data.reduce((sum, item) => sum + item.total, 0).toLocaleString("id-ID")}
                      </span>
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
