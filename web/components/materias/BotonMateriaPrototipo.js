"use client"

// TEMPORAL: botón para crear la materia de ejemplo "HTML, CSS y JS"
// completamente llena. Se retira (este archivo + su uso en
// materias/page.js + crearMateriaPrototipo en materias/actions.js)
// en cuanto se confirme que la materia quedó creada correctamente.
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Sparkles } from "lucide-react"
import { crearMateriaPrototipo } from "@/app/(app)/materias/actions"

export default function BotonMateriaPrototipo() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const resultado = await crearMateriaPrototipo()
      if (resultado?.error) {
        setError(resultado.error)
      } else if (resultado?.materiaId) {
        router.push(`/materias/${resultado.materiaId}`)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="btn btn-outline btn-sm gap-1"
      >
        <Sparkles className="size-4" />
        {pending ? "Creando…" : "Crear materia de ejemplo"}
      </button>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  )
}
