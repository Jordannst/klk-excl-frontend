"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Lock, User, Loader2, AlertCircle, Eye, EyeOff, KeyRound, X, CheckCircle, Check, XCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  // Forgot password state
  const [showForgotModal, setShowForgotModal] = React.useState(false)
  const [resetStep, setResetStep] = React.useState<"key" | "password">("key")
  const [secretKey, setSecretKey] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [isResetting, setIsResetting] = React.useState(false)
  const [resetError, setResetError] = React.useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = React.useState(false)

  // Validation checks
  const isPasswordLongEnough = newPassword.length >= 6
  const doPasswordsMatch = newPassword === confirmPassword && confirmPassword.length > 0
  const isFormValid = isPasswordLongEnough && doPasswordsMatch

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const result = await login(username, password)
    
    if (result.success) {
      router.push("/")
    } else {
      setError(result.error || "Login gagal")
    }
    
    setIsLoading(false)
  }

  const handleVerifyKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setResetError(null)
    setIsResetting(true)

    try {
      // First verify the key is correct with a dummy password (we'll send real one later)
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secretKey, newPassword: "verify-only-123456" }),
      })

      const data = await response.json()

      if (response.ok) {
        // Key is valid, move to password step
        // But we need to actually let user set their password, so we go to step 2
        setResetStep("password")
      } else if (response.status === 403) {
        setResetError("Secret key tidak valid")
      } else {
        setResetError(data.error || "Terjadi kesalahan")
      }
    } catch {
      setResetError("Network error. Please check your connection.")
    }

    setIsResetting(false)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    
    setResetError(null)
    setIsResetting(true)

    try {
      const response = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ secretKey, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setResetSuccess(true)
      } else {
        setResetError(data.error || "Reset password gagal")
      }
    } catch {
      setResetError("Network error. Please check your connection.")
    }

    setIsResetting(false)
  }

  const closeForgotModal = () => {
    setShowForgotModal(false)
    setResetStep("key")
    setSecretKey("")
    setNewPassword("")
    setConfirmPassword("")
    setResetError(null)
    setResetSuccess(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-200 rounded-full opacity-30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-200 rounded-full opacity-30 blur-3xl" />
      </div>

      <Card className="w-full max-w-md shadow-xl border-0 relative z-10">
        {/* Gradient top border */}
        <div className="h-2 bg-gradient-to-r from-blue-600 to-emerald-500 rounded-t-lg" />
        
        <CardHeader className="text-center pt-8 pb-4">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/30">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">KLK Invoice</CardTitle>
          <CardDescription className="text-slate-500">
            Masukkan kredensial untuk login
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-slate-700">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-11 h-12 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-11 pr-11 h-12 text-base border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !username || !password}
              className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Login"
              )}
            </Button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Lupa Password?
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeForgotModal}
          />
          
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm m-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-800">Reset Password</h2>
              <button
                onClick={closeForgotModal}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {resetSuccess ? (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle className="h-8 w-8 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-800">Password Berhasil Direset!</h3>
                    <p className="text-sm text-slate-500 mt-1">Silakan login dengan password baru Anda.</p>
                  </div>
                  <Button
                    onClick={closeForgotModal}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Kembali ke Login
                  </Button>
                </div>
              ) : resetStep === "key" ? (
                <form onSubmit={handleVerifyKey} className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Masukkan secret key untuk melanjutkan reset password.
                  </p>

                  {resetError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <p className="text-sm">{resetError}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="secretKey" className="text-sm font-semibold text-slate-700">
                      Secret Key
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <Input
                        id="secretKey"
                        type="password"
                        placeholder="Masukkan secret key"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        className="pl-11 h-12"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isResetting || !secretKey}
                    className="w-full bg-amber-600 hover:bg-amber-700"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memverifikasi...
                      </>
                    ) : (
                      "Lanjutkan"
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-sm text-slate-600">
                    Masukkan password baru Anda.
                  </p>

                  {resetError && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <p className="text-sm">{resetError}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-semibold text-slate-700">
                      Password Baru
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Minimal 6 karakter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-11 pr-11 h-12"
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {/* Password length validation */}
                    <div className={`flex items-center gap-2 text-sm ${isPasswordLongEnough ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {isPasswordLongEnough ? <Check className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <span>Minimal 6 karakter</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700">
                      Konfirmasi Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                      <Input
                        id="confirmPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Ulangi password baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-11 h-12"
                        required
                      />
                    </div>
                    {/* Password match validation */}
                    {confirmPassword.length > 0 && (
                      <div className={`flex items-center gap-2 text-sm ${doPasswordsMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                        {doPasswordsMatch ? <Check className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        <span>{doPasswordsMatch ? 'Password cocok' : 'Password tidak cocok'}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isResetting || !isFormValid}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      "Simpan Password Baru"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
