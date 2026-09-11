// ============================================================
// PDF · extracción de texto
// ------------------------------------------------------------
// Wrapper delgado sobre pdf-parse (v1.x: API simple, function(buffer),
// sin dependencias nativas — corre en Node runtime sin binarios
// externos). No uses la v2.x del paquete: reescribió la librería
// sobre pdfjs-dist + @napi-rs/canvas (binario nativo por plataforma),
// mal candidato para serverless.
//
// Importamos lib/pdf-parse.js directo (no el index.js del paquete):
// el index.js de la v1.1.1 trae un bloque de "modo debug" que se
// activa con `!module.parent` — con Webpack ese chequeo siempre da
// true dentro del bundle, y el bloque intenta leer un PDF de
// prueba que no existe en producción, tumbando el build. El
// archivo interno exporta la misma función sin ese bloque.
//
// Server-only. Requiere Node runtime (no Edge) — ningún Route
// Handler de este repo declara `export const runtime = "edge"`,
// así que esto funciona sin configuración extra, pero no le
// agregues ese export a la ruta que use este módulo.
// ============================================================

import pdfParse from "pdf-parse/lib/pdf-parse.js"

// Si el PDF es un escaneo sin capa de texto, pdf-parse devuelve
// texto vacío o casi vacío. Por debajo de este umbral lo tratamos
// como "no se pudo leer" en vez de mandar basura a la IA.
const MIN_TEXT_LENGTH = 200

// buffer: Buffer del PDF ya leído en memoria.
// Devuelve { text } o lanza Error con mensaje en español listo
// para mostrar al usuario.
export async function extractText(buffer) {
  let data
  try {
    data = await pdfParse(buffer)
  } catch {
    throw new Error(
      "No pudimos abrir este PDF. Asegúrate de que no esté dañado o protegido con contraseña."
    )
  }

  const text = (data.text ?? "").trim()
  if (text.length < MIN_TEXT_LENGTH) {
    throw new Error(
      "No pudimos leer texto de este PDF: parece ser un documento escaneado (imagen) sin texto seleccionable. Sube un PDF generado desde Word u otro editor de texto."
    )
  }

  return { text }
}
