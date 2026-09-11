// ============================================================
// OpenAI · content part de archivo PDF
// ------------------------------------------------------------
// Construye el content part `type: "file"` que Chat Completions
// acepta para mandar un PDF completo al modelo (con visión) en vez
// de solo texto extraído — usado por cartas-descriptivas/route.js
// para que la IA "vea" la tabla de la carta descriptiva tal como
// está en el documento (columnas, filas), en vez de interpretar
// texto plano donde esa estructura ya se perdió (ver
// lib/pdf/extractText.js: pdf-parse no preserva columnas).
//
// `file_data` inline (base64) en vez de subir a la Files API de
// OpenAI: el PDF se usa una sola vez para esta extracción, no hace
// falta persistirlo del lado de OpenAI — ya vive en nuestro propio
// Storage (bucket cartas-descriptivas).
// ============================================================

export function pdfComoContentPart(buffer, nombreArchivo) {
  return {
    type: "file",
    file: {
      filename: nombreArchivo || "carta-descriptiva.pdf",
      file_data: `data:application/pdf;base64,${buffer.toString("base64")}`,
    },
  }
}
