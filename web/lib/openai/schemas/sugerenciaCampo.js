// ============================================================
// Schema · sugerencia puntual de campo
// ------------------------------------------------------------
// Shape mínimo compartido por los 5 campos sugeribles de un
// subtema (actividad, acción docente, acción alumno, equipo,
// referencias) — ver web/app/api/subtemas/[id]/sugerir/route.js.
// Deliberadamente simple: reusa generateObject() sin modificarlo.
// ============================================================

import { z } from "zod"

export const sugerenciaCampoSchema = z.object({
  sugerencia: z
    .string()
    .describe("Texto sugerido para el campo solicitado, listo para usarse tal cual o editarse"),
})
