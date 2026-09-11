// ============================================================
// /superadmin · gestión de maestros y alumnos
// ------------------------------------------------------------
// Ruta fuera de los route groups (como /admin y /login): layout
// propio, sin sidebar de la app. Acceso: solo profiles.rol =
// 'super_admin' y no suspendido (ver lib/roles.js). Cualquier otro
// usuario autenticado ve un 404-ish "sin acceso"; sin sesión,
// redirige a login.
//
// Los datos se leen con el cliente admin (service role) para poder
// cruzar auth.users (último acceso) y contar materias/alumnos por
// maestro sin pelear con RLS.
// ============================================================

import Link from "next/link"
import { redirect } from "next/navigation"
import config from "@/config"
import { createAdminClient } from "@/lib/supabase/admin"
import { getUsuarioConRol, emailsSuperAdmin } from "@/lib/roles"
import PanelSuperAdmin from "./PanelSuperAdmin"

export const metadata = {
  title: "Super admin",
  robots: "noindex, nofollow",
}

export default async function SuperAdminPage() {
  const info = await getUsuarioConRol()

  if (!info) redirect(`${config.auth.loginUrl}?next=/superadmin`)
  if (info.suspendido) {
    return <SinAcceso titulo="Cuenta suspendida" mensaje="Tu cuenta está suspendida. Contacta al administrador." />
  }
  if (info.rol !== "super_admin") {
    return (
      <SinAcceso
        titulo="Sin acceso"
        mensaje="Esta sección es solo para el equipo administrador."
      />
    )
  }

  let error = null
  let maestros = []
  let alumnos = []

  try {
    const admin = createAdminClient()

    const [{ data: perfiles, error: e1 }, { data: mats, error: e2 }, { data: alus, error: e3 }, listaUsers] =
      await Promise.all([
        admin
          .from("profiles")
          .select("id, email, full_name, plan, rol, suspendido, created_at")
          .order("created_at", { ascending: false }),
        admin.from("materias").select("id, user_id"),
        admin
          .from("alumnos")
          .select("id, nombre, matricula, email, activo, maestro_id, materia_id, created_at")
          .order("created_at", { ascending: false }),
        admin.auth.admin.listUsers({ perPage: 1000 }),
      ])

    if (e1) throw new Error(e1.message)
    if (e2) throw new Error(e2.message)
    if (e3) throw new Error(e3.message)

    const materiasPorMaestro = new Map()
    for (const m of mats ?? []) {
      materiasPorMaestro.set(m.user_id, (materiasPorMaestro.get(m.user_id) ?? 0) + 1)
    }
    const alumnosPorMaestro = new Map()
    for (const a of alus ?? []) {
      alumnosPorMaestro.set(a.maestro_id, (alumnosPorMaestro.get(a.maestro_id) ?? 0) + 1)
    }
    const ultimoAccesoPorId = new Map()
    for (const u of listaUsers?.data?.users ?? []) {
      ultimoAccesoPorId.set(u.id, u.last_sign_in_at ?? null)
    }

    const emailsFijos = new Set(emailsSuperAdmin())

    maestros = (perfiles ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      nombre: p.full_name,
      plan: p.plan,
      rol: p.rol,
      suspendido: p.suspendido,
      creadoEn: p.created_at,
      materias: materiasPorMaestro.get(p.id) ?? 0,
      alumnos: alumnosPorMaestro.get(p.id) ?? 0,
      ultimoAcceso: ultimoAccesoPorId.get(p.id) ?? null,
      fijoPorEnv: p.email ? emailsFijos.has(p.email.toLowerCase()) : false,
    }))

    const nombrePorId = new Map(maestros.map((m) => [m.id, m.nombre || m.email]))
    alumnos = (alus ?? []).map((a) => ({
      id: a.id,
      nombre: a.nombre,
      matricula: a.matricula,
      email: a.email,
      activo: a.activo,
      creadoEn: a.created_at,
      maestro: nombrePorId.get(a.maestro_id) ?? "—",
    }))
  } catch (e) {
    error = e.message || "Error al conectar con Supabase."
  }

  return (
    <PanelSuperAdmin
      yoId={info.user.id}
      maestros={maestros}
      alumnos={alumnos}
      error={error}
    />
  )
}

function SinAcceso({ titulo, mensaje }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 px-4">
      <div className="w-full max-w-md rounded-2xl border border-base-300 bg-base-100 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <p className="mt-2 text-base-content/70">{mensaje}</p>
        <Link href="/dashboard" className="btn btn-primary btn-sm mt-6">
          Ir al dashboard
        </Link>
      </div>
    </main>
  )
}
