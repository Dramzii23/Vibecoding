"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")
  return { supabase, user }
}

// ------------------------------------------------------------
// Actividades
// ------------------------------------------------------------

export async function crearActividad(formData) {
  const nombre = formData.get("nombre")?.toString().trim()
  const descripcion = formData.get("descripcion")?.toString().trim() || null
  if (!nombre) return

  const { supabase, user } = await requireUser()
  await supabase.from("actividades").insert({ user_id: user.id, nombre, descripcion })
  revalidatePath("/catalogos")
}

export async function actualizarActividad(formData) {
  const id = formData.get("id")?.toString()
  const nombre = formData.get("nombre")?.toString().trim()
  const descripcion = formData.get("descripcion")?.toString().trim() || null
  if (!id || !nombre) return

  const { supabase, user } = await requireUser()
  await supabase
    .from("actividades")
    .update({ nombre, descripcion })
    .eq("id", id)
    .eq("user_id", user.id)
  revalidatePath("/catalogos")
}

export async function eliminarActividad(formData) {
  const id = formData.get("id")?.toString()
  if (!id) return

  const { supabase, user } = await requireUser()
  await supabase.from("actividades").delete().eq("id", id).eq("user_id", user.id)
  revalidatePath("/catalogos")
}

// ------------------------------------------------------------
// Acciones (docente/alumno) — misma tabla, campo `tipo`.
// ------------------------------------------------------------

export async function crearAccion(formData) {
  const tipo = formData.get("tipo")?.toString()
  const nombre = formData.get("nombre")?.toString().trim()
  if (!nombre || !["docente", "alumno"].includes(tipo)) return

  const { supabase, user } = await requireUser()
  await supabase.from("acciones").insert({ user_id: user.id, tipo, nombre })
  revalidatePath("/catalogos")
}

export async function actualizarAccion(formData) {
  const id = formData.get("id")?.toString()
  const nombre = formData.get("nombre")?.toString().trim()
  if (!id || !nombre) return

  const { supabase, user } = await requireUser()
  await supabase.from("acciones").update({ nombre }).eq("id", id).eq("user_id", user.id)
  revalidatePath("/catalogos")
}

export async function eliminarAccion(formData) {
  const id = formData.get("id")?.toString()
  if (!id) return

  const { supabase, user } = await requireUser()
  await supabase.from("acciones").delete().eq("id", id).eq("user_id", user.id)
  revalidatePath("/catalogos")
}

// ------------------------------------------------------------
// Recursos (archivos) — catálogo global, ver migración 015.
// ------------------------------------------------------------

export async function eliminarRecurso(formData) {
  const id = formData.get("id")?.toString()
  if (!id) return

  const { supabase, user } = await requireUser()
  const { data: recurso } = await supabase
    .from("recursos")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  await supabase.from("recursos").delete().eq("id", id).eq("user_id", user.id)
  if (recurso?.storage_path) {
    await supabase.storage.from("recursos").remove([recurso.storage_path])
  }
  revalidatePath("/catalogos")
  revalidatePath("/materias")
}

// ------------------------------------------------------------
// Variantes "crear rápido" para SelectorCatalogo.js — a diferencia
// de crearActividad/crearAccion arriba (pensadas para <form
// action={...}> con FormData y sin valor de retorno útil), estas
// reciben un objeto plano y devuelven la fila creada, para que el
// selector pueda elegirla de inmediato sin esperar un refetch.
// ------------------------------------------------------------

export async function crearActividadRapida({ nombre }) {
  if (!nombre?.trim()) return null
  const { supabase, user } = await requireUser()
  const { data } = await supabase
    .from("actividades")
    .insert({ user_id: user.id, nombre: nombre.trim() })
    .select("id, nombre, descripcion")
    .single()
  revalidatePath("/catalogos")
  return data ?? null
}

export async function crearAccionRapida({ nombre, tipo }) {
  if (!nombre?.trim() || !["docente", "alumno"].includes(tipo)) return null
  const { supabase, user } = await requireUser()
  const { data } = await supabase
    .from("acciones")
    .insert({ user_id: user.id, tipo, nombre: nombre.trim() })
    .select("id, nombre, tipo")
    .single()
  revalidatePath("/catalogos")
  return data ?? null
}
