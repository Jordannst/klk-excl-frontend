"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, User, Building2, Plus, Save, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const formSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  stt: z.string().min(3, "Nomor STT wajib diisi"),
  sender: z.string().min(2, "Nama pengirim minimal 2 karakter"),
  receiver: z.string().min(2, "Nama penerima minimal 2 karakter"),
  coly: z.coerce.number().min(1, "Minimal 1 koli"),
  kg: z.coerce.number().min(0.1, "Minimal 0.1 kg"),
  min: z.coerce.number().min(0, "Minimal 0 kg"),
  tarif: z.coerce.number().min(0, "Tarif tidak valid"),
  total: z.coerce.number().min(0, "Total tidak valid"),
})

export type ExpeditionFormData = z.infer<typeof formSchema>

interface ExpeditionFormProps {
  onSubmitSuccess?: (data: ExpeditionFormData[]) => void
}

export function ExpeditionForm({ onSubmitSuccess }: ExpeditionFormProps) {
  // State for temporary items (draft)
  const [temporaryItems, setTemporaryItems] = React.useState<ExpeditionFormData[]>([])

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    setFocus,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      stt: "",
      sender: "",
      receiver: "",
      coly: 1,
      kg: 1,
      min: 10,
      tarif: 0,
      total: 0,
    },
  })

  const currentDate = watch("date")
  const kg = Number(watch("kg")) || 0
  const min = Number(watch("min")) || 0
  const tarif = Number(watch("tarif")) || 0

  // Format rupiah helper functions
  const formatRupiah = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '')) || 0 : value
    return numValue.toLocaleString('id-ID')
  }

  const parseRupiah = (value: string): number => {
    return parseFloat(value.replace(/\./g, '')) || 0
  }

  // State for tarif display (formatted)
  const [tarifDisplay, setTarifDisplay] = React.useState<string>("")

  // Sync tarif display with form value
  React.useEffect(() => {
    if (tarif > 0) {
      setTarifDisplay(formatRupiah(tarif))
    } else {
      setTarifDisplay("")
    }
  }, [tarif])

  // Handle tarif input change
  const handleTarifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    // Remove all non-digit characters (only allow numbers)
    const cleanedValue = inputValue.replace(/\D/g, '')
    
    if (cleanedValue === '' || cleanedValue === '0') {
      setTarifDisplay("")
      setValue("tarif", 0)
      return
    }

    // Parse to number
    const numericValue = parseFloat(cleanedValue) || 0
    
    // Format back to rupiah format
    const formatted = formatRupiah(numericValue)
    setTarifDisplay(formatted)
    
    // Set the numeric value to form
    setValue("tarif", numericValue, { shouldValidate: true })
  }

  // Auto-calculate total when kg, min, or tarif changes
  React.useEffect(() => {
    const effectiveKg = Math.max(kg, min)
    const calculatedTotal = effectiveKg * tarif
    setValue("total", calculatedTotal)
  }, [kg, min, tarif, setValue])

  // Add item to temporary list
  const handleAddRow = (data: ExpeditionFormData) => {
    // Validate and calculate
    const effectiveKg = Math.max(data.kg, data.min)
    const calculatedTotal = effectiveKg * data.tarif
    
    const newItem: ExpeditionFormData = {
      ...data,
      total: calculatedTotal,
    }

    setTemporaryItems((prev) => [...prev, newItem])
    
    toast.success("✅ Baris ditambahkan!", {
      description: `STT: ${data.stt} - Total: Rp ${calculatedTotal.toLocaleString("id-ID")}`
    })

    // Reset form (except date)
    reset({
      date: currentDate,
      stt: "",
      sender: "",
      receiver: "",
      coly: 1,
      kg: 1,
      min: 10,
      tarif: 0,
      total: 0,
    })
    setTarifDisplay("")

    // Focus back to STT input
    setTimeout(() => {
      setFocus("stt")
    }, 100)
  }

  // Remove item from temporary list
  const handleRemoveItem = (index: number) => {
    setTemporaryItems((prev) => prev.filter((_, i) => i !== index))
    toast.info("Baris dihapus dari draft")
  }

  // Save entire batch
  const handleSaveReport = () => {
    if (temporaryItems.length === 0) {
      toast.error("Tidak ada data untuk disimpan", {
        description: "Tambahkan minimal 1 baris terlebih dahulu"
      })
      return
    }

    if (onSubmitSuccess) {
      onSubmitSuccess(temporaryItems)
    }

    toast.success("✅ Laporan berhasil disimpan!", {
      description: `${temporaryItems.length} transaksi telah ditambahkan`
    })

    // Clear temporary items
    setTemporaryItems([])
  }

  // Get effective kg for display
  const effectiveKg = Math.max(kg, min)
  
  // Calculate grand total
  const grandTotal = temporaryItems.reduce((sum, item) => sum + item.total, 0)

  return (
    <Card className="w-full shadow-md border-t-4 border-t-blue-600">
      <CardHeader>
        <CardTitle>Input Transaksi / STT</CardTitle>
        <CardDescription>Masukkan data pengiriman baru (Batch Input)</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit(handleAddRow)} className="space-y-6">
          {/* Row 1: Date & No STT (per transaksi) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-semibold text-slate-700">
                Tanggal (per transaksi)
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-blue-500" />
                <Input 
                  id="date" 
                  type="date" 
                  className="pl-11 h-12 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500 bg-white" 
                  {...register("date")} 
                />
              </div>
              {errors.date && <p className="text-xs text-red-500">⚠️ {errors.date.message}</p>}
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
              {errors.stt && <p className="text-xs text-red-500">⚠️ {errors.stt.message}</p>}
            </div>
          </div>

          {/* Row 2: Customer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sender" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-500" />
                Pengirim
              </Label>
              <Input 
                id="sender" 
                placeholder="Nama Pengirim" 
                className="h-12 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                {...register("sender")} 
              />
              {errors.sender && <p className="text-xs text-red-500">⚠️ {errors.sender.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="receiver" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-500" />
                Penerima
              </Label>
              <Input 
                id="receiver" 
                placeholder="Nama Penerima" 
                className="h-12 text-base border-slate-200 focus:border-emerald-500 focus:ring-emerald-500"
                {...register("receiver")} 
              />
              {errors.receiver && <p className="text-xs text-red-500">⚠️ {errors.receiver.message}</p>}
            </div>
          </div>

          {/* Row 3: The "Calculator Zone" (Visual Grouping) */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-4 gap-4 items-end">
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
                  onBlur={(e) => {
                    // Ensure format is maintained on blur
                    const numValue = parseRupiah(e.target.value)
                    if (numValue > 0) {
                      setTarifDisplay(formatRupiah(numValue))
                    }
                  }}
                  className="pl-10 h-12 text-base text-center font-semibold border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Row 4: The Result & Action */}
          <div className="flex justify-between items-center">
            {/* Left Side (Total Price) */}
            <div className="space-y-1">
              <Label className="text-sm font-semibold text-slate-600">TOTAL TAGIHAN</Label>
              <div className="text-3xl font-bold text-blue-700">
                Rp {(Number(watch("total")) || 0).toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Berat yang digunakan: {effectiveKg} kg {kg < min ? `(Min ${min} kg)` : `(Berat ${kg} kg)`}
              </p>
            </div>
            
            {/* Right Side (Add Row Button - Secondary) */}
            <Button 
              type="submit" 
              variant="outline"
              className="w-48 h-12 text-base font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Plus className="mr-2 h-5 w-5" />
              Tambah Baris (+)
            </Button>
          </div>

        </form>

        {/* Draft Table Section */}
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
                      <TableHead className="font-bold text-slate-700">Tgl</TableHead>
                      <TableHead className="font-bold text-slate-700">Pengirim</TableHead>
                      <TableHead className="font-bold text-slate-700">Penerima</TableHead>
                      <TableHead className="text-right font-bold text-slate-700">Coly</TableHead>
                      <TableHead className="text-right font-bold text-slate-700">Kg</TableHead>
                      <TableHead className="text-right font-bold text-slate-700">Total</TableHead>
                      <TableHead className="text-center font-bold text-slate-700">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {temporaryItems.map((item, index) => (
                      <TableRow key={index} className="hover:bg-slate-50">
                        <TableCell className="text-center text-slate-600 font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-blue-600">
                          {item.stt}
                        </TableCell>
                        <TableCell className="text-slate-700">
                          {item.date ? format(new Date(item.date), "dd MMM yyyy") : "-"}
                        </TableCell>
                        <TableCell className="text-slate-700">{item.sender}</TableCell>
                        <TableCell className="text-slate-700">{item.receiver}</TableCell>
                        <TableCell className="text-right font-semibold text-amber-600">
                          {item.coly}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700">
                          {item.kg}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-emerald-600">
                            Rp {item.total.toLocaleString("id-ID")}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveItem(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Grand Total Row */}
                    <TableRow className="bg-emerald-50 font-bold border-t-2 border-emerald-200">
                      <TableCell colSpan={7} className="text-right text-emerald-800">
                        GRAND TOTAL:
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-xl text-emerald-700">
                          Rp {grandTotal.toLocaleString("id-ID")}
                        </span>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Footer Action: Final Save */}
        {temporaryItems.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <Button
              type="button"
              onClick={handleSaveReport}
              className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
            >
              <Save className="mr-2 h-6 w-6" />
              SIMPAN LAPORAN SELESAI
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
