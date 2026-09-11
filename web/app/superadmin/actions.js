"use server"

import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUsuarioConRol, emailsSuperAdmin } from "@/lib/roles"

// Todas estas acciones exigen sesión de super_admin activa. El
// panel corre server-side; usamos el cliente admin (service role)
// para escribir profiles ajenos — igual que /admin con waitlist.

async function requireSuperAdmin() {
  const info = await getUsuarioConRol()
  if (!info || info.rol !== "super_admin" || info.suspendido) {
    throw new Error("No autorizado.")
  }
  return info
}

// Suspende / reactiva la cuenta de un maestro. La app cierra la
// sesión de un usuario suspendido en el layout de /(app) y en el de
// /superadmin. No se puede suspender a un super_admin ni a uno
// mismo.
export async function setSuspendido(formData) {
  const actor = await requireSuperAdmin()
  const id = formData.get("id")?.toString()
  const suspendido = formData.get("suspendido")?.toString() === "true"
  if (!id) return { error: "Falta el id del usuario." }
  if (id === actor.user.id) return { error: "No puedes suspender tu propia cuenta." }

  const admin = createAdminClient()
  const { data: objetivo } = await admin
    .from("profiles")
    .select("rol")
    .eq("id", id)
    .single()
  if (objetivo?.rol === "super_admin") {
    return { error: "No puedes suspender a otro super admin. Primero cámbiale el rol." }
  }

  const { error } = await admin.from("profiles").update({ suspendido }).eq("id", id)
  if (error) return { error: "No se pudo actualizar la cuenta." }
  revalidatePath("/superadmin")
  return { ok: true }
}

// Promueve un maestro a super_admin o lo degrada a maestro. No se
// puede degradar a uno mismo (evita quedarte sin acceso), ni
// degradar a alguien que está fijo por SUPER_ADMIN_EMAILS (el env
// lo volvería a promover en el siguiente login — se avisa).
export async function setRol(formData) {
  const actor = await requireSuperAdmin()
  const id = formData.get("id")?.toString()
  const rol = formData.get("rol")?.toString()
  if (!id || !["maestro", "super_admin"].includes(rol)) {
    return { error: "Datos inválidos." }
  }
  if (id === actor.user.id && rol !== "super_admin") {
    return { error: "No puedes quitarte a ti mismo el rol de super admin." }
  }

  const admin = createAdminClient()
  const { data: objetivo } = await admin
    .from("profiles")
    .select("email")
    .eq("id", id)
    .single()
  if (
    rol === "maestro" &&
    objetivo?.email &&
    emailsSuperAdmin().includes(objetivo.email.toLowerCase())
  ) {
    return {
      error:
        "Ese email está fijado en SUPER_ADMIN_EMAILS: se volvería a promover al iniciar sesión. Quítalo de la variable de entorno primero.",
    }
  }

  const patch = rol === "super_admin" ? { rol, suspendido: false } : { rol }
  const { error } = await admin.from("profiles").update(patch).eq("id", id)
  if (error) return { error: "No se pudo cambiar el rol." }
  revalidatePath("/superadmin")
  return { ok: true }
}
