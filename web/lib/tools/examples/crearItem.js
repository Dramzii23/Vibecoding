import { createClient } from "@/lib/supabase/server"

// Tool de ejemplo: crea un item en core_items del usuario autenticado.
// El alumno solo escribe execute(); el registry hace el resto.
export const crearItem = {
  name: "crear_item",
  description: "Crea un nuevo item en la lista del usuario autenticado.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "Título del item." },
      description: { type: "string", description: "Descripción opcional." },
    },
    required: ["title"],
    additionalProperties: false,
  },
  async execute({ title, description = null }) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    const { data, error } = await supabase
      .from("core_items")
      .insert({ user_id: user.id, title, description })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return { ok: true, item: data }
  },
}
