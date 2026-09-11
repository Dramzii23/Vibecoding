"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, CalendarClock, ListChecks, Plus } from "lucide-react"
import ColumnaDia from "./ColumnaDia"
import UnidadCard from "./UnidadCard"
import BacklogSubtemas from "./BacklogSubtemas"
import Dialog from "@/components/ui/Dialog"
import { fechasDeLaSemana, sumarSemanas, esHoy, fechaYaPaso } from "@/lib/fechas/semanaClase"

// Deriva el estado visual (color) de un chip de tema a partir de su
// estatus/fecha reales — ver "Mapeo de dato real → estatus visual"
// en el plan. No hay columna nueva en BD: todo sale de estatus+fecha.
function estadoDeTema(subtema) {
  if (subtema.estatus === "impartida") return "impartido"
  if (esHoy(subtema.fecha)) return "encurso"
  if (subtema.estatus === "planeada" && fechaYaPaso(subtema.fecha)) return "alerta"
  return "pendiente"
}

// Horario DENTRO de una materia: fechas reales de la semana en
// curso (según los días configurados de esta materia). Franja de
// días arriba (zona droppable) + unidades colapsables debajo con
// sus temas como chips coloreados por estado — arrastrar un chip a
// una columna de día (o a "Sesión de hoy") le asigna esa fecha. El
// DndContext y el estado de `subtemas` viven en el padre
// (MateriaContenido.js), compartidos con SesionDeHoy — este
// componente es "tonto" respecto a esos datos. Distinto del Horario
// del dashboard (HorarioMaterias.js), que muestra todas las
// materias del docente en una cuadrícula día×hora sin fechas de
// calendario.
export default function TableroSemana({
  diasClase,
  horaInicio,
  duracionSesionMinutos,
  subtemas,
  unidades,
  estructura,
  onAbrir,
  unidadesAbiertas,
  onToggleUnidad,
  onCrearUnidad,
  onEliminarUnidad,
  onCrearTema,
  onEliminarTema,
  onUnidadActualizada,
  onTemaActualizado,
}) {
  const [semanaRef, setSemanaRef] = useState(() => new Date())
  const [backlogAbierto, setBacklogAbierto] = useState(false)
  const [creandoUnidad, setCreandoUnidad] = useState(false)

  const columnas = fechasDeLaSemana(semanaRef, diasClase)

  // Combina las 3 fuentes que llegan por separado desde
  // MateriaContenido.js — `unidades` (id/nombre/objetivo reales de
  // BD, incluye unidades vacías sin ningún tema todavía) y
  // `estructura` (unidad→temas, sin subtemas) definen el árbol;
  // `subtemas` (plano, con temaId) solo aporta los chips de cada
  // tema. Antes esto se derivaba ÚNICAMENTE de `subtemas`, por lo que
  // una unidad recién creada sin temas no podía mostrarse, y cada
  // subtema se numeraba como si fuera un tema de nivel 2 — perdiendo
  // el nombre del tema padre real.
  const unidadesConTemas = useMemo(() => {
    const subtemasPorTema = new Map()
    for (const s of subtemas) {
      if (!subtemasPorTema.has(s.temaId)) subtemasPorTema.set(s.temaId, [])
      subtemasPorTema.get(s.temaId).push({ ...s, estadoVisual: estadoDeTema(s) })
    }
    const estructuraPorUnidad = new Map(estructura.map((u) => [u.unidadId, u.temas]))

    return unidades.map((unidad, i) => {
      const temas = (estructuraPorUnidad.get(unidad.id) ?? [])
        .slice()
        .sort((a, b) => a.orden - b.orden)
        .map((t, ti) => ({ ...t, numero: `${i + 1}.${ti + 1}`, subtemas: subtemasPorTema.get(t.id) ?? [] }))
      return { ...unidad, temas }
    })
  }, [unidades, estructura, subtemas])

  async function agregarUnidad() {
    setCreandoUnidad(true)
    await onCrearUnidad()
    setCreandoUnidad(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSemanaRef((d) => sumarSemanas(d, -1))}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-semibold text-base-content">
            Semana del {columnas[0]?.fechaISO ?? ""}
          </span>
          <button
            type="button"
            onClick={() => setSemanaRef((d) => sumarSemanas(d, 1))}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Semana siguiente"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setSemanaRef(new Date())}
            className="btn btn-ghost btn-sm gap-1.5"
          >
            <CalendarClock className="size-4" />
            Ir a hoy
          </button>
        </div>
        <button
          type="button"
          onClick={() => setBacklogAbierto(true)}
          className="btn btn-outline btn-primary btn-sm gap-1.5"
        >
          <ListChecks className="size-4" />
          Todos los temas
        </button>
      </div>

      {!columnas.length ? (
        <p className="rounded-box border border-dashed border-base-300 bg-base-100 px-4 py-8 text-center text-sm text-base-content/50">
          Esta materia no tiene días de clase configurados.
        </p>
      ) : (
        <div className="flex gap-2">
          {columnas.map((col) => (
            <ColumnaDia
              key={col.fechaISO}
              fechaISO={col.fechaISO}
              horaInicio={horaInicio}
              duracionSesionMinutos={duracionSesionMinutos}
            />
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        {unidadesConTemas.map((unidad) => (
          <UnidadCard
            key={unidad.id}
            unidad={unidad}
            temas={unidad.temas}
            abierta={unidadesAbiertas.has(unidad.id)}
            onToggle={onToggleUnidad}
            onAbrirSubtema={onAbrir}
            onCrearTema={onCrearTema}
            onEliminarTema={onEliminarTema}
            onTemaActualizado={onTemaActualizado}
            onEliminarUnidad={onEliminarUnidad}
            onUnidadActualizada={onUnidadActualizada}
          />
        ))}
        {!unidadesConTemas.length && (
          <p className="rounded-box border border-dashed border-base-300 bg-base-100 px-4 py-8 text-center text-sm text-base-content/50">
            Todavía no tienes unidades ni temas — importa tu carta descriptiva o agrega la primera unidad.
          </p>
        )}
        <button type="button" onClick={agregarUnidad} disabled={creandoUnidad} className="btn btn-outline btn-sm gap-1.5">
          <Plus className="size-4" /> {creandoUnidad ? "Creando…" : "Unidad"}
        </button>
      </div>

      <Dialog open={backlogAbierto} onClose={() => setBacklogAbierto(false)} title="Todos los temas">
        <BacklogSubtemas
          subtemas={subtemas}
          onAbrir={(s) => {
            setBacklogAbierto(false)
            onAbrir(s)
          }}
        />
      </Dialog>
    </div>
  )
}
