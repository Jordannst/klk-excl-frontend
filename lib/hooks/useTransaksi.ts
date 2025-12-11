'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transaksiApi } from '../api'
import { invoiceKeys } from './useInvoice'
import type { CreateTransaksiPayload, UpdateTransaksiPayload } from '../types'

// Query keys
export const transaksiKeys = {
  all: ['transaksi'] as const,
  lists: () => [...transaksiKeys.all, 'list'] as const,
  list: () => [...transaksiKeys.lists()] as const,
  details: () => [...transaksiKeys.all, 'detail'] as const,
  detail: (id: number) => [...transaksiKeys.details(), id] as const,
}

// Get all transactions
export function useTransaksiList() {
  return useQuery({
    queryKey: transaksiKeys.list(),
    queryFn: () => transaksiApi.getAll(),
  })
}

// Get transaction by ID
export function useTransaksi(id: number | null) {
  return useQuery({
    queryKey: transaksiKeys.detail(id!),
    queryFn: () => transaksiApi.getById(id!),
    enabled: id !== null,
  })
}

// Create transaction mutation
export function useCreateTransaksi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTransaksiPayload) => transaksiApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transaksiKeys.lists() })
    },
  })
}

// Update transaction mutation
export function useUpdateTransaksi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateTransaksiPayload }) =>
      transaksiApi.update(id, payload),
    onSuccess: (data) => {
      // Update cache for this specific transaction
      queryClient.setQueryData(transaksiKeys.detail(data.id), data)
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: transaksiKeys.lists() })
      // Also invalidate invoice queries since total may have changed
      if (data.invoiceId) {
        queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.invoiceId) })
        queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() })
      }
    },
  })
}

// Delete transaction mutation
export function useDeleteTransaksi() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => transaksiApi.delete(id),
    onSuccess: (_data, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: transaksiKeys.detail(id) })
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: transaksiKeys.lists() })
      // Invalidate all invoices since we don't know which one was affected
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
  })
}

