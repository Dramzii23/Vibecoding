"use client"

import { useRef, useState, useTransition } from "react"
import { FileText, Upload, Download, X } from "lucide-react"
import { eliminarRecurso } from "@/app/(app)/catalogos/actions"

// Columna "Recursos" de /catalogos — mismo espíritu que
// GestionCatalogo.js (lista + crear + eliminar) pero adaptado a
// archivos: "crear" es subir vía POST /api/recursos, y cada entrada
// tiene un link de descarga con URL firmada (ya resuelta
// server-side en catalogos/page.js, pasada en `item.urlDescarga` —
// expira, por eso se resuelve en cada carga de página en vez de
// guardarse). `usoPorId` y el filtro por materia siguen el mismo
// patrón que las otras 3 columnas.
export default function CatalogoRecursos({ recursos, usoPorId, materias }) {
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState(null)
  const [materiaFiltro, setMateriaFiltro] = useState("")
  const [pending, startTransition] = useTransition()
  const inputRef = useRef(null)

  async function handleArchivo(e) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setSubiendo(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/recursos", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "No pudimos subir el archivo.")
        return
      }
      window.location.reload()
    } catch {
      setError("No pudimos conectar con el servidor.")
    } finally {
      setSubiendo(false)
    }
  }

  function eliminar(id) {
    startTransition(async () => {
      const formData = new FormData()
      formData.append("id", id)
      await eliminarRecurso(formData)
    })
  }

  const visibles = materiaFiltro
    ? recursos.filter((r) => usoPorId[r.id]?.materias.has(materiaFiltro))
    : recursos

  return (
    <div className="space-y-3 rounded-box border border-base-200 bg-base-100 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">
          Recursos
        </h2>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subiendo}
          className="btn btn-ghost btn-xs gap-1"
        >
          <Upload className="size-3" /> {subiendo ? "Subiendo…" : "Subir"}
        </button>
      </div>

      {materias.length > 0 && (
        <select
          value={materiaFiltro}
          onChange={(e) => setMateriaFiltro(e.target.value)}
          className="select select-bordered select-sm w-full"
          aria-label="Filtrar recursos por materia"
        >
          <option value="">Todas las materias</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
      )}

      <input
        ref={inputRef}
        type="file"
        onChange={handleArchivo}
        accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        className="hidden"
      />

      {error && <p className="text-xs text-error">{error}</p>}

      {!visibles.length && (
        <p className="text-sm text-base-content/50">Sin recursos todavía.</p>
      )}

      <ul className="space-y-2">
        {visibles.map((r) => (
          <li key={r.id} className="rounded-lg border border-base-200 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="size-4 shrink-0 text-base-content/50" />
                <p className="truncate text-sm font-medium">{r.nombre}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {r.urlDescarga && (
                  <a
                    href={r.urlDescarga}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-xs btn-square"
                    title="Descargar"
                    aria-label={`Descargar ${r.nombre}`}
                  >
                    <Download className="size-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => eliminar(r.id)}
                  disabled={pending}
                  className="btn btn-ghost btn-xs btn-square text-error"
                  title="Eliminar"
                  aria-label={`Eliminar ${r.nombre}`}
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
            {usoPorId[r.id]?.count > 0 && (
              <p className="mt-1 text-xs text-base-content/40">
                usado en {usoPorId[r.id].count} {usoPorId[r.id].count === 1 ? "sesión" : "sesiones"}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
