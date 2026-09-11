"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"
import SelectorCatalogo from "@/components/catalogos/SelectorCatalogo"

// Envuelve SelectorCatalogo con un botón "Sugerir con IA" — a
// diferencia de CampoConSugerenciaIA.js (que reemplaza directo el
// valor de un textarea), aquí el campo es un catálogo (select): la
// sugerencia de la IA es TEXTO, así que hay que crear/seleccionar
// una entrada de catálogo con ese nombre. `crearAction` es la misma
// función "rápida" que SelectorCatalogo.js ya usa para "+ Crear
// nueva…" (crearActividadRapida/crearAccionRapida en
// catalogos/actions.js) — se reusa en vez de duplicar esa lógica.
export default function SelectorConSugerenciaIA({
  items,
  value,
  onChange,
  crearAction,
  extraFields,
  subtemaId,
  campo,
  campoActual,
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function sugerir() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/subtemas/${subtemaId}/sugerir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campo, campoActual }),
      })
      let data
      try {
        data = await res.json()
      } catch {
        setError(`El servidor respondió algo inesperado (status ${res.status}).`)
        return
      }
      if (!res.ok) {
        setError(data.error ?? "No pudimos generar una sugerencia.")
        return
      }
      const creada = await crearAction({ nombre: data.sugerencia, ...extraFields })
      if (creada?.id) {
        onChange(creada.id)
      } else {
        setError("La IA sugirió un texto, pero no pudimos guardarlo en el catálogo.")
      }
    } catch (err) {
      setError(`No pudimos conectar con el servidor: ${err?.message || "error desconocido"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <SelectorCatalogo
        items={items}
        value={value}
        onChange={onChange}
        crearAction={crearAction}
        extraFields={extraFields}
      />
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={sugerir}
          disabled={loading}
          className="btn btn-ghost btn-xs gap-1"
          title="Sugerir con IA"
        >
          {loading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
          Sugerir con IA
        </button>
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}
