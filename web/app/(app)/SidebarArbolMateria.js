"use client"

import { useMateriaTree } from "./materias/[id]/MateriaTreeContext"
import ArbolMaterial from "./materias/[id]/ArbolMaterial"

// Render del árbol Unidad → Tema en el sidebar global (layout.js),
// justo debajo de la navegación. Solo aparece cuando hay una materia
// abierta (MateriaContenido.js la registró en el contexto); en
// dashboard, chat, catálogos, etc. no muestra nada. El estado y el
// DndContext los provee MateriaTreeProvider (que envuelve toda la
// zona privada), así que editar/arrastrar aquí se refleja en vivo en
// el Horario interno de la página, y viceversa.
export default function SidebarArbolMateria() {
  const tree = useMateriaTree()
  if (!tree.materiaId) return null

  return (
    <div className="border-t border-base-200 pt-3">
      <ArbolMaterial
        unidades={tree.unidades}
        estructura={tree.estructura}
        subtemas={tree.subtemas}
        unidadesAbiertas={tree.unidadesAbiertas}
        onToggleUnidad={tree.toggleUnidad}
        onIrATema={tree.irATema}
        onCrearUnidad={tree.onCrearUnidad}
        onEliminarUnidad={tree.onEliminarUnidad}
        onCrearTema={tree.onCrearTema}
        onEliminarTema={tree.onEliminarTema}
        onUnidadActualizada={tree.onUnidadActualizada}
        onTemaActualizado={tree.onTemaActualizado}
      />
    </div>
  )
}
