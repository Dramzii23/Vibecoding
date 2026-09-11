import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil, BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import ConfirmarEliminarMateria from "@/components/materias/ConfirmarEliminarMateria"
import { colorSolidoMateria } from "@/lib/colorMateria"
import { formatRangoHora } from "@/lib/fechas/semanaClase"
import MateriaContenido from "./MateriaContenido"

export const metadata = { title: "Materia" }

const DIA_LABEL = {
  lunes: "Lun", martes: "Mar", miercoles: "Mié", jueves: "Jue",
  viernes: "Vie", sabado: "Sáb", domingo: "Dom",
}

// Página de UNA materia: bloque "Sesión de hoy" + "Progreso del
// curso" (dona) + horario interno (fechas reales de la semana,
// subtemas de ESTA materia únicamente) + "Todos los temas (N)" —
// a diferencia del Horario del dashboard (todas las materias, sin
// fechas de calendario).
export default async function MateriaPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: materia } = await supabase
    .from("materias")
    .select("id, nombre, horario, duracion_sesion_minutos, unidades(id)")
    .eq("id", id)
    .single()

  if (!materia) notFound()

  // Raíz de la query es `unidades` (no `temas`): así una unidad
  // recién creada SIN temas todavía sigue apareciendo — con
  // `temas!inner` como raíz, una unidad vacía desaparecía por
  // completo del resultado (inner join). subtemas no tiene
  // materia_id directo: sube por tema → unidad → materia. Traemos
  // TODOS los subtemas (con o sin fecha — el backlog los necesita
  // todos), con sus catálogos resueltos.
  const [{ data: unidadesData, error }, { data: actividades }, { data: accionesDocente }, { data: accionesAlumno }, { data: recursos }] =
    await Promise.all([
      supabase
        .from("unidades")
        .select(
          `id, numero, nombre, objetivo, semana_inicio, semana_fin,
           temas ( id, nombre, materiales_equipo, orden, unidad_id,
             subtemas ( id, nombre, fecha, semana, accion_docente, accion_alumno,
               actividad_preasignada, materiales_equipo, referencias, estatus, orden,
               actividad_id, accion_docente_id, accion_alumno_id,
               actividad:actividades ( id, nombre ),
               subtema_recursos ( recurso:recursos ( id, nombre ) ) ) )`
        )
        .eq("materia_id", materia.id)
        .order("numero", { ascending: true }),
      supabase.from("actividades").select("id, nombre").order("nombre"),
      supabase.from("acciones").select("id, nombre").eq("tipo", "docente").order("nombre"),
      supabase.from("acciones").select("id, nombre").eq("tipo", "alumno").order("nombre"),
      supabase.from("recursos").select("id, nombre").order("nombre"),
    ])

  // Unidades tal como las consume el CRUD del Horario interno — sin
  // sus temas anidados (esos viven aparte, dentro de `estructura`,
  // para poder editarlos/arrastrarlos independiente de los
  // subtemas).
  const unidades = (unidadesData ?? []).map((u) => ({
    id: u.id,
    numero: u.numero,
    nombre: u.nombre,
    objetivo: u.objetivo,
    semanaInicio: u.semana_inicio,
    semanaFin: u.semana_fin,
  }))

  // Estructura Unidad → Tema (sin subtemas) que usa TableroSemana.js
  // para el CRUD y el drag-and-drop de temas entre unidades — misma
  // fuente de datos que `unidades`, separada de `subtemas` (abajo)
  // para no duplicar el árbol completo en cada subtema.
  const estructura = (unidadesData ?? []).map((u) => ({
    unidadId: u.id,
    temas: (u.temas ?? [])
      .slice()
      .sort((a, b) => a.orden - b.orden)
      .map((t) => ({ id: t.id, nombre: t.nombre, horasTotales: t.horas_totales, orden: t.orden })),
  }))

  const subtemas = []
  for (const unidad of unidadesData ?? []) {
    for (const tema of unidad.temas ?? []) {
      for (const subtema of tema.subtemas ?? []) {
        subtemas.push({
          ...subtema,
          temaId: tema.id,
          temaNombre: tema.nombre,
          temaOrden: tema.orden,
          materialesTema: tema.materiales_equipo,
          unidad: { id: unidad.id, numero: unidad.numero, nombre: unidad.nombre, objetivo: unidad.objetivo },
          recursos: (subtema.subtema_recursos ?? []).map((sr) => sr.recurso).filter(Boolean),
        })
      }
    }
  }

  // Un único horario "primario" para el tablero de fechas reales: si
  // hay varios días con horas distintas, se toma la primera entrada
  // (el tablero solo necesita una duración/hora de referencia visual
  // por columna — cada columna ya trae su propio día real).
  const horaInicio = materia.horario?.[0]?.hora_inicio ?? null
  const diasClase = (materia.horario ?? []).map((h) => h.dia)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-box border border-base-300 bg-base-100 p-5">
        <div className="flex items-start gap-3">
          <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl text-white ${colorSolidoMateria(materia.id)}`}>
            <BookOpen className="size-6" />
          </span>
          <div>
            <Link href="/materias" className="text-xs text-base-content/50 hover:underline">
              ← Materias
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">{materia.nombre}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {diasClase.length > 0 && (
                <span className="badge badge-ghost badge-sm gap-1">
                  {diasClase.map((d) => DIA_LABEL[d] ?? d).join(" · ")}
                </span>
              )}
              {horaInicio && (
                <span className="badge badge-ghost badge-sm">
                  {formatRangoHora(horaInicio, materia.duracion_sesion_minutos)}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/materias/${materia.id}/editar`} className="btn btn-ghost btn-sm gap-1.5">
            <Pencil className="size-4" /> Editar materia
          </Link>
          <ConfirmarEliminarMateria
            materiaId={materia.id}
            nombre={materia.nombre}
            unidadesCount={materia.unidades?.length ?? 0}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          No pudimos cargar tus sesiones: {error.message}
        </div>
      )}

      <MateriaContenido
        materiaId={materia.id}
        subtemasIniciales={subtemas}
        unidadesIniciales={unidades}
        estructuraInicial={estructura}
        diasClase={diasClase}
        horaInicio={horaInicio}
        duracionSesionMinutos={materia.duracion_sesion_minutos}
        actividades={actividades ?? []}
        accionesDocente={accionesDocente ?? []}
        accionesAlumno={accionesAlumno ?? []}
        recursos={recursos ?? []}
      />
    </div>
  )
}
