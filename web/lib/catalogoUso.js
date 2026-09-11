// ============================================================
// Indicadores de uso de catálogo (Actividades, Acciones, Recursos)
// ------------------------------------------------------------
// Deriva, a partir de una lista plana de filas {catalogoId, materiaId,
// materiaNombre, subtemaNombre}, un mapa catalogoId → {count, materias,
// sesiones} listo para BadgeUso en GestionCatalogo.js. Una sola
// función compartida entre los 4 catálogos (actividad, acción
// docente, acción alumno, recurso) en vez de repetir el groupBy en
// catalogos/page.js.
// ============================================================
export function agruparUsoPorId(filas) {
  const mapa = {}
  for (const { catalogoId, materiaId, materiaNombre, subtemaNombre } of filas) {
    if (!catalogoId) continue
    if (!mapa[catalogoId]) {
      mapa[catalogoId] = { count: 0, materias: new Set(), sesiones: [] }
    }
    const entrada = mapa[catalogoId]
    entrada.count += 1
    entrada.materias.add(materiaId)
    entrada.sesiones.push({ materiaId, materiaNombre, subtemaNombre })
  }
  return mapa
}
