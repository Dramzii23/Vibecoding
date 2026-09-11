import Link from "next/link"
import { BookOpenCheck, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import MateriaCard from "@/components/materias/MateriaCard"
import BotonMateriaPrototipo from "@/components/materias/BotonMateriaPrototipo"

export const metadata = { title: "Materias" }

export default async function MateriasPage() {
  const supabase = await createClient()

  const { data: materias } = await supabase
    .from("materias")
    .select("id, nombre, horario, duracion_sesion_minutos, unidades(id)")
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-box border border-base-300 bg-base-100 p-5 md:p-6">
        <div>
          <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><BookOpenCheck className="size-4" />Planeación académica</p>
          <h1 className="text-2xl font-bold tracking-tight">Materias</h1>
          <p className="mt-1 text-sm text-base-content/70">
            Tus materias configuradas — cada una con su propia carta
            descriptiva organizada.
          </p>
        </div>
        <div className="flex items-start gap-2">
          <BotonMateriaPrototipo />
          <Link href="/materias/nueva" className="btn btn-primary btn-sm gap-1">
            <Plus className="size-4" /> Nueva materia
          </Link>
        </div>
      </div>

      {!materias?.length ? (
        <div className="rounded-box border border-dashed border-base-300 bg-base-100 px-4 py-12 text-center">
          <p className="text-base-content/60">
            Todavía no tienes ninguna materia configurada.
          </p>
          <Link href="/materias/nueva" className="btn btn-primary mt-4">
            Configura tu primera materia
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {materias.map((materia) => (
            <MateriaCard
              key={materia.id}
              materia={materia}
              unidadesCount={materia.unidades?.length ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
