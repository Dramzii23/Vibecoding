"use client"

import { useDroppable } from "@dnd-kit/core"
import TarjetaSubtema from "./TarjetaSubtema"

// Droppable especial "backlog": matriz de TODOS los subtemas de la
// materia (programados o no). Soltar una tarjeta aquí le quita la
// fecha (= la regresa al backlog). Se renderiza dentro del Dialog
// "Todos los temas" que abre TableroSemana.js — el título ya lo
// pone el Dialog, aquí solo el contador.
export default function BacklogSubtemas({ subtemas, onAbrir }) {
  const { setNodeRef, isOver } = useDroppable({ id: "backlog" })

  return (
    <div>
      <p className="mb-2 text-xs text-base-content/50">{subtemas.length} temas en total</p>
      <div
        ref={setNodeRef}
        className={`grid grid-cols-1 gap-2 rounded-box border p-3 sm:grid-cols-2 ${
          isOver ? "border-primary bg-primary/5" : "border-base-200 bg-base-100"
        }`}
      >
        {subtemas.map((s) => (
          <TarjetaSubtema key={s.id} subtema={s} onAbrir={onAbrir} />
        ))}
        {!subtemas.length && (
          <p className="col-span-full py-6 text-center text-sm text-base-content/50">
            Todavía no tienes sesiones. Importa tu carta descriptiva desde
            tu materia.
          </p>
        )}
      </div>
    </div>
  )
}
