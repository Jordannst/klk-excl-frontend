'use client'

import React, { useRef, useState, useCallback } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Button } from '@/components/ui/button'
import { Eraser, Undo2, Check, Palette } from 'lucide-react'

interface SignaturePadProps {
  onSave: (imageData: string) => void
  onCancel?: () => void
  isLoading?: boolean
}

type InkColor = 'black' | 'blue'

const INK_COLORS: Record<InkColor, string> = {
  black: '#000000',
  blue: '#1e40af',
}

export function SignaturePad({ onSave, onCancel, isLoading = false }: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null)
  const [isEmpty, setIsEmpty] = useState(true)
  const [inkColor, setInkColor] = useState<InkColor>('black')

  // Handle when user starts drawing
  const handleBegin = useCallback(() => {
    setIsEmpty(false)
  }, [])

  // Clear the canvas
  const handleClear = useCallback(() => {
    sigCanvas.current?.clear()
    setIsEmpty(true)
  }, [])

  // Save the signature as transparent PNG
  const handleSave = useCallback(() => {
    if (sigCanvas.current && !isEmpty) {
      // Get the data URL with transparent background
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
      onSave(dataUrl)
    }
  }, [isEmpty, onSave])

  // Toggle ink color
  const toggleInkColor = useCallback(() => {
    setInkColor((prev) => (prev === 'black' ? 'blue' : 'black'))
  }, [])

  return (
    <div className="space-y-4">
      {/* Canvas Container */}
      <div className="relative">
        <div className="border-2 border-dashed border-slate-300 rounded-lg bg-white overflow-hidden">
          <SignatureCanvas
            ref={sigCanvas}
            penColor={INK_COLORS[inkColor]}
            canvasProps={{
              className: 'w-full h-48 cursor-crosshair',
              style: { touchAction: 'none' },
            }}
            onBegin={handleBegin}
            backgroundColor="rgba(0,0,0,0)" // Transparent background
          />
        </div>

        {/* Empty state overlay */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-400 text-sm">Gambar tanda tangan di sini</p>
          </div>
        )}

        {/* Ink color indicator */}
        <div className="absolute top-2 right-2">
          <div
            className="w-4 h-4 rounded-full border-2 border-white shadow-md"
            style={{ backgroundColor: INK_COLORS[inkColor] }}
            title={`Warna: ${inkColor === 'black' ? 'Hitam' : 'Biru'}`}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={toggleInkColor}
          className="flex-1 sm:flex-none"
        >
          <Palette className="h-4 w-4 mr-2" />
          {inkColor === 'black' ? 'Hitam' : 'Biru'}
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={isEmpty}
          className="flex-1 sm:flex-none"
        >
          <Eraser className="h-4 w-4 mr-2" />
          Hapus
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="flex-1 sm:flex-none"
          >
            Batal
          </Button>
        )}

        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isEmpty || isLoading}
          className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700"
        >
          <Check className="h-4 w-4 mr-2" />
          {isLoading ? 'Menyimpan...' : 'Simpan'}
        </Button>
      </div>
    </div>
  )
}
