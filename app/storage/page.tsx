"use client"

import * as React from "react"
import { Database, FileText, RefreshCw, HardDrive, AlertTriangle, PenTool, Hash } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Navbar } from "@/components/Navbar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { statsApi, type StatsResponse } from "@/lib/api"

function StorageContent() {
  const [stats, setStats] = React.useState<StatsResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchStats = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await statsApi.getStats()
      setStats(data)
    } catch (err) {
      setError("Gagal memuat data storage")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    fetchStats()
  }, [])

  // Determine status color based on usage
  const getStatusColor = (percent: number) => {
    if (percent >= 90) return "text-red-600"
    if (percent >= 70) return "text-orange-500"
    if (percent >= 50) return "text-yellow-500"
    return "text-emerald-600"
  }

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500"
    if (percent >= 70) return "bg-orange-500"
    if (percent >= 50) return "bg-yellow-500"
    return "bg-emerald-500"
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Shared Navbar */}
      <Navbar />

      {/* Content */}
      <main className="max-w-4xl mx-auto pt-20 sm:pt-24 px-4 sm:px-6 pb-8">
        {/* Page Header with Action */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Storage Monitor</h2>
            <p className="text-sm text-slate-500">Pantau penggunaan database</p>
          </div>
          <Button
            variant="outline"
            onClick={fetchStats}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={fetchStats} className="ml-auto">
                  Coba Lagi
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && !stats && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 mx-auto mb-3 text-blue-500 animate-spin" />
              <p className="text-slate-500">Memuat data...</p>
            </div>
          </div>
        )}

        {/* Stats Content */}
        {stats && (
          <div className="space-y-6">
            {/* Database Usage Card */}
            <Card className="shadow-lg border-t-4 border-t-blue-600">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <HardDrive className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Database Storage</CardTitle>
                    <CardDescription>Supabase Free Tier (500 MB)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className={`text-4xl font-bold ${getStatusColor(stats.database.usagePercent)}`}>
                        {stats.database.sizeMB.toFixed(2)}
                      </span>
                      <span className="text-xl text-slate-400 ml-1">MB</span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-semibold text-slate-600">
                        {stats.database.limitMB}
                      </span>
                      <span className="text-lg text-slate-400 ml-1">MB</span>
                    </div>
                  </div>
                  <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${getProgressColor(stats.database.usagePercent)}`}
                      style={{ width: `${Math.min(stats.database.usagePercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Terpakai</span>
                    <span className={`font-semibold ${getStatusColor(stats.database.usagePercent)}`}>
                      {stats.database.usagePercent.toFixed(2)}%
                    </span>
                    <span className="text-slate-500">Limit</span>
                  </div>
                </div>

                {/* Warning if > 70% */}
                {stats.database.usagePercent >= 70 && (
                  <div className={`p-4 rounded-lg ${
                    stats.database.usagePercent >= 90 
                      ? "bg-red-50 border border-red-200" 
                      : "bg-orange-50 border border-orange-200"
                  }`}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className={`h-5 w-5 ${
                        stats.database.usagePercent >= 90 ? "text-red-500" : "text-orange-500"
                      }`} />
                      <span className={`font-medium ${
                        stats.database.usagePercent >= 90 ? "text-red-700" : "text-orange-700"
                      }`}>
                        {stats.database.usagePercent >= 90 
                          ? "Storage hampir penuh! Segera hapus data yang tidak diperlukan."
                          : "Storage mulai penuh. Pertimbangkan untuk menghapus invoice lama."
                        }
                      </span>
                    </div>
                  </div>
                )}

                {/* Storage Breakdown */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg text-center">
                    <p className="text-sm text-slate-500 mb-1">Sisa Storage</p>
                    <p className="text-2xl font-bold text-slate-700">
                      {(stats.database.limitMB - stats.database.sizeMB).toFixed(2)} MB
                    </p>
                  </div>
                  <div className="p-4 bg-violet-50 rounded-lg text-center">
                    <p className="text-sm text-slate-500 mb-1">Signature Storage</p>
                    <p className="text-2xl font-bold text-violet-600">
                      {stats.storage.signatureKB.toFixed(2)} KB
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Counts Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Invoice Count */}
              <Card className="shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                      <FileText className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Invoice</p>
                      <p className="text-2xl font-bold text-emerald-600">
                        {stats.counts.invoices}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction Count */}
              <Card className="shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                      <Hash className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Transaksi</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {stats.counts.transactions}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Signature Count */}
              <Card className="shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                      <PenTool className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Tanda Tangan</p>
                      <p className="text-2xl font-bold text-violet-600">
                        {stats.counts.signatures}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Last Updated */}
            <p className="text-center text-sm text-slate-400">
              Terakhir diperbarui: {format(new Date(stats.updatedAt), "dd MMMM yyyy, HH:mm:ss", { locale: id })}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default function StoragePage() {
  return (
    <ProtectedRoute>
      <StorageContent />
    </ProtectedRoute>
  )
}
