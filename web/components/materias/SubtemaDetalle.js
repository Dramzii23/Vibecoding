"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import SelectorConSugerenciaIA from "./SelectorConSugerenciaIA"
import CampoConSugerenciaIA from "./CampoConSugerenciaIA"
import SelectorRecursos from "./SelectorRecursos"
import { guardarDetalleSubtema } from "@/app/(app)/materias/[id]/actions"
import {
  crearActividadRapida,
  crearAccionRapida,
} from "@/app/(app)/catalogos/actions"

// Contenido del Dialog de detalle de un subtema. Muestra el
// breadcrumb (solo lectura), y por cada sección un selector de
// catálogo o campo con botón "Sugerir con IA".
export default function SubtemaDetalle({
  subtema,
  breadcrumb,
  actividades,
  accionesDocente,
  accionesAlumno,
  recursos,
  onGuardado,
}) {
  const router = useRouter()
  const [campos, setCampos] = useState({
    actividad_id: subtema.actividad_id ?? null,
    accion_docente_id: subtema.accion_docente_id ?? null,
    accion_alumno_id: subtema.accion_alumno_id ?? null,
    materiales_equipo: subtema.materiales_equipo ?? subtema.materialesTema ?? "",
    referencias: subtema.referencias ?? "",
  })
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState(null)

  function set(campo, valor) {
    setCampos((prev) => ({ ...prev, [campo]: valor }))
  }

  function handleGuardar() {
    setError(null)
    startTransition(async () => {
      const resultado = await guardarDetalleSubtema(subtema.id, campos)
      if (resultado?.error) {
        setError(resultado.error)
      } else {
        onGuardado?.(campos)
      }
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-base-content/60">{breadcrumb}</p>
      <p className="font-medium">{subtema.nombre}</p>

      {/* Texto libre extraído por la IA, mostrado como referencia si
          todavía no se formalizó con catálogo. */}
      {!campos.actividad_id && subtema.actividad_preasignada && (
        <p className="rounded-lg bg-base-200 px-3 py-2 text-xs text-base-content/60">
          Actividad detectada en tu carta descriptiva: "{subtema.actividad_preasignada}" —
          elige o crea una entrada de catálogo abajo para formalizarla.
        </p>
      )}

      <div className="space-y-1">
        <span className="text-sm font-medium">Actividad</span>
        <SelectorConSugerenciaIA
          items={actividades}
          value={campos.actividad_id}
          onChange={(v) => set("actividad_id", v)}
          crearAction={crearActividadRapida}
          subtemaId={subtema.id}
          campo="actividad"
          campoActual={subtema.actividad_preasignada}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <span className="text-sm font-medium">Acción del docente</span>
          <SelectorConSugerenciaIA
            items={accionesDocente}
            value={campos.accion_docente_id}
            onChange={(v) => set("accion_docente_id", v)}
            crearAction={crearAccionRapida}
            extraFields={{ tipo: "docente" }}
            subtemaId={subtema.id}
            campo="accion_docente"
            campoActual={subtema.accion_docente}
          />
          {!campos.accion_docente_id && subtema.accion_docente && (
            <p className="text-xs text-base-content/50">
              De la carta descriptiva: "{subtema.accion_docente}"
            </p>
          )}
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium">Acción del alumno</span>
          <SelectorConSugerenciaIA
            items={accionesAlumno}
            value={campos.accion_alumno_id}
            onChange={(v) => set("accion_alumno_id", v)}
            crearAction={crearAccionRapida}
            extraFields={{ tipo: "alumno" }}
            subtemaId={subtema.id}
            campo="accion_alumno"
            campoActual={subtema.accion_alumno}
          />
          {!campos.accion_alumno_id && subtema.accion_alumno && (
            <p className="text-xs text-base-content/50">
              De la carta descriptiva: "{subtema.accion_alumno}"
            </p>
          )}
        </div>
      </div>

      <CampoConSugerenciaIA
        label="Equipo / materiales"
        subtemaId={subtema.id}
        campo="equipo"
        value={campos.materiales_equipo}
        onChange={(v) => set("materiales_equipo", v)}
        rows={2}
      />

      <div className="space-y-1">
        <span className="text-sm font-medium">Recursos</span>
        <SelectorRecursos
          subtemaId={subtema.id}
          recursosAsignados={subtema.recursos ?? []}
          todosLosRecursos={recursos ?? []}
          onCambiar={() => router.refresh()}
        />
      </div>

      <CampoConSugerenciaIA
        label="Referencias"
        subtemaId={subtema.id}
        campo="referencias"
        value={campos.referencias}
        onChange={(v) => set("referencias", v)}
        rows={3}
      />

      {error && (
        <div role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleGuardar}
        disabled={pending}
        className="btn btn-primary w-full"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </div>
  )
}
