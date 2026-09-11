"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"

// Envuelve un campo (textarea por defecto, o el children pasado)
// con un botón "Sugerir con IA" que llama al endpoint genérico de
// sugerencias y reemplaza el valor del campo con la respuesta —
// el docente la acepta tal cual (ya quedó en el campo) o sigue
// editando antes de guardar. Sin paso de aceptar/rechazar aparte,
// minimiza clicks.
export default function CampoConSugerenciaIA({
  label,
  subtemaId,
  campo,
  value,
  onChange,
  rows = 2,
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
        body: JSON.stringify({ campo, campoActual: value }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "No pudimos generar una sugerencia.")
        return
      }
      onChange(data.sugerencia)
    } catch {
      setError("No pudimos conectar con el servidor.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <button
          type="button"
          onClick={sugerir}
          disabled={loading}
          className="btn btn-ghost btn-xs gap-1"
          title="Sugerir con IA"
        >
          {loading ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Sparkles className="size-3" />
          )}
          Sugerir con IA
        </button>
      </div>
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        aria-label={label}
        className="textarea textarea-bordered textarea-sm w-full"
      />
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}
