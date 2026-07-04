"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/store/auth"
import { CalendarDays, LayoutGrid, Timer, BarChart3, ArrowRight, Clock, Target, CheckCircle2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.replace("/today")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-text-secondary">
        Loading...
      </div>
    )
  }

  if (user) return null

  const features = [
    { icon: CalendarDays, title: "Time Blocking", desc: "Atur jadwal harian dengan blok waktu yang visual dan mudah" },
    { icon: Timer, title: "Fokus Timer", desc: "Stopwatch berbasis Pomodoro dengan istirahat proporsional" },
    { icon: Target, title: "Target Harian", desc: "Pantau progress dan selesaikan target setiap hari" },
    { icon: BarChart3, title: "Review Harian", desc: "Evaluasi pencapaian dan reschedule tugas yang terlewat" },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-bold">TimeBlock</h1>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="px-4 py-1.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-1.5 text-sm font-medium bg-primary text-white rounded-radius-md hover:bg-primary-hover transition-colors"
            >
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <Clock className="w-4 h-4" />
            Atur waktumu, capai lebih banyak
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
            Kelola Waktu dengan<br />
            <span className="text-primary">Time Blocking</span>
          </h2>
          <p className="text-lg text-text-secondary max-w-md mx-auto mb-8">
            Rencanakan hari, fokus pada tugas, dan review pencapaian — semua dalam satu aplikasi sederhana.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-radius-md font-medium hover:bg-primary-hover transition-colors"
            >
              Mulai Gratis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-6 py-3 bg-surface border border-border rounded-radius-md font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              Sudah punya akun
            </Link>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f) => (
              <div key={f.title} className="flex gap-4 p-5 bg-surface rounded-radius-xl border border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-text-secondary">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-caption text-text-secondary">
        TimeBlock &copy; {new Date().getFullYear()}
      </footer>
    </div>
  )
}
