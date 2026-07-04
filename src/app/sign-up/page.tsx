"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/store/auth"

export default function SignUpPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Semua field harus diisi")
      return
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter")
      return
    }
    setBusy(true)
    try {
      await signUp(email, password, name)
      router.push("/today")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }, [name, email, password, signUp, router])

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Daftar</h1>
          <p className="text-sm text-text-secondary mt-1">Buat akun untuk mulai menggunakan TimeBlock</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-radius-md text-sm focus:outline-none focus:border-primary"
              placeholder="Nama kamu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-radius-md text-sm focus:outline-none focus:border-primary"
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-radius-md text-sm focus:outline-none focus:border-primary"
              placeholder="Minimal 6 karakter"
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-2 bg-primary text-white rounded-radius-md text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {busy ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Sudah punya akun?{" "}
          <Link href="/sign-in" className="text-primary hover:underline">Masuk</Link>
        </p>
      </div>
    </div>
  )
}
