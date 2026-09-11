"use client"

export const DIAS = [
  { value: "lunes", label: "Lun" },
  { value: "martes", label: "Mar" },
  { value: "miercoles", label: "Mié" },
  { value: "jueves", label: "Jue" },
  { value: "viernes", label: "Vie" },
  { value: "sabado", label: "Sáb" },
  { value: "domingo", label: "Dom" },
]

// Control compartido de horario de una materia — usado en el wizard
// (Paso 2) y en la edición de una materia existente. Captura los
// días de clase y, para cada uno, su hora de inicio: modo "mismo
// horario" (un input aplica a todos los días marcados) o "horario
// distinto por día" (un input junto a cada día).
//
// Props: horarioUniforme (bool), horaUniforme (string "HH:MM"),
// horarioPorDia ({dia: "HH:MM"}), onChange({horarioUniforme,
// horaUniforme, horarioPorDia}) — reemplaza el objeto completo,
// mismo patrón shallow-merge que el resto del wizard.
//
// horarioPorDia se mantiene siempre resuelto (aunque el modo sea
// uniforme, cada día marcado tiene su entrada con horaUniforme) para
// que el caller (confirmarMateriaCompleta / actualizarDatosMateria)
// no necesite saber en qué modo estaba el control — solo lee
// horarioPorDia al final.
export default function ControlHorario({ horarioUniforme, horaUniforme, horarioPorDia, onChange }) {
  const diasMarcados = Object.keys(horarioPorDia)

  function set(campos) {
    onChange({ horarioUniforme, horaUniforme, horarioPorDia, ...campos })
  }

  function toggleDia(dia) {
    if (horarioPorDia[dia] !== undefined) {
      const { [dia]: _omitido, ...resto } = horarioPorDia
      set({ horarioPorDia: resto })
    } else {
      const horaNueva = horarioUniforme ? horaUniforme || "" : ""
      set({ horarioPorDia: { ...horarioPorDia, [dia]: horaNueva } })
    }
  }

  function cambiarHoraDia(dia, hora) {
    set({ horarioPorDia: { ...horarioPorDia, [dia]: hora } })
  }

  function cambiarHoraUniforme(hora) {
    // Re-propaga la hora a todos los días ya marcados.
    const nuevo = Object.fromEntries(diasMarcados.map((d) => [d, hora]))
    set({ horaUniforme: hora, horarioPorDia: nuevo })
  }

  function cambiarModo(uniforme) {
    if (uniforme) {
      // Al volver a modo uniforme, todos los días marcados toman la
      // hora uniforme actual (o la del primer día si no había una).
      const hora = horaUniforme || horarioPorDia[diasMarcados[0]] || ""
      const nuevo = Object.fromEntries(diasMarcados.map((d) => [d, hora]))
      set({ horarioUniforme: true, horaUniforme: hora, horarioPorDia: nuevo })
    } else {
      set({ horarioUniforme: false })
    }
  }

  return (
    <div className="space-y-3 rounded-box border border-base-200 bg-base-100 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">
          Días y horario de clase
        </h3>
        <label className="label cursor-pointer gap-2">
          <span className="label-text text-xs">Horario distinto por día</span>
          <input
            type="checkbox"
            checked={!horarioUniforme}
            onChange={(e) => cambiarModo(!e.target.checked)}
            className="toggle toggle-sm"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {DIAS.map((dia) => {
          const marcado = horarioPorDia[dia.value] !== undefined
          return (
            <label
              key={dia.value}
              className="label cursor-pointer gap-2 rounded-lg border border-base-200 px-3 py-1.5"
            >
              <input
                type="checkbox"
                checked={marcado}
                onChange={() => toggleDia(dia.value)}
                className="checkbox checkbox-sm"
              />
              <span className="label-text">{dia.label}</span>
            </label>
          )
        })}
      </div>

      {horarioUniforme ? (
        <label className="form-control max-w-xs">
          <span className="label-text mb-1 text-sm">Hora de inicio (todos los días)</span>
          <input
            type="time"
            value={horaUniforme}
            onChange={(e) => cambiarHoraUniforme(e.target.value)}
            aria-label="Hora de inicio de la clase"
            className="input input-bordered"
          />
        </label>
      ) : (
        diasMarcados.length > 0 && (
          <div className="space-y-2">
            {DIAS.filter((d) => horarioPorDia[d.value] !== undefined).map((dia) => (
              <label key={dia.value} className="flex items-center gap-2">
                <span className="w-14 text-sm text-base-content/70">{dia.label}</span>
                <input
                  type="time"
                  value={horarioPorDia[dia.value]}
                  onChange={(e) => cambiarHoraDia(dia.value, e.target.value)}
                  aria-label={`Hora de inicio el ${dia.label}`}
                  className="input input-bordered input-sm"
                />
              </label>
            ))}
          </div>
        )
      )}
    </div>
  )
}
