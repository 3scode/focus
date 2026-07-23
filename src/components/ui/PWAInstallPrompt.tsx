"use client"

import { useEffect, useState } from "react"
import { X, Download } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === "accepted") {
      console.log("PWA installed")
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem("pwa-install-dismissed", "true")
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-50 animate-slide-up">
      <div
        className="p-4 rounded-xl"
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 8px 40px rgba(0,0,0,0.5), 0 0 80px rgba(94,106,210,0.1)",
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/20 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-[#5E6AD2]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#EDEDEF] mb-1">Install Time Blocking</h3>
            <p className="text-xs text-[#8A8F98] mb-3">
              Install aplikasi ini di perangkat Anda untuk akses yang lebih cepat dan pengalaman offline.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 px-3 py-2 bg-[#5E6AD2] text-white text-sm font-medium rounded-lg hover:bg-[#6872D9] transition-colors shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
              >
                Install
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-2 text-sm text-[#8A8F98] hover:text-[#EDEDEF] transition-colors"
              >
                Nanti
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-white/[0.05] text-[#8A8F98] transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
