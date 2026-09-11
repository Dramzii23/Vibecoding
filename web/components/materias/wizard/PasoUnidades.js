"use client"

import { Plus, Trash2 } from "lucide-react"
import { formatFechaCorta } from "@/lib/fechas/semanaClase"

// Paso "Unidades del semestre" como LISTA editable (pedido
// explícito: no inputs numéricos con flechitas de incremento). El
// número de unidades y sus fechas reales ya vienen resueltos desde
// el paso Calendario (MateriaWizard.avanzarDesdeCalendario, vía
// distribuirEnUnidades) — semanaInicio/semanaFin siguen siendo lo
// que se persiste en BD (unidades.semana_inicio/fin), pero si la
// unidad trae `fechasSesion` (array de fechas ISO reales calculadas)
// se muestra el rango real como referencia, no solo el número de
// semana abstracto. Cada `unidad` tiene un `numero` temporal (no id
// real todavía — la materia no existe hasta el submit final) que el
// paso de Temas usa para resolver unidad_numero.
export default function PasoUnidades({ unidades, onChange }) {
  function actualizar(index, campo, valor) {
    onChange(unidades.map((u, i) => (i === index ? { ...u, [campo]: valor } : u)))
  }

  function agregar() {
    const ultima = unidades[unidades.length - 1]
    const semanaInicio = ultima ? ultima.semanaFin + 1 : 1
    onChange([
      ...unidades,
      {
        numero: unidades.length + 1,
        nombre: `Unidad ${unidades.length + 1}`,
        semanaInicio,
        semanaFin: semanaInicio + 3,
      },
    ])
  }

  function quitar(index) {
    onChange(
      unidades
        .filter((_, i) => i !== index)
        .map((u, i) => ({ ...u, numero: i + 1 }))
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Unidades del semestre</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Revisa las unidades que detectamos, o ajusta nombres y semanas.
        </p>
      </div>

      <ul className="space-y-2 rounded-box border border-base-200 bg-base-100 p-4">
        {unidades.map((u, index) => (
          <li
            key={index}
            className="rounded-lg border border-base-200 p-3"
          >
            <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[auto_1fr_auto_auto_auto]">
              <span className="text-sm font-medium text-base-content/60">
                #{u.numero}
              </span>
              <input
                value={u.nombre}
                onChange={(e) => actualizar(index, "nombre", e.target.value)}
                placeholder={`Unidad ${u.numero}`}
                aria-label={`Nombre de unidad ${u.numero}`}
                className="input input-bordered input-sm"
              />
              <label className="flex items-center gap-1 text-sm">
                Semana
                <input
                  type="number"
                  min={1}
                  value={u.semanaInicio}
                  onChange={(e) => actualizar(index, "semanaInicio", Number(e.target.value) || 1)}
                  aria-label={`Semana de inicio de unidad ${u.numero}`}
                  className="input input-bordered input-sm w-16"
                />
              </label>
              <label className="flex items-center gap-1 text-sm">
                a
                <input
                  type="number"
                  min={1}
                  value={u.semanaFin}
                  onChange={(e) => actualizar(index, "semanaFin", Number(e.target.value) || 1)}
                  aria-label={`Semana final de unidad ${u.numero}`}
                  className="input input-bordered input-sm w-16"
                />
              </label>
              <button
                type="button"
                onClick={() => quitar(index)}
                className="btn btn-ghost btn-sm btn-square text-error"
                title="Quitar unidad"
                aria-label={`Quitar ${u.nombre}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            {u.fechasSesion?.length > 0 && (
              <p className="mt-1.5 text-xs text-base-content/50">
                {u.fechasSesion.length} sesiones reales: {formatFechaCorta(u.fechasSesion[0])} al{" "}
                {formatFechaCorta(u.fechasSesion[u.fechasSesion.length - 1])}
              </p>
            )}
            <label className="form-control mt-2">
              <span className="label-text mb-1 text-xs text-base-content/50">
                Objetivo de la unidad (opcional)
              </span>
              <input
                value={u.objetivo || ""}
                onChange={(e) => actualizar(index, "objetivo", e.target.value)}
                placeholder="Qué debe lograr el estudiante en esta unidad"
                aria-label={`Objetivo de unidad ${u.numero}`}
                className="input input-bordered input-sm"
              />
            </label>
          </li>
        ))}

        <button type="button" onClick={agregar} className="btn btn-outline btn-sm gap-1">
          <Plus className="size-4" /> Agregar unidad
        </button>
      </ul>
    </div>
  )
}
