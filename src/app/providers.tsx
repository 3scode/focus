"use client"

import { type ReactNode } from "react"
import { AppProvider } from "@/store"

export function Providers({ children }: { children: ReactNode }) {
  return <AppProvider>{children}</AppProvider>
}
