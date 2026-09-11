// ============================================================
// /cuenta-suspendida
// ------------------------------------------------------------
// Aterrizaje para maestros cuya cuenta suspendió un super_admin
// (ver /superadmin). El layout de /(app) redirige aquí antes de
// dejar entrar. La sesión de Supabase sigue viva hasta que el
// usuario toca "Cerrar sesión" (Server Action que sí puede limpiar
// cookies, a diferencia del layout).
// ============================================================

import { redirect } from "next/navigation"
import { Ban } from "lucide-react"
import config from "@/config"
import { getUser } from "@/lib/supabase/server"
import { asegurarRolSuperAdmin } from "@/lib/roles"
import { signOut } from "@/lib/auth/actions"

export const metadata = { title: "Cuenta suspendida", robots: "noindex, nofollow" }

export default async function CuentaSuspendidaPage() {
  const user = await getUser()
  if (!user) redirect(config.auth.loginUrl)

  // Si ya no está suspendida (la reactivaron), no tiene nada que
  // hacer aquí.
  const info = await asegurarRolSuperAdmin(user)
  if (!info?.suspendido) redirect(config.auth.afterLoginUrl)

  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 px-4">
      <div className="w-full max-w-md rounded-2xl border border-error/30 bg-base-100 p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-xl bg-error/10 text-error">
          <Ban className="size-6" />
        </div>
        <h1 className="text-2xl font-bold">Cuenta suspendida</h1>
        <p className="mt-2 text-base-content/70">
          Un administrador suspendió el acceso de <strong>{user.email}</strong>. Si
          crees que es un error, contacta al equipo administrador de{" "}
          {config.app.institucion || config.app.name}.
        </p>
        <form action={signOut} className="mt-6">
          <button type="submit" className="btn btn-outline btn-sm">
            Cerrar sesión
          </button>
        </form>
      </div>
    </main>
  )
}
