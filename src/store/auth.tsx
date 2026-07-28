"use client"

import { createContext, useContext, useCallback, type ReactNode } from "react"
import { authClient } from "@/lib/auth-client"

interface User {
  email: string
  name: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession()
  const user: User | null = session?.user
    ? {
        email: session.user.email ?? "",
        name: session.user.name ?? session.user.email ?? "",
      }
    : null

  const signOut = useCallback(() => {
    authClient.signOut()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading: isPending, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
