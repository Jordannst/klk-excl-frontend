export const invoiceDateModes = ['enabled', 'blank-column', 'hidden-column'] as const

export type InvoiceDateMode = (typeof invoiceDateModes)[number]

const defaultInvoiceDateMode: InvoiceDateMode = 'enabled'
const invoiceDateModeSet = new Set<InvoiceDateMode>(invoiceDateModes)

export function isInvoiceDateMode(value: unknown): value is InvoiceDateMode {
  return typeof value === 'string' && invoiceDateModeSet.has(value as InvoiceDateMode)
}

export function normalizeInvoiceDateMode(value: unknown): InvoiceDateMode {
  if (value === undefined || value === null || value === '') {
    return defaultInvoiceDateMode
  }

  if (!isInvoiceDateMode(value)) {
    throw new Error('Invalid invoice date mode')
  }

  return value
}

export function isDateColumnVisible(dateMode: InvoiceDateMode): boolean {
  return dateMode !== 'hidden-column'
}

export function isDateInputEnabled(dateMode: InvoiceDateMode): boolean {
  return dateMode === 'enabled'
}

export function isRowDateRequired(dateMode: InvoiceDateMode): boolean {
  return dateMode === 'enabled'
}

export function getDateCellText(
  tanggal: string | null | undefined,
  dateMode: InvoiceDateMode,
  options?: {
    emptyText?: string
    hiddenText?: string
  }
): string {
  if (!isDateColumnVisible(dateMode)) {
    return options?.hiddenText ?? ''
  }

  if (dateMode === 'blank-column') {
    return options?.emptyText ?? ''
  }

  if (tanggal) {
    return tanggal
  }

  return options?.emptyText ?? '-'
}
