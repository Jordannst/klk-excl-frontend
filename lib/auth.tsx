"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: { id: number; username: string } | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

// Get base URL without /api suffix
const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  // Remove trailing /api if present
  return url.replace(/\/api\/?$/, "")
}
const API_BASE = getBaseUrl()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [user, setUser] = React.useState<{ id: number; username: string } | null>(null)
  const router = useRouter()

  // Check authentication status on mount
  const checkAuth = React.useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        credentials: "include",
      })
      
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setIsAuthenticated(true)
      } else {
        // Try to refresh token
        const refreshResponse = await fetch(`${API_BASE}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
        })
        
        if (refreshResponse.ok) {
          // Retry getting user
          const retryResponse = await fetch(`${API_BASE}/api/auth/me`, {
            credentials: "include",
          })
          if (retryResponse.ok) {
            const data = await retryResponse.json()
            setUser(data.user)
            setIsAuthenticated(true)
          } else {
            setUser(null)
            setIsAuthenticated(false)
          }
        } else {
          setUser(null)
          setIsAuthenticated(false)
        }
      }
    } catch {
      setUser(null)
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (username: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        return { 
          success: false, 
          error: data.error || "Login failed",
          attemptsRemaining: data.attemptsRemaining,
        }
      }
    } catch {
      return { success: false, error: "Network error. Please check your connection." }
    }
  }

  const logout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      })
    } catch {
      // Ignore errors
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      router.push("/login")
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
