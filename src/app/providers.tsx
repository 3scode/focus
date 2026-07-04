"use client"

import { type ReactNode, useEffect } from "react"
import { AppProvider } from "@/store"
import { AuthProvider } from "@/store/auth"
import { TimerProvider } from "@/store/timer"
import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt"
import { FloatingTimer } from "@/components/layout/FloatingTimer"
import { registerServiceWorker } from "@/lib/register-sw"

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    registerServiceWorker()
  }, [])

  return (
    <AuthProvider>
      <AppProvider>
        <TimerProvider>
          {children}
          <FloatingTimer />
          <PWAInstallPrompt />
        </TimerProvider>
      </AppProvider>
    </AuthProvider>
  )
}
