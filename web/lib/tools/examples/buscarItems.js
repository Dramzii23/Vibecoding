import { createClient } from "@/lib/supabase/server"

// Tool de ejemplo: busca items del usuario por coincidencia en el título.
export const buscarItems = {
  name: "buscar_items",
  description: "Busca items del usuario por coincidencia en el título.",
  parameters: {
    type: "object",
    properties: {
      query: { type: "string", description: "Texto a buscar en el título." },
    },
    required: ["query"],
    additionalProperties: false,
  },
  async execute({ query }) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("No autenticado")

    const { data, error } = await supabase
      .from("core_items")
      .select("id, title, description, status")
      .eq("user_id", user.id)
      .ilike("title", `%${query}%`)
    if (error) throw new Error(error.message)
    return { ok: true, items: data }
  },
}
