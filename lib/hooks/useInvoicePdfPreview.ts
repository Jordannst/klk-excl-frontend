"use client"

import * as React from "react"

import { downloadInvoicePdf } from "@/lib/api"

/** Wait after typing: one render per pause, not per key. */
export const INVOICE_PDF_PREVIEW_DEBOUNCE_MS = 800
/** Wait after a click setting (`quickKey` changed), and for the first preview. */
export const INVOICE_PDF_PREVIEW_QUICK_DEBOUNCE_MS = 300

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
 * `quickKey` names the part of the payload set by clicks rather than typing.
 */
export function useInvoicePdfPreview(payload: unknown, enabled: boolean, quickKey = ""): InvoicePdfPreview {
  // `previous` stays alive so the editor can keep showing it while `current` loads.
  const [urls, setUrls] = React.useState<{ current: string | null; previous: string | null }>({
    current: null,
    previous: null,
  })
  const [settled, setSettled] = React.useState<{ key: string; ok: boolean } | null>(null)
  const [retryCount, setRetryCount] = React.useState(0)

  // Compare by content, not identity: an invoice refetch hands over new arrays
  // with the same rows, and that must not trigger another render.
  const payloadKey = React.useMemo(() => JSON.stringify(payload), [payload])
  const requestKey = `${retryCount}:${payloadKey}`

  const payloadRef = React.useRef(payload)
  const hasPreviewRef = React.useRef(false)
  React.useEffect(() => {
    payloadRef.current = payload
    hasPreviewRef.current = urls.current !== null
  })

  const lastQuickKeyRef = React.useRef(quickKey)

  React.useEffect(() => {
    if (!enabled) return

    const quick = !hasPreviewRef.current || lastQuickKeyRef.current !== quickKey
    lastQuickKeyRef.current = quickKey

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const pdf = await downloadInvoicePdf(payloadRef.current, controller.signal)
        if (controller.signal.aborted) return
        const nextUrl = URL.createObjectURL(pdf)
        setUrls(({ current, previous }) => {
          if (previous) URL.revokeObjectURL(previous)
          return { current: nextUrl, previous: current }
        })
        setSettled({ key: requestKey, ok: true })
      } catch {
        if (controller.signal.aborted) return
        setSettled({ key: requestKey, ok: false })
      }
    }, quick ? INVOICE_PDF_PREVIEW_QUICK_DEBOUNCE_MS : INVOICE_PDF_PREVIEW_DEBOUNCE_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [requestKey, enabled, quickKey])

  // Drop the PDFs when the editor closes so it never shows a stale invoice.
  React.useEffect(() => {
    if (enabled) return
    setUrls(({ current, previous }) => {
      if (current) URL.revokeObjectURL(current)
      if (previous) URL.revokeObjectURL(previous)
      return { current: null, previous: null }
    })
    setSettled(null)
  }, [enabled])

  const retry = React.useCallback(() => setRetryCount((count) => count + 1), [])

  return {
    url: enabled ? urls.current : null,
    isLoading: enabled && settled?.key !== requestKey,
    error: enabled && settled?.key === requestKey && !settled.ok,
    retry,
  }
}
