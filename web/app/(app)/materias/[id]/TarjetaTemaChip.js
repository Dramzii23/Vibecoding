"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { CheckCircle2, CircleDot, Circle, AlertCircle } from "lucide-react"

// Estilo por estado, calculado en TableroSemana.js a partir de
// subtema.estatus/fecha (ver mapeoEstadoTema allá) — mismo patrón de
// paleta-por-clave que ya usa lib/colorMateria.js.
const ESTILO_ESTADO = {
  impartido: {
    card: "bg-[#e8fcdd] border-[#dbf6cd]",
    numero: "text-[#55a72c]",
    texto: "text-[#55a72c]",
    Icono: CheckCircle2,
    icono: "text-[#55a72c]",
  },
  encurso: {
    card: "bg-[#e5edfc] border-primary",
    numero: "text-[#1f2d47]",
    texto: "text-primary font-semibold",
    Icono: CircleDot,
    icono: "text-primary",
  },
  alerta: {
    card: "bg-[#fdf3e4] border-[#f2d3a0]",
    numero: "text-[#e29d2e]",
    texto: "text-[#f59e0b]",
    Icono: AlertCircle,
    icono: "text-[#f59e0b]",
  },
  pendiente: {
    card: "bg-white border-base-200",
    numero: "text-[#1f2d47]",
    texto: "text-[#1f2d47]",
    Icono: Circle,
    icono: "text-base-content/30",
  },
}

// Chip de tema dentro de una unidad del Horario interno (look del
// Figma: número + nombre + ícono de estado, coloreado por estado).
// Siempre draggable (sin modo edición especial — el Figma no lo
// sugiere y complicaba la interacción) — se suelta sobre una
// columna de día (ColumnaDia.js) o sobre "Sesión de hoy" para
// asignar/reprogramar su fecha; el mismo handleDragEnd de
// TableroSemana.js lo procesa. distance:8 en el sensor evita que un
// click normal (abrir la tarjeta) se interprete como drag.
export default function TarjetaTemaChip({ subtema, numero, estado, onAbrir }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: subtema.id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const { card, numero: numeroClase, texto, Icono, icono } = ESTILO_ESTADO[estado] ?? ESTILO_ESTADO.pendiente

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onAbrir(subtema)}
      className={`flex h-[54px] w-full cursor-grab items-start justify-between gap-2 rounded-[10px] border-[1.5px] px-3 py-2.5 active:cursor-grabbing sm:w-[206px] ${card}`}
    >
      <div className="flex h-full min-w-0 items-start gap-2">
        <span className={`shrink-0 text-sm font-bold ${numeroClase}`}>{numero}</span>
        <p className={`line-clamp-2 text-xs leading-snug ${texto}`}>{subtema.nombre}</p>
      </div>
      <Icono className={`size-[18px] shrink-0 ${icono}`} />
    </div>
  )
}
