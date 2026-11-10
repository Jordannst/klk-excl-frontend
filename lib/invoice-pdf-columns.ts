// Invoice PDF column widths, for display in the PDF editor only.
//
// The backend decides the real widths: calculateInvoicePdfColumnWidths in
// backend/src/services/pdf/invoicePdf.ts. This file mirrors its defaults, limits
// and fallback rule so the editor can show numbers and lock buttons. Change both
// together and run both checks (tests/invoice-pdf-columns.check.mjs here,
// src/checks/pdf-service.check.ts there).
//
// Node runs this file directly in that check, so keep it free of imports and of
// TypeScript syntax that emits code (enums, namespaces).

export type InvoicePdfColumnKey =
  | 'tanggal' | 'noResi' | 'coly' | 'berat' | 'min' | 'tarif' | 'total' | 'keterangan'

// Column width in mm; only the columns the user changed.
export type InvoicePdfColumnWidths = Partial<Record<InvoicePdfColumnKey, number>>

export const INVOICE_PDF_COLUMN_MIN_MM = 6
export const INVOICE_PDF_COLUMN_MAX_MM = 60
// Pengirim and Penerima share what is left and never go below this each.
export const INVOICE_PDF_TEXT_COLUMN_MIN_MM = 24

const TABLE_WIDTH_MM = 191
const NO_COLUMN_WIDTH_MM = 11

export const INVOICE_PDF_COLUMN_LABELS: Record<InvoicePdfColumnKey, string> = {
  tanggal: 'Tgl',
  noResi: 'No STT',
  coly: 'Coly',
  berat: 'Kg',
  min: 'Min',
  tarif: 'Tarif',
  total: 'Jumlah',
  keterangan: 'Ket',
}

export function visibleInvoicePdfColumns(showDate: boolean, showKet: boolean): InvoicePdfColumnKey[] {
  return [
    ...(showDate ? (['tanggal'] as const) : []),
    'noResi',
    'coly',
    'berat',
    'min',
    'tarif',
    'total',
    ...(showKet ? (['keterangan'] as const) : []),
  ]
}

function defaultWidth(key: InvoicePdfColumnKey, showKet: boolean): number {
  switch (key) {
    case 'tanggal': return 20
    // The Ket column also selects the dense font, which needs less width.
    case 'noResi': return showKet ? 34 : 38
    case 'coly': return 10
    case 'berat': return 8
    case 'min': return 8
    case 'tarif': return 16
    case 'total': return 19
    case 'keterangan': return 16
  }
}

export interface ResolvedInvoicePdfColumnWidths {
  /** Final width of every visible column. */
  widths: InvoicePdfColumnWidths
  /** Default width of every visible column. */
  defaults: InvoicePdfColumnWidths
  /** Width of Pengirim and of Penerima. */
  textColumnWidth: number
  /** False only when the overrides were dropped because they do not fit. */
  overridesApplied: boolean
}

export function resolveInvoicePdfColumnWidths(
  showDate: boolean,
  showKet: boolean,
  overrides: unknown
): ResolvedInvoicePdfColumnWidths {
  const keys = visibleInvoicePdfColumns(showDate, showKet)
  const defaults: InvoicePdfColumnWidths = {}
  const custom: InvoicePdfColumnWidths = {}
  const source =
    typeof overrides === 'object' && overrides !== null && !Array.isArray(overrides)
      ? (overrides as Record<string, unknown>)
      : {}

  for (const key of keys) {
    const fallback = defaultWidth(key, showKet)
    const value = source[key]
    defaults[key] = fallback
    custom[key] =
      typeof value === 'number' && Number.isFinite(value)
        ? Math.min(INVOICE_PDF_COLUMN_MAX_MM, Math.max(INVOICE_PDF_COLUMN_MIN_MM, Math.round(value * 2) / 2))
        : fallback
  }

  const textWidth = (widths: InvoicePdfColumnWidths) =>
    (TABLE_WIDTH_MM - NO_COLUMN_WIDTH_MM - keys.reduce((sum, key) => sum + (widths[key] ?? 0), 0)) / 2

  const overridesApplied = textWidth(custom) >= INVOICE_PDF_TEXT_COLUMN_MIN_MM
  const widths = overridesApplied ? custom : defaults

  return { widths, defaults, textColumnWidth: textWidth(widths), overridesApplied }
}
