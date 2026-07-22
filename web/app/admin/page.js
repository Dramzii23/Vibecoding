// ============================================================
// Admin · panel de leads (waitlist)
// ------------------------------------------------------------
// Ruta fuera de los route groups (como /login): no usa el
// layout de marketing ni el de app. Tres estados:
//   1. Sin ADMIN_PASSWORD  → instrucciones de setup
//   2. Sin cookie válida   → formulario de login
//   3. Autenticado         → tabla de leads desde Supabase
// ============================================================

import { cookies } from "next/headers"
import config from "@/config"
import { createAdminClient } from "@/lib/supabase/admin"
import LoginForm from "./LoginForm"
import LeadsTable from "./LeadsTable"

export const metadata = {
  title: "Admin",
  robots: "noindex, nofollow", // que Google no indexe esta página
}

function makeToken(password) {
  return Buffer.from(password).toString("base64")
}

export default async function AdminPage() {
  // Sin contraseña configurada → instrucciones de setup
  if (!process.env.ADMIN_PASSWORD) {
    return <SetupInstructions />
  }

  // ¿Ya inició sesión? (revisar la cookie)
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  const isAuthenticated = token === makeToken(process.env.ADMIN_PASSWORD)

  if (!isAuthenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-base-200 px-4">
        <LoginForm />
      </main>
    )
  }

  // Cargar los leads desde la tabla waitlist (service role)
  let leads = []
  let error = null
  try {
    const supabase = createAdminClient()
    const { data, error: dbError } = await supabase
      .from("waitlist")
      .select("id, email, source, created_at")
      .order("created_at", { ascending: false })
    if (dbError) throw new Error(dbError.message)
    leads = data ?? []
  } catch (e) {
    error = e.message || "Error desconocido al conectar con Supabase."
  }

  return <LeadsTable leads={leads} error={error} />
}

// Lo que ve el alumno si no tiene ADMIN_PASSWORD en .env.local
function SetupInstructions() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-warning/40 bg-base-100 p-8 shadow-sm">
        <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-warning/10 text-warning">
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold">Panel no configurado</h1>
        <p className="mt-2 mb-6 text-base-content/70">
          Para activar este panel define una contraseña en tu archivo{" "}
          <code className="rounded bg-base-200 px-1.5 py-0.5 text-sm">.env.local</code>.
        </p>
        <ol className="space-y-4 text-sm">
          <li className="flex items-start gap-3">
            <span className="badge badge-primary badge-sm mt-0.5 shrink-0">1</span>
            <span>
              Abre <code className="rounded bg-base-200 px-1.5 py-0.5">web/.env.local</code>{" "}
              (créalo desde <code className="rounded bg-base-200 px-1.5 py-0.5">.env.example</code>{" "}
              si no existe).
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="badge badge-primary badge-sm mt-0.5 shrink-0">2</span>
            <span>
              Agrega esta línea (elige tu propia contraseña):
              <code className="mt-2 block rounded bg-base-200 px-3 py-2.5 font-mono">
                ADMIN_PASSWORD=micontrasena123
              </code>
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="badge badge-primary badge-sm mt-0.5 shrink-0">3</span>
            <span>
              Reinicia el servidor:{" "}
              <kbd className="kbd kbd-sm">Ctrl</kbd>+<kbd className="kbd kbd-sm">C</kbd> y luego{" "}
              <code className="rounded bg-base-200 px-1.5 py-0.5">yarn dev</code>.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="badge badge-primary badge-sm mt-0.5 shrink-0">4</span>
            <span>Recarga esta página.</span>
          </li>
        </ol>
      </div>
    </main>
  )
}
