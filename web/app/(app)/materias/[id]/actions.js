"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// CRUD de subtemas (la sesión operable real, ver migración 010).
// subtemas no tiene user_id propio — hereda el dueño vía
// tema_id → unidad_id → materia_id, y RLS ya filtra por eso
// (policies "heredadas" de la migración 010). No hay un .eq
// adicional de defensa en profundidad posible sin un join extra
// aquí; nos apoyamos en RLS como única capa para estas tablas.

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")
  return { supabase, user }
}

export async function updateSubtema(formData) {
  const id = formData.get("id")?.toString()
  const nombre = formData.get("nombre")?.toString().trim()
  const fecha = formData.get("fecha")?.toString() || null
  const accion_docente = formData.get("accion_docente")?.toString().trim() || null
  const accion_alumno = formData.get("accion_alumno")?.toString().trim() || null
  const actividad_preasignada =
    formData.get("actividad_preasignada")?.toString().trim() || null
  const materiales_equipo =
    formData.get("materiales_equipo")?.toString().trim() || null
  if (!id || !nombre) return

  const { supabase } = await requireUser()
  await supabase
    .from("subtemas")
    .update({
      nombre,
      fecha,
      accion_docente,
      accion_alumno,
      actividad_preasignada,
      materiales_equipo,
    })
    .eq("id", id)
  revalidatePath("/materias")
}

export async function setEstatusSubtema(formData) {
  const id = formData.get("id")?.toString()
  const estatus = formData.get("estatus")?.toString()
  if (!id || !estatus) return

  const { supabase } = await requireUser()
  await supabase.from("subtemas").update({ estatus }).eq("id", id)
  revalidatePath("/materias")
}

export async function deleteSubtema(formData) {
  const id = formData.get("id")?.toString()
  if (!id) return

  const { supabase } = await requireUser()
  await supabase.from("subtemas").delete().eq("id", id)
  revalidatePath("/materias")
}

// Guarda el detalle completo desde la tarjeta expandida
// (SubtemaDetalle.js): catálogo (actividad_id, accion_*_id) +
// equipo + referencias. Recibe un objeto directo (no FormData):
// más simple para este shape que no tiene arrays anidados pero sí
// varios campos opcionales con valores `null` explícitos.
export async function guardarDetalleSubtema(id, campos) {
  if (!id) return { error: "Falta el id del subtema." }

  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("subtemas")
    .update({
      actividad_id: campos.actividad_id ?? null,
      accion_docente_id: campos.accion_docente_id ?? null,
      accion_alumno_id: campos.accion_alumno_id ?? null,
      materiales_equipo: campos.materiales_equipo ?? null,
      referencias: campos.referencias ?? null,
    })
    .eq("id", id)

  if (error) return { error: "No pudimos guardar los cambios." }
  revalidatePath("/materias")
  return { ok: true }
}

// Asigna/quita un recurso ya subido (catálogo global, ver
// migración 015) a/de un subtema — tabla puente subtema_recursos,
// N:N (un subtema puede tener varios recursos, un recurso puede
// usarse en varios subtemas). RLS de subtema_recursos ya valida
// dueño por ambos lados (recurso.user_id y subtema→...→materia.user_id).
export async function asignarRecursoASubtema(subtemaId, recursoId) {
  if (!subtemaId || !recursoId) return { error: "Faltan datos." }

  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("subtema_recursos")
    .insert({ subtema_id: subtemaId, recurso_id: recursoId })

  if (error) return { error: "No pudimos asignar el recurso." }
  revalidatePath("/materias")
  return { ok: true }
}

export async function quitarRecursoDeSubtema(subtemaId, recursoId) {
  if (!subtemaId || !recursoId) return { error: "Faltan datos." }

  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("subtema_recursos")
    .delete()
    .eq("subtema_id", subtemaId)
    .eq("recurso_id", recursoId)

  if (error) return { error: "No pudimos quitar el recurso." }
  revalidatePath("/materias")
  return { ok: true }
}

// Persiste el cambio de fecha al soltar una tarjeta en el tablero
// drag-and-drop (o de vuelta al backlog, fecha = null). Sin
// revalidatePath aquí a propósito: el tablero ya actualizó su
// estado local de forma optimista al soltar; un revalidatePath en
// cada drag forzaría un refetch completo del Server Component,
// deshaciendo el efecto optimista. Se resincroniza con el
// servidor en el siguiente load de página completo.
export async function moverSubtemaFecha(id, fecha) {
  if (!id) return { error: "Falta el id del subtema." }

  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("subtemas")
    .update({ fecha: fecha || null })
    .eq("id", id)

  if (error) return { error: "No pudimos mover la sesión." }
  return { ok: true }
}

// ============================================================
// CRUD de Unidades y Temas — edición directa desde el Horario
// interno de /materias/[id] (TableroSemana.js), fuera del wizard.
// RLS ya cubre insert/update/delete heredado vía materia_id/
// unidad_id (ver migración 010) — no hay .eq(user_id) adicional
// posible aquí sin un join extra; nos apoyamos en RLS como única
// capa, mismo patrón que el resto de este archivo.
// ============================================================

// Siguiente número libre de unidad para esta materia — no
// reutiliza huecos dejados por unidades borradas (unidades.numero
// solo necesita ser único, no consecutivo).
async function siguienteNumeroUnidad(supabase, materiaId) {
  const { data } = await supabase
    .from("unidades")
    .select("numero")
    .eq("materia_id", materiaId)
    .order("numero", { ascending: false })
    .limit(1)
  return (data?.[0]?.numero ?? 0) + 1
}

export async function crearUnidad(materiaId) {
  if (!materiaId) return { error: "Falta la materia." }

  const { supabase } = await requireUser()
  const numero = await siguienteNumeroUnidad(supabase, materiaId)

  const { data, error } = await supabase
    .from("unidades")
    .insert({
      materia_id: materiaId,
      numero,
      nombre: `Unidad ${numero}`,
      semana_inicio: 1,
      semana_fin: 1,
    })
    .select("id, numero, nombre, objetivo, semana_inicio, semana_fin")
    .single()

  if (error || !data) return { error: "No pudimos crear la unidad." }
  revalidatePath("/materias")
  return { ok: true, unidad: data }
}

export async function actualizarUnidad(formData) {
  const id = formData.get("id")?.toString()
  const nombre = formData.get("nombre")?.toString().trim()
  const objetivo = formData.get("objetivo")?.toString().trim() || null
  if (!id || !nombre) return { error: "El nombre de la unidad es obligatorio." }

  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("unidades")
    .update({ nombre, objetivo })
    .eq("id", id)

  if (error) return { error: "No pudimos guardar la unidad." }
  revalidatePath("/materias")
  return { ok: true }
}

// Borra la unidad y, por CASCADE (migración 010), todos sus temas y
// subtemas — irreversible, la UI debe confirmar antes de llamar
// esto.
export async function eliminarUnidad(id) {
  if (!id) return { error: "Falta el id de la unidad." }

  const { supabase } = await requireUser()
  const { data, error } = await supabase.from("unidades").delete().eq("id", id).select("id")

  if (error) return { error: "No pudimos eliminar la unidad." }
  if (!data?.length) return { error: "No se eliminó ninguna unidad — puede que ya no exista." }
  revalidatePath("/materias")
  return { ok: true }
}

export async function crearTema(unidadId) {
  if (!unidadId) return { error: "Falta la unidad." }

  const { supabase } = await requireUser()
  const { data: existentes } = await supabase
    .from("temas")
    .select("orden")
    .eq("unidad_id", unidadId)
    .order("orden", { ascending: false })
    .limit(1)
  const orden = (existentes?.[0]?.orden ?? -1) + 1

  const { data, error } = await supabase
    .from("temas")
    .insert({ unidad_id: unidadId, nombre: "Nuevo tema", orden })
    .select("id, nombre, horas_totales, materiales_equipo, orden, unidad_id")
    .single()

  if (error || !data) return { error: "No pudimos crear el tema." }
  revalidatePath("/materias")
  return { ok: true, tema: data }
}

export async function actualizarTema(formData) {
  const id = formData.get("id")?.toString()
  const nombre = formData.get("nombre")?.toString().trim()
  const horasRaw = formData.get("horas_totales")?.toString().trim()
  const materiales_equipo = formData.get("materiales_equipo")?.toString().trim() || null
  if (!id || !nombre) return { error: "El nombre del tema es obligatorio." }

  const { supabase } = await requireUser()
  const { error } = await supabase
    .from("temas")
    .update({
      nombre,
      horas_totales: horasRaw ? Number(horasRaw) : null,
      materiales_equipo,
    })
    .eq("id", id)

  if (error) return { error: "No pudimos guardar el tema." }
  revalidatePath("/materias")
  return { ok: true }
}

// Borra el tema y, por CASCADE, todos sus subtemas — irreversible,
// la UI debe confirmar antes de llamar esto.
export async function eliminarTema(id) {
  if (!id) return { error: "Falta el id del tema." }

  const { supabase } = await requireUser()
  const { data, error } = await supabase.from("temas").delete().eq("id", id).select("id")

  if (error) return { error: "No pudimos eliminar el tema." }
  if (!data?.length) return { error: "No se eliminó ningún tema — puede que ya no exista." }
  revalidatePath("/materias")
  return { ok: true }
}

// Arrastrar un tema completo a otra unidad: cambia unidad_id del
// tema y limpia la fecha de todos sus subtemas — la fecha asignada
// pertenecía al calendario de la unidad anterior, ya no aplica en
// la nueva; el docente las reasigna después desde el Horario. Sin
// revalidatePath (igual que moverSubtemaFecha): el tablero ya se
// actualiza de forma optimista al soltar.
export async function moverTemaAUnidad(temaId, unidadId) {
  if (!temaId || !unidadId) return { error: "Faltan datos para mover el tema." }

  const { supabase } = await requireUser()
  const { error: errorTema } = await supabase
    .from("temas")
    .update({ unidad_id: unidadId })
    .eq("id", temaId)

  if (errorTema) return { error: "No pudimos mover el tema." }

  const { error: errorSubtemas } = await supabase
    .from("subtemas")
    .update({ fecha: null })
    .eq("tema_id", temaId)

  if (errorSubtemas) {
    return { error: "El tema se movió, pero no pudimos limpiar las fechas de sus subtemas." }
  }
  return { ok: true }
}
