// ============================================================
// POST /api/recursos
// ------------------------------------------------------------
// Sube un archivo (PDF, PPTX, DOCX…) al catálogo global de
// Recursos del docente — mismo patrón que
// api/cartas-descriptivas/route.js (Buffer, randomUUID() en el
// path, upload a Storage), sin el paso de extracción/IA: aquí no
// hay interpretación, solo almacenamiento + registro.
//
// Node runtime obligatorio (default de este repo) — no hace falta
// declararlo explícito, pero tampoco se le pone `edge`.
// ============================================================

import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MAX_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB, igual que el límite del bucket (migración 015).

const EXT_POR_MIME = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "image/png": "png",
  "image/jpeg": "jpg",
}

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
    const nombre = formData.get("nombre")?.toString().trim()

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Sube un archivo." }, { status: 400 })
    }
    const ext = EXT_POR_MIME[file.type]
    if (!ext) {
      return NextResponse.json(
        { error: "Formato no soportado. Usa PDF, PPTX, DOCX, XLSX o una imagen." },
        { status: 400 }
      )
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "El archivo no debe pesar más de 25 MB." }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const storagePath = `${user.id}/${randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from("recursos")
      .upload(storagePath, buffer, { contentType: file.type })

    if (uploadError) {
      return NextResponse.json(
        { error: "No pudimos subir el archivo. Intenta de nuevo." },
        { status: 500 }
      )
    }

    const { data: recurso, error: insertError } = await supabase
      .from("recursos")
      .insert({
        user_id: user.id,
        nombre: nombre || file.name,
        storage_path: storagePath,
        nombre_archivo_original: file.name,
        mime_type: file.type,
        tamano_bytes: file.size,
      })
      .select("id, nombre, nombre_archivo_original, mime_type")
      .single()

    if (insertError || !recurso) {
      return NextResponse.json(
        { error: "No pudimos registrar el archivo. Intenta de nuevo." },
        { status: 500 }
      )
    }

    return NextResponse.json({ recurso })
  } catch {
    return NextResponse.json({ error: "Error procesando la solicitud." }, { status: 500 })
  }
}
