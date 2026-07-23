"use client"

import { type ReactNode, useEffect } from "react"
import { AppProvider } from "@/store"
import { AuthProvider } from "@/store/auth"
import { TimerProvider } from "@/store/timer"
import { FloatingTimer } from "@/components/layout/FloatingTimer"
import { registerServiceWorker } from "@/lib/register-sw"
import { Agentation } from "agentation"

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
          {process.env.NODE_ENV === "development" && <Agentation />}
        </TimerProvider>
      </AppProvider>
    </AuthProvider>
  )
}
