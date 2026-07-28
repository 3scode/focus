"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { CalendarDays, LayoutGrid, Calendar, Timer, BarChart3, Settings, LogOut, User, Clock, CheckSquare } from "lucide-react"
import { authClient } from "@/lib/auth-client"


const links = [
  { href: "/today", label: "Today", icon: CalendarDays },
  { href: "/month", label: "Month", icon: Calendar },
  { href: "/week", label: "Week", icon: LayoutGrid },
  { href: "/habits", label: "Habits", icon: CheckSquare },
  { href: "/timer", label: "Timer", icon: Timer },
  { href: "/review", label: "Review", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = authClient.useSession()
  const user = session?.user

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen bg-[#0a0a0c] border-r border-white/[0.06] p-4 shrink-0">
      <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-8 px-3 text-[#EDEDEF]">
        <Clock className="w-5 h-5 text-[#5E6AD2]" />
        Focus
      </Link>
      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${active
                  ? "bg-[#5E6AD2]/15 text-[#5E6AD2] shadow-[inset_0_1px_0_0_rgba(94,106,210,0.1)]"
                  : "text-[#8A8F98] hover:text-[#EDEDEF] hover:bg-white/[0.05]"
                }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto border-t border-white/[0.06] pt-4 px-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#5E6AD2]/20 flex items-center justify-center">
            {user?.image ? (
              <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
            ) : (
              <User className="w-4 h-4 text-[#5E6AD2]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#EDEDEF] truncate">{user?.name ?? user?.email ?? "User"}</p>
            <p className="text-xs text-[#8A8F98] truncate">{user?.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={() => authClient.signOut()}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-[#8A8F98] hover:text-[#EF4444] rounded-lg hover:bg-white/[0.05] transition-all duration-200"
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0c]/95 backdrop-blur-xl border-t border-white/[0.06] z-40">
      <div className="flex items-center justify-around h-16">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs font-medium transition-colors
                ${active ? "text-[#5E6AD2]" : "text-[#8A8F98]"}
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
