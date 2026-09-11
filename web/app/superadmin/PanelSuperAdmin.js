"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Ban,
  RotateCcw,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
} from "lucide-react"
import config from "@/config"
import { setSuspendido, setRol } from "./actions"

const fecha = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
})
const fechaHora = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function fmt(d, conHora = false) {
  if (!d) return "—"
  return (conHora ? fechaHora : fecha).format(new Date(d))
}

export default function PanelSuperAdmin({ yoId, maestros, alumnos, error }) {
  const [tab, setTab] = useState("maestros")

  const totales = useMemo(() => {
    const admins = maestros.filter((m) => m.rol === "super_admin").length
    const suspendidos = maestros.filter((m) => m.suspendido).length
    return {
      maestros: maestros.length,
      admins,
      suspendidos,
      alumnos: alumnos.length,
    }
  }, [maestros, alumnos])

  return (
    <div className="min-h-screen bg-base-200">
      <header className="sticky top-0 z-10 border-b border-base-300 bg-base-100 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold">
              <ShieldCheck className="size-5 text-primary" />
              Super admin
            </h1>
            <p className="text-sm text-base-content/60">{config.app.name}</p>
          </div>
          <Link href="/dashboard" className="btn btn-ghost btn-sm">
            Salir del panel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="stats mb-6 w-full border border-base-300 bg-base-100 shadow-sm">
          <div className="stat">
            <div className="stat-title">Maestros</div>
            <div className="stat-value text-2xl">{totales.maestros}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Super admins</div>
            <div className="stat-value text-2xl">{totales.admins}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Suspendidos</div>
            <div className="stat-value text-2xl">{totales.suspendidos}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Alumnos</div>
            <div className="stat-value text-2xl">{totales.alumnos}</div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-warning/40 bg-base-100 p-5 text-sm">
            <p className="font-semibold text-warning">No se pudieron cargar los datos</p>
            <p className="mt-1 text-base-content/70">{error}</p>
            <p className="mt-2 text-base-content/50">
              Revisa que <code className="rounded bg-base-200 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
              esté en tu <code className="rounded bg-base-200 px-1">.env.local</code> y que las
              migraciones 018 y 019 estén aplicadas.
            </p>
          </div>
        )}

        <div role="tablist" className="tabs-boxed tabs mb-4 w-fit">
          <button
            role="tab"
            className={`tab gap-2 ${tab === "maestros" ? "tab-active" : ""}`}
            onClick={() => setTab("maestros")}
          >
            <Users className="size-4" /> Maestros
          </button>
          <button
            role="tab"
            className={`tab gap-2 ${tab === "alumnos" ? "tab-active" : ""}`}
            onClick={() => setTab("alumnos")}
          >
            <GraduationCap className="size-4" /> Alumnos
          </button>
        </div>

        {tab === "maestros" ? (
          <TablaMaestros maestros={maestros} yoId={yoId} />
        ) : (
          <TablaAlumnos alumnos={alumnos} />
        )}
      </main>
    </div>
  )
}

function TablaMaestros({ maestros, yoId }) {
  const [q, setQ] = useState("")
  const filtrados = maestros.filter((m) =>
    [m.email, m.nombre].some((v) => String(v || "").toLowerCase().includes(q.toLowerCase()))
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100">
      <div className="flex items-center gap-2 border-b border-base-200 p-3">
        <Search className="size-4 text-base-content/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o email…"
          className="input input-sm input-ghost w-full max-w-xs"
          aria-label="Buscar maestro"
        />
        <span className="ml-auto text-xs text-base-content/50">
          {filtrados.length} de {maestros.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Maestro</th>
              <th>Rol</th>
              <th className="text-right">Materias</th>
              <th className="text-right">Alumnos</th>
              <th>Registro</th>
              <th>Último acceso</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((m) => (
              <FilaMaestro key={m.id} m={m} esYo={m.id === yoId} />
            ))}
            {!filtrados.length && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-base-content/50">
                  Sin maestros que coincidan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FilaMaestro({ m, esYo }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(null)

  function accion(fn, formData) {
    setError(null)
    startTransition(async () => {
      const r = await fn(formData)
      if (r?.error) setError(r.error)
    })
  }

  function fd(obj) {
    const f = new FormData()
    Object.entries(obj).forEach(([k, v]) => f.set(k, String(v)))
    return f
  }

  return (
    <tr className={m.suspendido ? "opacity-60" : ""}>
      <td>
        <div className="flex flex-col">
          <span className="font-medium">
            {m.nombre || "—"} {esYo && <span className="badge badge-ghost badge-xs">tú</span>}
          </span>
          <span className="text-xs text-base-content/50">{m.email}</span>
          {error && <span className="mt-1 text-xs text-error">{error}</span>}
        </div>
      </td>
      <td>
        <div className="flex flex-wrap items-center gap-1">
          <span
            className={`badge badge-sm ${m.rol === "super_admin" ? "badge-primary" : "badge-ghost"}`}
          >
            {m.rol === "super_admin" ? "super admin" : "maestro"}
          </span>
          {m.suspendido && <span className="badge badge-error badge-sm">suspendido</span>}
          {m.fijoPorEnv && (
            <span className="badge badge-outline badge-sm" title="Fijado en SUPER_ADMIN_EMAILS">
              env
            </span>
          )}
        </div>
      </td>
      <td className="text-right tabular-nums">{m.materias}</td>
      <td className="text-right tabular-nums">{m.alumnos}</td>
      <td className="text-xs text-base-content/60">{fmt(m.creadoEn)}</td>
      <td className="text-xs text-base-content/60">{fmt(m.ultimoAcceso, true)}</td>
      <td>
        <div className="flex justify-end gap-1">
          {m.rol === "super_admin" ? (
            <button
              type="button"
              disabled={pending || esYo}
              onClick={() => accion(setRol, fd({ id: m.id, rol: "maestro" }))}
              className="btn btn-ghost btn-xs gap-1"
              title={esYo ? "No puedes degradarte a ti mismo" : "Degradar a maestro"}
            >
              <ArrowDownCircle className="size-3.5" /> Degradar
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => accion(setRol, fd({ id: m.id, rol: "super_admin" }))}
              className="btn btn-ghost btn-xs gap-1"
              title="Promover a super admin"
            >
              <ArrowUpCircle className="size-3.5" /> Promover
            </button>
          )}
          {m.suspendido ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => accion(setSuspendido, fd({ id: m.id, suspendido: false }))}
              className="btn btn-ghost btn-xs gap-1 text-success"
            >
              <RotateCcw className="size-3.5" /> Reactivar
            </button>
          ) : (
            <button
              type="button"
              disabled={pending || esYo || m.rol === "super_admin"}
              onClick={() => accion(setSuspendido, fd({ id: m.id, suspendido: true }))}
              className="btn btn-ghost btn-xs gap-1 text-error"
              title={
                esYo
                  ? "No puedes suspenderte"
                  : m.rol === "super_admin"
                    ? "Degrada primero al super admin"
                    : "Suspender cuenta"
              }
            >
              <Ban className="size-3.5" /> Suspender
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

function TablaAlumnos({ alumnos }) {
  const [q, setQ] = useState("")
  const filtrados = alumnos.filter((a) =>
    [a.nombre, a.matricula, a.email, a.maestro].some((v) =>
      String(v || "").toLowerCase().includes(q.toLowerCase())
    )
  )

  return (
    <div className="overflow-hidden rounded-2xl border border-base-300 bg-base-100">
      <div className="flex items-center gap-2 border-b border-base-200 p-3">
        <Search className="size-4 text-base-content/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, matrícula o maestro…"
          className="input input-sm input-ghost w-full max-w-xs"
          aria-label="Buscar alumno"
        />
        <span className="ml-auto text-xs text-base-content/50">
          {filtrados.length} de {alumnos.length}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Matrícula</th>
              <th>Maestro</th>
              <th>Estado</th>
              <th>Registro</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((a) => (
              <tr key={a.id} className={a.activo ? "" : "opacity-60"}>
                <td>
                  <div className="flex flex-col">
                    <span className="font-medium">{a.nombre}</span>
                    {a.email && (
                      <span className="text-xs text-base-content/50">{a.email}</span>
                    )}
                  </div>
                </td>
                <td className="text-xs tabular-nums text-base-content/70">
                  {a.matricula || "—"}
                </td>
                <td className="text-xs text-base-content/70">{a.maestro}</td>
                <td>
                  <span className={`badge badge-sm ${a.activo ? "badge-ghost" : "badge-error"}`}>
                    {a.activo ? "activo" : "inactivo"}
                  </span>
                </td>
                <td className="text-xs text-base-content/60">{fmt(a.creadoEn)}</td>
              </tr>
            ))}
            {!filtrados.length && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-base-content/50">
                  {alumnos.length
                    ? "Sin alumnos que coincidan."
                    : "Todavía ningún maestro ha capturado alumnos."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
