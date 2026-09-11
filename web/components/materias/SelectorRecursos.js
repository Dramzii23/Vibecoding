"use client"

import { useRef, useState, useTransition } from "react"
import { FileText, Upload, X, Loader2 } from "lucide-react"
import { asignarRecursoASubtema, quitarRecursoDeSubtema } from "@/app/(app)/materias/[id]/actions"

const CREAR_NUEVA = "__subir_nuevo__"

// Sección "Recursos" del detalle de un subtema: lista los recursos
// ya asignados (con botón quitar) + selector para asignar uno
// existente del catálogo global (todosLosRecursos, ya cargado por
// page.js) + opción "Subir nuevo…" que sube el archivo vía
// POST /api/recursos y lo asigna automáticamente al terminar. Mismo
// espíritu que SelectorCatalogo.js (combobox + "+ Crear nueva…"),
// adaptado a que aquí el valor es una LISTA (recursos_ids), no un
// único id, y "crear" es subir un archivo en vez de escribir texto.
export default function SelectorRecursos({ subtemaId, recursosAsignados, todosLosRecursos, onCambiar }) {
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState(null)
  const [pending, startTransition] = useTransition()
  const inputRef = useRef(null)

  const idsAsignados = new Set(recursosAsignados.map((r) => r.id))
  const disponibles = todosLosRecursos.filter((r) => !idsAsignados.has(r.id))

  function handleSelectChange(e) {
    const valor = e.target.value
    if (!valor) return
    if (valor === CREAR_NUEVA) {
      inputRef.current?.click()
      e.target.value = ""
      return
    }
    startTransition(async () => {
      const resultado = await asignarRecursoASubtema(subtemaId, valor)
      if (!resultado?.error) onCambiar?.()
    })
    e.target.value = ""
  }

  async function handleArchivoElegido(e) {
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
      await asignarRecursoASubtema(subtemaId, data.recurso.id)
      onCambiar?.()
    } catch {
      setError("No pudimos conectar con el servidor.")
    } finally {
      setSubiendo(false)
    }
  }

  function quitar(recursoId) {
    startTransition(async () => {
      const resultado = await quitarRecursoDeSubtema(subtemaId, recursoId)
      if (!resultado?.error) onCambiar?.()
    })
  }

  return (
    <div className="space-y-2">
      {recursosAsignados.length > 0 && (
        <ul className="space-y-1.5">
          {recursosAsignados.map((r) => (
            <li key={r.id} className="flex items-center gap-2 rounded-lg border border-base-200 px-3 py-1.5 text-sm">
              <FileText className="size-4 shrink-0 text-base-content/50" />
              <span className="min-w-0 flex-1 truncate">{r.nombre}</span>
              <button
                type="button"
                onClick={() => quitar(r.id)}
                disabled={pending}
                className="btn btn-ghost btn-xs btn-square"
                aria-label={`Quitar ${r.nombre}`}
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <select
          onChange={handleSelectChange}
          disabled={subiendo}
          defaultValue=""
          className="select select-bordered select-sm flex-1"
        >
          <option value="" disabled>
            Asignar un recurso…
          </option>
          {disponibles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
          <option value={CREAR_NUEVA}>+ Subir nuevo…</option>
        </select>
        {subiendo && <Loader2 className="size-4 shrink-0 animate-spin text-base-content/50" />}
      </div>

      <input
        ref={inputRef}
        type="file"
        onChange={handleArchivoElegido}
        accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={subiendo}
        className="btn btn-ghost btn-xs gap-1"
      >
        <Upload className="size-3" />
        Subir nuevo recurso
      </button>

      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}
