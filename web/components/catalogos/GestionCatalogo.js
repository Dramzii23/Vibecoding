"use client"

import { useState } from "react"
import { Pencil, Plus, X } from "lucide-react"

// Componente genérico de CRUD inline para un catálogo (actividades
// o acciones). `campos` declara qué inputs mostrar además del
// nombre (ej. [{ name: "descripcion", label: "Descripción", type: "textarea" }]).
// `extraFields` son hidden inputs fijos que viajan siempre en el
// form (ej. tipo: "docente" para el catálogo de acciones docente).
// Badge "usado en N sesiones · M materias", expandible (<details>
// nativo, sin JS extra) a la lista de sesiones concretas con link a
// la materia. `uso` es { count, materias: Set<string>, sesiones:
// [{materiaId, materiaNombre, subtemaNombre}] } o undefined si esta
// entrada no se usa en ningún subtema todavía.
function BadgeUso({ uso }) {
  if (!uso?.count) {
    return <p className="text-xs text-base-content/40">Sin usar todavía.</p>
  }
  return (
    <details className="group">
      <summary className="cursor-pointer list-none text-xs text-base-content/50 hover:text-base-content/70">
        <span className="badge badge-ghost badge-xs">
          usado en {uso.count} {uso.count === 1 ? "sesión" : "sesiones"} · {uso.materias.size}{" "}
          {uso.materias.size === 1 ? "materia" : "materias"}
        </span>
      </summary>
      <ul className="mt-1.5 space-y-1 border-l border-base-200 pl-2">
        {uso.sesiones.map((s, i) => (
          <li key={i} className="text-xs">
            <a href={`/materias/${s.materiaId}#horario-materia`} className="link link-hover">
              {s.materiaNombre} · {s.subtemaNombre}
            </a>
          </li>
        ))}
      </ul>
    </details>
  )
}

export default function GestionCatalogo({
  titulo,
  items,
  crearAction,
  actualizarAction,
  eliminarAction,
  campos = [],
  extraFields = {},
  usoPorId,
}) {
  const [creando, setCreando] = useState(false)
  const [editandoId, setEditandoId] = useState(null)

  return (
    <div className="space-y-3 rounded-box border border-base-200 bg-base-100 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">
          {titulo}
        </h2>
        {!creando && (
          <button
            type="button"
            onClick={() => setCreando(true)}
            className="btn btn-ghost btn-xs gap-1"
          >
            <Plus className="size-3" /> Nueva
          </button>
        )}
      </div>

      {creando && (
        <form
          action={async (formData) => {
            await crearAction(formData)
            setCreando(false)
          }}
          className="space-y-2 rounded-lg border border-base-200 p-3"
        >
          {Object.entries(extraFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <input
            name="nombre"
            required
            maxLength={160}
            placeholder="Nombre"
            aria-label="Nombre"
            autoFocus
            className="input input-bordered input-sm w-full"
          />
          {campos.map((campo) =>
            campo.type === "textarea" ? (
              <textarea
                key={campo.name}
                name={campo.name}
                placeholder={campo.label}
                aria-label={campo.label}
                rows={2}
                className="textarea textarea-bordered textarea-sm w-full"
              />
            ) : (
              <input
                key={campo.name}
                name={campo.name}
                placeholder={campo.label}
                aria-label={campo.label}
                className="input input-bordered input-sm w-full"
              />
            )
          )}
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-xs">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => setCreando(false)}
              className="btn btn-ghost btn-xs"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {!items?.length && !creando && (
        <p className="text-sm text-base-content/50">Sin entradas todavía.</p>
      )}

      <ul className="space-y-2">
        {items?.map((item) =>
          editandoId === item.id ? (
            <li key={item.id} className="rounded-lg border border-base-200 p-3">
              <form
                action={async (formData) => {
                  await actualizarAction(formData)
                  setEditandoId(null)
                }}
                className="space-y-2"
              >
                <input type="hidden" name="id" value={item.id} />
                <input
                  name="nombre"
                  required
                  defaultValue={item.nombre}
                  maxLength={160}
                  aria-label="Nombre"
                  className="input input-bordered input-sm w-full"
                />
                {campos.map((campo) =>
                  campo.type === "textarea" ? (
                    <textarea
                      key={campo.name}
                      name={campo.name}
                      defaultValue={item[campo.name] ?? ""}
                      aria-label={campo.label}
                      rows={2}
                      className="textarea textarea-bordered textarea-sm w-full"
                    />
                  ) : (
                    <input
                      key={campo.name}
                      name={campo.name}
                      defaultValue={item[campo.name] ?? ""}
                      aria-label={campo.label}
                      className="input input-bordered input-sm w-full"
                    />
                  )
                )}
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary btn-xs">
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditandoId(null)}
                    className="btn btn-ghost btn-xs"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </li>
          ) : (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-base-200 px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.nombre}</p>
                {item.descripcion && (
                  <p className="truncate text-xs text-base-content/60">{item.descripcion}</p>
                )}
                {usoPorId && <BadgeUso uso={usoPorId[item.id]} />}
              </div>
              <button
                type="button"
                onClick={() => setEditandoId(item.id)}
                className="btn btn-ghost btn-xs btn-square"
                title="Editar"
                aria-label={`Editar ${item.nombre}`}
              >
                <Pencil className="size-3.5" />
              </button>
              <form action={eliminarAction}>
                <input type="hidden" name="id" value={item.id} />
                <button
                  type="submit"
                  className="btn btn-ghost btn-xs btn-square text-error"
                  title="Eliminar"
                  aria-label={`Eliminar ${item.nombre}`}
                >
                  <X className="size-3.5" />
                </button>
              </form>
            </li>
          )
        )}
      </ul>
    </div>
  )
}
