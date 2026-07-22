"use client"

import { useState } from "react"
import config from "@/config"
import { logoutAction } from "./actions"

// Fechas en formato local mexicano, ej. "21 jul 2026, 14:32"
const dateFmt = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export default function LeadsTable({ leads, error }) {
  const [search, setSearch] = useState("")

  const filtered = leads.filter((lead) =>
    [lead.email, lead.source]
      .some((v) => String(v || "").toLowerCase().includes(search.toLowerCase()))
  )

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const lastWeek = leads.filter(
    (l) => new Date(l.created_at).getTime() >= sevenDaysAgo
  ).length

  return (
    <div className="min-h-screen bg-base-200">
      <header className="sticky top-0 z-10 border-b border-base-300 bg-base-100 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Panel de administración</h1>
            <p className="text-sm text-base-content/60">{config.app.name}</p>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-ghost btn-sm">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {/* Resumen */}
        <div className="stats mb-8 w-full border border-base-300 bg-base-100 shadow-sm">
          <div className="stat">
            <div className="stat-title">Total de leads</div>
            <div className="stat-value">{leads.length}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Últimos 7 días</div>
            <div className="stat-value">{lastWeek}</div>
          </div>
        </div>

        {/* Error de conexión a Supabase */}
        {error && (
          <div className="mb-6 rounded-2xl border border-warning/40 bg-base-100 p-5">
            <p className="font-semibold">No se pudieron cargar los leads</p>
            <p className="mt-1 text-sm text-base-content/70">
              Verifica que las variables de Supabase estén configuradas en{" "}
              <code className="rounded bg-base-200 px-1">.env.local</code>{" "}
              (incluida <code className="rounded bg-base-200 px-1">SUPABASE_SERVICE_ROLE_KEY</code>).
            </p>
            <details className="mt-3">
              <summary className="cursor-pointer select-none text-xs text-base-content/50">
                Ver detalle técnico
              </summary>
              <code className="mt-2 block break-all rounded bg-base-200 p-3 text-xs">
                {error}
              </code>
            </details>
          </div>
        )}

        {!error && (
          <>
            {/* Buscador */}
            <div className="mb-4 flex items-center gap-3">
              <input
                type="text"
                placeholder="Buscar por email o fuente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-bordered input-sm w-72"
              />
              {search && (
                <span className="text-sm text-base-content/60">
                  {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Estado vacío */}
            {leads.length === 0 ? (
              <div className="rounded-2xl border border-base-300 bg-base-100 p-12 text-center">
                <p className="font-medium">Aún no hay leads</p>
                <p className="mt-1 text-sm text-base-content/60">
                  Cuando alguien se apunte al waitlist de la landing aparecerá aquí.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100">
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Fuente</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((lead) => (
                        <tr key={lead.id}>
                          <td>
                            <a href={`mailto:${lead.email}`} className="link link-primary">
                              {lead.email}
                            </a>
                          </td>
                          <td className="text-base-content/70">
                            {lead.source || <span className="text-base-content/30">—</span>}
                          </td>
                          <td className="whitespace-nowrap text-xs text-base-content/60">
                            {dateFmt.format(new Date(lead.created_at))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filtered.length === 0 && search && (
                  <p className="py-8 text-center text-sm text-base-content/40">
                    Sin resultados para &ldquo;{search}&rdquo;.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
