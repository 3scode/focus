"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

export function AuthGuard({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/sign-in")
    }
  }, [isPending, session, router])

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[#8A8F98]">
        Loading...
      </div>
    )
  }

  if (!session) return null

  return <>{children}</>
}
