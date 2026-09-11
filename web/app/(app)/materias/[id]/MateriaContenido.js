"use client"

import { useEffect, useState } from "react"
import ProgresoCurso from "@/components/materias/ProgresoCurso"
import Dialog from "@/components/ui/Dialog"
import SubtemaDetalle from "@/components/materias/SubtemaDetalle"
import SesionDeHoy from "./SesionDeHoy"
import TableroSemana from "./TableroSemana"
import { useMateriaTree } from "./MateriaTreeContext"

// Contenido de /materias/[id]. El estado del árbol Unidad → Tema →
// Subtema y el DndContext que lo mueve YA NO viven aquí: los provee
// MateriaTreeProvider (app/(app)/layout.js), para que el árbol
// editable pueda renderizarse en el sidebar global compartiendo la
// misma fuente de verdad y el mismo Dnd que este Horario interno.
//
// Este componente solo: (1) registra los datos iniciales en el
// contexto al montar, (2) consume el estado ya centralizado, (3)
// pinta la columna derecha — "Sesión de hoy", "Progreso del curso" y
// el Horario interno (#horario-materia). El panel de navegación
// Unidad/Tema está en el sidebar (SidebarArbolMateria.js).
export default function MateriaContenido({
  materiaId,
  subtemasIniciales,
  unidadesIniciales,
  estructuraInicial,
  diasClase,
  horaInicio,
  duracionSesionMinutos,
  actividades,
  accionesDocente,
  accionesAlumno,
  recursos,
}) {
  const tree = useMateriaTree()
  const { registrarMateria } = tree
  const [subtemaAbierto, setSubtemaAbierto] = useState(null)

  // Registra esta materia en el contexto (idempotente: el provider
  // ignora el registro si ya tiene este materiaId). registrarMateria
  // es estable (useCallback []), así que este efecto solo corre de
  // nuevo si cambia la materia.
  useEffect(() => {
    registrarMateria({
      materiaId,
      unidades: unidadesIniciales,
      estructura: estructuraInicial,
      subtemas: subtemasIniciales,
    })
  }, [registrarMateria, materiaId, unidadesIniciales, estructuraInicial, subtemasIniciales])

  // Antes del primer registro efectivo, el contexto sigue con la
  // materia anterior (o vacío) — espera a que coincida para no
  // pintar datos de otra materia por un frame.
  const listo = tree.materiaId === materiaId

  function handleGuardadoDetalle(campos) {
    tree.aplicarCamposSubtema(subtemaAbierto.id, campos)
    setSubtemaAbierto(null)
  }

  if (!listo) {
    return <div className="h-64 animate-pulse rounded-box bg-base-200" />
  }

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_320px]">
          <SesionDeHoy
            subtemaHoy={tree.subtemaHoy}
            horaInicio={horaInicio}
            duracionSesionMinutos={duracionSesionMinutos}
            actividades={actividades}
            accionesDocente={accionesDocente}
            accionesAlumno={accionesAlumno}
            onAbrir={setSubtemaAbierto}
          />
          <ProgresoCurso subtemas={tree.subtemas} />
        </div>

        <div id="horario-materia" className="scroll-mt-4">
          <TableroSemana
            diasClase={diasClase}
            horaInicio={horaInicio}
            duracionSesionMinutos={duracionSesionMinutos}
            subtemas={tree.subtemas}
            unidades={tree.unidades}
            estructura={tree.estructura}
            onAbrir={setSubtemaAbierto}
            unidadesAbiertas={tree.unidadesAbiertas}
            onToggleUnidad={tree.toggleUnidad}
            onCrearUnidad={tree.onCrearUnidad}
            onEliminarUnidad={tree.onEliminarUnidad}
            onCrearTema={tree.onCrearTema}
            onEliminarTema={tree.onEliminarTema}
            onUnidadActualizada={tree.onUnidadActualizada}
            onTemaActualizado={tree.onTemaActualizado}
          />
        </div>
      </div>

      <Dialog
        open={!!subtemaAbierto}
        onClose={() => setSubtemaAbierto(null)}
        title="Detalle de la sesión"
      >
        {subtemaAbierto && (
          <SubtemaDetalle
            subtema={subtemaAbierto}
            breadcrumb={`${subtemaAbierto.unidad?.nombre || `Unidad ${subtemaAbierto.unidad?.numero ?? "?"}`} · ${subtemaAbierto.temaNombre}`}
            actividades={actividades}
            accionesDocente={accionesDocente}
            accionesAlumno={accionesAlumno}
            recursos={recursos}
            onGuardado={handleGuardadoDetalle}
          />
        )}
      </Dialog>
    </>
  )
}
