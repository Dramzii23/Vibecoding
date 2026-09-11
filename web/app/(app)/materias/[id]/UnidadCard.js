"use client"

import { useState, useTransition } from "react"
import { useDroppable } from "@dnd-kit/core"
import { ChevronDown, Pencil, Trash2, Check, X, Plus } from "lucide-react"
import TemaBloque from "./TemaBloque"
import { actualizarUnidad } from "./actions"

// Tarjeta de una unidad del Horario interno: colapsable (igual que
// antes) + ahora también droppable (destino de arrastrar un
// TemaBloque desde otra unidad, id `unidad:<id>`) + editable in-line
// (nombre/objetivo) + borrable (con confirmación, CASCADE real en
// BD) + "+ Tema" para crear uno vacío directo en esta unidad.
export default function UnidadCard({
  unidad,
  temas,
  abierta,
  onToggle,
  onAbrirSubtema,
  onCrearTema,
  onEliminarTema,
  onTemaActualizado,
  onEliminarUnidad,
  onUnidadActualizada,
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
        onUnidadActualizada(unidad.id, { nombre: nombre.trim(), objetivo: objetivo.trim() || null })
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
      className={`rounded-lg border p-2.5 ${isOver ? "border-primary bg-primary/5" : "border-base-200 bg-base-100"}`}
    >
      {editando ? (
        <div className="space-y-1.5">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={`Unidad ${unidad.numero}`}
            aria-label={`Nombre de unidad ${unidad.numero}`}
            className="input input-bordered input-sm w-full"
            autoFocus
          />
          <input
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            placeholder="Objetivo de la unidad (opcional)"
            aria-label={`Objetivo de unidad ${unidad.numero}`}
            className="input input-bordered input-sm w-full"
          />
          <div className="flex gap-1.5">
            <button type="button" onClick={guardar} disabled={pending} className="btn btn-primary btn-xs gap-1">
              <Check className="size-3.5" /> Guardar
            </button>
            <button type="button" onClick={cancelar} className="btn btn-ghost btn-xs gap-1">
              <X className="size-3.5" /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex w-full items-center gap-2">
          <button
            type="button"
            onClick={() => onToggle(unidad.id)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <ChevronDown
              className={`size-4 shrink-0 text-base-content/50 transition-transform ${abierta ? "" : "-rotate-90"}`}
            />
            <span className="min-w-0 truncate text-sm font-semibold">
              Unidad {unidad.numero} · {unidad.nombre}
            </span>
          </button>
          <button type="button" onClick={() => setEditando(true)} className="btn btn-ghost btn-xs btn-square shrink-0" aria-label="Editar unidad">
            <Pencil className="size-3.5" />
          </button>
          {confirmarBorrado ? (
            <span className="flex shrink-0 items-center gap-1 text-xs">
              <button type="button" onClick={() => onEliminarUnidad(unidad.id)} className="btn btn-error btn-xs">
                Confirmar borrado
              </button>
              <button type="button" onClick={() => setConfirmarBorrado(false)} className="btn btn-ghost btn-xs">
                Cancelar
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmarBorrado(true)}
              className="btn btn-ghost btn-xs btn-square shrink-0 text-error"
              aria-label="Eliminar unidad"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {!editando && unidad.objetivo && (
        <p className="mt-1 pl-6 text-xs text-base-content/50">{unidad.objetivo}</p>
      )}

      {abierta && !editando && (
        <div className="mt-2.5 space-y-3">
          {temas.map((tema) => (
            <TemaBloque
              key={tema.id}
              tema={tema}
              numero={tema.numero}
              onAbrirSubtema={onAbrirSubtema}
              onEliminar={onEliminarTema}
              onActualizado={onTemaActualizado}
            />
          ))}
          {!temas.length && <p className="py-1 text-xs text-base-content/40">Sin temas todavía.</p>}
          <button
            type="button"
            onClick={agregarTema}
            disabled={creandoTema}
            className="btn btn-outline btn-xs gap-1"
          >
            <Plus className="size-3.5" /> {creandoTema ? "Creando…" : "Tema"}
          </button>
        </div>
      )}
    </div>
  )
}
