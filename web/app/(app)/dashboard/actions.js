"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

// CRUD de core_items vía Server Actions. La RLS de Supabase ya
// garantiza que cada quien solo toca sus filas; aun así filtramos
// por user_id como defensa en profundidad.

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")
  return { supabase, user }
}

export async function createItem(formData) {
  const title = formData.get("title")?.toString().trim()
  const description = formData.get("description")?.toString().trim() || null
  if (!title) return

  const { supabase, user } = await requireUser()
  await supabase.from("core_items").insert({
    user_id: user.id,
    title,
    description,
  })
  revalidatePath("/dashboard")
}

export async function toggleItem(formData) {
  const id = formData.get("id")?.toString()
  const status = formData.get("status")?.toString()
  if (!id) return

  const next = status === "done" ? "active" : "done"
  const { supabase, user } = await requireUser()
  await supabase
    .from("core_items")
    .update({ status: next })
    .eq("id", id)
    .eq("user_id", user.id)
  revalidatePath("/dashboard")
}

export async function deleteItem(formData) {
  const id = formData.get("id")?.toString()
  if (!id) return

  const { supabase, user } = await requireUser()
  await supabase
    .from("core_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
  revalidatePath("/dashboard")
}
