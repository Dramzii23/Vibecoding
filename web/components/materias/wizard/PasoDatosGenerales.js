"use client"

import ControlHorario from "./ControlHorario"

// Paso 2: nombre (prellenado desde la IA si se pudo extraer),
// días+horario de clase (ControlHorario.js, compartido con la
// edición de materia), duración de sesión (default 120 min),
// formato de semestre.
export default function PasoDatosGenerales({ datos, onChange }) {
  function set(campo, valor) {
    onChange({ ...datos, [campo]: valor })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Datos generales</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Revisa lo que encontramos en tu carta descriptiva y ajusta lo que
          haga falta.
        </p>
      </div>

      <div className="space-y-3 rounded-box border border-base-200 bg-base-100 p-4">
        <label className="form-control">
          <span className="label-text mb-1 text-sm">Nombre de la materia</span>
          <input
            value={datos.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            required
            maxLength={120}
            placeholder="Nombre de la materia (ej. Fundamentos del Diseño)"
            aria-label="Nombre de la materia"
            className="input input-bordered w-full"
          />
        </label>
      </div>

      <ControlHorario
        horarioUniforme={datos.horarioUniforme}
        horaUniforme={datos.horaUniforme}
        horarioPorDia={datos.horarioPorDia}
        onChange={(campos) => onChange({ ...datos, ...campos })}
      />

      <div className="grid grid-cols-1 gap-3 rounded-box border border-base-200 bg-base-100 p-4 sm:grid-cols-2">
        <label className="form-control">
          <span className="label-text mb-1 text-sm">Duración de cada sesión (minutos)</span>
          <input
            type="number"
            min={30}
            max={240}
            value={datos.duracionSesionMinutos}
            onChange={(e) => set("duracionSesionMinutos", Number(e.target.value) || 120)}
            aria-label="Duración de la sesión en minutos"
            className="input input-bordered"
          />
        </label>
        <label className="form-control">
          <span className="label-text mb-1 text-sm">Formato de semestre</span>
          <select
            value={datos.formatoSemestre}
            onChange={(e) => set("formatoSemestre", e.target.value)}
            aria-label="Formato de semestre"
            className="select select-bordered"
          >
            <option value="semestral">Semestral</option>
            <option value="cuatrimestral">Cuatrimestral</option>
            <option value="trimestral">Trimestral</option>
          </select>
        </label>
      </div>
    </div>
  )
}
