'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, PenTool, Database, LogOut, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

// Navigation items configuration
const navItems = [
  {
    href: '/',
    label: 'Invoice',
    icon: FileText,
    color: 'blue',
  },
  {
    href: '/signatures',
    label: 'Tanda Tangan',
    icon: PenTool,
    color: 'violet',
  },
  {
    href: '/storage',
    label: 'Storage',
    icon: Database,
    color: 'emerald',
  },
]

interface NavbarProps {
  className?: string
}

export function Navbar({ className }: NavbarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  // Close mobile menu when route changes
  React.useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-white/20',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-blue-600 flex-shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-lg font-bold text-slate-900 leading-tight">KLK Invoice</h1>
              {user && (
                <p className="text-[10px] text-slate-500 truncate -mt-0.5">
                  {user.username}
                </p>
              )}
            </div>
            <span className="text-lg font-bold text-slate-900 sm:hidden">KLK Invoice</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    className={cn(
                      'gap-2 transition-all',
                      isActive
                        ? `bg-${item.color}-600 hover:bg-${item.color}-700 text-white`
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    )}
                    style={isActive ? { 
                      backgroundColor: item.color === 'blue' ? '#2563eb' : 
                                      item.color === 'violet' ? '#7c3aed' : '#059669'
                    } : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Right side - Logout & Mobile Menu */}
          <div className="flex items-center gap-2">
            {/* Logout button - Desktop */}
            <Button
              onClick={logout}
              variant="ghost"
              size="sm"
              className="hidden md:flex gap-2 text-slate-600 hover:text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </Button>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden h-9 w-9 p-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 py-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link key={item.href} href={item.href} className="block">
                  <div
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                    )}
                  </div>
                </Link>
              )
            })}
            
            {/* Divider */}
            <div className="border-t border-slate-200 my-2" />
            
            {/* User info & Logout */}
            <div className="px-3 py-2">
              {user && (
                <p className="text-xs text-slate-500 mb-2">
                  Login sebagai <span className="font-medium text-slate-700">{user.username}</span>
                </p>
              )}
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="w-full justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Keluar
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
