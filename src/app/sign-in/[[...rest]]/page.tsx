"use client"

import { SignIn } from "@clerk/nextjs"
import { Clock } from "lucide-react"
import Link from "next/link"

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-fade-up">
        <Link href={`${BASE}/`} className="flex items-center gap-2 text-lg font-semibold text-[#EDEDEF]">
          <Clock className="w-5 h-5 text-[#5E6AD2]" />
          Time Blocking
        </Link>
        <SignIn
          routing="path"
          path={`${BASE}/sign-in`}
          signUpUrl={`${BASE}/sign-up`}
          forceRedirectUrl={`${BASE}/today`}
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "w-full bg-transparent shadow-none border-0 p-0",
              headerTitle: "text-2xl font-semibold text-[#EDEDEF]",
              headerSubtitle: "text-sm text-[#8A8F98]",
              socialButtonsBlockButton: "bg-white/[0.05] text-[#EDEDEF] border border-white/[0.1] rounded-lg hover:bg-white/[0.08] transition-all",
              socialButtonsBlockButtonText: "text-[#EDEDEF]",
              dividerLine: "bg-white/[0.06]",
              dividerText: "text-[#8A8F98]",
              formFieldLabel: "text-sm font-medium text-[#8A8F98]",
              formFieldInput: "w-full px-3 py-2.5 rounded-lg text-sm text-[#EDEDEF] placeholder:text-[#8A8F98]/60 bg-white/[0.03] border border-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] focus:outline-none",
              formButtonPrimary: "w-full py-2.5 bg-[#5E6AD2] text-white rounded-lg text-sm font-medium hover:bg-[#6872D9] transition-all shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)]",
              footerActionText: "text-sm text-[#8A8F98]",
              footerActionLink: "text-[#5E6AD2] hover:text-[#6872D9] transition-colors",
              formFieldErrorText: "text-sm text-[#EF4444]",
              formFieldInputError: "border-[#EF4444]",
              identityPreviewText: "text-[#EDEDEF]",
              identityPreviewEditButton: "text-[#5E6AD2]",
              otpCodeFieldInput: "bg-white/[0.03] text-[#EDEDEF] border border-white/[0.1] rounded-lg",
              alert: "rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444]",
            },
          }}
        />
      </div>
    </div>
  )
}
