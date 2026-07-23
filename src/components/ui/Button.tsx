"use client"

import { type ButtonHTMLAttributes } from "react"
import { Loader2 } from "lucide-react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 ease-out rounded-lg disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"

  const variants: Record<string, string> = {
    primary: "bg-[#5E6AD2] text-white hover:bg-[#6872D9] shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] hover:shadow-[0_0_0_1px_rgba(94,106,210,0.6),0_8px_20px_rgba(94,106,210,0.4),inset_0_1px_0_0_rgba(255,255,255,0.25)]",
    secondary: "bg-white/[0.05] text-[#EDEDEF] hover:bg-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_0_rgba(255,255,255,0.15)]",
    ghost: "text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.05]",
  }

  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-sm",
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
