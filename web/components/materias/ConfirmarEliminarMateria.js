"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import Dialog from "@/components/ui/Dialog"
import { eliminarMateria } from "@/app/(app)/materias/actions"

// No existe ningún precedente de confirmación en el repo (catálogos,
// subtemas, etc. se borran de un click) — pero borrar una materia es
// cascada sobre unidades/temas/subtemas, así que aquí sí se
// introduce un paso de confirmación, reusando el Dialog genérico.
//
// Llama a eliminarMateria directamente (useTransition) en vez de
// <form action={eliminarMateria}> — un <form> nativo ignora el valor
// de retorno de la Server Action, así que un error (RLS, fila ya
// borrada, etc.) pasaba desapercibido y el botón parecía "no hacer
// nada". Así el error real se muestra en el Dialog. La navegación
// tras borrar la hace router.push() en el cliente, NO redirect() en
// la Server Action (ver comentario en actions.js) — evita el crash
// que causaba lanzar NEXT_REDIRECT dentro de un useTransition.
export default function ConfirmarEliminarMateria({ materiaId, nombre, unidadesCount }) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [error, setError] = useState(null)
  const [pending, startTransition] = useTransition()

  function handleEliminar() {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set("id", materiaId)
      const resultado = await eliminarMateria(formData)
      if (resultado?.error) {
        setError(resultado.error)
      } else {
        setAbierto(false)
        router.push("/materias")
        router.refresh()
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          // Quita el foco del trigger para que el dropdown de DaisyUI
          // que pueda envolver este botón (ej. el menú ⋮ de
          // MateriaCard.js) se cierre visualmente al abrir el Dialog
          // — el propio Dialog ya no crashea gracias al portal, esto
          // solo evita que el menú se vea abierto detrás del modal.
          e.currentTarget.blur()
          setAbierto(true)
        }}
        className="btn btn-ghost btn-sm gap-1.5 text-error"
      >
        <Trash2 className="size-4" /> Eliminar
      </button>

      <Dialog open={abierto} onClose={() => setAbierto(false)} title="Eliminar materia">
        <div className="space-y-4">
          <p className="text-sm text-base-content/70">
            Esto borrará permanentemente <strong>{nombre}</strong>
            {unidadesCount > 0 && (
              <>
                {" "}
                junto con {unidadesCount} {unidadesCount === 1 ? "unidad" : "unidades"} y todos
                sus temas y subtemas
              </>
            )}
            . Esta acción no se puede deshacer.
          </p>
          {error && (
            <div role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setAbierto(false)}
              disabled={pending}
              className="btn btn-ghost btn-sm"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleEliminar}
              disabled={pending}
              className="btn btn-error btn-sm"
            >
              {pending ? "Eliminando…" : "Sí, eliminar"}
            </button>
          </div>
        </div>
      </Dialog>
    </>
  )
}
