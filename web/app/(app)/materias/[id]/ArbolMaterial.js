"use client"

import { useState, useTransition } from "react"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Pencil,
  Trash2,
  Check,
  X,
  Plus,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  Circle,
} from "lucide-react"
import { esHoy, fechaYaPaso } from "@/lib/fechas/semanaClase"
import { actualizarUnidad, actualizarTema } from "./actions"

// Árbol Unidad → Tema, editable + arrastrable. Se renderiza en el
// SIDEBAR GLOBAL (app/(app)/SidebarArbolMateria.js), no dentro de la
// página — reemplaza al antiguo PanelNavegacion (drawer). Comparte
// estado y DndContext con el Horario interno (#horario-materia) vía
// MateriaTreeProvider (app/(app)/layout.js), así editar / crear /
// borrar / arrastrar aquí se refleja al instante en el tablero de la
// página y viceversa — una sola fuente de verdad, dos vistas.
//
// Los ids de drag/drop son EXACTAMENTE los del tablero grande
// (`tema:<id>` para arrastrar, `unidad:<id>` para soltar), así el
// handleDragEnd del provider no necesita distinguir desde dónde se
// arrastró: sidebar y tablero son zonas de drop simultáneas.

const ICONO_ESTADO = {
  impartido: { Icono: CheckCircle2, clase: "text-[#55a72c]" },
  encurso: { Icono: CircleDot, clase: "text-primary" },
  alerta: { Icono: AlertCircle, clase: "text-[#f59e0b]" },
  pendiente: { Icono: Circle, clase: "text-base-content/30" },
}

function estadoDeSubtema(subtema) {
  if (subtema.estatus === "impartida") return "impartido"
  if (esHoy(subtema.fecha)) return "encurso"
  if (subtema.estatus === "planeada" && fechaYaPaso(subtema.fecha)) return "alerta"
  return "pendiente"
}

const PRIORIDAD_ESTADO = { alerta: 0, encurso: 1, pendiente: 2, impartido: 3 }
function estadoDelTema(subtemas) {
  return (
    subtemas
      .map(estadoDeSubtema)
      .sort((a, b) => PRIORIDAD_ESTADO[a] - PRIORIDAD_ESTADO[b])[0] ?? "pendiente"
  )
}

export default function ArbolMaterial({
  unidades,
  estructura,
  subtemas,
  unidadesAbiertas,
  onToggleUnidad,
  onIrATema,
  onCrearUnidad,
  onEliminarUnidad,
  onCrearTema,
  onEliminarTema,
  onUnidadActualizada,
  onTemaActualizado,
}) {
  const [creandoUnidad, setCreandoUnidad] = useState(false)

  // subtemas por tema (para el ícono de estado + número de subtemas)
  const subtemasPorTema = new Map()
  for (const s of subtemas) {
    if (!subtemasPorTema.has(s.temaId)) subtemasPorTema.set(s.temaId, [])
    subtemasPorTema.get(s.temaId).push(s)
  }
  const temasPorUnidad = new Map(estructura.map((u) => [u.unidadId, u.temas]))

  async function agregarUnidad() {
    setCreandoUnidad(true)
    await onCrearUnidad()
    setCreandoUnidad(false)
  }

  return (
    <div className="space-y-1.5">
      <p className="px-1 pb-1 text-xs font-bold uppercase tracking-wide text-base-content/50">
        Unidades y temas
      </p>

      {unidades.map((unidad, i) => (
        <NodoUnidad
          key={unidad.id}
          unidad={unidad}
          numeroBase={i + 1}
          temas={(temasPorUnidad.get(unidad.id) ?? [])
            .slice()
            .sort((a, b) => a.orden - b.orden)}
          subtemasPorTema={subtemasPorTema}
          abierta={unidadesAbiertas.has(unidad.id)}
          onToggle={onToggleUnidad}
          onIrATema={onIrATema}
          onCrearTema={onCrearTema}
          onEliminarTema={onEliminarTema}
          onEliminarUnidad={onEliminarUnidad}
          onUnidadActualizada={onUnidadActualizada}
          onTemaActualizado={onTemaActualizado}
        />
      ))}

      {!unidades.length && (
        <p className="px-1 py-2 text-xs text-base-content/40">
          Sin unidades todavía.
        </p>
      )}

      <button
        type="button"
        onClick={agregarUnidad}
        disabled={creandoUnidad}
        className="btn btn-ghost btn-xs mt-1 w-full justify-start gap-1.5 text-base-content/60"
      >
        <Plus className="size-3.5" /> {creandoUnidad ? "Creando…" : "Nueva unidad"}
      </button>
    </div>
  )
}

function NodoUnidad({
  unidad,
  numeroBase,
  temas,
  subtemasPorTema,
  abierta,
  onToggle,
  onIrATema,
  onCrearTema,
  onEliminarTema,
  onEliminarUnidad,
  onUnidadActualizada,
  onTemaActualizado,
}) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(unidad.nombre || "")
  const [objetivo, setObjetivo] = useState(unidad.objetivo || "")
  const [pending, startTransition] = useTransition()
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)
  const [creandoTema, setCreandoTema] = useState(false)

  const { setNodeRef, isOver } = useDroppable({ id: `unidad:${unidad.id}` })

  function guardar() {
    if (!nombre.trim()) return
    const formData = new FormData()
    formData.set("id", unidad.id)
    formData.set("nombre", nombre.trim())
    formData.set("objetivo", objetivo)
    startTransition(async () => {
      const resultado = await actualizarUnidad(formData)
      if (!resultado?.error) {
        onUnidadActualizada(unidad.id, {
          nombre: nombre.trim(),
          objetivo: objetivo.trim() || null,
        })
        setEditando(false)
      }
    })
  }

  function cancelar() {
    setNombre(unidad.nombre || "")
    setObjetivo(unidad.objetivo || "")
    setEditando(false)
  }

  async function agregarTema() {
    setCreandoTema(true)
    await onCrearTema(unidad.id)
    setCreandoTema(false)
  }

  return (
    <div
      ref={setNodeRef}
      className={`rounded-md border ${isOver ? "border-primary bg-primary/5" : "border-transparent"}`}
    >
      {editando ? (
        <div className="space-y-1 p-1">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={`Unidad ${unidad.numero}`}
            aria-label={`Nombre de unidad ${unidad.numero}`}
            className="input input-bordered input-xs w-full"
            autoFocus
          />
          <input
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            placeholder="Objetivo (opcional)"
            aria-label={`Objetivo de unidad ${unidad.numero}`}
            className="input input-bordered input-xs w-full"
          />
          <div className="flex gap-1">
            <button
              type="button"
              onClick={guardar}
              disabled={pending}
              className="btn btn-primary btn-xs flex-1 gap-1"
            >
              <Check className="size-3" /> Guardar
            </button>
            <button type="button" onClick={cancelar} className="btn btn-ghost btn-xs gap-1">
              <X className="size-3" />
            </button>
          </div>
        </div>
      ) : (
        <div className="group flex items-center gap-1 rounded-md px-1 py-1 hover:bg-base-200">
          <button
            type="button"
            onClick={() => onToggle(unidad.id)}
            className="flex min-w-0 flex-1 items-center gap-1 text-left"
          >
            <ChevronDown
              className={`size-3.5 shrink-0 text-base-content/40 transition-transform ${abierta ? "" : "-rotate-90"}`}
            />
            <span className="min-w-0 truncate text-xs font-semibold">
              {unidad.numero}. {unidad.nombre}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="btn btn-ghost btn-xs btn-square shrink-0 opacity-0 group-hover:opacity-100"
            aria-label="Editar unidad"
          >
            <Pencil className="size-3" />
          </button>
          {confirmarBorrado ? (
            <span className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => onEliminarUnidad(unidad.id)}
                className="btn btn-error btn-xs"
              >
                Borrar
              </button>
              <button
                type="button"
                onClick={() => setConfirmarBorrado(false)}
                className="btn btn-ghost btn-xs btn-square"
                aria-label="Cancelar"
              >
                <X className="size-3" />
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmarBorrado(true)}
              className="btn btn-ghost btn-xs btn-square shrink-0 text-error opacity-0 group-hover:opacity-100"
              aria-label="Eliminar unidad"
            >
              <Trash2 className="size-3" />
            </button>
          )}
        </div>
      )}

      {abierta && !editando && (
        <div className="space-y-0.5 pb-1 pl-4">
          {temas.map((tema, ti) => (
            <NodoTema
              key={tema.id}
              tema={tema}
              numero={`${numeroBase}.${ti + 1}`}
              subtemas={subtemasPorTema.get(tema.id) ?? []}
              onIrATema={() => onIrATema(tema.id, unidad.id)}
              onEliminar={onEliminarTema}
              onActualizado={onTemaActualizado}
            />
          ))}
          {!temas.length && (
            <p className="px-1 py-0.5 text-xs text-base-content/40">Sin temas.</p>
          )}
          <button
            type="button"
            onClick={agregarTema}
            disabled={creandoTema}
            className="btn btn-ghost btn-xs w-full justify-start gap-1 text-base-content/50"
          >
            <Plus className="size-3" /> {creandoTema ? "Creando…" : "Tema"}
          </button>
        </div>
      )}
    </div>
  )
}

function NodoTema({ tema, numero, subtemas, onIrATema, onEliminar, onActualizado }) {
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState(tema.nombre || "")
  const [horas, setHoras] = useState(tema.horasTotales ?? "")
  const [pending, startTransition] = useTransition()
  const [confirmarBorrado, setConfirmarBorrado] = useState(false)

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `tema:${tema.id}`,
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const { Icono, clase } = ICONO_ESTADO[estadoDelTema(subtemas)]

  function guardar() {
    if (!nombre.trim()) return
    const formData = new FormData()
    formData.set("id", tema.id)
    formData.set("nombre", nombre.trim())
    formData.set("horas_totales", horas)
    startTransition(async () => {
      const resultado = await actualizarTema(formData)
      if (!resultado?.error) {
        onActualizado(tema.id, {
          nombre: nombre.trim(),
          horasTotales: horas ? Number(horas) : null,
        })
        setEditando(false)
      }
    })
  }

  function cancelar() {
    setNombre(tema.nombre || "")
    setHoras(tema.horasTotales ?? "")
    setEditando(false)
  }

  if (editando) {
    return (
      <div className="space-y-1 p-1">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del tema"
          aria-label="Nombre del tema"
          className="input input-bordered input-xs w-full"
          autoFocus
        />
        <div className="flex gap-1">
          <input
            type="number"
            min={0}
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
            placeholder="Hrs"
            aria-label="Horas del tema"
            className="input input-bordered input-xs w-14"
          />
          <button
            type="button"
            onClick={guardar}
            disabled={pending}
            className="btn btn-primary btn-xs flex-1 gap-1"
          >
            <Check className="size-3" /> Guardar
          </button>
          <button type="button" onClick={cancelar} className="btn btn-ghost btn-xs btn-square">
            <X className="size-3" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div ref={setNodeRef} style={style} className="group flex items-center gap-0.5 rounded-md px-1 py-1 hover:bg-base-200">
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="cursor-grab text-base-content/25 hover:text-base-content/50 active:cursor-grabbing"
        aria-label="Arrastrar tema a otra unidad"
      >
        <GripVertical className="size-3" />
      </button>
      <Icono className={`size-3 shrink-0 ${clase}`} />
      <button
        type="button"
        onClick={onIrATema}
        className="flex min-w-0 flex-1 items-center gap-1 text-left"
      >
        <span className="shrink-0 text-xs font-medium text-base-content/40">{numero}</span>
        <span className="min-w-0 truncate text-xs">{tema.nombre || "Tema sin nombre"}</span>
      </button>
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="btn btn-ghost btn-xs btn-square shrink-0 opacity-0 group-hover:opacity-100"
        aria-label="Editar tema"
      >
        <Pencil className="size-3" />
      </button>
      {confirmarBorrado ? (
        <span className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onEliminar(tema.id)}
            className="btn btn-error btn-xs"
          >
            Borrar
          </button>
          <button
            type="button"
            onClick={() => setConfirmarBorrado(false)}
            className="btn btn-ghost btn-xs btn-square"
            aria-label="Cancelar"
          >
            <X className="size-3" />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setConfirmarBorrado(true)}
          className="btn btn-ghost btn-xs btn-square shrink-0 text-error opacity-0 group-hover:opacity-100"
          aria-label="Eliminar tema"
        >
          <Trash2 className="size-3" />
        </button>
      )}
    </div>
  )
}
