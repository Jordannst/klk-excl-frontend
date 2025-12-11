"use client"

import * as React from "react"
import { Package, TrendingUp, Clock, BarChart3 } from "lucide-react"
import { ExpeditionForm, ExpeditionFormData } from "@/components/ExpeditionForm"
import { TransactionTable } from "@/components/TransactionTable"

export default function Dashboard() {
  const [data, setData] = React.useState<ExpeditionFormData[]>([])

  const handleAddTransaction = (newData: ExpeditionFormData) => {
    setData((prev) => [newData, ...prev])
  }

  const handleRefresh = () => {
    // In a real app, this would re-fetch from API
    console.log("Refreshing data...")
  }

  // Calculate stats
  const totalTransactions = data.length
  const totalRevenue = data.reduce((sum, item) => sum + item.total, 0)
  const totalWeight = data.reduce((sum, item) => sum + Math.max(item.kg || 0, item.min || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Enhanced Navbar with gradient */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-xl shadow-sm supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto flex h-16 items-center gap-4 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">
                Ekspedisi Admin
              </h1>
              <p className="text-xs text-slate-500">Dashboard Pengiriman</p>
            </div>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5">
              <Clock className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">
                {new Date().toLocaleDateString('id-ID', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto py-6 px-4 md:py-8 md:px-8 space-y-6">
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Transactions */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-1">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <TrendingUp className="h-5 w-5 text-blue-100" />
              </div>
              <div className="text-3xl font-bold">{totalTransactions}</div>
              <div className="text-sm text-blue-100 font-medium">Total Transaksi</div>
            </div>
          </div>

          {/* Total Revenue */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-1">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <TrendingUp className="h-6 w-6" />
                </div>
              </div>
              <div className="text-3xl font-bold">Rp {totalRevenue.toLocaleString('id-ID')}</div>
              <div className="text-sm text-emerald-100 font-medium">Total Pendapatan</div>
            </div>
          </div>

          {/* Total Weight */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 p-6 text-white shadow-lg shadow-violet-500/30 transition-all hover:shadow-xl hover:shadow-violet-500/40 hover:-translate-y-1">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Package className="h-6 w-6" />
                </div>
              </div>
              <div className="text-3xl font-bold">{totalWeight} kg</div>
              <div className="text-sm text-violet-100 font-medium">Total Berat Kirim</div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Form */}
          <div className="xl:col-span-5 w-full">
            <ExpeditionForm onSubmitSuccess={handleAddTransaction} />
          </div>

          {/* Right Column: Table */}
          <div className="xl:col-span-7 w-full">
            <TransactionTable data={data} onRefresh={handleRefresh} />
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/60 backdrop-blur-sm mt-12">
        <div className="container mx-auto py-6 px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-600">
              © 2025 Ekspedisi Admin. All rights reserved.
            </p>
            <p className="text-xs text-slate-500">
              v1.0.0
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
