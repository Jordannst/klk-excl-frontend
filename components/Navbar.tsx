'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutGrid, PenTool, Database, Trash2, LogOut, Menu, X, Plus } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

// Navigation items configuration (design_handoff_dashboard)
const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
  { href: '/signatures', label: 'Tanda Tangan', icon: PenTool },
  { href: '/storage', label: 'Storage', icon: Database },
  { href: '/trash', label: 'Trash', icon: Trash2 },
]

interface NavbarProps {
  className?: string
  onNewInvoice?: () => void
}

export function Navbar({ className, onNewInvoice }: NavbarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const initial = (user?.username || 'K').charAt(0).toUpperCase()

  const newInvoiceButton = (
    <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-klk-green px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-klk-green-hover">
      <Plus className="h-4 w-4" />
      Invoice Baru
    </span>
  )

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 h-[58px] border-b border-klk-line bg-white',
        className
      )}
    >
      <div className="flex h-full items-center gap-6 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/klkexpress.png" alt="KLK Express" className="w-[78px]" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-[7px] text-[13px] font-semibold transition-colors',
                  isActive
                    ? 'bg-klk-green-tint text-klk-green'
                    : 'text-klk-ink-2 hover:bg-klk-canvas hover:text-klk-ink'
                )}
              >
                <Icon className="h-[15px] w-[15px]" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden md:block">
            {onNewInvoice ? (
              <button type="button" onClick={onNewInvoice} className="cursor-pointer">
                {newInvoiceButton}
              </button>
            ) : (
              <Link href="/">{newInvoiceButton}</Link>
            )}
          </span>

          <span className="hidden h-6 w-px bg-klk-line md:block" />

          {/* User */}
          <div className="hidden items-center gap-2.5 md:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-klk-green-deep text-[13px] font-semibold text-white">
              {initial}
            </span>
            <span className="leading-tight">
              <span className="block text-[12.5px] font-semibold text-klk-ink">
                {user?.username || 'Pengguna'}
              </span>
              <span className="block font-klk-mono text-[9px] uppercase tracking-[.1em] text-klk-ink-3">
                Branch Manado
              </span>
            </span>
          </div>

          <button
            onClick={logout}
            className="hidden h-9 w-9 items-center justify-center rounded-lg text-klk-ink-3 transition-colors hover:bg-klk-red-tint hover:text-klk-red md:flex"
            aria-label="Keluar"
            title="Keluar"
          >
            <LogOut className="h-4 w-4" />
          </button>

          {/* Mobile menu button */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-klk-ink-2 hover:bg-klk-canvas md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="space-y-1 border-t border-klk-line bg-white px-4 py-3 md:hidden">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link key={item.href} href={item.href} className="block">
                <div
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                    isActive
                      ? 'bg-klk-green-tint text-klk-green'
                      : 'text-klk-ink-2 hover:bg-klk-canvas'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </div>
              </Link>
            )
          })}

          <div className="my-2 border-t border-klk-line" />

          <div className="px-3 py-2">
            {user && (
              <p className="mb-2 text-xs text-klk-ink-3">
                Login sebagai <span className="font-semibold text-klk-ink-2">{user.username}</span>
              </p>
            )}
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-klk-line py-2 text-[13px] font-semibold text-klk-red hover:bg-klk-red-tint"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
