"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, BookOpen, ListChecks, MessageSquare, Bot } from "lucide-react"

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/materias", label: "Materias", icon: BookOpen },
  { href: "/catalogos", label: "Catálogos", icon: ListChecks },
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/agent", label: "Agente", icon: Bot },
]

// Nav del sidebar — Client Component (necesita usePathname para
// resaltar el ítem activo). El resto del sidebar (institución,
// perfil) es estático y vive en layout.js como Server Component.
export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const activo = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activo ? "bg-primary/10 font-semibold text-primary" : "text-base-content/70 hover:bg-base-200"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
