"use client"

import { type ReactNode } from "react"
import { AppProvider } from "@/store"
import { AuthProvider } from "@/store/auth"

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppProvider>{children}</AppProvider>
    </AuthProvider>
  )
}
