"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { DndContext, useDroppable, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { AlertTriangle, CalendarRange, Check, ChevronDown, LayoutList, Pencil, Settings2, X } from "lucide-react"
import TarjetaMateria from "./TarjetaMateria"
import { moverHorarioMateria } from "./actions"
import { expandirHorario, detectarTraslapes, sugerirHuecos } from "@/lib/fechas/horarioMateria"
import { formatRangoHora, NOMBRE_DIA } from "@/lib/fechas/semanaClase"

// Formatea "HH:MM" (24h) como "9:00 a. m." sin necesitar una
// duración — distinto de formatRangoHora, que siempre da un rango.
function formatHoraSimple(hora) {
  const [h, m] = hora.split(":").map(Number)
  return new Date(2000, 0, 1, h, m).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })
}

const HORAS_COMPLETAS = Array.from({ length: 14 }, (_, i) => 7 + i)
const DIAS_COLUMNA = [
  { value: "lunes" }, { value: "martes" }, { value: "miercoles" },
  { value: "jueves" }, { value: "viernes" },
]
const GRID_TEMPLATE_COLUMNS = "64px repeat(5, minmax(132px, 1fr))"
const ROW_H = 26 // debe coincidir con la altura de fila usada abajo

function Celda({ dia, hora, editable }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${dia}-${hora}`, disabled: !editable })
  return (
    <div
      ref={setNodeRef}
      className={`border-b border-r border-base-200 p-0.5 ${isOver ? "bg-primary/10" : ""}`}
      style={{ height: ROW_H }}
    />
  )
}

// Horario del dashboard: cuadrícula día×hora con TODAS las materias
// del docente (a diferencia del Horario dentro de una materia, que
// opera sobre fechas reales y subtemas de una sola). Cada entrada de
// horario (un día) de una materia es una tarjeta draggable
// independiente — soltarla en otra celda solo mueve ESE día.
export default function HorarioMaterias({ materias }) {
  const router = useRouter()
  const [lista, setLista] = useState(materias)
  const [aviso, setAviso] = useState(null) // { mensaje, sugerencias: [{dia,horaInicio}] }
  const [modoEdicion, setModoEdicion] = useState(false)
  const [vistaCompacta, setVistaCompacta] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Todas las entradas {materia, dia, horaInicio, horaFin} de todas
  // las materias, para posicionar tarjetas y detectar traslapes.
  const entradas = useMemo(
    () =>
      lista.flatMap((materia) =>
        expandirHorario(materia.horario, materia.duracion_sesion_minutos).map((e) => ({
          materia,
          ...e,
        }))
      ),
    [lista]
  )

  // Sin ninguna entrada VÁLIDA (día + hora), aunque horario tenga
  // filas con hora_inicio en null (ej. una materia migrada de un
  // horario previo sin hora capturada).
  const materiasConHorario = new Set(entradas.map((e) => e.materia.id))
  const sinHorario = lista.filter((m) => !materiasConHorario.has(m.id))
  const horasOcupadas = entradas.map((e) => Number(e.horaInicio.split(":")[0]))
  const desde = horasOcupadas.length ? Math.max(7, Math.min(...horasOcupadas) - 1) : 7
  const hasta = horasOcupadas.length ? Math.min(20, Math.max(...horasOcupadas) + 2) : 20
  const horas = vistaCompacta ? HORAS_COMPLETAS.filter((h) => h >= desde && h <= hasta) : HORAS_COMPLETAS

  const hoy = new Date()
  const indiceHoy = hoy.getDay()
  const fechas = DIAS_COLUMNA.map((dia, index) => {
    const fecha = new Date(hoy)
    const diferencia = (index + 1) - (indiceHoy === 0 ? 7 : indiceHoy)
    fecha.setDate(hoy.getDate() + diferencia)
    return { ...dia, numero: fecha.getDate(), activo: diferencia === 0 }
  })

  // Entradas que EMPIEZAN dentro del rango de horas visible, con su
  // altura en filas (redondeada al alza a la hora completa siguiente)
  // — así una materia de 2h ocupa visualmente 2 filas de la cuadrícula
  // en vez de solo la fila de su hora de inicio.
  function entradasParaColumna(dia) {
    if (!horas.length) return []
    const primeraHora = horas[0]
    const ultimaHora = horas[horas.length - 1]
    return entradas
      .filter((e) => e.dia === dia)
      .map((e) => {
        const [hInicio, mInicio] = e.horaInicio.split(":").map(Number)
        const [hFin, mFin] = e.horaFin.split(":").map(Number)
        if (hInicio < primeraHora || hInicio > ultimaHora) return null
        const minutosDuracion = (hFin * 60 + mFin) - (hInicio * 60 + mInicio)
        const filaInicio = (hInicio - primeraHora) + mInicio / 60
        const filasAltura = Math.max(minutosDuracion / 60, 1) // nunca menos de 1 fila completa
        return { entrada: e, top: filaInicio * ROW_H, height: filasAltura * ROW_H }
      })
      .filter(Boolean)
  }

  function handleDragEnd({ active, over }) {
    if (!modoEdicion || !over) return
    const [materiaId, diaOrigen] = active.id.split("::")
    const [diaDestino, horaDestino] = over.id.split("-")
    const horaInicio = `${String(horaDestino).padStart(2, "0")}:00`

    const materia = lista.find((m) => m.id === materiaId)
    if (!materia) return

    const horarioAnterior = materia.horario
    if (diaOrigen === diaDestino) {
      const entradaVieja = horarioAnterior.find((h) => h.dia === diaOrigen)
      if (entradaVieja?.hora_inicio === horaInicio) return // soltó en la misma celda
    }

    const sinOrigen = horarioAnterior.filter((h) => h.dia !== diaOrigen)
    const horarioNuevo = [...sinOrigen, { dia: diaDestino, hora_inicio: horaInicio }]

    // Optimista: actualiza estado local de inmediato.
    setLista((prev) => prev.map((m) => (m.id === materiaId ? { ...m, horario: horarioNuevo } : m)))

    // Detecta traslapes contra las demás materias (con el horario ya
    // actualizado localmente) y avisa sin bloquear.
    const otras = lista.filter((m) => m.id !== materiaId)
    const entradaMovida = { dia: diaDestino, horaInicio, horaFin: sumarDuracion(horaInicio, materia.duracion_sesion_minutos) }
    const choques = detectarTraslapes(entradaMovida, materiaId, otras)
    if (choques.length) {
      const ocupacion = otras.flatMap((m) => expandirHorario(m.horario, m.duracion_sesion_minutos))
      const sugerencias = sugerirHuecos(diaDestino, horaInicio, materia.duracion_sesion_minutos, ocupacion)
      setAviso({
        materiaId,
        diaOrigen,
        mensaje: `"${materia.nombre}" se cruza con ${choques.map((c) => `"${c.materia.nombre}"`).join(", ")} el ${NOMBRE_DIA[diaDestino]}.`,
        sugerencias,
      })
    }

    moverHorarioMateria(materiaId, diaOrigen, diaDestino, horaInicio).then((resultado) => {
      if (resultado?.error) {
        setLista((prev) => prev.map((m) => (m.id === materiaId ? { ...m, horario: horarioAnterior } : m)))
      }
    })
  }

  function aplicarSugerencia(sugerencia) {
    if (!aviso) return
    const { materiaId, diaOrigen } = aviso
    const materia = lista.find((m) => m.id === materiaId)
    if (!materia) return

    const sinOrigen = materia.horario.filter((h) => h.dia !== diaOrigen)
    const horarioNuevo = [...sinOrigen, { dia: sugerencia.dia, hora_inicio: sugerencia.horaInicio }]

    setLista((prev) => prev.map((m) => (m.id === materiaId ? { ...m, horario: horarioNuevo } : m)))
    setAviso(null)
    moverHorarioMateria(materiaId, diaOrigen, sugerencia.dia, sugerencia.horaInicio)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <CalendarRange className="size-5 text-primary" />
            <h2 className="text-xl font-bold">Horario</h2>
            {modoEdicion && <span className="badge badge-primary badge-sm">Editando</span>}
          </div>
          <p className="mt-1 text-sm text-base-content/55">Tus clases de lunes a viernes, organizadas por hora.</p>
        </div>
        <div className="dropdown dropdown-end">
          <button type="button" tabIndex={0} className="btn btn-sm btn-outline gap-2">
            <Settings2 className="size-4" /> Opciones <ChevronDown className="size-3.5" />
          </button>
          <ul tabIndex={0} className="menu dropdown-content z-30 mt-2 w-64 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
            <li><button type="button" onClick={() => setModoEdicion((v) => !v)}><Pencil className="size-4" />Editar horario{modoEdicion && <Check className="ml-auto size-4 text-success" />}</button></li>
            <li><button type="button" onClick={() => setVistaCompacta((v) => !v)}><LayoutList className="size-4" />Vista compacta{vistaCompacta && <Check className="ml-auto size-4 text-success" />}</button></li>
            <li><button type="button" onClick={() => router.push("/materias")}><CalendarRange className="size-4" />Administrar materias</button></li>
          </ul>
        </div>
      </div>

      {aviso && (
        <div className="flex flex-wrap items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning-content">
          <AlertTriangle className="size-4 shrink-0 translate-y-0.5" />
          <div className="flex-1 space-y-2">
            <p>{aviso.mensaje}</p>
            {aviso.sugerencias.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <span className="text-xs opacity-70">Horarios libres cercanos:</span>
                {aviso.sugerencias.map((s) => (
                  <button
                    key={`${s.dia}-${s.horaInicio}`}
                    type="button"
                    onClick={() => aplicarSugerencia(s)}
                    className="btn btn-xs btn-outline"
                  >
                    {NOMBRE_DIA[s.dia]} {formatHoraSimple(s.horaInicio)}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setAviso(null)}
            className="btn btn-ghost btn-xs btn-square"
            aria-label="Cerrar aviso"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="overflow-x-auto rounded-box border border-base-200 bg-base-100">
          <div className="min-w-[720px]">
            {/* Encabezado de días */}
            <div className="grid border-b border-base-200" style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}>
              <div />
              {fechas.map((d) => (
                <div key={d.value} className={`px-2 py-3 text-center ${d.activo ? "bg-primary text-primary-content" : "bg-base-200/60"}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide">{NOMBRE_DIA[d.value]}</p>
                  <p className="mt-0.5 text-lg font-bold tabular-nums">{d.numero}</p>
                </div>
              ))}
            </div>

            {/* Cuadrícula: celdas droppable (una fila por hora, para
                el drag-and-drop) + una capa por columna con las
                tarjetas posicionadas por su duración real, para que
                una materia de 2h ocupe visualmente 2 filas. */}
            <div className="relative grid" style={{ gridTemplateColumns: GRID_TEMPLATE_COLUMNS }}>
              {/* Columna de horas */}
              <div>
                {horas.map((hora) => (
                  <div
                    key={hora}
                    className="flex items-center justify-end border-r border-base-200 px-1.5 text-[10px] leading-none text-base-content/40"
                    style={{ height: ROW_H }}
                  >
                    {String(hora).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Columnas de día */}
              {fechas.map((d) => (
                <div key={d.value} className="relative">
                  {horas.map((hora) => (
                    <Celda key={hora} dia={d.value} hora={hora} editable={modoEdicion} />
                  ))}
                  <div className="pointer-events-none absolute inset-0 px-0.5">
                    {entradasParaColumna(d.value).map(({ entrada: e, top, height }) => (
                      <div
                        key={`${e.materia.id}-${e.dia}`}
                        className="pointer-events-auto absolute inset-x-0.5"
                        style={{ top, height }}
                      >
                        <TarjetaMateria
                          materia={e.materia}
                          rangoHora={formatRangoHora(e.horaInicio, e.materia.duracion_sesion_minutos)}
                          dragId={`${e.materia.id}::${e.dia}`}
                          onAbrir={(id) => router.push(`/materias/${id}`)}
                          onEditar={(id) => router.push(`/materias/${id}/editar`)}
                          modoEdicion={modoEdicion}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DndContext>

      {sinHorario.length > 0 && (
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">
            Sin horario asignado
          </p>
          <div className="flex flex-wrap gap-2">
            {sinHorario.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => router.push(`/materias/${m.id}`)}
                className="btn btn-sm btn-outline"
              >
                {m.nombre}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function sumarDuracion(horaInicio, minutos) {
  const [h, m] = horaInicio.split(":").map(Number)
  const total = h * 60 + m + (minutos ?? 120)
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}
