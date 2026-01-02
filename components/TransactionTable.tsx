"use client"

import * as React from "react"
import { RefreshCw, FileText, Package as PackageIcon, Download, Printer, Pencil, Check, X, Loader2 } from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { PrintInvoiceModal } from "@/components/PrintInvoiceModal"
import { useUpdateTransaksi } from "@/lib/hooks"
import type { Transaksi } from "@/lib/types"

interface TransactionTableProps {
  data: Transaksi[]
  onRefresh?: () => void
  title?: string
}

export function TransactionTable({ data, onRefresh, title }: TransactionTableProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [editingId, setEditingId] = React.useState<number | null>(null)
  const [editDraft, setEditDraft] = React.useState<Transaksi | null>(null)
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false)

  // API mutation for updating
  const updateTransaksiMutation = useUpdateTransaksi()

  const handleRefresh = () => {
    if (!onRefresh) return
    setIsRefreshing(true)
    onRefresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const startEdit = (item: Transaksi) => {
    setEditingId(item.id)
    setEditDraft({ ...item })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditDraft(null)
  }

  const saveEdit = async () => {
    if (!editingId || !editDraft) return

    // Recalculate total based on effective kg
    const effectiveKg = Math.max(editDraft.berat, editDraft.min)
    const calculatedTotal = effectiveKg * editDraft.tarif

    try {
      await updateTransaksiMutation.mutateAsync({
        id: editingId,
        payload: {
          tanggal: editDraft.tanggal,
          pengirim: editDraft.pengirim,
          penerima: editDraft.penerima,
          coly: editDraft.coly,
          berat: editDraft.berat,
          min: editDraft.min,
          tarif: editDraft.tarif,
          total: calculatedTotal,
          noResi: editDraft.noResi,
        },
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

  const handleEditChange = (field: keyof Transaksi, value: string | number) => {
    if (!editDraft) return
    setEditDraft((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  // Format number with dot separator (Indonesian format)
  const formatNumber = (num: number): string => {
    return num.toLocaleString("id-ID")
  }

  // Export to Excel
  const exportToExcel = () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diekspor")
      return
    }

    // Prepare data for Excel - format sesuai gambar
    const excelData: Record<string, string | number>[] = data.map((item) => ({
      "Hari/Tgl": item.tanggal ? format(new Date(item.tanggal), "dd MMM yyyy", { locale: id }) : "",
      "No Stt": item.noResi,
      Pengirim: item.pengirim,
      Penerima: item.penerima,
      C: item.coly,
      Kg: item.berat,
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
      toast.error("Tidak ada data untuk dicetak")
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
          <h1>${title || 'Perhitungan Pengiriman Barang'}</h1>
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
                  (item) => `
                <tr>
                  <td>${item.tanggal ? format(new Date(item.tanggal), "dd MMM yyyy", { locale: id }) : ""}</td>
                  <td>${item.noResi}</td>
                  <td>${item.pengirim}</td>
                  <td>${item.penerima}</td>
                  <td>${item.coly}</td>
                  <td>${item.berat}</td>
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
              {title || 'Laporan Transaksi'}
            </CardTitle>
          </div>
          <div className="flex flex-wrap gap-2">
            {onRefresh && (
              <Button 
                variant="outline" 
                size="default"
                onClick={handleRefresh}
                className="gap-2 border-2 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all duration-300"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            )}
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
              onClick={() => setIsPrintModalOpen(true)}
              disabled={data.length === 0}
              className="gap-2 border-2 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all duration-300"
            >
              <Printer className="h-4 w-4" />
              Print Invoice
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
                    <TableHead className="font-bold text-slate-700">Pengirim</TableHead>
                    <TableHead className="font-bold text-slate-700">Penerima</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Coly</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Kg</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Min</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Tarif</TableHead>
                    <TableHead className="font-bold text-slate-700 text-right">Total</TableHead>
                    <TableHead className="font-bold text-slate-700 text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => {
                    const isEditing = editingId === item.id
                    const draft = isEditing ? editDraft : item
                    
                    return (
                      <TableRow 
                        key={item.id || index} 
                        className="group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-transparent transition-all duration-200 border-b border-slate-100"
                      >
                        <TableCell className="text-center text-slate-600 font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-slate-600">
                          {isEditing ? (
                            <Input
                              value={draft?.tanggal ? format(new Date(draft.tanggal), "yyyy-MM-dd") : ""}
                              type="date"
                              className="w-32"
                              onChange={(e) => handleEditChange("tanggal", e.target.value)}
                            />
                          ) : (
                            item.tanggal ? format(new Date(item.tanggal), "dd MMM yyyy", { locale: id }) : "-"
                          )}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-blue-600 group-hover:text-blue-700">
                          {isEditing ? (
                            <Input
                              value={draft?.noResi || ""}
                              className="w-28"
                              onChange={(e) => handleEditChange("noResi", e.target.value)}
                            />
                          ) : (
                            item.noResi
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {isEditing ? (
                            <Input
                              value={draft?.pengirim || ""}
                              className="w-32"
                              onChange={(e) => handleEditChange("pengirim", e.target.value)}
                            />
                          ) : (
                            item.pengirim
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">
                          {isEditing ? (
                            <Input
                              value={draft?.penerima || ""}
                              className="w-32"
                              onChange={(e) => handleEditChange("penerima", e.target.value)}
                            />
                          ) : (
                            item.penerima
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">
                          {isEditing ? (
                            <Input
                              value={draft?.coly ?? 0}
                              type="number"
                              className="w-16 text-right"
                              onChange={(e) => handleEditChange("coly", Number(e.target.value))}
                            />
                          ) : (
                            item.coly
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700">
                          {isEditing ? (
                            <Input
                              value={draft?.berat ?? 0}
                              type="number"
                              step="0.1"
                              className="w-16 text-right"
                              onChange={(e) => handleEditChange("berat", Number(e.target.value))}
                            />
                          ) : (
                            item.berat
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-orange-600">
                          {isEditing ? (
                            <Input
                              value={draft?.min ?? 0}
                              type="number"
                              className="w-16 text-right"
                              onChange={(e) => handleEditChange("min", Number(e.target.value))}
                            />
                          ) : (
                            item.min
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-600">
                          {isEditing ? (
                            <Input
                              value={draft?.tarif ?? 0}
                              type="number"
                              className="w-20 text-right"
                              onChange={(e) => handleEditChange("tarif", Number(e.target.value))}
                            />
                          ) : (
                            `Rp ${(item.tarif || 0).toLocaleString("id-ID")}`
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-lg text-emerald-600">
                            Rp {item.total.toLocaleString("id-ID")}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-2 text-green-700 border-green-200 hover:bg-green-50"
                                onClick={saveEdit}
                                disabled={updateTransaksiMutation.isPending}
                              >
                                {updateTransaksiMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-slate-600 hover:bg-slate-100"
                                onClick={cancelEdit}
                                disabled={updateTransaksiMutation.isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-blue-600 hover:bg-blue-50"
                              onClick={() => startEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  
                  {/* Summary Row */}
                  <TableRow className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 border-t-2 border-emerald-200 font-bold hover:from-emerald-100 hover:to-emerald-50">
                    <TableCell colSpan={9} className="text-right text-emerald-800 text-base">
                      Grand Total:
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-xl text-emerald-700">
                        Rp {data.reduce((sum, item) => sum + item.total, 0).toLocaleString("id-ID")}
                      </span>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>

      {/* Print Invoice Modal */}
      <PrintInvoiceModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        data={data}
        invoiceTitle={title}
      />
    </Card>
  )
}
