// ============================================================
// Fechas · calendario académico del semestre
// ------------------------------------------------------------
// Funciones puras para el paso "Calendario" del wizard de materia:
// dado un rango de fechas real (inicio/fin de semestre) y los días
// de la semana con clase, calcula las sesiones hábiles reales
// (excluyendo festivos) y reparte temas/unidades sobre ellas —
// TODO determinístico, sin segunda llamada a IA (decisión explícita
// del usuario). Mismo estilo que semanaClase.js/horarioMateria.js:
// Date nativo, sin dependencias externas.
// ============================================================

import { DIA_A_INDICE_ISO, lunesDeLaSemana } from "./semanaClase"

function toISODate(date) {
  return date.toISOString().slice(0, 10)
}

// N-ésimo día de la semana (0=domingo..6=sábado) de un mes dado —
// usado para festivos que la Ley Federal del Trabajo define como
// "primer lunes de febrero", "tercer lunes de marzo/noviembre" en
// vez de una fecha fija. Calculado por fórmula, no hardcodeado por
// año: cubre cualquier año sin mantenimiento.
function nEsimoDiaSemanaDelMes(año, mesIndice0, diaSemana, n) {
  const primero = new Date(año, mesIndice0, 1)
  const offset = (diaSemana - primero.getDay() + 7) % 7
  const dia = 1 + offset + (n - 1) * 7
  return new Date(año, mesIndice0, dia)
}

// Festivos oficiales de México (Ley Federal del Trabajo, Art. 74) —
// única fuente soportada por ahora (decisión: lista fija en código,
// sin API externa). Devuelve [{fecha: "YYYY-MM-DD", nombre}] para
// el año dado. Si el rango del semestre cruza dos años (ej.
// agosto-enero), el caller debe llamar esta función para cada año
// del rango — ver diasFestivosEnRango.
export function diasFestivosMexico(año) {
  return [
    { fecha: toISODate(new Date(año, 0, 1)), nombre: "Año Nuevo" },
    { fecha: toISODate(nEsimoDiaSemanaDelMes(año, 1, 1, 1)), nombre: "Aniversario de la Constitución" },
    { fecha: toISODate(nEsimoDiaSemanaDelMes(año, 2, 1, 3)), nombre: "Natalicio de Benito Juárez" },
    { fecha: toISODate(new Date(año, 4, 1)), nombre: "Día del Trabajo" },
    { fecha: toISODate(new Date(año, 8, 16)), nombre: "Día de la Independencia" },
    { fecha: toISODate(nEsimoDiaSemanaDelMes(año, 10, 1, 3)), nombre: "Aniversario de la Revolución Mexicana" },
    { fecha: toISODate(new Date(año, 11, 25)), nombre: "Navidad" },
  ]
}

// Festivos de México para todos los años que toca un rango de
// fechas (inclusive) — el semestre puede cruzar de un año a otro.
export function diasFestivosEnRango(fechaInicioISO, fechaFinISO) {
  const añoInicio = new Date(`${fechaInicioISO}T00:00:00`).getFullYear()
  const añoFin = new Date(`${fechaFinISO}T00:00:00`).getFullYear()
  const festivos = []
  for (let año = añoInicio; año <= añoFin; año++) {
    festivos.push(...diasFestivosMexico(año))
  }
  return festivos.filter((f) => f.fecha >= fechaInicioISO && f.fecha <= fechaFinISO)
}

// Dado un rango de fechas (inclusive) y los días de la semana con
// clase (["lunes","miercoles",...], mismo vocabulario que
// materias.horario), devuelve las fechas ISO reales de cada sesión
// — excluyendo las fechas en `festivosExcluidos` (array de "YYYY-MM-DD",
// solo los que el usuario confirmó como inhábiles en el paso de
// Calendario, no automáticamente todos los de diasFestivosMexico).
export function sesionesHabiles({ fechaInicioISO, fechaFinISO, diasClaseSemana, festivosExcluidos = [] }) {
  if (!fechaInicioISO || !fechaFinISO || !diasClaseSemana?.length) return []

  const indicesISO = new Set(diasClaseSemana.map((d) => DIA_A_INDICE_ISO[d]).filter(Boolean))
  const excluidos = new Set(festivosExcluidos)

  const sesiones = []
  const cursor = new Date(`${fechaInicioISO}T00:00:00`)
  const fin = new Date(`${fechaFinISO}T00:00:00`)

  while (cursor <= fin) {
    const diaISO = cursor.getDay() === 0 ? 7 : cursor.getDay()
    const fechaISO = toISODate(cursor)
    if (indicesISO.has(diaISO) && !excluidos.has(fechaISO)) {
      sesiones.push(fechaISO)
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return sesiones
}

// Reparte un array de fechas de sesión (ya calculado por
// sesionesHabiles) entre las unidades configuradas. Proporcional a
// `pesoHoras` de cada unidad si se provee (ej. suma de
// horas_totales de sus temas, extraída por la IA) — si no hay pesos
// (todas 0/undefined), reparte equitativamente. Determinístico, sin
// IA. Devuelve un array paralelo a `unidades`:
// [{ numero, fechas: ["YYYY-MM-DD", ...] }].
export function distribuirEnUnidades(sesiones, unidades, pesoHorasPorUnidad = {}) {
  if (!unidades?.length || !sesiones?.length) {
    return (unidades ?? []).map((u) => ({ numero: u.numero, fechas: [] }))
  }

  const pesos = unidades.map((u) => pesoHorasPorUnidad[u.numero] || 0)
  const sumaPesos = pesos.reduce((a, b) => a + b, 0)
  const proporciones = sumaPesos > 0
    ? pesos.map((p) => p / sumaPesos)
    : unidades.map(() => 1 / unidades.length)

  // Reparto por proporción, con redondeo hacia abajo y las sesiones
  // sobrantes (por redondeo) asignadas a la última unidad — evita
  // perder sesiones por truncamiento.
  const cantidades = proporciones.map((p) => Math.floor(p * sesiones.length))
  const asignadas = cantidades.reduce((a, b) => a + b, 0)
  cantidades[cantidades.length - 1] += sesiones.length - asignadas

  let cursor = 0
  return unidades.map((u, i) => {
    const cantidad = cantidades[i]
    const fechas = sesiones.slice(cursor, cursor + cantidad)
    cursor += cantidad
    return { numero: u.numero, fechas }
  })
}

// Agrupa un array plano de fechas ISO de sesión en bloques de
// "semana calendario" (lunes-domingo) — nivel de agrupación que usa
// la vista de revisión del wizard (una fila colapsable por semana,
// igual que el HTML de referencia del usuario: "Martes 4 y jueves 6
// de agosto" es una sola fila, no dos). Asume `fechas` ya viene
// ordenado ascendente (como lo entrega sesionesHabiles/
// distribuirEnUnidades). Devuelve [{ fechaInicioSemana: "YYYY-MM-DD",
// fechas: ["YYYY-MM-DD", ...] }] en el mismo orden.
export function agruparEnSemanas(fechas) {
  const bloques = []
  let bloqueActual = null

  for (const fechaISO of fechas ?? []) {
    const inicioSemana = toISODate(lunesDeLaSemana(`${fechaISO}T00:00:00`))
    if (!bloqueActual || bloqueActual.fechaInicioSemana !== inicioSemana) {
      bloqueActual = { fechaInicioSemana: inicioSemana, fechas: [] }
      bloques.push(bloqueActual)
    }
    bloqueActual.fechas.push(fechaISO)
  }
  return bloques
}
