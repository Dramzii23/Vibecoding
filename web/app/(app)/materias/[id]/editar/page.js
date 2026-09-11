import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import FormularioEditarMateria from "./FormularioEditarMateria"

export const metadata = { title: "Editar materia" }

// Edición simple de una sola pantalla (nombre, horario, duración,
// formato) — NO es el wizard de 5 pasos, ese es solo para crear.
export default async function EditarMateriaPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: materia } = await supabase
    .from("materias")
    .select("id, nombre, horario, duracion_sesion_minutos, formato_semestre")
    .eq("id", id)
    .single()

  if (!materia) notFound()

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Editar materia</h1>
        <p className="mt-1 text-sm text-base-content/70">
          Ajusta el nombre, días/horario o duración de sesión de {materia.nombre}.
        </p>
      </div>
      <FormularioEditarMateria materia={materia} />
    </div>
  )
}
