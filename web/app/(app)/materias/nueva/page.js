import config from "@/config"
import MateriaWizard from "@/components/materias/wizard/MateriaWizard"
import { FileUp } from "lucide-react"

export const metadata = { title: "Nueva materia" }

export default function NuevaMateriaPage() {
  if (!config.features.cartaDescriptivaIA) {
    return (
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-base-content/60">
          El importador de carta descriptiva está desactivado en{" "}
          <code>config.features.cartaDescriptivaIA</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-box border border-base-300 bg-base-100 p-5 md:p-6">
        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary"><FileUp className="size-4" />Importación guiada</p>
        <h1 className="text-2xl font-bold tracking-tight">Nueva materia</h1>
        <p className="mt-1 text-sm text-base-content/70">
          Sube tu carta descriptiva y te guiamos paso a paso para dejar todo
          listo.
        </p>
      </div>
      <div className="rounded-box border border-base-300 bg-base-100 p-5 md:p-7"><MateriaWizard /></div>
    </div>
  )
}
