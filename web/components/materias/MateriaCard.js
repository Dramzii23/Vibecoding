"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, Clock3, MoreVertical, Pencil } from "lucide-react"
import ConfirmarEliminarMateria from "./ConfirmarEliminarMateria"

const DIA_LABEL = {
  lunes: "Lun",
  martes: "Mar",
  miercoles: "Mié",
  jueves: "Jue",
  viernes: "Vie",
  sabado: "Sáb",
  domingo: "Dom",
}

export default function MateriaCard({ materia, unidadesCount }) {
  const dias = (materia.horario ?? []).map((h) => h.dia)

  return (
    <article className="group relative flex min-h-48 flex-col rounded-box border border-base-300 bg-base-100 p-5 transition-colors hover:border-primary">
      <Link href={`/materias/${materia.id}`} className="flex flex-col gap-2">
        <div className="flex items-center gap-2 pr-8">
          <BookOpen className="size-4 text-primary" />
          <h3 className="truncate font-semibold">{materia.nombre}</h3>
        </div>
        <p className="flex items-center gap-1.5 text-sm text-base-content/60">
          <Clock3 className="size-3.5" />
          {unidadesCount} {unidadesCount === 1 ? "unidad" : "unidades"} ·{" "}
          {materia.duracion_sesion_minutos} min por sesión
        </p>
        {dias.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {dias.map((dia) => (
              <span key={dia} className="badge badge-sm badge-ghost">
                {DIA_LABEL[dia] ?? dia}
              </span>
            ))}
          </div>
        )}
        <span className="mt-auto flex items-center gap-1 pt-5 text-sm font-semibold text-primary">Abrir planeación <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
      </Link>

      <div className="dropdown dropdown-end absolute right-2 top-2">
        <div
          tabIndex={0}
          role="button"
          className="btn btn-ghost btn-xs btn-square"
          aria-label={`Opciones de ${materia.nombre}`}
        >
          <MoreVertical className="size-4" />
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content menu z-50 mt-2 w-40 rounded-box border border-base-200 bg-base-100 p-2 shadow-lg"
        >
          <li>
            <Link href={`/materias/${materia.id}/editar`} className="flex items-center gap-2">
              <Pencil className="size-3.5" /> Editar
            </Link>
          </li>
          <li>
            <ConfirmarEliminarMateria
              materiaId={materia.id}
              nombre={materia.nombre}
              unidadesCount={unidadesCount}
            />
          </li>
        </ul>
      </div>
    </article>
  )
}
