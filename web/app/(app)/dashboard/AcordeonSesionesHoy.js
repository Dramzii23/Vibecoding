"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ChevronDown, Sparkles, CalendarClock } from "lucide-react"
import Dialog from "@/components/ui/Dialog"
import SubtemaDetalle from "@/components/materias/SubtemaDetalle"
import SesionHoyContenido from "@/components/materias/SesionHoyContenido"
import { materiasConSesionHoy } from "@/lib/fechas/horarioMateria"

// "Sesión de hoy" del Dashboard general: una fila colapsable por
// cada materia que tiene clase HOY (según su horario semanal) Y
// tiene un subtema con fecha de hoy asignado — a diferencia de
// SesionDeHoy.js (una sola materia, ya resuelta), aquí primero hay
// que listar TODAS las que aplican. La fila cuya hora cubre el
// momento actual se expande por default (fondo azul claro); el
// profesor puede expandir/colapsar cualquiera libremente después —
// el auto-expand solo decide el estado inicial. `ahora` se resuelve
// en cliente (mismo patrón que DashboardHeader.js) para evitar
// mismatch de hidratación: el servidor no conoce la hora real del
// navegador.
export default function AcordeonSesionesHoy({
  materias,
  subtemasDeHoy,
  actividades,
  accionesDocente,
  accionesAlumno,
  recursos,
  onExpandirMateria,
}) {
  const router = useRouter()
  const [ahora, setAhora] = useState(null)
  const [expandidaId, setExpandidaId] = useState(null)
  const [subtemaAbierto, setSubtemaAbierto] = useState(null)
  const inicializadoRef = useRef(false)

  // Notifica al padre (DashboardSesionesHoy.js) cuál materia está
  // expandida — así "Progreso del curso" a la derecha puede mostrar
  // los datos de esa materia. Cualquier cambio de expandidaId
  // (auto-expand inicial o click manual del profesor) se propaga.
  function seleccionar(materiaId) {
    setExpandidaId(materiaId)
    onExpandirMateria?.(materiaId)
  }

  useEffect(() => {
    const actualizar = () => setAhora(new Date())
    actualizar()
    const timer = window.setInterval(actualizar, 30000)
    return () => window.clearInterval(timer)
  }, [])

  // Materias con horario para hoy, separadas en dos grupos: las que
  // ya tienen un subtema con fecha de hoy asignado (van al
  // acordeón) y las que no (horario configurado, pero nadie
  // arrastró un tema a la fecha de hoy en su Horario interno
  // todavía — se avisa en vez de desaparecer en silencio).
  const { filas, sinAsignar } = useMemo(() => {
    if (!ahora) return { filas: [], sinAsignar: [] }
    const conFilas = []
    const sinFilas = []
    for (const entrada of materiasConSesionHoy(ahora, materias ?? [])) {
      const subtema = (subtemasDeHoy ?? []).find((s) => s.materiaId === entrada.materia.id)
      if (subtema) conFilas.push({ ...entrada, subtema })
      else sinFilas.push(entrada)
    }
    return { filas: conFilas, sinAsignar: sinFilas }
  }, [ahora, materias, subtemasDeHoy])

  // Se inicializa una sola vez, cuando `ahora` ya está listo — no se
  // vuelve a forzar en renders posteriores, así el profesor puede
  // colapsar la fila en curso sin que se re-expanda sola.
  useEffect(() => {
    if (!ahora || inicializadoRef.current || !filas.length) return
    inicializadoRef.current = true
    seleccionar(filas.find((f) => f.enCurso)?.materia.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ahora, filas])

  if (!ahora || (!filas.length && !sinAsignar.length)) return null

  return (
    <div className="space-y-2.5">
      {sinAsignar.map((entrada) => (
        <div
          key={entrada.materia.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-box border border-dashed border-base-300 bg-base-100 p-4"
        >
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 shrink-0 text-base-content/40" />
            <p className="text-sm text-base-content/60">
              <span className="font-bold text-base-content">{entrada.materia.nombre}</span> tiene
              clase hoy, pero todavía no le asignas una sesión.
            </p>
          </div>
          <Link
            href={`/materias/${entrada.materia.id}#horario-materia`}
            className="btn btn-primary btn-sm shrink-0"
          >
            Asignar en el Horario
          </Link>
        </div>
      ))}
      {filas.map((fila) => {
        const abierta = expandidaId === fila.materia.id
        return (
          <div
            key={fila.materia.id}
            className={`rounded-box border p-4 ${abierta ? "border-primary/40 bg-primary/5" : "border-base-300 bg-base-100"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => seleccionar(abierta ? null : fila.materia.id)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <ChevronDown
                  className={`size-4 shrink-0 text-base-content/50 transition-transform ${abierta ? "" : "-rotate-90"}`}
                />
                <span className="truncate text-base font-bold">{fila.materia.nombre}</span>
              </button>
              <button
                type="button"
                onClick={() => setSubtemaAbierto(fila.subtema)}
                className="btn btn-sm shrink-0 gap-1.5 border-[#fe7618] text-[#f97316] hover:bg-[#fe7618]/10"
              >
                <Sparkles className="size-4" />
                Sugerir con IA
              </button>
            </div>

            {abierta && (
              <div className="mt-3 pl-6">
                <SesionHoyContenido
                  subtema={fila.subtema}
                  horaInicio={fila.horaInicio}
                  horaFin={fila.horaFin}
                  actividades={actividades}
                  accionesDocente={accionesDocente}
                  accionesAlumno={accionesAlumno}
                  onClickContenido={() => setSubtemaAbierto(fila.subtema)}
                />
              </div>
            )}
          </div>
        )
      })}

      <Dialog
        open={!!subtemaAbierto}
        onClose={() => setSubtemaAbierto(null)}
        title="Detalle de la sesión"
      >
        {subtemaAbierto && (
          <SubtemaDetalle
            subtema={subtemaAbierto}
            breadcrumb={`${subtemaAbierto.unidad?.nombre || `Unidad ${subtemaAbierto.unidad?.numero ?? "?"}`} · ${subtemaAbierto.temaNombre}`}
            actividades={actividades}
            accionesDocente={accionesDocente}
            accionesAlumno={accionesAlumno}
            recursos={recursos}
            onGuardado={() => {
              setSubtemaAbierto(null)
              router.refresh()
            }}
          />
        )}
      </Dialog>
    </div>
  )
}
