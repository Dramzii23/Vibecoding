// ============================================================
// POST /api/subtemas/[id]/sugerir
// ------------------------------------------------------------
// Endpoint genérico para el botón "Sugerir con IA" de cada
// sección de la tarjeta expandida (actividad, acción docente,
// acción alumno, equipo, referencias). Un solo endpoint, no uno
// por campo: los 5 comparten contrato de entrada/salida, solo
// cambia la instrucción — ver buildSugerenciaPrompt (switch por
// campo).
//
// Body: { campo: "actividad"|"accion_docente"|"accion_alumno"|
//         "equipo"|"referencias", campoActual?: string }
// ============================================================

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateObject } from "@/lib/openai/structured"
import { sugerenciaCampoSchema } from "@/lib/openai/schemas/sugerenciaCampo"
import { buildSugerenciaPrompt } from "@/lib/openai/prompts/sugerenciaCampo"

const CAMPOS_VALIDOS = ["actividad", "accion_docente", "accion_alumno", "equipo", "referencias"]

export async function POST(request, { params }) {
  const { id: subtemaId } = await params

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 })
    }

    const { campo, campoActual } = await request.json()
    if (!CAMPOS_VALIDOS.includes(campo)) {
      return NextResponse.json({ error: "Campo inválido." }, { status: 400 })
    }

    // RLS ya filtra por dueño (subtemas hereda vía tema→unidad→
    // materia); este select además confirma que el subtema existe
    // y trae el contexto para el prompt.
    const { data: subtema, error: subtemaError } = await supabase
      .from("subtemas")
      .select(`nombre, temas ( nombre, unidades ( nombre, numero ) )`)
      .eq("id", subtemaId)
      .single()

    if (subtemaError || !subtema) {
      return NextResponse.json({ error: "Subtema no encontrado." }, { status: 404 })
    }

    const unidad = subtema.temas?.unidades
    const contexto = {
      subtemaNombre: subtema.nombre,
      temaNombre: subtema.temas?.nombre,
      unidadNombre: unidad?.nombre || (unidad?.numero ? `Unidad ${unidad.numero}` : null),
      campoActual: typeof campoActual === "string" ? campoActual : null,
    }

    const resultado = await generateObject(
      sugerenciaCampoSchema,
      buildSugerenciaPrompt(campo, contexto)
    )

    return NextResponse.json({ sugerencia: resultado.sugerencia })
  } catch {
    return NextResponse.json(
      { error: "No pudimos generar una sugerencia. Intenta de nuevo." },
      { status: 500 }
    )
  }
}
