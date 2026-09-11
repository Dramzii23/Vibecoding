import { createClient } from "@/lib/supabase/server"
import GestionCatalogo from "@/components/catalogos/GestionCatalogo"
import CatalogoRecursos from "@/components/catalogos/CatalogoRecursos"
import { agruparUsoPorId } from "@/lib/catalogoUso"
import { LibraryBig } from "lucide-react"
import {
  crearActividad,
  actualizarActividad,
  eliminarActividad,
  crearAccion,
  actualizarAccion,
  eliminarAccion,
} from "./actions"

export const metadata = { title: "Catálogos" }

// Selecciona todos los subtemas con su materia resuelta (vía
// tema→unidad→materia) y los 3 ids de catálogo — una sola query
// reutilizada para derivar el uso de actividades/acciones. Los
// recursos (N:N) se resuelven aparte por subtema_recursos.
async function cargarUsoSubtemas(supabase) {
  const { data } = await supabase
    .from("subtemas")
    .select(
      `id, nombre, actividad_id, accion_docente_id, accion_alumno_id,
       tema:temas!inner ( unidad:unidades!inner ( materia:materias!inner ( id, nombre ) ) )`
    )
  return (data ?? []).map((s) => ({
    id: s.id,
    nombre: s.nombre,
    actividad_id: s.actividad_id,
    accion_docente_id: s.accion_docente_id,
    accion_alumno_id: s.accion_alumno_id,
    materiaId: s.tema?.unidad?.materia?.id,
    materiaNombre: s.tema?.unidad?.materia?.nombre,
  }))
}

export default async function CatalogosPage() {
  const supabase = await createClient()

  const [
    { data: actividades },
    { data: accionesDocente },
    { data: accionesAlumno },
    { data: recursos },
    { data: materias },
    subtemasUso,
    { data: subtemaRecursos },
  ] = await Promise.all([
    supabase.from("actividades").select("id, nombre, descripcion").order("nombre"),
    supabase.from("acciones").select("id, nombre").eq("tipo", "docente").order("nombre"),
    supabase.from("acciones").select("id, nombre").eq("tipo", "alumno").order("nombre"),
    supabase.from("recursos").select("id, nombre, storage_path").order("nombre"),
    supabase.from("materias").select("id, nombre").order("nombre"),
    cargarUsoSubtemas(supabase),
    supabase
      .from("subtema_recursos")
      .select(
        `recurso_id,
         subtema:subtemas!inner ( id, nombre,
           tema:temas!inner ( unidad:unidades!inner ( materia:materias!inner ( id, nombre ) ) ) )`
      ),
  ])

  const usoActividades = agruparUsoPorId(
    subtemasUso.map((s) => ({
      catalogoId: s.actividad_id,
      materiaId: s.materiaId,
      materiaNombre: s.materiaNombre,
      subtemaNombre: s.nombre,
    }))
  )
  const usoAccionesDocente = agruparUsoPorId(
    subtemasUso.map((s) => ({
      catalogoId: s.accion_docente_id,
      materiaId: s.materiaId,
      materiaNombre: s.materiaNombre,
      subtemaNombre: s.nombre,
    }))
  )
  const usoAccionesAlumno = agruparUsoPorId(
    subtemasUso.map((s) => ({
      catalogoId: s.accion_alumno_id,
      materiaId: s.materiaId,
      materiaNombre: s.materiaNombre,
      subtemaNombre: s.nombre,
    }))
  )
  const usoRecursos = agruparUsoPorId(
    (subtemaRecursos ?? []).map((sr) => ({
      catalogoId: sr.recurso_id,
      materiaId: sr.subtema?.tema?.unidad?.materia?.id,
      materiaNombre: sr.subtema?.tema?.unidad?.materia?.nombre,
      subtemaNombre: sr.subtema?.nombre,
    }))
  )

  // URLs firmadas (1h) para descarga — se resuelven en cada carga de
  // página en vez de guardarse, porque expiran.
  const recursosConUrl = await Promise.all(
    (recursos ?? []).map(async (r) => {
      const { data } = await supabase.storage
        .from("recursos")
        .createSignedUrl(r.storage_path, 3600)
      return { ...r, urlDescarga: data?.signedUrl ?? null }
    })
  )

  return (
    <div className="space-y-6">
      <div className="rounded-box border border-base-300 bg-base-100 p-5 md:p-6">
        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><LibraryBig className="size-4" />Biblioteca reutilizable</p>
        <h1 className="text-2xl font-bold tracking-tight">Catálogos</h1>
        <p className="mt-1 text-sm text-base-content/70">
          Entradas reutilizables entre todas tus materias — actividades,
          acciones y recursos que asignas a tus sesiones.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-4">
        <GestionCatalogo
          titulo="Actividades"
          items={actividades ?? []}
          crearAction={crearActividad}
          actualizarAction={actualizarActividad}
          eliminarAction={eliminarActividad}
          campos={[{ name: "descripcion", label: "Descripción (opcional)", type: "textarea" }]}
          usoPorId={usoActividades}
        />
        <GestionCatalogo
          titulo="Acciones del docente"
          items={accionesDocente ?? []}
          crearAction={crearAccion}
          actualizarAction={actualizarAccion}
          eliminarAction={eliminarAccion}
          extraFields={{ tipo: "docente" }}
          usoPorId={usoAccionesDocente}
        />
        <GestionCatalogo
          titulo="Acciones del alumno"
          items={accionesAlumno ?? []}
          crearAction={crearAccion}
          actualizarAction={actualizarAccion}
          eliminarAction={eliminarAccion}
          extraFields={{ tipo: "alumno" }}
          usoPorId={usoAccionesAlumno}
        />
        <CatalogoRecursos recursos={recursosConUrl} usoPorId={usoRecursos} materias={materias ?? []} />
      </div>
    </div>
  )
}
