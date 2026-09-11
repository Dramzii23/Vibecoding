"use client"

import { Plus, Trash2 } from "lucide-react"

// Paso 3: criterios de evaluación como barras interactivas.
// Prellenados desde criterios_evaluacion de la IA si se extrajo
// una tabla de ponderaciones; si no, arranca con un criterio
// vacío. La suma a 100% se valida como aviso no bloqueante — el
// docente puede seguir ajustando sin que lo trabemos.
export default function PasoEvaluacion({ criterios, onChange }) {
  const suma = criterios.reduce((acc, c) => acc + (Number(c.porcentaje) || 0), 0)

  function actualizar(index, campo, valor) {
    onChange(criterios.map((c, i) => (i === index ? { ...c, [campo]: valor } : c)))
  }

  function agregar() {
    onChange([...criterios, { criterio: "", porcentaje: 0 }])
  }

  function quitar(index) {
    onChange(criterios.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Criterios de evaluación</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Ajusta las barras según cómo calificas — deben sumar 100%.
        </p>
      </div>

      <div className="space-y-4 rounded-box border border-base-200 bg-base-100 p-4">
        {criterios.map((c, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center gap-2">
              <input
                value={c.criterio}
                onChange={(e) => actualizar(index, "criterio", e.target.value)}
                placeholder="Criterio (ej. Proyectos)"
                aria-label="Nombre del criterio"
                className="input input-bordered input-sm flex-1"
              />
              <input
                type="number"
                min={0}
                max={100}
                value={c.porcentaje}
                onChange={(e) => actualizar(index, "porcentaje", Number(e.target.value) || 0)}
                aria-label={`Porcentaje de ${c.criterio || "criterio"}`}
                className="input input-bordered input-sm w-20"
              />
              <span className="text-sm text-base-content/60">%</span>
              <button
                type="button"
                onClick={() => quitar(index)}
                className="btn btn-ghost btn-sm btn-square text-error"
                title="Quitar criterio"
                aria-label={`Quitar criterio ${c.criterio || index + 1}`}
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={c.porcentaje}
              onChange={(e) => actualizar(index, "porcentaje", Number(e.target.value))}
              aria-label={`Barra de porcentaje de ${c.criterio || "criterio"}`}
              className="range range-primary range-sm"
            />
          </div>
        ))}

        <button type="button" onClick={agregar} className="btn btn-ghost btn-sm gap-1">
          <Plus className="size-4" /> Agregar criterio
        </button>

        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            suma === 100
              ? "bg-success/10 text-success"
              : "bg-warning/10 text-warning-content"
          }`}
        >
          Suma actual: {suma}% {suma !== 100 && "— debería sumar 100%"}
        </div>
      </div>
    </div>
  )
}
