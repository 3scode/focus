"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/Button"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await authClient.signUp.email({ email, password, name })
      if (error) {
        toast.error(error.message ?? "Gagal membuat akun")
        return
      }
      toast.success("Akun berhasil dibuat")
      window.location.replace("/today")
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message ?? "Terjadi kesalahan")
      } else {
        toast.error("Terjadi kesalahan")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#5E6AD2]/15 border border-[#5E6AD2]/20 mb-4">
            <User className="w-5 h-5 text-[#5E6AD2]" />
          </div>
          <h1 className="text-xl font-semibold text-[#EDEDEF] mb-1">Daftar</h1>
          <p className="text-sm text-[#8A8F98]">Buat akun Focus baru</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#8A8F98]">Nama</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F98] pointer-events-none" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Nama kamu"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.05] text-[#EDEDEF] placeholder:text-[#8A8F98]/60 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/30 focus:border-[#5E6AD2]/30 text-base transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#8A8F98]">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F98] pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.05] text-[#EDEDEF] placeholder:text-[#8A8F98]/60 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/30 focus:border-[#5E6AD2]/30 text-base transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#8A8F98]">Kata sandi</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8F98] pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Minimal 8 karakter"
                className="w-full pl-10 pr-12 py-3 rounded-xl border border-white/[0.06] bg-white/[0.05] text-[#EDEDEF] placeholder:text-[#8A8F98]/60 focus:outline-none focus:ring-2 focus:ring-[#5E6AD2]/30 focus:border-[#5E6AD2]/30 text-base transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A8F98] hover:text-[#EDEDEF] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" loading={loading}>
            Daftar
          </Button>
        </form>

        <p className="text-center text-sm text-[#8A8F98] mt-6">
          Sudah punya akun?{" "}
          <Link href="/sign-in" className="text-[#5E6AD2] hover:text-[#6872D9] font-medium transition-colors">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
