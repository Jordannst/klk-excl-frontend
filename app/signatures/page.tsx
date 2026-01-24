"use client"

import * as React from "react"
import { toast } from "sonner"
import { PenTool, Plus, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SignaturePad } from "@/components/SignaturePad"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Navbar } from "@/components/Navbar"
import { useSignatures, useCreateSignature, useDeleteSignature } from "@/lib/hooks/useSignature"
import type { Signature } from "@/lib/types"

// ============================================================================
// Delete Confirmation Dialog Component
// ============================================================================
interface DeleteDialogProps {
  isOpen: boolean
  signatureLabel: string
  onConfirm: () => void
  onCancel: () => void
  isDeleting: boolean
}

function DeleteConfirmDialog({ isOpen, signatureLabel, onConfirm, onCancel, isDeleting }: DeleteDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Hapus Tanda Tangan?</h3>
        <p className="text-sm text-slate-600 mb-6">
          Tanda tangan <span className="font-semibold">&quot;{signatureLabel}&quot;</span> akan dihapus permanen.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting} className="flex-1">
            Batal
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Signature Card Component
// ============================================================================
interface SignatureCardProps {
  signature: Signature
  onDelete: (signature: Signature) => void
}

function SignatureCard({ signature, onDelete }: SignatureCardProps) {
  return (
    <div className="group relative bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all">
      {/* Signature Image */}
      <div className="aspect-[3/2] bg-slate-50 rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-slate-100">
        <img
          src={signature.imageData}
          alt={signature.label}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Label */}
      <p className="text-sm font-medium text-slate-800 truncate">{signature.label}</p>
      <p className="text-xs text-slate-400">
        {new Date(signature.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(signature)}
        className="absolute top-2 right-2 p-2 rounded-lg bg-red-50 text-red-600 opacity-0 group-hover:opacity-100 hover:bg-red-100 transition-all"
        title="Hapus tanda tangan"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

// ============================================================================
// Main Page Content
// ============================================================================
function SignaturesContent() {
  const [showCreateForm, setShowCreateForm] = React.useState(false)
  const [newSignatureLabel, setNewSignatureLabel] = React.useState("")
  const [pendingImageData, setPendingImageData] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<Signature | null>(null)

  // Hooks
  const { data: signatures, isLoading: isLoadingSignatures } = useSignatures()
  const createSignature = useCreateSignature()
  const deleteSignature = useDeleteSignature()

  // Handle signature pad save
  const handleSignaturePadSave = (imageData: string) => {
    setPendingImageData(imageData)
  }

  // Handle final save with label
  const handleSaveSignature = async () => {
    if (!pendingImageData || !newSignatureLabel.trim()) return

    try {
      await createSignature.mutateAsync({
        label: newSignatureLabel.trim(),
        imageData: pendingImageData,
      })

      // Reset form
      setShowCreateForm(false)
      setNewSignatureLabel("")
      setPendingImageData(null)
      
      // Success notification
      toast.success("Tanda tangan berhasil disimpan", {
        description: `Tanda tangan "${newSignatureLabel.trim()}" telah ditambahkan`,
      })
    } catch (error) {
      console.error("Failed to save signature:", error)
      toast.error("Gagal menyimpan tanda tangan", {
        description: "Silakan coba lagi atau periksa koneksi internet",
      })
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return
    
    const deletedLabel = deleteTarget.label

    try {
      await deleteSignature.mutateAsync(deleteTarget.id)
      setDeleteTarget(null)
      
      // Success notification
      toast.success("Tanda tangan berhasil dihapus", {
        description: `Tanda tangan "${deletedLabel}" telah dihapus`,
      })
    } catch (error) {
      console.error("Failed to delete signature:", error)
      toast.error("Gagal menghapus tanda tangan", {
        description: "Silakan coba lagi atau periksa koneksi internet",
      })
    }
  }

  // Cancel create form
  const handleCancelCreate = () => {
    setShowCreateForm(false)
    setNewSignatureLabel("")
    setPendingImageData(null)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Shared Navbar */}
      <Navbar />

      {/* Content */}
      <main className="max-w-5xl mx-auto pt-20 sm:pt-24 px-4 sm:px-6 pb-8">
        {/* Page Header with Action */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Kelola Tanda Tangan</h2>
            <p className="text-sm text-slate-500">Buat dan kelola tanda tangan untuk invoice</p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="bg-violet-600 hover:bg-violet-700 text-white"
            disabled={showCreateForm}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Tambah TTD</span>
            <span className="sm:hidden">Tambah</span>
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Buat Tanda Tangan Baru</h2>

            {!pendingImageData ? (
              // Step 1: Draw signature
              <SignaturePad
                onSave={handleSignaturePadSave}
                onCancel={handleCancelCreate}
              />
            ) : (
              // Step 2: Add label and confirm
              <div className="space-y-4">
                {/* Preview */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <p className="text-xs text-slate-500 mb-2">Preview:</p>
                  <div className="flex justify-center">
                    <img
                      src={pendingImageData}
                      alt="Preview"
                      className="max-h-24 object-contain"
                    />
                  </div>
                </div>

                {/* Label Input */}
                <div className="space-y-2">
                  <Label htmlFor="signature-label" className="text-sm font-semibold text-slate-700">
                    Nama Penandatangan <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="signature-label"
                    value={newSignatureLabel}
                    onChange={(e) => setNewSignatureLabel(e.target.value)}
                    placeholder="Contoh: Pak Jordan, Bu Janti"
                    className="h-10"
                    autoFocus
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setPendingImageData(null)}
                    className="flex-1"
                  >
                    Gambar Ulang
                  </Button>
                  <Button
                    onClick={handleSaveSignature}
                    disabled={!newSignatureLabel.trim() || createSignature.isPending}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {createSignature.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Tanda Tangan"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Signatures Grid */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Tanda Tangan Tersimpan
            {signatures && signatures.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({signatures.length})
              </span>
            )}
          </h2>

          {/* Loading State */}
          {isLoadingSignatures && (
            <div className="py-12 text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-3 text-violet-500 animate-spin" />
              <p className="text-sm text-slate-500">Memuat tanda tangan...</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoadingSignatures && (!signatures || signatures.length === 0) && (
            <div className="py-12 text-center">
              <PenTool className="h-12 w-12 mx-auto mb-3 text-slate-300" />
              <h3 className="text-base font-semibold text-slate-600 mb-1">Belum Ada Tanda Tangan</h3>
              <p className="text-sm text-slate-400 mb-4">
                Buat tanda tangan pertama untuk digunakan di invoice
              </p>
              {!showCreateForm && (
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Tanda Tangan
                </Button>
              )}
            </div>
          )}

          {/* Signatures Grid */}
          {!isLoadingSignatures && signatures && signatures.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {signatures.map((signature) => (
                <SignatureCard
                  key={signature.id}
                  signature={signature}
                  onDelete={setDeleteTarget}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={!!deleteTarget}
        signatureLabel={deleteTarget?.label || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={deleteSignature.isPending}
      />
    </div>
  )
}

// ============================================================================
// Export with Protected Route
// ============================================================================
export default function SignaturesPage() {
  return (
    <ProtectedRoute>
      <SignaturesContent />
    </ProtectedRoute>
  )
}
