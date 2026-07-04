"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { CalendarDays, LayoutGrid, Timer, BarChart3, Settings, LogOut, User, Clock } from "lucide-react"
import { useAuth } from "@/store/auth"

const links = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/week", label: "Week", icon: LayoutGrid },
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/review", label: "Review", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  return (
    <aside className="hidden md:flex flex-col w-56 h-screen bg-surface border-r border-border p-4 shrink-0">
      <Link href="/" className="flex items-center gap-2 text-lg font-bold mb-8 px-3 block"><Clock className="w-5 h-5" />TimeBlock</Link>
      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-radius-md text-sm font-medium transition-colors
                ${active ? "bg-primary text-white" : "text-text-secondary hover:bg-background hover:text-text-primary"}
              `}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto border-t border-border pt-4 px-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-caption text-text-secondary truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:text-error rounded-radius-md hover:bg-background transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </button>
      </div>
    </aside>
  )
}

export function BottomTab() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-40">
      <div className="flex items-center justify-around h-16">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-caption font-medium transition-colors
                ${active ? "text-primary" : "text-text-secondary"}
              `}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
