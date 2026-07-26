"use client"

import { SignUpButton } from "@clerk/nextjs"
import { Clock } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-fade-up">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-[#EDEDEF]">
          <Clock className="w-5 h-5 text-[#5E6AD2]" />
          Time Blocking
        </Link>
        <p className="text-sm text-[#8A8F98] text-center">
          Buat akun untuk mulai menggunakan Time Blocking
        </p>
        <SignUpButton mode="modal" fallbackRedirectUrl="/today">
          <button className="w-full py-2.5 bg-[#5E6AD2] text-white rounded-lg text-sm font-medium hover:bg-[#6872D9] transition-all shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]">
            Daftar
          </button>
        </SignUpButton>
        <p className="text-sm text-[#8A8F98]">
          Sudah punya akun?{" "}
          <Link href="/sign-in" className="text-[#5E6AD2] hover:text-[#6872D9] transition-colors">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
