"use server"

import { createClient } from "@/lib/supabase/server"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")
  return { supabase, user }
}

// Persiste el nuevo horario de UN día de una materia al soltar su
// tarjeta en el Horario del dashboard (HorarioMaterias.js). Quita la
// entrada de `diaOrigen` (el día que se arrastró) y pone/reemplaza
// la de `diaDestino` con la nueva hora — así una tarjeta que se
// mueve de martes a jueves no deja duplicada la entrada de martes.
// Si `diaOrigen === diaDestino`, es solo un cambio de hora en el
// mismo día. Los demás días configurados de esa materia quedan
// intactos (permite ajustar un día suelto sin desarmar el patrón
// "mismo horario todos los días" de los demás).
//
// Sin revalidatePath a propósito: el Horario ya actualizó su estado
// local de forma optimista al soltar; revalidar en cada drag
// forzaría un refetch completo, deshaciendo el efecto optimista.
export async function moverHorarioMateria(materiaId, diaOrigen, diaDestino, horaInicio) {
  if (!materiaId || !diaDestino || !horaInicio) return { error: "Faltan datos para mover la materia." }

  const { supabase } = await requireUser()

  const { data: materia, error: fetchError } = await supabase
    .from("materias")
    .select("horario")
    .eq("id", materiaId)
    .single()

  if (fetchError || !materia) return { error: "No pudimos encontrar la materia." }

  const sinOrigen = (materia.horario ?? []).filter((h) => h.dia !== diaOrigen)
  const horarioNuevo = [...sinOrigen, { dia: diaDestino, hora_inicio: horaInicio }]

  const { error } = await supabase
    .from("materias")
    .update({ horario: horarioNuevo })
    .eq("id", materiaId)

  if (error) return { error: "No pudimos mover la materia." }
  return { ok: true }
}
