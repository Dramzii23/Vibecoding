import { CalendarRange } from "lucide-react"
import DonutChart from "./DonutChart"

// Panel "Progreso del curso": conteo de subtemas por estatus
// (planeada/impartida/reprogramada) + "sin programar" (sin fecha
// asignada todavía) — todo derivado de subtemas.estatus/fecha, ya
// cargados por page.js, sin columnas ni vistas nuevas en BD.
export default function ProgresoCurso({ subtemas, hrefCalendario = "#horario-materia" }) {
  const impartidas = subtemas.filter((s) => s.estatus === "impartida").length
  const reprogramadas = subtemas.filter((s) => s.estatus === "reprogramada").length
  const planeadasConFecha = subtemas.filter((s) => s.estatus === "planeada" && s.fecha).length
  const sinProgramar = subtemas.filter((s) => s.estatus === "planeada" && !s.fecha).length

  const datos = [
    { label: "Impartidas", valor: impartidas, color: "text-primary" },
    { label: "Planeadas", valor: planeadasConFecha, color: "text-success" },
    { label: "Reprogramada", valor: reprogramadas, color: "text-warning" },
    { label: "Sin programar", valor: sinProgramar, color: "text-base-300" },
  ]

  return (
    <div className="space-y-4 rounded-box border border-base-300 bg-base-100 p-5">
      <h2 className="text-lg font-bold">Progreso del curso</h2>
      <DonutChart datos={datos} total={subtemas.length} totalLabel="sesiones totales" />
      <a href={hrefCalendario} className="btn btn-outline btn-sm w-full gap-1.5">
        <CalendarRange className="size-4" />
        Ver calendario del curso
      </a>
    </div>
  )
}
