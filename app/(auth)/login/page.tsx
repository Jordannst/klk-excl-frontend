"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ProductBrand } from "@/components/ProductBrand"
import { ThemeControl } from "@/components/marketing/ThemeControl"
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
  const [secretKey, setSecretKey] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [isResetting, setIsResetting] = React.useState(false)
  const [resetError, setResetError] = React.useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = React.useState(false)
  const resetDialogRef = React.useRef<HTMLDialogElement>(null)

  React.useEffect(() => {
    if (showForgotModal) resetDialogRef.current?.showModal()
  }, [showForgotModal])

  // Validation checks
  const isPasswordLongEnough = newPassword.length >= 6
  const doPasswordsMatch = newPassword === confirmPassword && confirmPassword.length > 0
  const isFormValid = secretKey.trim().length > 0 && isPasswordLongEnough && doPasswordsMatch

  const isLocked = status === "locked"
  const isBusy = status === "loading" || status === "success"

  // Redirect if already authenticated
  React.useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace("/dashboard")
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
      setTimeout(() => router.replace("/dashboard"), 900)
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid || isResetting) return

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
        setResetError(response.status === 403 ? "Private key tidak valid." : data.error || "Reset password gagal")
      }
    } catch {
      setResetError("Koneksi bermasalah. Periksa jaringan Anda.")
    }

    setIsResetting(false)
  }

  const closeForgotModal = () => {
    if (isResetting) return
    setShowForgotModal(false)
    setShowNewPassword(false)
    setSecretKey("")
    setNewPassword("")
    setConfirmPassword("")
    setResetError(null)
    setResetSuccess(false)
  }

  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(e.getModifierState?.("CapsLock") ?? false)
  }

  if (authLoading) {
    return (
      <div className={styles.gate}>
        <Loader2 className={styles.spin} style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  const buttonLabel =
    status === "loading" ? "Memeriksa…" : status === "success" ? "Mengalihkan…" : status === "error" ? "Coba lagi" : "Masuk"

  return (
    <div className={styles.root}>
      {/* Left brand panel (desktop) */}
      <aside className={styles.panel}>
        <div className={styles.pattern} />
        <div className={styles.scrim} />
        <div className={styles.pc}>
          <Link href="/" className={styles.brandLink} aria-label="KLK Invoice — Beranda"><ProductBrand /></Link>
          <div>
            <p className={styles.panelEyebrow}>ADMINISTRASI RAPI. BISNIS TERUS BERGERAK.</p>
            <h2 className={styles.headline}>Lebih sedikit kerumitan.<br /><span>Lebih banyak ruang untuk bisnis.</span></h2>
            <div className={styles.documentArt} aria-hidden="true"><div><span>KLK Invoice</span><small>CONTOH DOKUMEN</small></div><strong>Invoice pengiriman</strong><p>Oktober 2026 · DEMO-001</p><div className={styles.documentLines}><i /><i /><i /></div><div><span>Total tagihan</span><b>Rp 700.000</b></div></div>
            <div className={styles.rule} />
            <p className={styles.meta}>Dari pencatatan transaksi hingga invoice siap dibagikan.<br />Kelola semuanya dalam satu alur kerja.</p>
          </div>
        </div>
      </aside>

      {/* Hero (mobile) */}
      <div className={styles.hero}>
        <div className={styles.pattern} />
        <div className={styles.scrim} />
        <div className={styles.heroContent}>
          <Link href="/" aria-label="KLK Invoice — Beranda"><ProductBrand /></Link>
          <Link href="/" className={styles.backLink}>Kembali ke beranda ↗</Link>
        </div>
      </div>

      {/* Form column */}
      <main className={styles.form}>
        <div className={styles.formInner}>
          <div className={styles.themeBar}><ThemeControl locale="id" system /><ThemeControl locale="id" /></div>
          <p className={styles.eyebrow}>RUANG KERJA ANDA</p>
          <h1 className={styles.h1}>Selamat datang kembali</h1>
          <p className={styles.sub}>Masuk ke akun KLK Invoice untuk mengelola invoice dan transaksi bisnis Anda.</p>

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
            <span>© {new Date().getFullYear()} KLK Invoice</span>
            <Link href="/">Kembali ke beranda ↗</Link>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <dialog ref={resetDialogRef} onCancel={(event) => { event.preventDefault(); closeForgotModal() }} aria-labelledby="reset-title" className="fixed inset-0 z-50 m-0 flex h-dvh max-h-none w-screen max-w-none items-center justify-center bg-transparent p-0">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeForgotModal}
          />

          <div className={`${styles.resetCard} relative rounded-xl shadow-2xl w-full max-w-sm m-4 max-h-[90dvh] overflow-y-auto`}>
            <div className="flex items-center justify-between p-4 border-b border-[var(--klk-line)]">
              <h2 id="reset-title" className="text-lg font-bold text-[var(--klk-ink)]">Atur ulang password</h2>
              <button
                onClick={closeForgotModal}
                disabled={isResetting}
                aria-label="Tutup dialog"
                className="p-2 rounded-lg hover:bg-[var(--klk-canvas)] text-[var(--klk-ink-3)] hover:text-[var(--klk-ink-2)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {resetSuccess ? (
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success-tint)]">
                      <CheckCircle className="h-8 w-8 text-[var(--success-ink)]" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[var(--klk-ink)]">Password Berhasil Direset!</h3>
                    <p className="text-sm text-[var(--klk-ink-3)] mt-1">Silakan login dengan password baru Anda.</p>
                  </div>
                  <Button
                    onClick={closeForgotModal}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Kembali ke Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-sm text-[var(--klk-ink-2)]">
                    Masukkan private key dan password baru. Password hanya berubah setelah Anda menekan Simpan Password Baru.
                  </p>

                  {resetError && (
                    <div role="alert" className="flex items-center gap-2 p-3 rounded-lg bg-[var(--klk-red-tint)] border border-[var(--klk-red)] text-[var(--klk-red)]">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <p className="text-sm">{resetError}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="secretKey" className="text-sm font-semibold text-[var(--klk-ink-2)]">
                      Private Key
                    </Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 h-5 w-5 text-[var(--klk-ink-3)]" />
                      <Input
                        id="secretKey"
                        type="password"
                        placeholder="Masukkan private key"
                        value={secretKey}
                        onChange={(e) => setSecretKey(e.target.value)}
                        className="pl-11 h-12"
                        disabled={isResetting}
                        autoComplete="off"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-semibold text-[var(--klk-ink-2)]">
                      Password Baru
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-[var(--klk-ink-3)]" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Minimal 6 karakter"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-11 pr-11 h-12"
                        disabled={isResetting}
                        autoComplete="new-password"
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        aria-label={showNewPassword ? "Sembunyikan password baru" : "Tampilkan password baru"}
                        className="absolute right-3 top-3 text-[var(--klk-ink-3)] hover:text-[var(--klk-ink-2)] transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {/* Password length validation */}
                    <div className={`flex items-center gap-2 text-sm ${isPasswordLongEnough ? 'text-[var(--success-ink)]' : 'text-[var(--klk-ink-3)]'}`}>
                      {isPasswordLongEnough ? <Check className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      <span>Minimal 6 karakter</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold text-[var(--klk-ink-2)]">
                      Konfirmasi Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-[var(--klk-ink-3)]" />
                      <Input
                        id="confirmPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Ulangi password baru"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isResetting}
                        autoComplete="new-password"
                        minLength={6}
                        className="pl-11 h-12"
                        required
                      />
                    </div>
                    {/* Password match validation */}
                    {confirmPassword.length > 0 && (
                      <div className={`flex items-center gap-2 text-sm ${doPasswordsMatch ? 'text-[var(--success-ink)]' : 'text-[var(--klk-red)]'}`}>
                        {doPasswordsMatch ? <Check className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                        <span>{doPasswordsMatch ? 'Password cocok' : 'Password tidak cocok'}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isResetting || !isFormValid}
                    className="w-full bg-blue-600 hover:bg-blue-700"
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
        </dialog>
      )}
    </div>
  )
}
