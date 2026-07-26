"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Instrument_Sans, IBM_Plex_Mono } from "next/font/google"
import {
  Lock,
  User,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  X,
  CheckCircle,
  Check,
  XCircle,
} from "lucide-react"
import { useAuth } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiBaseUrl } from "@/lib/api-base"
import styles from "./login.module.css"

const API_BASE = apiBaseUrl

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--klk-font-sans",
})

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--klk-font-mono",
})

const MAX_ATTEMPTS = 3
const LOCKOUT_MS = 15 * 60 * 1000

type LoginStatus = "idle" | "loading" | "error" | "locked" | "success"

interface LoginAlert {
  tone: "error" | "success"
  title: string
  detail?: string
}

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()

  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [status, setStatus] = React.useState<LoginStatus>("idle")
  const [attempts, setAttempts] = React.useState(0)
  const [capsLock, setCapsLock] = React.useState(false)
  const [fieldErrors, setFieldErrors] = React.useState<{ username?: string; password?: string }>({})
  const [alert, setAlert] = React.useState<LoginAlert | null>(null)

  const usernameRef = React.useRef<HTMLInputElement>(null)
  const passwordRef = React.useRef<HTMLInputElement>(null)

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

  const isLocked = status === "locked"
  const isBusy = status === "loading" || status === "success"

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, authLoading, router])

  // Client-side lockout timer (advisory only — real enforcement belongs on the server)
  React.useEffect(() => {
    if (status !== "locked") return
    const timer = setTimeout(() => {
      setStatus("idle")
      setAttempts(0)
      setAlert(null)
    }, LOCKOUT_MS)
    return () => clearTimeout(timer)
  }, [status])

  const clearFieldState = (field: "username" | "password") => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
    if (status === "error") {
      setStatus("idle")
      setAlert(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLocked || isBusy) return

    if (!username.trim()) {
      setFieldErrors({ username: "Username wajib diisi" })
      usernameRef.current?.focus()
      return
    }
    if (!password) {
      setFieldErrors({ password: "Password wajib diisi" })
      passwordRef.current?.focus()
      return
    }

    setFieldErrors({})
    setAlert(null)
    setStatus("loading")

    const result = await login(username, password)

    if (result.success) {
      setStatus("success")
      setAlert({ tone: "success", title: "Berhasil masuk.", detail: "Mengalihkan ke dashboard invoice…" })
      setTimeout(() => router.push("/"), 900)
      return
    }

    const failCount = attempts + 1
    setAttempts(failCount)

    if (failCount >= MAX_ATTEMPTS) {
      setStatus("locked")
      setAlert({ tone: "error", title: "Akun dikunci 15 menit.", detail: "Hubungi admin IT." })
      return
    }

    setStatus("error")
    setFieldErrors({ password: "Password tidak cocok" })
    setAlert({
      tone: "error",
      title: result.error || "Username atau password salah.",
      detail: `Sisa ${MAX_ATTEMPTS - failCount} percobaan sebelum akun dikunci 15 menit.`,
    })
    passwordRef.current?.select()
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

  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(e.getModifierState?.("CapsLock") ?? false)
  }

  const fontVars = `${instrumentSans.variable} ${plexMono.variable}`

  if (authLoading) {
    return (
      <div className={`${styles.gate} ${fontVars}`}>
        <Loader2 className={styles.spin} style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  const buttonLabel =
    status === "loading" ? "Memeriksa…" : status === "success" ? "Mengalihkan…" : status === "error" ? "Coba lagi" : "Masuk"

  return (
    <div className={`${styles.root} ${fontVars}`}>
      {/* Left brand panel (desktop) */}
      <aside className={styles.panel}>
        <div className={styles.pattern} />
        <div className={styles.scrim} />
        <div className={styles.pc}>
          <div className={styles.logoChip}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/klkexpress.png" alt="KLK Express" />
          </div>
          <div>
            <h2 className={styles.headline}>Satu tempat untuk semua invoice ekspedisi.</h2>
            <div className={styles.rule} />
            <p className={styles.meta}>
              PT. Kemilau Lintas Khatulistiwa
              <br />
              Branch Manado · Permata Klabat Blok E1 No 17
            </p>
          </div>
        </div>
      </aside>

      {/* Hero (mobile) */}
      <div className={styles.hero}>
        <div className={styles.pattern} />
        <div className={styles.scrim} />
        <div className={styles.heroContent}>
          <div className={styles.logoChip}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/klkexpress.png" alt="KLK Express" />
          </div>
          <p className={styles.meta}>Branch Manado</p>
        </div>
      </div>

      {/* Form column */}
      <main className={styles.form}>
        <div className={styles.formInner}>
          <p className={styles.eyebrow}>Sistem Invoice · KLK Express</p>
          <h1 className={styles.h1}>Masuk</h1>
          <p className={styles.sub}>Akun internal karyawan KLK Express.</p>

          {alert && (
            <div className={`${styles.alert} ${alert.tone === "success" ? styles.alertSuccess : ""}`} role="alert">
              {alert.tone === "success" ? <CheckCircle /> : <AlertCircle />}
              <div>
                <div className={styles.alertTitle}>{alert.title}</div>
                {alert.detail && <div className={styles.alertDetail}>{alert.detail}</div>}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className={styles.field}>
              <label htmlFor="username" className={styles.label}>
                Username
              </label>
              <div className={`${styles.inputBox} ${fieldErrors.username ? styles.inputError : ""}`}>
                <User />
                <input
                  ref={usernameRef}
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Username Anda"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    clearFieldState("username")
                  }}
                  className={styles.input}
                  disabled={isBusy}
                  autoFocus
                />
              </div>
              {fieldErrors.username && (
                <div className={styles.hint}>
                  <AlertCircle />
                  {fieldErrors.username}
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={`${styles.inputBox} ${fieldErrors.password ? styles.inputError : ""}`}>
                <Lock />
                <input
                  ref={passwordRef}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    clearFieldState("password")
                  }}
                  onKeyDown={handlePasswordKey}
                  onKeyUp={handlePasswordKey}
                  onBlur={() => setCapsLock(false)}
                  className={styles.input}
                  disabled={isBusy}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeBtn}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
              {fieldErrors.password && (
                <div className={styles.hint}>
                  <AlertCircle />
                  {fieldErrors.password}
                </div>
              )}
              {capsLock && (
                <div className={styles.caps}>
                  <i />
                  Caps Lock aktif
                </div>
              )}
            </div>

            <div className={styles.row}>
              <button type="button" className={styles.link} onClick={() => setShowForgotModal(true)}>
                Lupa password?
              </button>
            </div>

            <button
              type="submit"
              className={`${styles.btn} ${status === "loading" ? styles.btnLoading : ""} ${isLocked ? styles.btnLocked : ""}`}
              disabled={isBusy || isLocked}
            >
              {status === "loading" && <Loader2 className={styles.spin} style={{ width: 16, height: 16 }} />}
              {buttonLabel}
            </button>
          </form>

          <div className={styles.footer}>
            <span>© 2026 PT. KLK</span>
            <span>Bantuan IT</span>
          </div>
        </div>
      </main>

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
                    className="w-full bg-emerald-700 hover:bg-emerald-800"
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
