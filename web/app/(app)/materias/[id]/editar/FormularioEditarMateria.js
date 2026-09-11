"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import ControlHorario from "@/components/materias/wizard/ControlHorario"
import { actualizarDatosMateria } from "@/app/(app)/materias/actions"

// Deriva el estado inicial de ControlHorario a partir de
// materia.horario ([{dia, hora_inicio}]) — si todos los días
// comparten la misma hora, arranca en modo "horario uniforme"
// (mejor UX que forzar siempre el modo por-día al editar).
function estadoHorarioInicial(horario) {
  const horarioPorDia = Object.fromEntries((horario ?? []).map((h) => [h.dia, h.hora_inicio]))
  const horas = new Set(Object.values(horarioPorDia))
  const uniforme = horas.size <= 1
  return {
    horarioUniforme: uniforme,
    horaUniforme: uniforme ? (horas.values().next().value ?? "") : "",
    horarioPorDia,
  }
}

export default function FormularioEditarMateria({ materia }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(null)
  const [nombre, setNombre] = useState(materia.nombre)
  const [duracion, setDuracion] = useState(materia.duracion_sesion_minutos)
  const [formato, setFormato] = useState(materia.formato_semestre)
  const [horarioEstado, setHorarioEstado] = useState(() => estadoHorarioInicial(materia.horario))

  function handleGuardar() {
    setError(null)
    if (!nombre.trim()) {
      setError("El nombre de la materia es obligatorio.")
      return
    }

    const horario = Object.entries(horarioEstado.horarioPorDia)
      .filter(([, hora]) => hora)
      .map(([dia, hora_inicio]) => ({ dia, hora_inicio }))

    startTransition(async () => {
      const resultado = await actualizarDatosMateria(materia.id, {
        nombre,
        horario,
        duracion_sesion_minutos: duracion,
        formato_semestre: formato,
      })
      if (resultado?.error) {
        setError(resultado.error)
      } else {
        router.push(`/materias/${materia.id}`)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 rounded-box border border-base-200 bg-base-100 p-4">
        <label className="form-control">
          <span className="label-text mb-1 text-sm">Nombre de la materia</span>
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            maxLength={120}
            aria-label="Nombre de la materia"
            className="input input-bordered w-full"
          />
        </label>
      </div>

      <ControlHorario
        horarioUniforme={horarioEstado.horarioUniforme}
        horaUniforme={horarioEstado.horaUniforme}
        horarioPorDia={horarioEstado.horarioPorDia}
        onChange={setHorarioEstado}
      />

      <div className="grid grid-cols-1 gap-3 rounded-box border border-base-200 bg-base-100 p-4 sm:grid-cols-2">
        <label className="form-control">
          <span className="label-text mb-1 text-sm">Duración de cada sesión (minutos)</span>
          <input
            type="number"
            min={30}
            max={240}
            value={duracion}
            onChange={(e) => setDuracion(Number(e.target.value) || 120)}
            aria-label="Duración de la sesión en minutos"
            className="input input-bordered"
          />
        </label>
        <label className="form-control">
          <span className="label-text mb-1 text-sm">Formato de semestre</span>
          <select
            value={formato}
            onChange={(e) => setFormato(e.target.value)}
            aria-label="Formato de semestre"
            className="select select-bordered"
          >
            <option value="semestral">Semestral</option>
            <option value="cuatrimestral">Cuatrimestral</option>
            <option value="trimestral">Trimestral</option>
          </select>
        </label>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => router.back()} className="btn btn-ghost">
          Cancelar
        </button>
        <button type="button" onClick={handleGuardar} disabled={pending} className="btn btn-primary">
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  )
}
