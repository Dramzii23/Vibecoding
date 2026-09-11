"use client"

import { useState } from "react"
import { FileUp, Loader2 } from "lucide-react"

// Paso 1: subir el PDF, sin haber configurado nada antes. La IA
// devuelve nombre_materia, numero_unidades_sugerido,
// criterios_evaluacion y temas/subtemas — el wizard usa todo eso
// para prellenar los pasos siguientes. "Omitir y capturar a mano"
// no bloquea al docente si no tiene el PDF a mano.
export default function PasoSubirPDF({ onExtraido, onOmitir }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/cartas-descriptivas", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "No pudimos procesar el PDF.")
        return
      }

      onExtraido(data)
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-box border border-base-200 bg-base-100 p-6"
    >
      <div>
        <h2 className="text-lg font-semibold">Sube tu carta descriptiva</h2>
        <p className="mt-1 text-sm text-base-content/60">
          La IA lee el PDF y prellena el nombre de tu materia, sus unidades,
          temas y subtemas. Revisas y ajustas todo en los siguientes pasos.
        </p>
      </div>

      <label
        htmlFor="carta-pdf"
        className="flex cursor-pointer flex-col items-center gap-2 rounded-box border-2 border-dashed border-base-300 px-6 py-10 text-center hover:border-primary"
      >
        <FileUp className="size-8 text-base-content/40" />
        <span className="text-sm font-medium">
          {file ? file.name : "Selecciona el PDF de tu carta descriptiva"}
        </span>
        <span className="text-xs text-base-content/50">PDF, hasta 15 MB</span>
        <input
          id="carta-pdf"
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="hidden"
        />
      </label>

      {error && (
        <div role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!file || loading}
        className="btn btn-primary w-full gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Leyendo tu carta descriptiva… esto puede tardar un minuto
          </>
        ) : (
          "Interpretar con IA"
        )}
      </button>

      <button
        type="button"
        onClick={onOmitir}
        disabled={loading}
        className="btn btn-ghost btn-sm w-full"
      >
        Omitir y capturar a mano
      </button>
    </form>
  )
}
