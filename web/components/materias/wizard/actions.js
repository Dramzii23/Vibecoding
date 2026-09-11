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

// Fusiona lo que en v1 eran dos pasos (crearMateria +
// confirmarImportacion) en un solo Server Action: la materia no
// se crea a medias en BD durante el wizard (todo vive en memoria
// del cliente), así que aquí se hace TODO de una vez al final:
// materia → unidades (bulk) → temas → subtemas, en ese orden.
//
// Inserts secuenciales sin transacción real (supabase-js no
// expone transacciones multi-tabla): si algo falla a medio
// camino, se reporta cuánto se alcanzó a guardar en vez de fallar
// en silencio — mismo riesgo aceptado que v1, razonable para el
// volumen de un curso.
//
// Devuelve { ok: true, materiaId } o { error } — NO hace redirect()
// aquí (a diferencia de v1). Un redirect() lanzado dentro de una
// Server Action invocada vía useTransition en cliente puede no
// propagarse limpio (mismo bug real ya diagnosticado y corregido en
// materias/actions.js → eliminarMateria esta sesión). El caller
// (MateriaWizard.js) navega con router.push()/router.refresh() en
// el cliente tras confirmar éxito.
export async function confirmarMateriaCompleta(datosWizard) {
  const { supabase, user } = await requireUser()

  const {
    cartaId,
    nombre,
    horarioPorDia,
    duracionSesionMinutos,
    formatoSemestre,
    criteriosEvaluacion,
    unidades,
    temas,
    fechaInicioSemestre,
    fechaFinSemestre,
  } = datosWizard

  if (!nombre?.trim()) {
    return { error: "El nombre de la materia es obligatorio." }
  }
  if (!unidades?.length) {
    return { error: "Agrega al menos una unidad antes de continuar." }
  }

  const { data: materia, error: materiaError } = await supabase
    .from("materias")
    .insert({
      user_id: user.id,
      nombre: nombre.trim(),
      horario: Object.entries(horarioPorDia ?? {})
        .filter(([, hora]) => hora)
        .map(([dia, hora_inicio]) => ({ dia, hora_inicio })),
      duracion_sesion_minutos: duracionSesionMinutos || 120,
      formato_semestre: formatoSemestre || "semestral",
      criterios_evaluacion: criteriosEvaluacion ?? [],
      numero_unidades: unidades.length,
      estatus_config: "configurada",
      fecha_inicio_semestre: fechaInicioSemestre || null,
      fecha_fin_semestre: fechaFinSemestre || null,
    })
    .select("id")
    .single()

  if (materiaError || !materia) {
    return { error: "No pudimos crear la materia. Intenta de nuevo." }
  }

  const unidadesAInsertar = unidades.map((u) => ({
    materia_id: materia.id,
    numero: u.numero,
    nombre: u.nombre || null,
    objetivo: u.objetivo || null,
    semana_inicio: u.semanaInicio,
    semana_fin: u.semanaFin,
  }))

  const { data: unidadesCreadas, error: unidadesError } = await supabase
    .from("unidades")
    .insert(unidadesAInsertar)
    .select("id, numero")

  if (unidadesError || !unidadesCreadas) {
    return {
      error:
        "Creamos la materia pero no pudimos generar sus unidades. Contacta soporte.",
    }
  }

  const numeroAId = new Map(unidadesCreadas.map((u) => [u.numero, u.id]))

  let temasGuardados = 0
  for (const [temaIndex, tema] of (temas ?? []).entries()) {
    const unidadId = numeroAId.get(tema.unidad_numero)
    if (!unidadId) continue // el docente no resolvió la unidad de este tema; se omite.

    const { data: temaCreado, error: temaError } = await supabase
      .from("temas")
      .insert({
        unidad_id: unidadId,
        nombre: tema.nombre,
        horas_totales: tema.horas_totales ?? null,
        materiales_equipo: tema.materiales_equipo ?? null,
        orden: temaIndex,
      })
      .select("id")
      .single()

    if (temaError || !temaCreado) {
      return {
        error: `Se guardaron ${temasGuardados} de ${temas.length} temas. Falló al guardar "${tema.nombre}". Intenta de nuevo.`,
      }
    }

    if (tema.subtemas?.length) {
      const subtemasAInsertar = tema.subtemas.map((subtema, subtemaIndex) => ({
        tema_id: temaCreado.id,
        nombre: subtema.nombre,
        fecha: subtema.fecha || null,
        semana: subtema.semana_sugerida ?? null,
        accion_docente: subtema.accion_docente ?? null,
        accion_alumno: subtema.accion_alumno ?? null,
        actividad_preasignada: subtema.actividad_preasignada ?? null,
        materiales_equipo: subtema.materiales_equipo ?? null,
        estatus: "planeada",
        orden: subtemaIndex,
      }))

      const { error: subtemasError } = await supabase
        .from("subtemas")
        .insert(subtemasAInsertar)

      if (subtemasError) {
        return {
          error: `Se guardaron ${temasGuardados + 1} de ${temas.length} temas, pero fallaron los subtemas de "${tema.nombre}". Revisa el dashboard antes de reintentar.`,
        }
      }
    }

    temasGuardados += 1
  }

  if (cartaId) {
    await supabase
      .from("cartas_descriptivas")
      .update({ materia_id: materia.id, status: "importado" })
      .eq("id", cartaId)
      .eq("user_id", user.id)
  }

  revalidatePath("/materias")
  revalidatePath("/dashboard")
  return { ok: true, materiaId: materia.id }
}
