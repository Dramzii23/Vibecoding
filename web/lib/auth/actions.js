"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import config from "@/config"

// Cierra la sesión y manda al usuario a la home (o donde diga config).
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect(config.auth.afterLogoutUrl)
}
