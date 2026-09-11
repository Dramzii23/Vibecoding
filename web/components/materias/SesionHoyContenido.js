"use client"

import { Target, User, UserPlus, Monitor, BookOpen } from "lucide-react"
import { formatFechaCorta, formatRangoHora } from "@/lib/fechas/semanaClase"

function minutosEntre(horaInicio, horaFin) {
  const [h1, m1] = horaInicio.split(":").map(Number)
  const [h2, m2] = horaFin.split(":").map(Number)
  return h2 * 60 + m2 - (h1 * 60 + m1)
}

// Una fila de solo lectura: ícono circular pastel + label + texto.
function Campo({ Icono, label, texto }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#e5edfc]">
        <Icono className="size-4 text-primary" />
      </span>
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-bold text-[#1f2d47]">{label}</p>
        <p className="text-sm text-base-content/80">{texto}</p>
      </div>
    </div>
  )
}

// Resuelve el nombre a mostrar para un campo con catálogo: si ya
// tiene _id, busca su .nombre en la lista de catálogo recibida; si
// no, cae al texto libre que la IA preasignó desde la carta
// descriptiva (mismo fallback que ya usa SubtemaDetalle.js).
function nombreCatalogo(lista, id, textoPreasignado) {
  if (id) return lista.find((item) => item.id === id)?.nombre ?? textoPreasignado
  return textoPreasignado || "Sin definir todavía."
}

// Contenido de solo lectura de una "Sesión de hoy": meta (fecha ·
// rango de hora · unidad/tema) + título del subtema + los 5 campos
// (Actividad, Acción docente, Acción alumno, Materiales,
// Referencias). Compartido entre materias/[id]/SesionDeHoy.js (una
// sola materia) y dashboard/AcordeonSesionesHoy.js (una fila por
// materia con clase hoy) — misma estructura visual en ambos lugares,
// sin duplicar. `onClickContenido` (opcional) hace clicable el
// bloque completo para abrir el Dialog de edición.
export default function SesionHoyContenido({
  subtema,
  horaInicio,
  horaFin,
  duracionSesionMinutos,
  actividades,
  accionesDocente,
  accionesAlumno,
  onClickContenido,
}) {
  const unidadLabel = subtema.unidad?.nombre || `Unidad ${subtema.unidad?.numero ?? "?"}`
  // Acepta el rango ya expandido ({horaInicio, horaFin} — como lo da
  // materiasConSesionHoy) o {horaInicio, duracionSesionMinutos}
  // (como lo da materias/[id]/page.js): formatRangoHora ya recibe
  // horaInicio + una duración en minutos, así que si viene horaFin
  // se deriva esa duración en vez de recalcular el formato aparte.
  const duracion = horaFin ? minutosEntre(horaInicio, horaFin) : duracionSesionMinutos
  const rangoHora = formatRangoHora(horaInicio, duracion)

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs font-medium text-base-content/60">
        <span>{formatFechaCorta(subtema.fecha)}</span>
        {rangoHora && <span>{rangoHora}</span>}
        <span>
          {unidadLabel} · <span className="font-bold">{subtema.temaNombre}</span>
        </span>
      </div>

      <button
        type="button"
        onClick={onClickContenido}
        className="block w-full space-y-4 rounded-lg text-left hover:bg-base-200/40"
      >
        <p className="text-base font-bold text-base-content">{subtema.nombre}</p>

        <Campo
          Icono={Target}
          label="Actividad"
          texto={nombreCatalogo(actividades, subtema.actividad_id, subtema.actividad_preasignada)}
        />
        <Campo
          Icono={User}
          label="Acción del docente"
          texto={nombreCatalogo(accionesDocente, subtema.accion_docente_id, subtema.accion_docente)}
        />
        <Campo
          Icono={UserPlus}
          label="Acción del alumno"
          texto={nombreCatalogo(accionesAlumno, subtema.accion_alumno_id, subtema.accion_alumno)}
        />
        <Campo
          Icono={Monitor}
          label="Materiales y equipo"
          texto={subtema.materiales_equipo || subtema.materialesTema || "Sin definir todavía."}
        />
        <Campo
          Icono={BookOpen}
          label="Referencias"
          texto={subtema.referencias || "Sin definir todavía."}
        />
      </button>
    </>
  )
}
