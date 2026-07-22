// ============================================================
// Supabase · cliente de servidor
// ------------------------------------------------------------
// Úsalo en Server Components, Route Handlers y Server Actions.
// Lee/escribe las cookies de sesión vía next/headers.
//
// El bloque try/catch en setAll es necesario: desde un Server
// Component no se pueden escribir cookies (solo leer). El refresh
// de sesión lo hace el middleware, así que ahí el catch es inocuo.
// ============================================================

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Llamado desde un Server Component: ignorar.
            // El middleware ya se encarga de refrescar la sesión.
          }
        },
      },
    }
  )
}

// Helper: devuelve el usuario autenticado o null.
// Usa getUser() (valida el JWT contra Supabase), no getSession().
export async function getUser() {
  // Antes de configurar Supabase (Sem 2) no hay sesión posible.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
