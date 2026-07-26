"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { useSearchTransaksi, type TransaksiSearchResult } from "@/lib/hooks/useTransaksi"

interface TransaksiSearchProps {
  onSelect: (invoiceId: number, noResi: string) => void
}

export function TransaksiSearch({ onSelect }: TransaksiSearchProps) {
  const router = useRouter()
  const [input, setInput] = React.useState("")
  const [query, setQuery] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Debounce typing -> query
  React.useEffect(() => {
    const timer = setTimeout(() => setQuery(input), 300)
    return () => clearTimeout(timer)
  }, [input])

  const { data: results, isFetching, isError } = useSearchTransaksi(query)
  const showDropdown = isOpen && query.trim().length >= 3

  // Close on outside click / Escape
  React.useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [])

  const handlePick = (result: TransaksiSearchResult) => {
    setIsOpen(false)
    setInput("")
    setQuery("")
    if (result.invoice.deletedAt) {
      router.push("/trash")
      return
    }
    onSelect(result.invoice.id, result.noResi)
  }

  return (
    <div ref={containerRef} className="relative mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Cari No STT..."
          aria-label="Cari transaksi berdasarkan No STT"
          className="w-full h-10 pl-9 pr-3 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-40 mt-1 w-full max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {isError ? (
            <p className="p-3 text-sm text-red-600">Gagal mencari. Coba lagi.</p>
          ) : !results || results.length === 0 ? (
            !isFetching && <p className="p-3 text-sm text-slate-500">Tidak ditemukan</p>
          ) : (
            results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handlePick(result)}
                className="w-full px-3 py-2 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-slate-800 truncate">{result.noResi}</span>
                  {result.invoice.deletedAt && (
                    <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                      di Trash
                    </span>
                  )}
                </span>
                <span className="block text-xs text-slate-500 truncate">
                  {result.invoice.title}
                  {result.tanggal
                    ? ` — ${format(new Date(result.tanggal), "dd MMM yyyy", { locale: idLocale })}`
                    : ""}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
