// ============================================================
// POST /api/cartas-descriptivas
// ------------------------------------------------------------
// Paso 1 del wizard: recibe el PDF de la carta descriptiva ANTES
// de que exista ninguna materia. Lo sube a Storage y le pide a la
// IA que proponga nombre de materia, unidades declaradas, criterios
// de evaluación, y la estructura de temas/subtemas. No escribe
// materias/unidades/temas/subtemas todavía — eso pasa hasta el
// Server Action final del wizard (confirmarMateriaCompleta, en
// materias/wizard/actions.js).
//
// EXTRACCIÓN EN 2 PASADAS (confirmado con pruebas reales — ver
// lib/openai/prompts/cartaDescriptiva.js): una sola llamada pidiendo
// TODOS los temas + TODOS los subtemas de un documento de varias
// páginas es no determinista (la misma llamada, mismo PDF, mismo
// modelo, dio 3, 33 y 18 subtemas en 3 intentos idénticos). Aquí:
// 1. Pasada 1 — una llamada corta que lista los temas grandes (sin
//    subtemas).
// 2. Pasada 2 — una llamada POR CADA TEMA (en paralelo), pidiendo
//    solo sus subtemas — cada llamada cubre un fragmento chico del
//    documento, así que no trunca.
// Los resultados se combinan al shape de siempre (mismo que usaba
// la versión de una sola pasada) para que el resto del wizard
// (MateriaWizard.js, PasoConfirmarTemas.js, confirmarMateriaCompleta)
// no necesite cambios.
//
// La IA lee el PDF COMPLETO (adjunto como content part de archivo,
// con visión) en cada llamada — texto plano (pdf-parse) pierde la
// estructura de columnas de la tabla real (Unidad | Temas |
// Actividades en paralelo). extractText() se conserva solo como
// validación barata previa (¿el PDF tiene texto seleccionable, o es
// un escaneo?) antes de gastar las llamadas de IA con archivo
// adjunto, más caras/lentas.
//
// Node runtime obligatorio (default de este repo — no le pongas
// `export const runtime = "edge"` a este archivo): pdf-parse no
// corre en Edge.
// ============================================================

import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { extractText } from "@/lib/pdf/extractText"
import { generateObject } from "@/lib/openai/structured"
import { pdfComoContentPart } from "@/lib/openai/pdfContentPart"
import { temasResumenSchema, subtemasDeTemaSchema } from "@/lib/openai/schemas/cartaDescriptiva"
import { buildTemasResumenPrompt, buildSubtemasDeTemaPrompt } from "@/lib/openai/prompts/cartaDescriptiva"
import config from "@/config"

const MAX_SIZE_BYTES = 15 * 1024 * 1024 // 15 MB, igual que el límite del bucket (migración 011).

export async function POST(request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")

    if (!(file instanceof File) || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Sube un archivo PDF." },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "El PDF no debe pesar más de 15 MB." },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const storagePath = `${user.id}/${randomUUID()}.pdf`

    const { error: uploadError } = await supabase.storage
      .from("cartas-descriptivas")
      .upload(storagePath, buffer, { contentType: "application/pdf" })

    if (uploadError) {
      return NextResponse.json(
        { error: "No pudimos subir el archivo. Intenta de nuevo." },
        { status: 500 }
      )
    }

    const { data: carta, error: insertError } = await supabase
      .from("cartas_descriptivas")
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        nombre_archivo_original: file.name,
        status: "subido",
      })
      .select("id")
      .single()

    if (insertError || !carta) {
      return NextResponse.json(
        { error: "No pudimos registrar el archivo. Intenta de nuevo." },
        { status: 500 }
      )
    }

    // Valida que el PDF tenga texto seleccionable (no sea un
    // escaneo) antes de gastar las llamadas de IA con archivo
    // adjunto — el texto extraído en sí ya NO se usa como input
    // de la IA (ver cabecera del archivo), solo esta validación.
    try {
      await extractText(buffer)
    } catch (err) {
      await supabase
        .from("cartas_descriptivas")
        .update({ status: "error", error_mensaje: err.message })
        .eq("id", carta.id)
      return NextResponse.json({ error: err.message }, { status: 422 })
    }

    await supabase
      .from("cartas_descriptivas")
      .update({ status: "extrayendo" })
      .eq("id", carta.id)

    const pdfPart = pdfComoContentPart(buffer, file.name)

    // Pasada 1: lista de temas grandes, sin subtemas.
    let resumen
    try {
      resumen = await generateObject(
        temasResumenSchema,
        [{ type: "text", text: buildTemasResumenPrompt() }, pdfPart],
        config.ai.pdfModel
      )
    } catch {
      await supabase
        .from("cartas_descriptivas")
        .update({
          status: "error",
          error_mensaje:
            "La IA no pudo interpretar el documento. Intenta de nuevo en unos minutos.",
        })
        .eq("id", carta.id)
      return NextResponse.json(
        { error: "La IA no pudo interpretar el documento. Intenta de nuevo en unos minutos." },
        { status: 500 }
      )
    }

    // Pasada 2: subtemas de cada tema, en paralelo. Un fallo en UN
    // tema no aborta los demás — ese tema queda sin subtemas y se
    // agrega una advertencia, en vez de perder toda la importación.
    const advertenciasSubtemas = []
    const temas = await Promise.all(
      resumen.temas.map(async (tema) => {
        if (tema.sin_subtemas_definidos) {
          return { ...tema, subtemas: [] }
        }
        try {
          const { subtemas } = await generateObject(
            subtemasDeTemaSchema,
            [{ type: "text", text: buildSubtemasDeTemaPrompt(tema.nombre) }, pdfPart],
            config.ai.pdfModel
          )
          return { ...tema, subtemas }
        } catch {
          advertenciasSubtemas.push(
            `No pudimos extraer los subtemas de "${tema.nombre}" — agrégalos a mano.`
          )
          return { ...tema, subtemas: [] }
        }
      })
    )

    const resultadoIA = {
      nombre_materia: resumen.nombre_materia,
      unidades_declaradas_carta: resumen.unidades_declaradas_carta,
      semana_entrega_final_detectada: resumen.semana_entrega_final_detectada,
      criterios_evaluacion: resumen.criterios_evaluacion,
      temas,
      advertencias: [...resumen.advertencias, ...advertenciasSubtemas],
    }

    await supabase
      .from("cartas_descriptivas")
      .update({ status: "extraido", resultado_ia: resultadoIA })
      .eq("id", carta.id)

    return NextResponse.json({
      cartaId: carta.id,
      resultado: resultadoIA,
    })
  } catch {
    return NextResponse.json(
      { error: "Error procesando la solicitud." },
      { status: 500 }
    )
  }
}
