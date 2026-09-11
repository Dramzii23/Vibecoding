"use client"

import { useMemo } from "react"
import { AlertTriangle } from "lucide-react"
import { diasFestivosEnRango, sesionesHabiles } from "@/lib/fechas/calendarioAcademico"
import { nombresUnidadDesdeTemas } from "./MateriaWizard"

// Paso "Calendario del semestre": captura el rango de fechas real
// sobre el horario semanal ya elegido en Datos generales
// (horarioPorDia) — a diferencia de ese paso (qué días de la semana
// hay clase), aquí se fija DESDE CUÁNDO HASTA CUÁNDO. Con eso se
// calculan las sesiones hábiles reales (excluyendo festivos
// confirmados) — 100% determinístico en cliente, sin segunda
// llamada a IA (decisión del usuario). El número de unidades del
// semestre también se decide aquí, no se infiere del PDF (ver
// cartaDescriptiva.js: las cartas reales casi nunca lo declaran).
//
// Si hay discrepancia entre las horas_totales que sumó la IA de los
// temas y las horas reales calculadas (sesiones × duración), se
// avisa aquí mismo con la elección de prioridad — el usuario pidió
// explícitamente que el número de sesiones calculado con lo que se
// preguntó al inicio tenga prioridad, así que "calendario" es el
// default ya seleccionado.
export default function PasoCalendario({ datos, onChange }) {
  const {
    fechaInicioSemestre,
    fechaFinSemestre,
    pais,
    numeroUnidades,
    tieneSemanaEntregaFinal,
    festivosExcluidos,
    prioridadHoras,
    horarioPorDia,
    duracionSesionMinutos,
    temas,
    unidadesDeclaradasCarta,
  } = datos

  function set(campos) {
    onChange({ ...datos, ...campos })
  }

  const diasClaseSemana = Object.keys(horarioPorDia ?? {})

  // Cuántas unidades con NOMBRE REAL distinto detectó la IA en los
  // temas (ver schemas/cartaDescriptiva.js: unidad_nombre) — señal
  // más confiable que unidadesDeclaradasCarta cuando la carta no dice
  // el número explícito pero sí nombra cada unidad en su columna.
  const unidadesConNombreDetectadas = useMemo(() => nombresUnidadDesdeTemas(temas).size, [temas])

  const festivosEnRango = useMemo(() => {
    if (!fechaInicioSemestre || !fechaFinSemestre) return []
    return diasFestivosEnRango(fechaInicioSemestre, fechaFinSemestre)
  }, [fechaInicioSemestre, fechaFinSemestre])

  const diasClaseKey = diasClaseSemana.join(",")
  const sesiones = useMemo(() => {
    if (!fechaInicioSemestre || !fechaFinSemestre || !diasClaseSemana.length) return []
    return sesionesHabiles({
      fechaInicioISO: fechaInicioSemestre,
      fechaFinISO: fechaFinSemestre,
      diasClaseSemana,
      festivosExcluidos,
    })
  }, [fechaInicioSemestre, fechaFinSemestre, diasClaseKey, festivosExcluidos]) // eslint-disable-line react-hooks/exhaustive-deps

  const horasCalculadas = sesiones.length * (duracionSesionMinutos || 120) / 60
  const horasDeclaradasCarta = (temas ?? []).reduce((acc, t) => acc + (t.horas_totales || 0), 0)
  const hayDiscrepancia =
    horasDeclaradasCarta > 0 && Math.abs(horasDeclaradasCarta - horasCalculadas) > 1

  function toggleFestivo(fecha) {
    const yaExcluido = festivosExcluidos.includes(fecha)
    set({
      festivosExcluidos: yaExcluido
        ? festivosExcluidos.filter((f) => f !== fecha)
        : [...festivosExcluidos, fecha],
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Calendario del semestre</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Con esto calculamos las sesiones reales de tu curso y sugerimos
          fechas para cada tema — tu carta descriptiva no suele declarar
          esta información, así que la capturas tú.
        </p>
      </div>

      {unidadesDeclaradasCarta != null && (
        <div className="rounded-lg bg-info/10 px-3 py-2 text-sm text-info">
          Tu carta descriptiva declara {unidadesDeclaradasCarta}{" "}
          {unidadesDeclaradasCarta === 1 ? "unidad" : "unidades"}. Puedes usar ese número
          abajo o cambiarlo.
        </div>
      )}

      {unidadesDeclaradasCarta == null && unidadesConNombreDetectadas > 0 && (
        <div className="rounded-lg bg-info/10 px-3 py-2 text-sm text-info">
          Detectamos {unidadesConNombreDetectadas}{" "}
          {unidadesConNombreDetectadas === 1 ? "unidad con nombre propio" : "unidades con nombre propio"} en
          tu carta descriptiva. Puedes usar ese número abajo o cambiarlo.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 rounded-box border border-base-200 bg-base-100 p-4 sm:grid-cols-2">
        <label className="form-control">
          <span className="label-text mb-1 text-sm">Inicio del semestre</span>
          <input
            type="date"
            value={fechaInicioSemestre || ""}
            onChange={(e) => set({ fechaInicioSemestre: e.target.value })}
            aria-label="Fecha de inicio del semestre"
            className="input input-bordered"
          />
        </label>
        <label className="form-control">
          <span className="label-text mb-1 text-sm">Fin del semestre</span>
          <input
            type="date"
            value={fechaFinSemestre || ""}
            onChange={(e) => set({ fechaFinSemestre: e.target.value })}
            aria-label="Fecha de fin del semestre"
            className="input input-bordered"
          />
        </label>
        <label className="form-control">
          <span className="label-text mb-1 text-sm">País (para días festivos)</span>
          <select
            value={pais}
            onChange={(e) => set({ pais: e.target.value })}
            aria-label="País"
            className="select select-bordered"
          >
            <option value="mx">México</option>
          </select>
        </label>
        <label className="form-control">
          <span className="label-text mb-1 text-sm">Número de unidades del semestre</span>
          <input
            type="number"
            min={1}
            max={12}
            value={numeroUnidades}
            onChange={(e) => set({ numeroUnidades: Number(e.target.value) || 1 })}
            aria-label="Número de unidades del semestre"
            className="input input-bordered"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 rounded-lg border border-base-200 bg-base-100 px-3 py-2">
        <input
          type="checkbox"
          checked={tieneSemanaEntregaFinal}
          onChange={(e) => set({ tieneSemanaEntregaFinal: e.target.checked })}
          className="checkbox checkbox-sm"
        />
        <span className="text-sm">
          Reservar la última semana del semestre para entrega/presentación del proyecto final
        </span>
      </label>

      {!diasClaseSemana.length && (
        <p className="rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning-content">
          Todavía no configuraste días de clase en "Datos generales" — vuelve a ese paso
          para poder calcular tus sesiones.
        </p>
      )}

      {fechaInicioSemestre && fechaFinSemestre && diasClaseSemana.length > 0 && (
        <div className="space-y-3 rounded-box border border-base-200 bg-base-100 p-4">
          <p className="text-sm font-semibold">
            {sesiones.length} sesiones hábiles calculadas ({horasCalculadas.toFixed(1)} horas)
          </p>

          {festivosEnRango.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-base-content/50">
                Días festivos en tu rango — confirma si son inhábiles
              </p>
              {festivosEnRango.map((f) => (
                <label key={f.fecha} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!festivosExcluidos.includes(f.fecha)}
                    onChange={() => toggleFestivo(f.fecha)}
                    className="checkbox checkbox-xs"
                  />
                  {f.fecha} — {f.nombre}
                </label>
              ))}
            </div>
          )}

          {hayDiscrepancia && (
            <div className="space-y-2 rounded-lg bg-warning/10 px-3 py-2.5 text-sm">
              <p className="flex items-center gap-1.5 font-semibold text-warning-content">
                <AlertTriangle className="size-4 shrink-0" />
                Tu carta descriptiva declara {horasDeclaradasCarta.toFixed(1)} horas, pero tu
                calendario calcula {horasCalculadas.toFixed(1)} horas — no coinciden.
              </p>
              <div className="flex flex-col gap-1.5">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="prioridadHoras"
                    checked={prioridadHoras === "calendario"}
                    onChange={() => set({ prioridadHoras: "calendario" })}
                    className="radio radio-sm"
                  />
                  Recalcular según mi calendario ({sesiones.length} sesiones)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="prioridadHoras"
                    checked={prioridadHoras === "carta"}
                    onChange={() => set({ prioridadHoras: "carta" })}
                    className="radio radio-sm"
                  />
                  Usar las horas de la carta descriptiva como referencia
                </label>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
