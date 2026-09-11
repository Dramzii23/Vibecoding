"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"

const ESTATUS_BADGE = {
  planeada: "badge-ghost",
  impartida: "badge-success",
  reprogramada: "badge-warning",
}

// Siempre draggable. Breadcrumb "Unidad 2 · Tema" + nombre + badges
// de actividad/acciones si ya están asignadas. Click (no drag) abre
// el Dialog de detalle — se distingue de un drag corto por
// activationConstraint en el sensor de TableroSemana.js, así que
// aquí el onClick normal basta.
export default function TarjetaSubtema({ subtema, onAbrir }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: subtema.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const unidadLabel = subtema.unidad?.nombre || `Unidad ${subtema.unidad?.numero ?? "?"}`

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onAbrir(subtema)}
      className="cursor-grab space-y-1 rounded-lg border border-base-200 bg-base-100 p-3 text-sm shadow-sm hover:border-primary active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-1">
        <p className="truncate text-xs text-base-content/50">
          {unidadLabel} · {subtema.temaNombre}
        </p>
        <GripVertical className="size-3.5 shrink-0 text-base-content/30" />
      </div>
      <p className="truncate font-medium">{subtema.nombre}</p>
      <div className="flex flex-wrap items-center gap-1">
        <span className={`badge badge-xs ${ESTATUS_BADGE[subtema.estatus] ?? "badge-ghost"}`}>
          {subtema.estatus}
        </span>
        {(subtema.actividad?.nombre || subtema.actividad_preasignada) && (
          <span className="badge badge-xs badge-outline">Actividad</span>
        )}
      </div>
    </div>
  )
}
