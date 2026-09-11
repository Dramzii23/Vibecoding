// ============================================================
// Prompt · sugerencia puntual de campo
// ------------------------------------------------------------
// Arma el prompt para un campo específico de un subtema. Un solo
// endpoint (POST /api/subtemas/[id]/sugerir) usa esto con un
// switch(campo) — los 5 campos comparten contrato de entrada/
// salida, solo cambia la instrucción.
// ============================================================

const INSTRUCCIONES = {
  actividad:
    "Sugiere una actividad concreta y breve que el docente puede asignar en esta sesión (ej. 'Debate en equipos sobre...', 'Práctica guiada de...'). Sé específico al tema, no genérico.",
  accion_docente:
    "Sugiere, en una frase corta, qué debería hacer el DOCENTE durante esta sesión (ej. 'Presenta el concepto con ejemplos visuales').",
  accion_alumno:
    "Sugiere, en una frase corta, qué debería hacer el ALUMNO durante esta sesión (ej. 'Resuelve el ejercicio en parejas y comparte resultados').",
  equipo:
    "Sugiere el equipo, materiales o software que probablemente se necesiten para esta sesión (ej. 'Proyector, laptop, plantillas impresas').",
  referencias:
    "Sugiere una o dos referencias bibliográficas o recursos (libro, artículo, sitio) plausibles para este tema. Si no puedes ser específico con fuentes reales, sugiere el TIPO de referencia a buscar en vez de inventar un título o autor falso.",
}

export function buildSugerenciaPrompt(campo, contexto) {
  const instruccion = INSTRUCCIONES[campo]
  if (!instruccion) {
    throw new Error(`Campo desconocido para sugerencia: "${campo}"`)
  }

  const { subtemaNombre, temaNombre, unidadNombre, campoActual } = contexto

  return `Eres un asistente que ayuda a un docente universitario a planear una
sesión de clase.

Contexto de la sesión:
- Unidad: ${unidadNombre || "sin especificar"}
- Tema: ${temaNombre || "sin especificar"}
- Sesión/subtema: ${subtemaNombre || "sin especificar"}
${campoActual ? `- Valor actual de este campo (referencia, puedes mejorarlo): "${campoActual}"` : ""}

${instruccion}

Responde solo con la sugerencia final, sin explicaciones adicionales, en
español, breve (1-2 frases como máximo salvo que el campo pida una lista
corta).`
}
