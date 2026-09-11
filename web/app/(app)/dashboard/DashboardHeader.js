"use client"

import { useEffect, useState } from "react"
import { CalendarDays, Clock, Timer } from "lucide-react"
import { proximaClase } from "@/lib/fechas/horarioMateria"
import { NOMBRE_DIA, formatRangoHora } from "@/lib/fechas/semanaClase"
import { colorSolidoMateria } from "@/lib/colorMateria"

// Formatea milisegundos restantes como "hh:mm" — el panel "Próxima
// clase" no necesita segundos, se actualiza cada 30s de todos modos.
function formatCountdown(ms) {
  const minutosTotales = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(minutosTotales / 60)
  const m = minutosTotales % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export default function DashboardHeader({ materias }) {
  const [ahora, setAhora] = useState(null)

  useEffect(() => {
    const actualizar = () => setAhora(new Date())
    actualizar()
    const timer = window.setInterval(actualizar, 30000)
    return () => window.clearInterval(timer)
  }, [])

  const fecha = ahora?.toLocaleDateString("es-MX", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
  const hora = ahora?.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })

  // Solo se calcula una vez que `ahora` existe (evita mismatch de
  // hidratación: el servidor no conoce la hora del navegador).
  const proxima = ahora ? proximaClase(ahora, materias ?? []) : null

  return (
    <header className="rounded-box border border-base-300 bg-base-100 px-5 py-4 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">Tu jornada docente</p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">¿Qué toca hoy?</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/60">
            <span className="flex items-center gap-1.5 capitalize"><CalendarDays className="size-4" />{fecha || "Cargando fecha…"}</span>
            <span className="flex items-center gap-1.5"><Clock className="size-4" />{hora || "--:--"}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {proxima && (
            <div className="flex items-center gap-4 rounded-xl border border-base-300 bg-base-200/60 px-4 py-2.5">
              <div>
                <p className="text-xs font-medium text-base-content/50">Próxima clase</p>
                <p className="flex items-center gap-1.5 font-semibold">
                  <span className={`size-2.5 shrink-0 rounded-full ${colorSolidoMateria(proxima.materia.id)}`} />
                  {proxima.materia.nombre}
                </p>
                <p className="text-xs text-base-content/60">
                  {NOMBRE_DIA[proxima.dia]} · {formatRangoHora(proxima.horaInicio, proxima.materia.duracion_sesion_minutos)}
                </p>
              </div>
              <div className="border-l border-base-300 pl-4 text-right">
                <p className="flex items-center justify-end gap-1 text-[11px] text-base-content/50">
                  <Timer className="size-3.5" />
                  Comienza en
                </p>
                <p className="font-mono text-lg font-bold tabular-nums text-accent">
                  {formatCountdown(proxima.fecha - ahora)}
                </p>
                <p className="text-[10px] text-base-content/40">(hh:mm)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
