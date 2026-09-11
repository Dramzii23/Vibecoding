"use client"

import { useState, useTransition } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil, Trash2, Check, X } from "lucide-react"
import TarjetaTemaChip from "./TarjetaTemaChip"
import { actualizarTema } from "./actions"

// Encabezado de un tema (1.1, 1.2...) dentro de una unidad, con sus
// subtemas (chips) debajo — arrastrable como bloque completo hacia
// otra unidad (drop-zone: UnidadCard.js, id `unidad:<id>`). El
// GripVertical es el único "handle" de arrastre (listeners solo ahí)
// para no competir con el lápiz/basura ni con el drag de cada chip
// de subtema individual (TarjetaTemaChip ya es draggable por sí
// mismo, con su propio id sin prefijo).
export default function TemaBloque({ tema, numero, onAbrirSubtema, onEliminar, onActualizado }) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(tema.nombre || "")
  const [horas, setHoras] = useState(tema.horasTotales ?? "")
  const [pending, startTransition] = useTransition()
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tema:${tema.id}`,
  })
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.5 : 1 }

  function guardar() {
    if (!nombre.trim()) return
    const formData = new FormData()
    formData.set("id", tema.id)
    formData.set("nombre", nombre.trim())
    formData.set("horas_totales", horas)
    startTransition(async () => {
      const resultado = await actualizarTema(formData)
      if (!resultado?.error) {
        onActualizado(tema.id, { nombre: nombre.trim(), horasTotales: horas ? Number(horas) : null })
        setEditando(false)
      }
    })
  }

  function cancelar() {
    setNombre(tema.nombre || "")
    setHoras(tema.horasTotales ?? "")
    setEditando(false)
  }

  return (
    <div ref={setNodeRef} style={style} id={`tema-${tema.id}`} className="scroll-mt-4">
      {editando ? (
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre del tema"
            aria-label="Nombre del tema"
            className="input input-bordered input-xs w-48"
            autoFocus
          />
          <input
            type="number"
            min={0}
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
            placeholder="Hrs"
            aria-label="Horas totales del tema"
            className="input input-bordered input-xs w-16"
          />
          <button type="button" onClick={guardar} disabled={pending} className="btn btn-ghost btn-xs btn-square text-success" aria-label="Guardar tema">
            <Check className="size-3.5" />
          </button>
          <button type="button" onClick={cancelar} className="btn btn-ghost btn-xs btn-square text-error" aria-label="Cancelar edición">
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="mb-1.5 flex items-center gap-1.5">
          <button
            type="button"
            {...listeners}
            {...attributes}
            className="cursor-grab text-base-content/30 hover:text-base-content/60 active:cursor-grabbing"
            aria-label="Arrastrar tema a otra unidad"
          >
            <GripVertical className="size-3.5" />
          </button>
          <p className="text-xs font-semibold text-base-content/60">
            {numero} · {tema.nombre || "Tema sin nombre"}
            {tema.horasTotales != null && <span className="ml-1 font-normal text-base-content/40">({tema.horasTotales}h)</span>}
          </p>
          <button type="button" onClick={() => setEditando(true)} className="btn btn-ghost btn-xs btn-square" aria-label="Editar tema">
            <Pencil className="size-3" />
          </button>
          {confirmarBorrado ? (
            <span className="flex items-center gap-1 text-xs">
              <span className="text-error">¿Borrar tema y sus subtemas?</span>
              <button type="button" onClick={() => onEliminar(tema.id)} className="btn btn-error btn-xs">
                Sí
              </button>
              <button type="button" onClick={() => setConfirmarBorrado(false)} className="btn btn-ghost btn-xs">
                No
              </button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmarBorrado(true)} className="btn btn-ghost btn-xs btn-square text-error" aria-label="Eliminar tema">
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tema.subtemas.map((subtema, si) => (
          <TarjetaTemaChip
            key={subtema.id}
            subtema={subtema}
            numero={`${numero}.${si + 1}`}
            estado={subtema.estadoVisual}
            onAbrir={onAbrirSubtema}
          />
        ))}
        {!tema.subtemas.length && <p className="text-xs italic text-base-content/40">Sin subtemas todavía.</p>}
      </div>
    </div>
  )
}
