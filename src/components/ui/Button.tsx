"use client"

import { type ButtonHTMLAttributes } from "react"
import { Loader2 } from "lucide-react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

const variants = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  secondary: "bg-surface border border-border text-text-primary hover:bg-background",
  ghost: "text-text-secondary hover:text-text-primary hover:bg-background",
}

const sizes = {
  sm: "px-3 py-1.5 text-caption",
  md: "px-4 py-2 text-button",
  lg: "px-6 py-3 text-button",
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
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-radius-md font-medium transition-all duration-150
        disabled:opacity-50 disabled:pointer-events-none
        ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
