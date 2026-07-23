"use client"

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react"
import { useUser, useAuth as useClerkAuth, useClerk } from "@clerk/nextjs"

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
  const { user: clerkUser, isLoaded: userLoaded } = useUser()
  const { isLoaded: authLoaded } = useClerkAuth()
  const { signOut: clerkSignOut } = useClerk()

  const [user, setUser] = useState<User | null>(null)

  const loading = !userLoaded || !authLoaded

  useEffect(() => {
    if (clerkUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser({
        email: clerkUser.primaryEmailAddress?.emailAddress ?? "",
        name: clerkUser.fullName ?? clerkUser.username ?? clerkUser.primaryEmailAddress?.emailAddress ?? "",
      })
    } else {
      setUser(null)
    }
  }, [clerkUser])

  const signOut = useCallback(() => {
    clerkSignOut({ redirectUrl: "/" })
  }, [clerkSignOut])

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
