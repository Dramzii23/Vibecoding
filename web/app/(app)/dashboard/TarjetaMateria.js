"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Pencil } from "lucide-react"
import { colorMateria } from "@/lib/colorMateria"

// Draggable: representa UNA entrada de horario (un día) de una
// materia en el Horario del dashboard. dragId es único por
// materia+día (ej. "materiaId::lunes") — cada día de una misma
// materia se arrastra independiente. onAbrir navega a /materias/[id].
export default function TarjetaMateria({ materia, rangoHora, dragId, onAbrir, onEditar, modoEdicion }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    disabled: !modoEdicion,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onAbrir(materia.id)}
      className={`group relative h-full overflow-hidden rounded-md border px-1.5 py-1 text-[11px] leading-tight transition-colors ${modoEdicion ? "cursor-grab pr-5 ring-1 ring-primary/20 active:cursor-grabbing" : "cursor-pointer"} ${colorMateria(materia.id)}`}
      title={materia.nombre}
    >
      <p className="truncate font-semibold">{materia.nombre}</p>
      {rangoHora && <p className="truncate text-[9px] opacity-70">{rangoHora}</p>}
      {modoEdicion && (
        <div className="absolute right-0.5 top-0.5 flex flex-col gap-0.5">
          <GripVertical className="size-3 opacity-50" />
          <button type="button" aria-label={`Editar ${materia.nombre}`} className="rounded p-0.5 transition-colors hover:bg-base-100" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onEditar(materia.id) }}>
            <Pencil className="size-2.5" />
          </button>
        </div>
      )}
    </div>
  )
}
