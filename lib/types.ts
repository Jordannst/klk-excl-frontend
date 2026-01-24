// Backend API Types - synchronized with Prisma schema

export interface Transaksi {
  id: number
  tanggal: string  // ISO date string
  pengirim: string
  penerima: string
  coly: number
  berat: number
  min: number
  tarif: number
  total: number
  noResi: string
  keterangan?: string | null
  invoiceId?: number | null
  createdAt: string
}

export interface Invoice {
  id: number
  title: string
  createdAt: string
  total: number
  count: number
  transactions: Transaksi[]
}

// List item (without transactions)
export interface InvoiceListItem {
  id: number
  title: string
  createdAt: string
  total: number
  count: number
}

// Request payloads
export interface CreateTransaksiPayload {
  tanggal: string
  pengirim: string
  penerima: string
  coly: number
  berat: number
  min: number
  tarif: number
  total: number
  noResi: string
  keterangan?: string
  invoiceId?: number
}

export interface UpdateTransaksiPayload {
  tanggal?: string
  pengirim?: string
  penerima?: string
  coly?: number
  berat?: number
  min?: number
  tarif?: number
  total?: number
  noResi?: string
  keterangan?: string
}

export interface CreateInvoicePayload {
  title: string
  transactions: CreateTransaksiPayload[]
}

export interface UpdateInvoicePayload {
  title: string
}

// API Response types
export interface ApiError {
  error: string
}

export interface DeleteResponse {
  message: string
}

// Signature types
export interface Signature {
  id: string
  label: string
  imageData: string // Base64 encoded PNG
  createdAt: string
}

export interface CreateSignaturePayload {
  label: string
  imageData: string
}

