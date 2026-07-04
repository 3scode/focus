"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { CalendarDays, LayoutGrid, Timer, BarChart3, Settings } from "lucide-react"

const links = [
  { href: "/", label: "Today", icon: CalendarDays },
  { href: "/week", label: "Week", icon: LayoutGrid },
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/review", label: "Review", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 h-screen bg-surface border-r border-border p-4 shrink-0">
      <h1 className="text-lg font-bold mb-8 px-3">TimeBlock</h1>
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
