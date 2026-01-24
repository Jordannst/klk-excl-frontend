'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { signatureApi } from '../api'
import type { CreateSignaturePayload } from '../types'

// Query keys
export const signatureKeys = {
  all: ['signatures'] as const,
  lists: () => [...signatureKeys.all, 'list'] as const,
  list: () => [...signatureKeys.lists()] as const,
}

/**
 * Hook to fetch all signatures
 */
export function useSignatures() {
  return useQuery({
    queryKey: signatureKeys.list(),
    queryFn: () => signatureApi.getAll(),
  })
}

/**
 * Hook to create a new signature
 */
export function useCreateSignature() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateSignaturePayload) => signatureApi.create(payload),
    onSuccess: () => {
      // Invalidate and refetch signatures list
      queryClient.invalidateQueries({ queryKey: signatureKeys.lists() })
    },
  })
}

/**
 * Hook to delete a signature
 */
export function useDeleteSignature() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => signatureApi.delete(id),
    onSuccess: () => {
      // Invalidate and refetch signatures list
      queryClient.invalidateQueries({ queryKey: signatureKeys.lists() })
    },
  })
}
