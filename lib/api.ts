import axios from 'axios'
import type {
  Invoice,
  InvoiceListItem,
  Transaksi,
  CreateInvoicePayload,
  UpdateInvoicePayload,
  CreateTransaksiPayload,
  UpdateTransaksiPayload,
  DeleteResponse,
} from './types'

// Get API base URL with /api suffix
const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
  // Add /api suffix if not present
  return url.endsWith('/api') ? url : `${url}/api`
}

// Create axios instance with base URL
const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests for authentication
})

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/auth/refresh`,
          {},
          { withCredentials: true }
        )
        // Retry the original request
        return api.request(error.config)
      } catch {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

// Invoice API
export const invoiceApi = {
  // Get all invoices
  getAll: async (): Promise<InvoiceListItem[]> => {
    const { data } = await api.get<InvoiceListItem[]>('/invoice')
    return data
  },

  // Get invoice by ID with transactions
  getById: async (id: number): Promise<Invoice> => {
    const { data } = await api.get<Invoice>(`/invoice/${id}`)
    return data
  },

  // Create new invoice with batch transactions
  create: async (payload: CreateInvoicePayload): Promise<Invoice> => {
    const { data } = await api.post<Invoice>('/invoice', payload)
    return data
  },

  // Update invoice title
  update: async (id: number, payload: UpdateInvoicePayload): Promise<Invoice> => {
    const { data } = await api.put<Invoice>(`/invoice/${id}`, payload)
    return data
  },

  // Delete invoice
  delete: async (id: number): Promise<DeleteResponse> => {
    const { data } = await api.delete<DeleteResponse>(`/invoice/${id}`)
    return data
  },
}

// Transaksi API
export const transaksiApi = {
  // Get all transactions
  getAll: async (): Promise<Transaksi[]> => {
    const { data } = await api.get<Transaksi[]>('/transaksi')
    return data
  },

  // Get transaction by ID
  getById: async (id: number): Promise<Transaksi> => {
    const { data } = await api.get<Transaksi>(`/transaksi/${id}`)
    return data
  },

  // Create new transaction
  create: async (payload: CreateTransaksiPayload): Promise<Transaksi> => {
    const { data } = await api.post<Transaksi>('/transaksi', payload)
    return data
  },

  // Update transaction
  update: async (id: number, payload: UpdateTransaksiPayload): Promise<Transaksi> => {
    const { data } = await api.put<Transaksi>(`/transaksi/${id}`, payload)
    return data
  },

  // Delete transaction
  delete: async (id: number): Promise<DeleteResponse> => {
    const { data } = await api.delete<DeleteResponse>(`/transaksi/${id}`)
    return data
  },
}

// Health check
export const healthApi = {
  check: async (): Promise<{ status: string; timestamp: string }> => {
    const { data } = await api.get<{ status: string; timestamp: string }>('/health')
    return data
  },
}

export default api

