// Backend API Types - synchronized with Prisma schema

import type { InvoiceDateMode } from './invoice-date-mode'

export type { InvoiceDateMode } from './invoice-date-mode'

export interface Transaksi {
  id: number
  tanggal: string | null // ISO date string when present
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
  dateMode: InvoiceDateMode
  showKeteranganColumn: boolean
  transactions: Transaksi[]
}

// List item (without transactions)
export interface InvoiceListItem {
  id: number
  title: string
  createdAt: string
  total: number
  count: number
  showKeteranganColumn: boolean
}

// Trash item (soft-deleted invoice)
export interface TrashInvoiceItem {
  id: number
  title: string
  createdAt: string
  deletedAt: string // When the invoice was moved to trash
  total: number
  count: number
}

// Request payloads
export interface CreateTransaksiPayload {
  tanggal?: string | null
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
}

export interface UpdateTransaksiPayload {
  tanggal?: string | null
  pengirim?: string
  penerima?: string
  coly?: number
  berat?: number
  min?: number
  tarif?: number
  total?: number
  noResi?: string
  keterangan?: string | null
}

export interface CreateInvoicePayload {
  title: string
  dateMode?: InvoiceDateMode
  showKeteranganColumn?: boolean
  transactions: CreateTransaksiPayload[]
}

export interface UpdateInvoicePayload {
  title?: string
  dateMode?: InvoiceDateMode
  showKeteranganColumn?: boolean
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
