"use client"

import { type ReactNode, useEffect } from "react"
import { AppProvider } from "@/store"
import { AuthProvider } from "@/store/auth"
import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt"
import { registerServiceWorker } from "@/lib/register-sw"

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <AuthProvider>
      <AppProvider>
        {children}
        <PWAInstallPrompt />
      </AppProvider>
    </AuthProvider>
  )
}
