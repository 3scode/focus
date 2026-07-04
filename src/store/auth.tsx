"use client"

import { createContext, useContext, useCallback, useState, useEffect, type ReactNode } from "react"
import { registerUser, authenticateUser, getSession, setSession, clearSession } from "@/lib/auth"

interface User {
  email: string
  name: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    if (session) setUser(session)
    setLoading(false)
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    const stored = await registerUser(email, password, name)
    const sessionUser = { email: stored.email, name: stored.name }
    setSession(sessionUser)
    setUser(sessionUser)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const stored = await authenticateUser(email, password)
    const sessionUser = { email: stored.email, name: stored.name }
    setSession(sessionUser)
    setUser(sessionUser)
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
