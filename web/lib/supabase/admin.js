// ============================================================
// Supabase · cliente admin (service role)
// ------------------------------------------------------------
// SOLO SERVIDOR. Este cliente usa la SERVICE_ROLE_KEY, que se
// salta el RLS por completo. Nunca lo importes desde un
// componente cliente ni expongas la key con NEXT_PUBLIC_.
//
// Lo usa el panel /admin para leer la tabla `waitlist`
// (la migración 007 solo permite leerla con service role).
// ============================================================

import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      // No hay usuario: es una conexión de servidor con permisos totales.
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
