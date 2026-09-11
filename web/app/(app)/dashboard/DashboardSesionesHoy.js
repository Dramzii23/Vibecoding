"use client"

import { useState } from "react"
import ProgresoCurso from "@/components/materias/ProgresoCurso"
import AcordeonSesionesHoy from "./AcordeonSesionesHoy"

// Layout de 2 columnas del bloque "Sesión de hoy" del Dashboard
// (diseño Figma, frame 30:851): acordeón de materias con clase hoy
// a la izquierda + "Progreso del curso" de la materia actualmente
// expandida a la derecha. AcordeonSesionesHoy.js avisa aquí arriba
// (via onExpandirMateria) cuál está expandida — se filtran
// `todosLosSubtemas` por esa materia para la dona, igual que
// materias/[id]/page.js ya hace con los subtemas de una sola
// materia.
export default function DashboardSesionesHoy({
  materias,
  subtemasDeHoy,
  todosLosSubtemas,
  actividades,
  accionesDocente,
  accionesAlumno,
  recursos,
}) {
  const [materiaExpandidaId, setMateriaExpandidaId] = useState(null)

  const materiaExpandida = materias.find((m) => m.id === materiaExpandidaId)
  const subtemasDeLaMateria = materiaExpandidaId
    ? (todosLosSubtemas ?? []).filter((s) => s.materiaId === materiaExpandidaId)
    : []

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <AcordeonSesionesHoy
        materias={materias}
        subtemasDeHoy={subtemasDeHoy}
        actividades={actividades}
        accionesDocente={accionesDocente}
        accionesAlumno={accionesAlumno}
        recursos={recursos}
        onExpandirMateria={setMateriaExpandidaId}
      />
      {materiaExpandida && (
        <ProgresoCurso
          subtemas={subtemasDeLaMateria}
          hrefCalendario={`/materias/${materiaExpandida.id}#horario-materia`}
        />
      )}
    </div>
  )
}
