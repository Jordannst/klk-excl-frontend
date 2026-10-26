"use client"

import * as React from "react"
import { Check, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Transaksi, UpdateTransaksiPayload } from "@/lib/types"

interface EditTransactionDialogProps {
  isOpen: boolean
  transaction: Transaksi | null
  canEditDate: boolean
  showDateField: boolean
  showKeteranganField: boolean
  isSaving: boolean
  onClose: () => void
  onSave: (payload: UpdateTransaksiPayload) => Promise<void>
}

type EditTransactionDraft = {
  tanggal: string | null
  noResi: string
  pengirim: string
  penerima: string
  coly: string
  berat: string
  min: string
  tarif: string
  keterangan: string
}

const focusableSelector = [
  "a[href]",
  "button:not(:disabled)",
  "input:not(:disabled)",
  "select:not(:disabled)",
  "textarea:not(:disabled)",
  '[tabindex]:not([tabindex="-1"])',
].join(", ")

const toDateInputValue = (tanggal: string | null | undefined) => {
  if (!tanggal) {
    return ""
  }

  return tanggal.slice(0, 10)
}

const normalizeDateOnlyPayload = (tanggal: string | null | undefined) => {
  const dateOnlyValue = toDateInputValue(tanggal)

  return dateOnlyValue || null
}

const toIntegerValue = (value: string) => Number(value)

const toDisplayInteger = (value: number) => String(value ?? 0)

const isValidInteger = (value: string, minimum: number) => {
  if (!/^\d+$/.test(value)) {
    return false
  }

  return Number(value) >= minimum
}

const getFocusableElements = (container: HTMLElement | null) => {
  if (!container) {
    return []
  }

  return Array.from(container.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) => element.offsetParent !== null || element === document.activeElement
  )
}

export function EditTransactionDialog({
  isOpen,
  transaction,
  canEditDate,
  showDateField,
  showKeteranganField,
  isSaving,
  onClose,
  onSave,
}: EditTransactionDialogProps) {
  const [draft, setDraft] = React.useState<EditTransactionDraft | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const dialogRef = React.useRef<HTMLFormElement | null>(null)
  const closeButtonRef = React.useRef<HTMLButtonElement | null>(null)
  const previouslyFocusedElementRef = React.useRef<HTMLElement | null>(null)
  const hasFocusedOnOpenRef = React.useRef(false)
  const titleId = React.useId()
  const descriptionId = React.useId()
  const validationMessageId = React.useId()

  React.useEffect(() => {
    if (!transaction) {
      setDraft(null)
      return
    }

    setDraft({
      tanggal: normalizeDateOnlyPayload(transaction.tanggal),
      noResi: transaction.noResi,
      pengirim: transaction.pengirim,
      penerima: transaction.penerima,
      coly: toDisplayInteger(transaction.coly),
      berat: toDisplayInteger(transaction.berat),
      min: toDisplayInteger(transaction.min),
      tarif: toDisplayInteger(transaction.tarif),
      keterangan: transaction.keterangan ?? "",
    })
  }, [transaction])

  React.useEffect(() => {
    if (!isOpen) {
      return
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    hasFocusedOnOpenRef.current = false

    return () => {
      const elementToRestore = previouslyFocusedElementRef.current
      previouslyFocusedElementRef.current = null
      hasFocusedOnOpenRef.current = false

      if (elementToRestore && document.contains(elementToRestore)) {
        elementToRestore.focus()
      }
    }
  }, [isOpen])

  const isBusy = isSaving || isSubmitting
  const isColyValid = draft ? isValidInteger(draft.coly, 1) : false
  const isBeratValid = draft ? isValidInteger(draft.berat, 1) : false
  const isMinValid = draft ? isValidInteger(draft.min, 0) : false
  const isTarifValid = draft ? isValidInteger(draft.tarif, 0) : false
  const hasNumericErrors = !isColyValid || !isBeratValid || !isMinValid || !isTarifValid
  const validationMessage = hasNumericErrors
    ? "Coly dan Kg minimal 1. Min dan Tarif minimal 0. Semua angka harus bilangan bulat."
    : null
  const numericValidationDescription = validationMessage ? validationMessageId : undefined

  React.useEffect(() => {
    if (!isOpen || !draft || hasFocusedOnOpenRef.current) {
      return
    }

    const frameId = window.requestAnimationFrame(() => {
      const firstEditableInput = dialogRef.current?.querySelector<HTMLInputElement>("input:not(:disabled)")
      const focusTarget = firstEditableInput ?? closeButtonRef.current ?? dialogRef.current

      focusTarget?.focus()
      hasFocusedOnOpenRef.current = true
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [draft, isOpen])

  React.useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false)
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (!isBusy) {
          onClose()
        }
        return
      }

      if (event.key !== "Tab") {
        return
      }

      const focusableElements = getFocusableElements(dialogRef.current)
      if (focusableElements.length === 0) {
        event.preventDefault()
        dialogRef.current?.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isBusy, isOpen, onClose])

  if (!isOpen || !draft) {
    return null
  }

  const coly = isColyValid ? toIntegerValue(draft.coly) : 0
  const berat = isBeratValid ? toIntegerValue(draft.berat) : 0
  const min = isMinValid ? toIntegerValue(draft.min) : 0
  const tarif = isTarifValid ? toIntegerValue(draft.tarif) : 0
  const total = Math.max(berat, min) * tarif

  const updateDraft = <K extends keyof EditTransactionDraft>(
    field: K,
    value: EditTransactionDraft[K]
  ) => {
    setDraft((current) => (current ? { ...current, [field]: value } : current))
  }

  const requestClose = () => {
    if (!isBusy) {
      onClose()
    }
  }

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && !isBusy) {
      onClose()
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isBusy || hasNumericErrors) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSave({
        tanggal: canEditDate ? normalizeDateOnlyPayload(draft.tanggal) : null,
        pengirim: draft.pengirim.trim(),
        penerima: draft.penerima.trim(),
        coly,
        berat,
        min,
        tarif,
        total,
        noResi: draft.noResi.trim(),
        keterangan: draft.keterangan.trim(),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={handleBackdropClick}
    >
      <form
        ref={dialogRef}
        onSubmit={handleSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-slate-800">Edit transaksi</h2>
            <p id={descriptionId} className="text-sm text-slate-500">STT {transaction?.noResi}</p>
          </div>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            onClick={requestClose}
            disabled={isBusy}
            aria-label="Tutup dialog edit transaksi"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {showDateField && (
              <div className="space-y-2">
                <Label htmlFor="edit-transaction-tanggal">Tanggal</Label>
                <Input
                  id="edit-transaction-tanggal"
                  type="date"
                  value={toDateInputValue(draft.tanggal)}
                  onChange={(event) => updateDraft("tanggal", event.target.value || null)}
                  disabled={isBusy || !canEditDate}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-transaction-no-resi">No STT</Label>
              <Input
                id="edit-transaction-no-resi"
                value={draft.noResi}
                onChange={(event) => updateDraft("noResi", event.target.value)}
                disabled={isBusy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-transaction-pengirim">Pengirim</Label>
              <Input
                id="edit-transaction-pengirim"
                value={draft.pengirim}
                onChange={(event) => updateDraft("pengirim", event.target.value)}
                disabled={isBusy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-transaction-penerima">Penerima</Label>
              <Input
                id="edit-transaction-penerima"
                value={draft.penerima}
                onChange={(event) => updateDraft("penerima", event.target.value)}
                disabled={isBusy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-transaction-coly">Coly</Label>
              <Input
                id="edit-transaction-coly"
                type="number"
                min="1"
                step="1"
                value={draft.coly}
                onChange={(event) => updateDraft("coly", event.target.value)}
                aria-invalid={!isColyValid}
                aria-describedby={numericValidationDescription}
                disabled={isBusy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-transaction-berat">Kg</Label>
              <Input
                id="edit-transaction-berat"
                type="number"
                min="1"
                step="1"
                value={draft.berat}
                onChange={(event) => updateDraft("berat", event.target.value)}
                aria-invalid={!isBeratValid}
                aria-describedby={numericValidationDescription}
                disabled={isBusy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-transaction-min">Min</Label>
              <Input
                id="edit-transaction-min"
                type="number"
                min="0"
                step="1"
                value={draft.min}
                onChange={(event) => updateDraft("min", event.target.value)}
                aria-invalid={!isMinValid}
                aria-describedby={numericValidationDescription}
                disabled={isBusy}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-transaction-tarif">Tarif</Label>
              <Input
                id="edit-transaction-tarif"
                type="number"
                min="0"
                step="1"
                value={draft.tarif}
                onChange={(event) => updateDraft("tarif", event.target.value)}
                aria-invalid={!isTarifValid}
                aria-describedby={numericValidationDescription}
                disabled={isBusy}
              />
            </div>

            {showKeteranganField && (
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="edit-transaction-keterangan">Keterangan</Label>
                <Input
                  id="edit-transaction-keterangan"
                  value={draft.keterangan}
                  onChange={(event) => updateDraft("keterangan", event.target.value)}
                  disabled={isBusy}
                />
              </div>
            )}
          </div>

          {validationMessage && (
            <p id={validationMessageId} role="alert" className="mt-4 text-sm font-medium text-red-600">
              {validationMessage}
            </p>
          )}

          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-medium text-emerald-800">Total baru</p>
            <p className="text-xl font-bold text-emerald-700">
              Rp {total.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={requestClose}
            disabled={isBusy}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isBusy || hasNumericErrors} className="bg-emerald-600 hover:bg-emerald-700">
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            Simpan Perubahan
          </Button>
        </div>
      </form>
    </div>
  )
}
