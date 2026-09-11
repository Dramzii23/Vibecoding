// ============================================================
// Color por materia — hash estable del id sobre una paleta fija
// ------------------------------------------------------------
// Compartido entre TarjetaMateria.js (Horario del dashboard) y el
// header de /materias/[id], para que una misma materia se vea con
// el mismo color en ambas pantallas sin guardar nada en BD.
// ============================================================

// Pastel saturado — variantes con más cuerpo que un simple /10 de
// opacidad, para que las tarjetas del Horario se lean como bloques
// de color (como en un calendario real) y no solo bordes tenues.
const PALETA = [
  { badge: "border-violet-300 bg-violet-100 text-violet-800", solido: "bg-violet-500" },
  { badge: "border-emerald-300 bg-emerald-100 text-emerald-800", solido: "bg-emerald-500" },
  { badge: "border-primary/40 bg-primary/15 text-primary", solido: "bg-primary" },
  { badge: "border-amber-300 bg-amber-100 text-amber-800", solido: "bg-amber-500" },
  { badge: "border-rose-300 bg-rose-100 text-rose-800", solido: "bg-rose-500" },
  { badge: "border-cyan-300 bg-cyan-100 text-cyan-800", solido: "bg-cyan-500" },
]

function indicePara(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return hash % PALETA.length
}

// Clases de borde+fondo+texto pastel, para tarjetas/badges (Horario
// del dashboard, badges de días).
export function colorMateria(id) {
  return PALETA[indicePara(id)].badge
}

// Clase de fondo sólido, para el ícono cuadrado del header de
// /materias/[id].
export function colorSolidoMateria(id) {
  return PALETA[indicePara(id)].solido
}
