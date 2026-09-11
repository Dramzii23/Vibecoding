"use client"

import { useDroppable } from "@dnd-kit/core"
import { formatFechaCorta, formatRangoHora, esHoy } from "@/lib/fechas/semanaClase"

// Droppable: franja compacta de un día de clase (fecha real de la
// semana en curso). Ya no lista tarjetas dentro — los subtemas viven
// agrupados por unidad debajo (TableroSemana.js); esta columna solo
// es la zona donde soltar un chip de tema para asignarle esta fecha.
// El día de hoy siempre se resalta.
export default function ColumnaDia({ fechaISO, horaInicio, duracionSesionMinutos }) {
  const { setNodeRef, isOver } = useDroppable({ id: fechaISO })
  const rangoHora = formatRangoHora(horaInicio, duracionSesionMinutos)
  const esHoyColumna = esHoy(fechaISO)

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-1 flex-col gap-0.5 rounded-[10px] border p-2.5 ${
        isOver
          ? "border-primary bg-primary/5"
          : esHoyColumna
            ? "border-[1.5px] border-primary bg-[#e5edfc]"
            : "border-base-200 bg-base-100"
      }`}
    >
      <p className={`text-xs font-bold ${esHoyColumna ? "text-primary" : "text-base-content"}`}>
        {formatFechaCorta(fechaISO)}
      </p>
      {rangoHora && <p className="text-[10px] text-base-content/70">{rangoHora}</p>}
    </div>
  )
}
