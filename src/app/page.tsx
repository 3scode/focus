"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { CalendarDays, LayoutGrid, Timer, BarChart3, ArrowRight, Clock } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/today")
    }
  }, [isPending, session, router])

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[#8A8F98]">
        Loading...
      </div>
    )
  }

  if (session) return null

  const features = [
    { icon: CalendarDays, title: "Blok Waktu", desc: "Atur jadwal harian dengan blok waktu yang visual dan mudah" },
    { icon: Timer, title: "Fokus Timer", desc: "Stopwatch berbasis Pomodoro dengan istirahat proporsional" },
    { icon: LayoutGrid, title: "Target Harian", desc: "Pantau progress dan selesaikan target setiap hari" },
    { icon: BarChart3, title: "Review Harian", desc: "Evaluasi pencapaian dan reschedule tugas yang terlewat" },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <header
        className="sticky top-0 z-10 border-b border-white/[0.06]"
        style={{ background: "rgba(5,5,6,0.8)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 h-14">
          <h1 className="text-lg font-semibold flex items-center gap-2 text-[#EDEDEF]">
            <Clock className="w-5 h-5 text-[#5E6AD2]" />
            Focus
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href="/sign-in"
              className="px-4 py-1.5 text-sm font-medium text-[#8A8F98] hover:text-[#EDEDEF] transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/sign-up"
              className="px-4 py-1.5 text-sm font-medium bg-[#5E6AD2] text-white rounded-lg hover:bg-[#6872D9] transition-colors shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]"
            >
              Daftar
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#5E6AD2]/15 text-[#5E6AD2] rounded-full text-sm font-medium mb-6 shadow-[inset_0_1px_0_0_rgba(94,106,210,0.1)]">
            <Clock className="w-4 h-4" />
            Atur waktumu, capai lebih banyak
          </div>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight mb-4">
            <span className="bg-gradient-to-b from-[#EDEDEF] via-[#EDEDEF]/95 to-[#EDEDEF]/70 bg-clip-text text-transparent">
              Kelola Waktu dengan
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#5E6AD2] via-indigo-400 to-[#5E6AD2] bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
              Focus
            </span>
          </h2>
          <p className="text-lg text-[#8A8F98] max-w-md mx-auto mb-8">
            Rencanakan hari, fokus pada tugas, dan review pencapaian — semua dalam satu aplikasi sederhana.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5E6AD2] text-white rounded-lg font-medium hover:bg-[#6872D9] transition-all duration-200 shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_0_1px_rgba(94,106,210,0.6),0_8px_20px_rgba(94,106,210,0.4),inset_0_1px_0_0_rgba(255,255,255,0.25)]"
            >
              Mulai Gratis <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-[#8A8F98] hover:text-[#EDEDEF] transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.05)",
                boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.1)",
              }}
            >
              Sudah punya akun
            </Link>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex gap-4 p-5 rounded-xl transition-all duration-200 hover:bg-white/[0.08]"
                style={{
                  background: "linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.06), 0 2px 20px rgba(0,0,0,0.4)",
                }}
              >
                <div className="w-10 h-10 rounded-lg bg-[#5E6AD2]/20 flex items-center justify-center shrink-0">
                  <f.icon className="w-5 h-5 text-[#5E6AD2]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#EDEDEF] mb-1">{f.title}</h3>
                  <p className="text-sm text-[#8A8F98]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-[#8A8F98]">
        &copy;{" "}
        <a
          href="https://3scode.my.id"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#5E6AD2] hover:text-[#6872D9] transition-colors"
        >
          Created By 3SCODE
        </a>
      </footer>
    </div>
  )
}