"use client"

import { useDroppable } from "@dnd-kit/core"
import { CalendarClock, Sparkles } from "lucide-react"
import SesionHoyContenido from "@/components/materias/SesionHoyContenido"

// Bloque destacado de la sesión de HOY dentro de /materias/[id]:
// tarjeta de SOLO LECTURA (diseño Figma) — para editar, la tarjeta
// (o el botón "Sugerir con IA") llaman `onAbrir` para abrir el mismo
// Dialog de edición que usa el Horario interno (estado compartido,
// ver MateriaContenido.js). Además es zona droppable (id: "hoy") —
// arrastrar un chip de tema aquí equivale a soltarlo en la columna
// de hoy de la franja de días: mismo handleDragEnd en el padre. Si
// no hay sesión programada para hoy, muestra un empty state que
// también acepta el drop. El contenido de solo lectura (meta + 5
// campos) vive en SesionHoyContenido.js, compartido con el acordeón
// del Dashboard (AcordeonSesionesHoy.js).
export default function SesionDeHoy({
  subtemaHoy,
  horaInicio,
  duracionSesionMinutos,
  actividades,
  accionesDocente,
  accionesAlumno,
  onAbrir,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "hoy" })

  if (!subtemaHoy) {
    return (
      <div className="rounded-box border border-base-300 bg-base-100 p-5">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Sesión de hoy</h2>
        </div>
        <div
          ref={setNodeRef}
          className={`flex flex-col items-center gap-3 rounded-lg border border-dashed px-4 py-8 text-center ${
            isOver ? "border-primary bg-primary/5" : "border-base-300"
          }`}
        >
          <p className="text-sm text-base-content/60">
            No tienes ninguna sesión programada para hoy.
          </p>
          <p className="text-xs text-base-content/40">
            Arrastra un tema aquí desde el Horario interno, o
          </p>
          <a href="#horario-materia" className="btn btn-primary btn-sm">
            Asignar en el Horario
          </a>
        </div>
      </div>
    )
  }

  return (
    <div ref={setNodeRef} className={`rounded-box border p-5 ${isOver ? "border-primary bg-primary/5" : "border-base-300 bg-base-100"}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Sesión de hoy</h2>
        <button
          type="button"
          onClick={() => onAbrir(subtemaHoy)}
          className="btn btn-sm gap-1.5 border-[#fe7618] text-[#f97316] hover:bg-[#fe7618]/10"
        >
          <Sparkles className="size-4" />
          Sugerir con IA
        </button>
      </div>

      <SesionHoyContenido
        subtema={subtemaHoy}
        horaInicio={horaInicio}
        duracionSesionMinutos={duracionSesionMinutos}
        actividades={actividades}
        accionesDocente={accionesDocente}
        accionesAlumno={accionesAlumno}
        onClickContenido={() => onAbrir(subtemaHoy)}
      />
    </div>
  )
}
