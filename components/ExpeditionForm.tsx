"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { User, Building2, Plus, Save, Trash2, Pencil, X, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { InvoiceDateModeField } from "@/components/InvoiceDateModeField"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AutocompleteInput } from "@/components/ui/autocomplete-input"
import { DateInputWithShortcuts } from "@/components/ui/date-input-with-shortcuts"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useCreateInvoice } from "@/lib/hooks"
import {
  getDateCellText,
  isDateColumnVisible,
  isDateInputEnabled,
  isRowDateRequired,
  normalizeInvoiceDateMode,
  type InvoiceDateMode,
} from "@/lib/invoice-date-mode"
import type { CreateInvoicePayload, Invoice } from "@/lib/types"

const DRAFT_STORAGE_KEY = "klk_invoice_draft"

const formSchema = z
  .object({
    title: z.string().min(1, "Judul wajib diisi"),
    dateMode: z.custom<InvoiceDateMode>((value) => {
      try {
        normalizeInvoiceDateMode(value)
        return true
      } catch {
        return false
      }
    }, "Mode tanggal tidak valid"),
    date: z.string(),
    stt: z.string().min(3, "Nomor STT wajib diisi"),
    sender: z.string().min(2, "Nama pengirim minimal 2 karakter"),
    receiver: z.string().min(2, "Nama penerima minimal 2 karakter"),
    coly: z.coerce.number().min(1, "Minimal 1 koli"),
    kg: z.coerce.number().min(0.1, "Minimal 0.1 kg"),
    min: z.coerce.number().min(0, "Minimal 0 kg"),
    tarif: z.coerce.number().min(0, "Tarif tidak valid"),
    total: z.coerce.number().min(0, "Total tidak valid"),
    keterangan: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (isRowDateRequired(data.dateMode) && !data.date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date"],
        message: "Tanggal wajib diisi",
      })
    }
  })

export type ExpeditionFormData = z.infer<typeof formSchema>

export type BatchPayload = {
  title: string
  createdAt: string
  dateMode: InvoiceDateMode
  transactions: ExpeditionFormData[]
}

type DraftStorageShape = {
  items?: unknown
  title?: unknown
  dateMode?: unknown
}

const dateModeHelpText: Record<InvoiceDateMode, string> = {
  enabled: "Tanggal aktif untuk setiap transaksi",
  "blank-column": "Kolom tanggal akan dibiarkan kosong",
  "hidden-column": "Kolom tanggal disembunyikan",
}

const createDefaultDraftTitle = () => `Invoice KLK ${format(new Date(), "dd MMM")}`

const createDefaultRowDate = () => format(new Date(), "yyyy-MM-dd")

const getRowDateValue = (dateMode: InvoiceDateMode, date: string | null | undefined): string => {
  return isDateInputEnabled(dateMode) ? date ?? "" : ""
}

const getStoredRowDate = (date: string | null | undefined): string => {
  return date ?? ""
}

const createEmptyRowValues = (
  title: string,
  dateMode: InvoiceDateMode,
  date?: string | null
): ExpeditionFormData => ({
  title,
  dateMode,
  date: isDateInputEnabled(dateMode) ? date || createDefaultRowDate() : "",
  stt: "",
  sender: "",
  receiver: "",
  coly: 1,
  kg: 1,
  min: 10,
  tarif: 0,
  total: 0,
  keterangan: "",
})

const normalizeDraftItem = (
  item: Partial<ExpeditionFormData>,
  fallbackDateMode: InvoiceDateMode
): ExpeditionFormData => {
  const dateMode = normalizeInvoiceDateMode(item.dateMode ?? fallbackDateMode)

  return {
    title: typeof item.title === "string" ? item.title : "",
    dateMode,
    date: getStoredRowDate(item.date),
    stt: typeof item.stt === "string" ? item.stt : "",
    sender: typeof item.sender === "string" ? item.sender : "",
    receiver: typeof item.receiver === "string" ? item.receiver : "",
    coly: typeof item.coly === "number" ? item.coly : 1,
    kg: typeof item.kg === "number" ? item.kg : 1,
    min: typeof item.min === "number" ? item.min : 10,
    tarif: typeof item.tarif === "number" ? item.tarif : 0,
    total: typeof item.total === "number" ? item.total : 0,
    keterangan: typeof item.keterangan === "string" ? item.keterangan : "",
  }
}

const normalizeDraftItems = (items: unknown, fallbackDateMode: InvoiceDateMode): ExpeditionFormData[] => {
  if (!Array.isArray(items)) {
    return []
  }

  return items.map((item) => normalizeDraftItem((item ?? {}) as Partial<ExpeditionFormData>, fallbackDateMode))
}

const getDraftDateText = (date: string | null | undefined, dateMode: InvoiceDateMode) => {
  if (dateMode === "enabled" && date) {
    return format(new Date(date), "dd MMM yyyy")
  }

  return getDateCellText(date, dateMode)
}

const hasPendingRowData = (values: {
  stt?: string
  sender?: string
  receiver?: string
  coly?: number
  kg?: number
  min?: number
  tarif?: number
  keterangan?: string
}) => {
  return Boolean(
    (values.stt && values.stt.trim() !== "") ||
      (values.sender && values.sender.trim() !== "") ||
      (values.receiver && values.receiver.trim() !== "") ||
      values.coly !== 1 ||
      values.kg !== 1 ||
      values.min !== 10 ||
      values.tarif !== 0 ||
      (values.keterangan && values.keterangan.trim() !== "")
  )
}

interface ExpeditionFormProps {
  onSubmitSuccess?: (invoice: Invoice) => void
}

export function ExpeditionForm({ onSubmitSuccess }: ExpeditionFormProps) {
  const [temporaryItems, setTemporaryItems] = React.useState<ExpeditionFormData[]>([])
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [tarifDisplay, setTarifDisplay] = React.useState<string>("")
  const titleInputRef = React.useRef<HTMLInputElement>(null)
  const preservedCreateDateRef = React.useRef<string>(createDefaultRowDate())
  const preservedEditingDateRef = React.useRef<string>("")

  const createInvoiceMutation = useCreateInvoice()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setFocus,
    formState: { errors },
  } = useForm<ExpeditionFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: createEmptyRowValues(createDefaultDraftTitle(), "enabled", createDefaultRowDate()),
  })

  const currentDateMode = watch("dateMode")
  const currentDate = watch("date")
  const titleValue = watch("title")
  const sttValue = watch("stt")
  const senderValue = watch("sender")
  const receiverValue = watch("receiver")
  const colyValue = Number(watch("coly")) || 0
  const kg = Number(watch("kg")) || 0
  const min = Number(watch("min")) || 0
  const tarif = Number(watch("tarif")) || 0
  const kgValue = Number(watch("kg")) || 0
  const minValue = Number(watch("min")) || 0
  const tarifValue = Number(watch("tarif")) || 0
  const keteranganValue = watch("keterangan")
  const isDateEnabled = isDateInputEnabled(currentDateMode)
  const showDraftDateColumn = isDateColumnVisible(currentDateMode)
  const grandTotalLabelColSpan = showDraftDateColumn ? 7 : 6

  const formatRupiah = (value: number | string): string => {
    const numValue = typeof value === "string" ? parseFloat(value.replace(/\./g, "")) || 0 : value
    return numValue.toLocaleString("id-ID")
  }

  const parseRupiah = (value: string): number => {
    return parseFloat(value.replace(/\./g, "")) || 0
  }

  React.useEffect(() => {
    if (tarif > 0) {
      setTarifDisplay(formatRupiah(tarif))
    } else {
      setTarifDisplay("")
    }
  }, [tarif])

  React.useEffect(() => {
    setTimeout(() => {
      setFocus("stt")
    }, 50)
  }, [setFocus])

  React.useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(DRAFT_STORAGE_KEY) : null
    if (!stored) {
      return
    }

    try {
      const parsed = JSON.parse(stored) as DraftStorageShape
      const draftDateMode = normalizeInvoiceDateMode(parsed?.dateMode)
      const draftTitle = typeof parsed?.title === "string" && parsed.title.trim() !== ""
        ? parsed.title
        : createDefaultDraftTitle()
      const draftItems = normalizeDraftItems(parsed?.items, draftDateMode)

      setTemporaryItems(draftItems)
      reset(createEmptyRowValues(draftTitle, draftDateMode, createDefaultRowDate()))
    } catch (error) {
      console.warn("Failed to parse draft from localStorage", error)
    }
  }, [reset])

  React.useEffect(() => {
    if (!isDateEnabled || !currentDate) {
      return
    }

    if (editingId) {
      preservedEditingDateRef.current = currentDate
      return
    }

    preservedCreateDateRef.current = currentDate
  }, [currentDate, editingId, isDateEnabled])

  React.useEffect(() => {
    if (isDateEnabled) {
      if (!currentDate) {
        if (editingId) {
          if (preservedEditingDateRef.current) {
            setValue("date", preservedEditingDateRef.current, { shouldValidate: true })
          }
          return
        }

        setValue("date", preservedCreateDateRef.current || createDefaultRowDate(), { shouldValidate: true })
      }
      return
    }

    if (currentDate !== "") {
      setValue("date", "", { shouldValidate: true })
    }
  }, [currentDate, editingId, isDateEnabled, setValue])

  React.useEffect(() => {
    if (temporaryItems.length === 0) {
      return
    }

    setTemporaryItems((prev) => {
      const next = prev.map((item) => ({
        ...item,
        dateMode: currentDateMode,
      }))

      const hasChanged = next.some((item, index) => item.dateMode !== prev[index]?.dateMode)

      return hasChanged ? next : prev
    })
  }, [currentDateMode, temporaryItems.length])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        items: temporaryItems.map((item) => ({
          ...item,
          dateMode: currentDateMode,
          date: getStoredRowDate(item.date),
        })),
        title: titleValue,
        dateMode: currentDateMode,
      })
    )
  }, [temporaryItems, titleValue, currentDateMode])

  const handleTarifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanedValue = e.target.value.replace(/\D/g, "")

    if (cleanedValue === "" || cleanedValue === "0") {
      setTarifDisplay("")
      setValue("tarif", 0)
      return
    }

    const numericValue = parseFloat(cleanedValue) || 0
    setTarifDisplay(formatRupiah(numericValue))
    setValue("tarif", numericValue, { shouldValidate: true })
  }

  React.useEffect(() => {
    const effectiveKg = Math.max(kg, min)
    const calculatedTotal = effectiveKg * tarif
    setValue("total", calculatedTotal)
  }, [kg, min, tarif, setValue])

  const handleAddRow = (data: ExpeditionFormData) => {
    const dateMode = normalizeInvoiceDateMode(data.dateMode ?? currentDateMode)
    const normalizedTitle = (data.title || titleValue || "").trim()

    if (!normalizedTitle) {
      toast.error("Judul wajib diisi")
      titleInputRef.current?.focus()
      return
    }

    const normalizedStt = (data.stt || "").trim()
    if (!normalizedStt) {
      toast.error("No STT wajib diisi")
      setFocus("stt")
      return
    }

    const isDuplicate = temporaryItems.some(
      (item) => item.stt.trim().toLowerCase() === normalizedStt.toLowerCase() && (editingId ? item.stt !== editingId : true)
    )
    if (isDuplicate) {
      toast.error(`No STT ${normalizedStt} sudah ada di daftar draft`)
      return
    }

    const effectiveKg = Math.max(data.kg, data.min)
    const calculatedTotal = effectiveKg * data.tarif

    const existingEditingItem = editingId
      ? temporaryItems.find((item) => item.stt === editingId)
      : null

    const nextStoredDate = isDateInputEnabled(dateMode)
      ? getStoredRowDate(data.date)
      : existingEditingItem?.date ?? ""

    const newItem: ExpeditionFormData = {
      ...data,
      title: normalizedTitle,
      dateMode,
      date: nextStoredDate,
      stt: normalizedStt,
      total: calculatedTotal,
    }

    if (editingId) {
      setTemporaryItems((prev) => prev.map((item) => (item.stt === editingId ? newItem : item)))
      toast.success("Baris diperbarui", {
        description: `STT: ${newItem.stt} - Total: Rp ${calculatedTotal.toLocaleString("id-ID")}`,
      })
      setEditingId(null)
      preservedEditingDateRef.current = ""
    } else {
      setTemporaryItems((prev) => [...prev, newItem])
      toast.success("Baris ditambahkan", {
        description: `STT: ${newItem.stt} - Total: Rp ${calculatedTotal.toLocaleString("id-ID")}`,
      })
    }

    reset(createEmptyRowValues(normalizedTitle, dateMode, currentDate))
    setTarifDisplay("")

    setTimeout(() => {
      setFocus("stt")
    }, 100)
  }

  const handleRemoveItem = (index: number) => {
    setTemporaryItems((prev) => prev.filter((_, i) => i !== index))
    toast.info("Baris dihapus dari draft")
  }

  const handleEditItem = (stt: string) => {
    const item = temporaryItems.find((row) => row.stt === stt)
    if (!item) return

    const itemDateMode = normalizeInvoiceDateMode(item.dateMode ?? currentDateMode)

    preservedEditingDateRef.current = item.date ?? ""
    setEditingId(stt)
    reset({
      title: titleValue || item.title || createDefaultDraftTitle(),
      dateMode: itemDateMode,
      date: getRowDateValue(itemDateMode, item.date),
      stt: item.stt,
      sender: item.sender,
      receiver: item.receiver,
      coly: item.coly,
      kg: item.kg,
      min: item.min,
      tarif: item.tarif,
      total: item.total,
      keterangan: item.keterangan || "",
    })
    setTarifDisplay(item.tarif ? formatRupiah(item.tarif) : "")
    setTimeout(() => setFocus("stt"), 50)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    preservedEditingDateRef.current = ""
    reset(createEmptyRowValues(titleValue || createDefaultDraftTitle(), currentDateMode, currentDate))
    setTarifDisplay("")
    setTimeout(() => setFocus("stt"), 50)
  }

  const handleSaveReport = async () => {
    const hasFormData = hasPendingRowData({
      stt: sttValue,
      sender: senderValue,
      receiver: receiverValue,
      coly: colyValue,
      kg: kgValue,
      min: minValue,
      tarif: tarifValue,
      keterangan: keteranganValue,
    })

    if (temporaryItems.length === 0) {
      toast.error("Daftar laporan masih kosong", {
        description: "Tambahkan minimal 1 baris terlebih dahulu",
      })
      return
    }

    if (hasFormData) {
      toast.warning("Masih ada data di form yang belum ditambahkan. Klik 'Tambah Baris' atau kosongkan form dulu.")
      return
    }

    if (!titleValue || titleValue.trim() === "") {
      toast.error("Judul wajib diisi")
      titleInputRef.current?.focus()
      return
    }

    if (currentDateMode === "enabled" && temporaryItems.some((item) => !item.date)) {
      toast.error("Semua tanggal transaksi harus diisi saat mode tanggal aktif")
      return
    }

    const payload: CreateInvoicePayload = {
      title: titleValue,
      dateMode: currentDateMode,
      transactions: temporaryItems.map((item) => ({
        tanggal: currentDateMode === "enabled" ? getStoredRowDate(item.date) || null : null,
        pengirim: item.sender,
        penerima: item.receiver,
        coly: item.coly,
        berat: item.kg,
        min: item.min,
        tarif: item.tarif,
        total: item.total,
        noResi: item.stt,
        keterangan: item.keterangan || undefined,
      })),
    }

    try {
      const result = await createInvoiceMutation.mutateAsync(payload)

      toast.success("Laporan berhasil disimpan", {
        description: `${temporaryItems.length} transaksi telah ditambahkan ke database`,
      })

      setTemporaryItems([])
      if (typeof window !== "undefined") {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      }

      reset(createEmptyRowValues(createDefaultDraftTitle(), "enabled", createDefaultRowDate()))
      setTarifDisplay("")
      setEditingId(null)

      if (onSubmitSuccess) {
        onSubmitSuccess(result)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Gagal menyimpan laporan"
      if (typeof error === "object" && error !== null && "response" in error) {
        const axiosError = error as { response?: { data?: { error?: string } } }
        toast.error(axiosError.response?.data?.error || errorMessage)
      } else {
        toast.error(errorMessage)
      }
    }
  }

  const effectiveKg = Math.max(kg, min)
  const grandTotal = temporaryItems.reduce((sum, item) => sum + item.total, 0)

  return (
    <Card className="w-full shadow-md border-t-4 border-t-blue-600">
      <CardHeader>
        <CardTitle>Input Transaksi / STT</CardTitle>
        <CardDescription>Masukkan data pengiriman baru (Batch Input)</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(handleAddRow)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold text-slate-700">
              Judul File (contoh: Invoice KLK 20 Jan)
            </Label>
            <Input
              id="title"
              ref={titleInputRef}
              placeholder="Judul File"
              className="h-12 text-base font-semibold border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              value={titleValue || ""}
              onChange={(e) => setValue("title", e.target.value, { shouldValidate: true })}
            />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <InvoiceDateModeField
            value={currentDateMode}
            onChange={(value) => setValue("dateMode", value, { shouldValidate: true })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-semibold text-slate-700">
                Tanggal (per transaksi)
              </Label>
              {isDateEnabled ? (
                <DateInputWithShortcuts
                  id="date"
                  value={currentDate}
                  onChange={(val) => setValue("date", val, { shouldValidate: true })}
                />
              ) : (
                <Input
                  id="date"
                  value={dateModeHelpText[currentDateMode]}
                  disabled
                  readOnly
                  className="h-12 text-base border-slate-200 bg-slate-100 text-slate-500"
                />
              )}
              {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stt" className="text-sm font-semibold text-slate-700">
                No STT
              </Label>
              <Input
                id="stt"
                placeholder="Masukkan No. STT"
                className="h-12 text-base font-bold text-lg border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                {...register("stt")}
              />
              {errors.stt && <p className="text-xs text-red-500">{errors.stt.message}</p>}
            </div>
          </div>

          <p className="text-xs text-slate-500 -mt-2">
            {isDateEnabled
              ? "Tanggal akan disimpan per transaksi."
              : currentDateMode === "blank-column"
                ? "Tanggal transaksi tidak wajib diisi. Draft tetap menampilkan kolom tanggal kosong."
                : "Tanggal transaksi tidak wajib diisi. Draft menyembunyikan kolom tanggal."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sender" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                Pengirim
              </Label>
              <AutocompleteInput
                id="sender"
                value={senderValue || ""}
                onChange={(val) => setValue("sender", val, { shouldValidate: true })}
                storageKey="invoice_pengirim"
                placeholder="Nama Pengirim"
                className="h-12 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
              {errors.sender && <p className="text-xs text-red-500">{errors.sender.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiver" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-500" />
                Penerima
              </Label>
              <AutocompleteInput
                id="receiver"
                value={receiverValue || ""}
                onChange={(val) => setValue("receiver", val, { shouldValidate: true })}
                storageKey="invoice_penerima"
                placeholder="Nama Penerima"
                className="h-12 text-base border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
              {errors.receiver && <p className="text-xs text-red-500">{errors.receiver.message}</p>}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="coly" className="text-sm font-semibold text-slate-700">
                C (Coly)
              </Label>
              <Input
                id="coly"
                type="number"
                min={1}
                className="h-12 text-base text-center font-semibold border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                {...register("coly")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kg" className="text-sm font-semibold text-slate-700">
                Kg (Berat)
              </Label>
              <Input
                id="kg"
                type="number"
                step="0.1"
                min={0}
                className="h-12 text-base text-center font-semibold border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                {...register("kg")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min" className="text-sm font-semibold text-slate-700">
                Min (Kg)
              </Label>
              <Input
                id="min"
                type="number"
                step="1"
                min={0}
                className="h-12 text-base text-center font-semibold border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                {...register("min")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tarif" className="text-sm font-semibold text-slate-700">
                Tarif /Kg
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-xs font-semibold text-slate-500">Rp</span>
                <Input
                  id="tarif"
                  type="text"
                  inputMode="numeric"
                  placeholder="0"
                  value={tarifDisplay}
                  onChange={handleTarifChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSubmit(handleAddRow)()
                    }
                  }}
                  onBlur={(e) => {
                    const numValue = parseRupiah(e.target.value)
                    if (numValue > 0) {
                      setTarifDisplay(formatRupiah(numValue))
                    }
                  }}
                  className="pl-10 h-12 text-base text-center font-semibold border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2 col-span-2 md:col-span-4 lg:col-span-1">
              <Label htmlFor="keterangan" className="text-sm font-semibold text-slate-700">
                Ket (Opsional)
              </Label>
              <AutocompleteInput
                id="keterangan"
                value={keteranganValue || ""}
                onChange={(val) => setValue("keterangan", val, { shouldValidate: true })}
                storageKey="invoice_keterangan"
                placeholder="Keterangan..."
                className="h-12 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="space-y-1 w-full sm:w-auto text-center sm:text-left">
              <Label className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Tagihan</Label>
              <div className="text-4xl font-black text-blue-700 tabular-nums">
                Rp {(Number(watch("total")) || 0).toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Berat yang digunakan: <span className="font-bold text-slate-700">{effectiveKg} kg</span>{" "}
                {kg < min ? `(Min ${min} kg)` : `(Berat ${kg} kg)`}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="h-12 px-6 text-base font-semibold border-2 border-slate-400 text-slate-600 hover:bg-slate-50 transition-all"
                >
                  <X className="mr-2 h-5 w-5" />
                  Batal
                </Button>
              )}
              <Button
                type="submit"
                variant="outline"
                className="h-12 px-8 text-base font-bold border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-md active:scale-95"
              >
                {editingId ? (
                  <>
                    <Pencil className="mr-2 h-5 w-5" />
                    Update Baris
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-5 w-5" />
                    Tambah Baris (+)
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {temporaryItems.length > 0 && (
          <div className="mt-8 space-y-4">
            <Separator />
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-4">Draft Laporan</h3>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="text-center font-bold text-slate-700">No</TableHead>
                      <TableHead className="font-bold text-slate-700">STT</TableHead>
                      {showDraftDateColumn && (
                        <TableHead className="font-bold text-slate-700">Tgl</TableHead>
                      )}
                      <TableHead className="font-bold text-slate-700">Pengirim</TableHead>
                      <TableHead className="font-bold text-slate-700">Penerima</TableHead>
                      <TableHead className="text-right font-bold text-slate-700">Coly</TableHead>
                      <TableHead className="text-right font-bold text-slate-700">Kg</TableHead>
                      <TableHead className="text-right font-bold text-slate-700">Total</TableHead>
                      <TableHead className="font-bold text-slate-700">Ket</TableHead>
                      <TableHead className="text-center font-bold text-slate-700">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {temporaryItems.map((item, index) => (
                      <TableRow key={`${item.stt}-${index}`} className="hover:bg-slate-50">
                        <TableCell className="text-center text-slate-600 font-medium">{index + 1}</TableCell>
                        <TableCell className="font-mono font-bold text-blue-600">{item.stt}</TableCell>
                        {showDraftDateColumn && (
                          <TableCell className="text-slate-700">
                            {getDraftDateText(item.date, currentDateMode)}
                          </TableCell>
                        )}
                        <TableCell className="text-slate-700">{item.sender}</TableCell>
                        <TableCell className="text-slate-700">{item.receiver}</TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">{item.coly}</TableCell>
                        <TableCell className="text-right font-medium text-slate-700">{item.kg}</TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-emerald-600">Rp {item.total.toLocaleString("id-ID")}</span>
                        </TableCell>
                        <TableCell className="text-slate-600">{item.keterangan || "-"}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem(item.stt)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-emerald-50 font-bold border-t-2 border-emerald-200">
                      <TableCell colSpan={grandTotalLabelColSpan} className="text-right text-emerald-800">
                        GRAND TOTAL:
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xl text-emerald-700">Rp {grandTotal.toLocaleString("id-ID")}</span>
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {temporaryItems.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <Button
              type="button"
              onClick={handleSaveReport}
              disabled={createInvoiceMutation.isPending}
              className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg disabled:opacity-50"
            >
              {createInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-6 w-6" />
                  SIMPAN LAPORAN SELESAI
                </>
              )}
            </Button>
            <p className="text-xs text-slate-500 text-center mt-2">
              {temporaryItems.length} transaksi akan disimpan sebagai 1 laporan
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
