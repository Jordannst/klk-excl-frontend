"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Truck, User, Box, Weight, Receipt, Sparkles, Calculator, Scale } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

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
  onSubmitSuccess?: (data: ExpeditionFormData) => void
}

export function ExpeditionForm({ onSubmitSuccess }: ExpeditionFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
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

  // Auto-calculate total when kg, min, or tarif changes
  React.useEffect(() => {
    const effectiveKg = Math.max(kg, min)
    const calculatedTotal = effectiveKg * tarif
    setValue("total", calculatedTotal)
  }, [kg, min, tarif, setValue])

  const onSubmit = (data: ExpeditionFormData) => {
    console.log("Form Submitted:", data)
    
    setTimeout(() => {
      toast.success("✅ Transaksi berhasil disimpan!", {
        description: `STT: ${data.stt} - Total: Rp ${data.total.toLocaleString("id-ID")}`
      })
      
      if (onSubmitSuccess) {
        onSubmitSuccess(data)
      }

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
    }, 500)
  }

  // Get effective kg for display
  const effectiveKg = Math.max(kg, min)

  return (
    <Card className="w-full shadow-elevation border-0 overflow-hidden bg-gradient-to-br from-white to-slate-50/50 backdrop-blur-sm">
      {/* Gradient Header */}
      <div className="h-2 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500"></div>
      
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-500/30">
                <Truck className="h-5 w-5 text-white" />
              </div>
              Input Transaksi Baru
            </CardTitle>
            <CardDescription className="text-base">
              Masukkan data pengiriman paket dengan lengkap.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <Separator className="mb-6" />
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Row 1: Date & No STT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-semibold text-slate-700">
                Hari / Tanggal
              </Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-blue-500" />
                <Input 
                  id="date" 
                  type="date" 
                  className="pl-11 h-12 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500" 
                  {...register("date")} 
                />
              </div>
              {errors.date && <p className="text-xs text-red-500">⚠️ {errors.date.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stt" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-500" />
                No. STT
              </Label>
              <Input 
                id="stt" 
                placeholder="Masukkan No. STT" 
                className="h-12 text-base font-mono tracking-widest border-slate-200 focus:border-blue-500 focus:ring-blue-500 uppercase"
                {...register("stt")} 
              />
              {errors.stt && <p className="text-xs text-red-500">⚠️ {errors.stt.message}</p>}
            </div>
          </div>

          {/* Row 2: Sender & Receiver */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <User className="h-4 w-4 text-emerald-500" />
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

          {/* Row 3: Coly, Kg, Min */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="coly" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                <Box className="h-4 w-4 text-amber-500" /> C (Koli)
              </Label>
              <Input 
                id="coly" 
                type="number" 
                min={1} 
                className="h-12 text-base text-center font-semibold border-slate-200 focus:border-amber-500 focus:ring-amber-500"
                {...register("coly")} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kg" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                <Weight className="h-4 w-4 text-violet-500" /> Kg
              </Label>
              <Input 
                id="kg" 
                type="number" 
                step="0.1" 
                min={0} 
                className="h-12 text-base text-center font-semibold border-slate-200 focus:border-violet-500 focus:ring-violet-500"
                {...register("kg")} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                <Scale className="h-4 w-4 text-orange-500" /> Min (Kg)
              </Label>
              <Input 
                id="min" 
                type="number" 
                step="1" 
                min={0} 
                className="h-12 text-base text-center font-semibold border-slate-200 focus:border-orange-500 focus:ring-orange-500"
                {...register("min")} 
              />
            </div>
          </div>

          {/* Row 4: Tarif & Total */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tarif" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                <Calculator className="h-4 w-4 text-blue-500" /> Tarif (per Kg)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 font-semibold text-slate-500">Rp</span>
                <Input 
                  id="tarif"
                  type="number"
                  min={0}
                  className="pl-12 h-12 text-base font-semibold border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  {...register("tarif")}
                />
              </div>
            </div>
            
            {/* Total - Auto Calculated */}
            <div className="space-y-2">
              <Label htmlFor="total" className="text-sm font-bold text-emerald-700 flex items-center gap-1">
                <Sparkles className="h-4 w-4" /> JUMLAH / TOTAL
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 font-bold text-lg text-emerald-700">Rp</span>
                <Input 
                  id="total"
                  readOnly
                  className="pl-12 h-12 font-bold text-xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 text-emerald-900 cursor-not-allowed"
                  value={(Number(watch("total")) || 0).toLocaleString("id-ID")}
                />
              </div>
              <p className="text-xs text-slate-500">
                = max({kg} kg, {min} kg) × Rp {tarif.toLocaleString("id-ID")} = {effectiveKg} kg × Rp {tarif.toLocaleString("id-ID")}
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            size="lg" 
            className="w-full h-14 text-base font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Simpan Transaksi
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}
