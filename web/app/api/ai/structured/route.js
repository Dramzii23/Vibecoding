// ============================================================
// POST /api/ai/structured
// ------------------------------------------------------------
// Body:  { prompt: string, schemaName: string }
// Resp:  JSON con el objeto generado y validado contra el schema.
//        400 si falta el prompt o si schemaName es desconocido.
//
// Los schemas viven inline como demo (Fase 3). En tu producto los
// moverías a su propio módulo y los resolverías por nombre igual.
// ============================================================

import { NextResponse } from "next/server"
import { z } from "zod"
import { generateObject } from "@/lib/openai/structured"

// Registro de schemas disponibles, resueltos por `schemaName`.
const schemas = {
  // Extrae una tarea estructurada de texto libre.
  tarea: z.object({
    title: z.string().describe("Título corto de la tarea"),
    priority: z.enum(["baja", "media", "alta"]).describe("Prioridad"),
    dueDate: z.string().describe("Fecha límite en formato ISO (YYYY-MM-DD)"),
  }),
  // Extrae los datos de un contacto de un mensaje.
  contacto: z.object({
    name: z.string().describe("Nombre completo"),
    email: z.string().describe("Correo electrónico"),
    reason: z.string().describe("Motivo del contacto"),
  }),
}

export async function POST(request) {
  try {
    const { prompt, schemaName } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "prompt requerido." }, { status: 400 })
    }

    const schema = schemas[schemaName]
    if (!schema) {
      const disponibles = Object.keys(schemas).join(", ")
      return NextResponse.json(
        { error: `schemaName desconocido: "${schemaName}". Disponibles: ${disponibles}.` },
        { status: 400 }
      )
    }

    const parsed = await generateObject(schema, prompt)
    return NextResponse.json(parsed)
  } catch (err) {
    return NextResponse.json(
      { error: "Error procesando la solicitud." },
      { status: 500 }
    )
  }
}
