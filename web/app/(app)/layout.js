import Link from "next/link"
import { redirect } from "next/navigation"
import { Landmark } from "lucide-react"
import config from "@/config"
import { getUser } from "@/lib/supabase/server"
import { asegurarRolSuperAdmin } from "@/lib/roles"
import UserMenu from "@/components/auth/UserMenu"
import Logo from "@/components/Logo"
import SidebarNav from "./SidebarNav"
import SidebarArbolMateria from "./SidebarArbolMateria"
import { MateriaTreeProvider } from "./materias/[id]/MateriaTreeContext"

// Layout de la zona privada. El middleware ya bloquea sin sesión,
// pero revalidamos aquí para tener el `user` y proteger por si acaso.
export default async function AppLayout({ children }) {
  const user = await getUser()
  if (!user) redirect(config.auth.loginUrl)

  // Sincroniza el rol con SUPER_ADMIN_EMAILS y trae el estado de la
  // cuenta. Si el super_admin la suspendió, no entra a la zona
  // privada — se le manda a una página que le explica y cierra su
  // sesión (auth.users no se toca; el bloqueo es de la app).
  const info = await asegurarRolSuperAdmin(user)
  if (info?.suspendido) {
    redirect("/cuenta-suspendida")
  }
  const esSuperAdmin = info?.rol === "super_admin"

  const meta = user.user_metadata || {}
  const nombreCompleto = meta.full_name || meta.name || user.email
  const primerNombre = nombreCompleto?.split(" ")[0] || "Profesor"

  return (
    <MateriaTreeProvider>
      <div className="flex min-h-screen flex-col bg-base-200">
        <header className="sticky top-0 z-40 border-b border-base-200 bg-base-100">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold">
              <Logo className="size-7" />
              {config.brand.logoText}
            </Link>
            <UserMenu user={user} esSuperAdmin={esSuperAdmin} />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 py-6">
          <aside className="hidden w-52 shrink-0 flex-col justify-between md:flex">
            <div className="space-y-4">
              <p className="px-3 font-heading text-lg font-black text-primary">
                Bienvenido {primerNombre}
              </p>
              <SidebarNav />
              <SidebarArbolMateria />
            </div>

            <div className="space-y-2">
              {config.app.institucion && (
                <div className="flex items-center gap-2 rounded-lg border border-base-200 bg-base-100 px-3 py-2 text-xs font-medium text-base-content/60">
                  <Landmark className="size-4 shrink-0 text-primary" />
                  <span className="truncate">{config.app.institucion}</span>
                </div>
              )}
              <UserMenu user={user} variant="sidebar" esSuperAdmin={esSuperAdmin} />
            </div>
          </aside>

          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </MateriaTreeProvider>
  )
}
