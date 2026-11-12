"use client"

import * as React from "react"
import { Minus, Plus } from "lucide-react"

import {
  INVOICE_PDF_COLUMN_LABELS,
  INVOICE_PDF_COLUMN_MAX_MM,
  INVOICE_PDF_COLUMN_MIN_MM,
  INVOICE_PDF_TEXT_COLUMN_MIN_MM,
  resolveInvoicePdfColumnWidths,
  visibleInvoicePdfColumns,
  type InvoicePdfColumnKey,
  type InvoicePdfColumnWidths,
} from "@/lib/invoice-pdf-columns"

interface InvoiceColumnWidthEditorProps {
  showDate: boolean
  showKet: boolean
  /** Only the widths the user changed; untouched columns follow the defaults. */
  value: InvoicePdfColumnWidths
  onChange: (next: InvoicePdfColumnWidths) => void
}

const stepButtonClass =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"

/** Number field that only reports a value once the user leaves it or presses Enter. */
function WidthInput({
  label,
  value,
  onCommit,
}: {
  label: string
  value: number
  onCommit: (next: number) => void
}) {
  const [draft, setDraft] = React.useState<string | null>(null)

  const commit = () => {
    if (draft === null) return
    const parsed = Number(draft)
    setDraft(null)
    // Empty or unreadable input keeps the previous width.
    if (draft.trim() !== "" && Number.isFinite(parsed)) onCommit(parsed)
  }

  return (
    <input
      type="number"
      inputMode="decimal"
      step={1}
      min={INVOICE_PDF_COLUMN_MIN_MM}
      max={INVOICE_PDF_COLUMN_MAX_MM}
      aria-label={`Lebar kolom ${label} dalam mm`}
      value={draft ?? String(value)}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur()
      }}
      className="h-8 w-14 rounded-lg border border-slate-200 bg-white px-1 text-center text-sm tabular-nums text-slate-800 [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  )
}

export function InvoiceColumnWidthEditor({ showDate, showKet, value, onChange }: InvoiceColumnWidthEditorProps) {
  const keys = visibleInvoicePdfColumns(showDate, showKet)
  const { widths, defaults, textColumnWidth, overridesApplied } = resolveInvoicePdfColumnWidths(
    showDate,
    showKet,
    value
  )

  // Pengirim and Penerima shrink by half of every mm a column gains, so this is
  // how many mm the fixed columns can still grow in total.
  const room = (textColumnWidth - INVOICE_PDF_TEXT_COLUMN_MIN_MM) * 2
  const hasRoomForStep = room >= 1
  const hasOverrides = Object.keys(value).length > 0

  const setWidth = (key: InvoicePdfColumnKey, requested: number) => {
    const current = widths[key] ?? 0
    const largestThatFits = Math.min(INVOICE_PDF_COLUMN_MAX_MM, current + room)
    const nextWidth = Math.min(
      largestThatFits,
      Math.max(INVOICE_PDF_COLUMN_MIN_MM, Math.round(requested * 2) / 2)
    )

    // Keep overrides of columns that are hidden right now; rewrite the visible ones
    // from what is actually applied, so dropped overrides do not come back.
    const next: InvoicePdfColumnWidths = { ...value }
    for (const column of keys) {
      const width = column === key ? nextWidth : widths[column]
      if (width === undefined || width === defaults[column]) delete next[column]
      else next[column] = width
    }
    onChange(next)
  }

  return (
    <section className="rounded-lg border border-slate-200 p-4" aria-label="Lebar kolom">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700">Lebar kolom (mm)</h3>
        <button
          type="button"
          onClick={() => onChange({})}
          disabled={!hasOverrides}
          className="h-7 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Reset
        </button>
      </div>

      {!overridesApplied && (
        <p className="mb-3 rounded-lg bg-amber-50 p-2.5 text-xs font-medium text-amber-800" role="status">
          Lebar kustom tidak muat dengan kolom yang tampil, dipakai lebar default
        </p>
      )}

      <ul className="space-y-1.5">
        {keys.map((key) => {
          const label = INVOICE_PDF_COLUMN_LABELS[key]
          const width = widths[key] ?? 0

          return (
            <li key={key} className="flex items-center justify-between gap-2">
              <span className="text-sm text-slate-700">{label}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className={stepButtonClass}
                  aria-label={`Kecilkan kolom ${label}`}
                  disabled={width <= INVOICE_PDF_COLUMN_MIN_MM}
                  onClick={() => setWidth(key, width - 1)}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <WidthInput label={label} value={width} onCommit={(next) => setWidth(key, next)} />
                <button
                  type="button"
                  className={stepButtonClass}
                  aria-label={`Besarkan kolom ${label}`}
                  disabled={width >= INVOICE_PDF_COLUMN_MAX_MM || !hasRoomForStep}
                  onClick={() => setWidth(key, width + 1)}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>

      <p className="mt-3 text-xs text-slate-500">
        Pengirim dan Penerima otomatis: {textColumnWidth.toLocaleString("id-ID")} mm
      </p>
      {!hasRoomForStep && (
        <p className="mt-1 text-xs font-medium text-amber-700">Kecilkan kolom lain dulu</p>
      )}
    </section>
  )
}
