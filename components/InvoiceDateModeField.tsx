"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  invoiceDateModes,
  isDateColumnVisible,
  isDateInputEnabled,
  type InvoiceDateMode,
} from "@/lib/invoice-date-mode"

interface InvoiceDateModeFieldProps {
  value: InvoiceDateMode
  onChange: (value: InvoiceDateMode) => void
  className?: string
  disabled?: boolean
}

const modeLabels: Record<InvoiceDateMode, string> = {
  enabled: "Tanggal aktif",
  "blank-column": "Kolom kosong",
  "hidden-column": "Sembunyikan kolom",
}

function getModeDescription(mode: InvoiceDateMode) {
  if (isDateInputEnabled(mode)) {
    return "Setiap transaksi memakai tanggal masing-masing."
  }

  if (isDateColumnVisible(mode)) {
    return "Kolom tanggal tetap tampil, tetapi nilainya kosong."
  }

  return "Kolom tanggal disembunyikan di draft invoice ini."
}

export function InvoiceDateModeField({
  value,
  onChange,
  className,
  disabled = false,
}: InvoiceDateModeFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-semibold text-slate-700">
        Mode tanggal invoice
      </Label>

      <div
        role="radiogroup"
        aria-label="Mode tanggal invoice"
        className="grid grid-cols-1 gap-3 md:grid-cols-3"
      >
        {invoiceDateModes.map((mode) => {
          const isActive = mode === value

          return (
            <Button
              key={mode}
              type="button"
              variant={isActive ? "default" : "outline"}
              onClick={() => onChange(mode)}
              disabled={disabled}
              className={cn(
                "h-auto min-h-20 flex-col items-start justify-start gap-1 px-4 py-3 text-left whitespace-normal",
                isActive
                  ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700 disabled:border-blue-600 disabled:bg-blue-600 disabled:text-white"
                  : "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50 disabled:border-slate-200 disabled:bg-white disabled:text-slate-400",
                disabled && "cursor-not-allowed opacity-70"
              )}
              aria-pressed={isActive}
            >
              <span className="text-sm font-bold">{modeLabels[mode]}</span>
              <span className={cn("text-xs leading-relaxed", isActive ? "text-blue-100" : "text-slate-500")}>
                {getModeDescription(mode)}
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
