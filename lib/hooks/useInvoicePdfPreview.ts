"use client"

import * as React from "react"

import { downloadInvoicePdf } from "@/lib/api"

export const INVOICE_PDF_PREVIEW_DEBOUNCE_MS = 800

interface InvoicePdfPreview {
  /** Object URL of the latest rendered PDF, or null before the first one. */
  url: string | null
  /** True from the moment the payload changes until its PDF arrives or fails. */
  isLoading: boolean
  /** True when the latest request failed; `url` keeps the last good PDF. */
  error: boolean
  retry: () => void
}

/**
 * Renders the invoice PDF on the backend shortly after the payload stops
 * changing, so the editor always shows the real file the user will download.
 */
export function useInvoicePdfPreview(payload: unknown, enabled: boolean): InvoicePdfPreview {
  const [url, setUrl] = React.useState<string | null>(null)
  const [settled, setSettled] = React.useState<{ key: string; ok: boolean } | null>(null)
  const [retryCount, setRetryCount] = React.useState(0)

  // Compare by content, not identity: an invoice refetch hands over new arrays
  // with the same rows, and that must not trigger another render.
  const payloadKey = React.useMemo(() => JSON.stringify(payload), [payload])
  const requestKey = `${retryCount}:${payloadKey}`

  const payloadRef = React.useRef(payload)
  React.useEffect(() => {
    payloadRef.current = payload
  })

  React.useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const pdf = await downloadInvoicePdf(payloadRef.current, controller.signal)
        if (controller.signal.aborted) return
        const nextUrl = URL.createObjectURL(pdf)
        setUrl((previous) => {
          if (previous) URL.revokeObjectURL(previous)
          return nextUrl
        })
        setSettled({ key: requestKey, ok: true })
      } catch {
        if (controller.signal.aborted) return
        setSettled({ key: requestKey, ok: false })
      }
    }, INVOICE_PDF_PREVIEW_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [requestKey, enabled])

  // Drop the PDF when the editor closes so it never shows a stale invoice.
  React.useEffect(() => {
    if (enabled) return
    setUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return null
    })
    setSettled(null)
  }, [enabled])

  const retry = React.useCallback(() => setRetryCount((count) => count + 1), [])

  return {
    url: enabled ? url : null,
    isLoading: enabled && settled?.key !== requestKey,
    error: enabled && settled?.key === requestKey && !settled.ok,
    retry,
  }
}
