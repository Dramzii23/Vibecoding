"use client"

import { useState, useTransition } from "react"

const CREAR_NUEVA = "__crear_nueva__"

// Combobox de una entrada de catálogo (actividad o acción), con
// opción fija "+ Crear nueva…" al final. Al elegirla, revela un
// input inline; al confirmar, llama `crearAction` (Server Action)
// y selecciona automáticamente la entrada recién creada.
//
// `crearAction` debe devolver la fila creada ({ id, nombre, ... })
// — a diferencia de las actions de GestionCatalogo.js (que solo
// revalidatePath), aquí necesitamos el id nuevo de vuelta para
// poder seleccionarlo sin esperar un refetch de la página.
export default function SelectorCatalogo({
  items,
  value,
  onChange,
  crearAction,
  placeholder = "Sin asignar",
  extraFields = {},
}) {
  const [creando, setCreando] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState("")
  const [pending, startTransition] = useTransition()

  function handleSelectChange(e) {
    if (e.target.value === CREAR_NUEVA) {
      setCreando(true)
      return
    }
    onChange(e.target.value || null)
  }

  function handleCrear() {
    if (!nuevoNombre.trim()) return
    startTransition(async () => {
      const creada = await crearAction({ nombre: nuevoNombre.trim(), ...extraFields })
      if (creada?.id) onChange(creada.id)
      setCreando(false)
      setNuevoNombre("")
    })
  }

  if (creando) {
    return (
      <div className="flex gap-2">
        <input
          value={nuevoNombre}
          onChange={(e) => setNuevoNombre(e.target.value)}
          placeholder="Nombre de la nueva entrada"
          aria-label="Nombre de la nueva entrada"
          autoFocus
          className="input input-bordered input-sm flex-1"
        />
        <button
          type="button"
          onClick={handleCrear}
          disabled={pending || !nuevoNombre.trim()}
          className="btn btn-primary btn-sm"
        >
          {pending ? "…" : "Crear"}
        </button>
        <button type="button" onClick={() => setCreando(false)} className="btn btn-ghost btn-sm">
          Cancelar
        </button>
      </div>
    )
  }

  return (
    <select
      value={value ?? ""}
      onChange={handleSelectChange}
      className="select select-bordered select-sm w-full"
    >
      <option value="">{placeholder}</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>
          {item.nombre}
        </option>
      ))}
      <option value={CREAR_NUEVA}>+ Crear nueva…</option>
    </select>
  )
}
