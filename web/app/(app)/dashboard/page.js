import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import DashboardHeader from "./DashboardHeader"
import HorarioMaterias from "./HorarioMaterias"
import DashboardSesionesHoy from "./DashboardSesionesHoy"

export const metadata = { title: "Dashboard" }

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

// Dashboard = Horario del docente: cuadrícula día×hora con TODAS
// sus materias (no filtra por una "materia actual" — para eso está
// /materias/[id], el horario interno de cada materia).
export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: materias } = await supabase
    .from("materias")
    .select("id, nombre, horario, duracion_sesion_minutos")
    .order("created_at", { ascending: true })

  if (!materias?.length) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Todavía no tienes ninguna materia configurada.
          </p>
        </div>
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 px-4 py-12 text-center">
          <p className="text-base-content/60">
            Configura tu primera materia y sube su carta descriptiva para
            que la IA organice tus temas y subtemas.
          </p>
          <Link href="/materias/nueva" className="btn btn-primary mt-4">
            Configura tu primera materia
          </Link>
        </div>
      </div>
    )
  }

  // Subtemas de HOY de TODAS las materias (no una sola) — el
  // acordeón "Sesión de hoy" resuelve en cliente qué materias tienen
  // clase hoy (necesita la hora real del navegador) y busca aquí el
  // subtema correspondiente a cada una. Mismo patrón de joins
  // anidados que ya usa materias/[id]/page.js, sin filtrar por una
  // materia.
  //
  // También se traen TODOS los subtemas (con o sin fecha) de TODAS
  // las materias, para "Progreso del curso" de la materia que el
  // profesor tenga expandida en el acordeón — una sola query grande
  // en vez de un fetch bajo demanda por materia (volumen pequeño por
  // docente, evita un loading state al expandir).
  const [
    { data: subtemasHoyRaw },
    { data: todosLosSubtemasRaw },
    { data: actividades },
    { data: accionesDocente },
    { data: accionesAlumno },
    { data: recursos },
  ] = await Promise.all([
    supabase
      .from("subtemas")
      .select(
        `id, nombre, fecha, accion_docente, accion_alumno,
         actividad_preasignada, materiales_equipo, referencias, estatus,
         actividad_id, accion_docente_id, accion_alumno_id,
         actividad:actividades ( id, nombre ),
         subtema_recursos ( recurso:recursos ( id, nombre ) ),
         tema:temas!inner ( nombre, materiales_equipo,
           unidad:unidades!inner ( numero, nombre, materia_id ) )`
      )
      .eq("fecha", hoyISO()),
    supabase
      .from("subtemas")
      .select(
        `id, estatus, fecha,
         tema:temas!inner ( unidad:unidades!inner ( materia_id ) )`
      ),
    supabase.from("actividades").select("id, nombre").order("nombre"),
    supabase.from("acciones").select("id, nombre").eq("tipo", "docente").order("nombre"),
    supabase.from("acciones").select("id, nombre").eq("tipo", "alumno").order("nombre"),
    supabase.from("recursos").select("id, nombre").order("nombre"),
  ])

  const subtemasDeHoy = (subtemasHoyRaw ?? []).map((s) => ({
    ...s,
    temaNombre: s.tema?.nombre,
    materialesTema: s.tema?.materiales_equipo,
    unidad: s.tema?.unidad,
    materiaId: s.tema?.unidad?.materia_id,
    recursos: (s.subtema_recursos ?? []).map((sr) => sr.recurso).filter(Boolean),
  }))

  const todosLosSubtemas = (todosLosSubtemasRaw ?? []).map((s) => ({
    id: s.id,
    estatus: s.estatus,
    fecha: s.fecha,
    materiaId: s.tema?.unidad?.materia_id,
  }))

  return (
    <div className="space-y-6">
      <DashboardHeader materias={materias} />
      <DashboardSesionesHoy
        materias={materias}
        subtemasDeHoy={subtemasDeHoy}
        todosLosSubtemas={todosLosSubtemas}
        actividades={actividades ?? []}
        accionesDocente={accionesDocente ?? []}
        accionesAlumno={accionesAlumno ?? []}
        recursos={recursos ?? []}
      />
      <HorarioMaterias materias={materias} />
    </div>
  )
}
