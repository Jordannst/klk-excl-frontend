'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { invoiceApi } from '../api'
import type { CreateInvoicePayload, UpdateInvoicePayload } from '../types'

// Query keys
export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: () => [...invoiceKeys.lists()] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: number) => [...invoiceKeys.details(), id] as const,
}

// Get all invoices (paginated with search and date filter)
export function useInvoices(
  page = 1,
  limit = 10,
  search = '',
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: [...invoiceKeys.list(), page, limit, search, startDate, endDate],
    queryFn: () => invoiceApi.getAll(page, limit, search, startDate, endDate),
  })
}

// Get invoice by ID
export function useInvoice(id: number | null) {
  return useQuery({
    queryKey: invoiceKeys.detail(id!),
    queryFn: () => invoiceApi.getById(id!),
    enabled: id !== null,
  })
}

// Create invoice mutation
export function useCreateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateInvoicePayload) => invoiceApi.create(payload),
    onSuccess: () => {
      // Invalidate and refetch invoices list
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
    },
  })
}

// Update invoice mutation
export function useUpdateInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateInvoicePayload }) =>
      invoiceApi.update(id, payload),
    onSuccess: (data) => {
      // Update cache for this specific invoice
      queryClient.setQueryData(invoiceKeys.detail(data.id), data)
      // Invalidate list to reflect updated title
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
    },
  })
}

// Delete invoice mutation
export function useDeleteInvoice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => invoiceApi.delete(id),
    onSuccess: (_data, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: invoiceKeys.detail(id) })
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
    },
  })
}

