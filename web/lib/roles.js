// ============================================================
// Roles · super_admin
// ------------------------------------------------------------
// SOLO SERVIDOR. Helpers para el panel /superadmin (gestión de
// maestros y alumnos). El eje de rol vive en profiles.rol
// ('maestro' | 'super_admin'), ver migración 018.
//
// Bootstrap: los emails en SUPER_ADMIN_EMAILS (coma-separados)
// reciben el rol al iniciar sesión — asegurarRolSuperAdmin() lo
// sincroniza. Así el primer admin siempre puede entrar sin tocar
// la BD, y quitar un email de la lista lo degrada en el siguiente
// login.
//
// Para LEER/ESCRIBIR perfiles ajenos usamos el cliente admin
// (service role), igual que /admin con la tabla waitlist — no
// dependemos de que el RLS de super_admin resuelva perfecto.
// ============================================================

import { createAdminClient } from "@/lib/supabase/admin"
import { getUser } from "@/lib/supabase/server"

export function emailsSuperAdmin() {
  return (process.env.SUPER_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

// Sincroniza el rol del usuario con la lista de env:
//  - email en la lista y rol != super_admin  → sube a super_admin
//  - email NO en la lista y rol == super_admin → baja a maestro
//    (solo si NO fue promovido manualmente; ver nota abajo)
//
// Nota: no distinguimos "promovido por env" de "promovido a mano"
// en la BD. Regla simple: la lista de env manda para las cuentas
// que aparecen en ella; a un admin promovido desde el panel se le
// quita el rol desde el panel, no por env. Para evitar degradar por
// error a admins-de-panel, SOLO degradamos si el email estuvo
// alguna vez en env — que no lo sabemos — así que degradamos
// únicamente cuando la lista de env NO está vacía y el email no
// está en ella. Si prefieres no auto-degradar nunca, deja
// SUPER_ADMIN_EMAILS vacío y gestiona todo desde el panel.
export async function asegurarRolSuperAdmin(user) {
  if (!user?.email) return null
  const lista = emailsSuperAdmin()
  const email = user.email.toLowerCase()

  let admin
  try {
    admin = createAdminClient()
  } catch {
    // Sin service role no podemos sincronizar; devolvemos lo que haya.
    return leerRol(user.id)
  }

  const { data: perfil } = await admin
    .from("profiles")
    .select("rol, suspendido")
    .eq("id", user.id)
    .single()

  const rolActual = perfil?.rol ?? "maestro"
  const enLista = lista.includes(email)

  if (enLista && rolActual !== "super_admin") {
    await admin.from("profiles").update({ rol: "super_admin", suspendido: false }).eq("id", user.id)
    return { rol: "super_admin", suspendido: false }
  }
  if (!enLista && lista.length > 0 && rolActual === "super_admin") {
    await admin.from("profiles").update({ rol: "maestro" }).eq("id", user.id)
    return { rol: "maestro", suspendido: perfil?.suspendido ?? false }
  }
  return { rol: rolActual, suspendido: perfil?.suspendido ?? false }
}

async function leerRol(userId) {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from("profiles")
      .select("rol, suspendido")
      .eq("id", userId)
      .single()
    return { rol: data?.rol ?? "maestro", suspendido: data?.suspendido ?? false }
  } catch {
    return { rol: "maestro", suspendido: false }
  }
}

// Devuelve { user, rol, suspendido } del usuario actual, o null si
// no hay sesión. Úsalo en el layout/páginas de /superadmin.
export async function getUsuarioConRol() {
  const user = await getUser()
  if (!user) return null
  const info = await asegurarRolSuperAdmin(user)
  return { user, rol: info?.rol ?? "maestro", suspendido: info?.suspendido ?? false }
}

export async function esSuperAdmin() {
  const info = await getUsuarioConRol()
  return info?.rol === "super_admin" && !info.suspendido
}
