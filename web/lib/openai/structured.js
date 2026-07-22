// ============================================================
// OpenAI · structured outputs
// ------------------------------------------------------------
// generateObject() fuerza a OpenAI a devolver un objeto que
// cumple un schema de Zod. Internamente usa response_format con
// JSON Schema estricto, así que el resultado ya viene validado y
// parseado — no hay que hacer JSON.parse ni try/catch manual.
// ============================================================

import { zodResponseFormat } from "openai/helpers/zod"
import { openai } from "./client"
import config from "@/config"

// schema: ZodSchema · prompt: string · model: opcional (override)
// Devuelve el objeto ya validado contra `schema`.
export async function generateObject(schema, prompt, model = config.ai.structuredModel) {
  const completion = await openai.beta.chat.completions.parse({
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: zodResponseFormat(schema, "result"),
  })

  return completion.choices[0].message.parsed
}
