// ============================================================
// Fechas · semana de clase
// ------------------------------------------------------------
// Funciones puras para calcular las fechas reales de una semana
// dados los días de clase configurados en una materia (ej.
// ["lunes", "miercoles", "viernes"]). Sin dependencias externas
// (Date nativo) — el repo no tiene date-fns/dayjs instalado y no
// se justifica agregarlo solo para esto.
// ============================================================

// Mismo enum de días que MateriaWizard usa en los checkboxes.
// Exportado: horarioMateria.js y otros componentes lo reusan para no
// duplicar el mapa día→índice/label.
export const DIA_A_INDICE_ISO = {
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
  domingo: 7,
}

export const NOMBRE_DIA = {
  lunes: "Lunes",
  martes: "Martes",
  miercoles: "Miércoles",
  jueves: "Jueves",
  viernes: "Viernes",
  sabado: "Sábado",
  domingo: "Domingo",
}

function toISODate(date) {
  return date.toISOString().slice(0, 10)
}

// Lunes (00:00 local) de la semana que contiene `fechaReferencia`.
// Exportada: calendarioAcademico.js la reusa para agrupar fechas de
// sesión reales en bloques de semana calendario.
export function lunesDeLaSemana(fechaReferencia) {
  const d = new Date(fechaReferencia)
  const diaISO = d.getDay() === 0 ? 7 : d.getDay() // getDay(): 0=domingo..6=sábado
  d.setDate(d.getDate() - (diaISO - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

// Dado un Date cualquiera dentro de una semana y el array de días
// de clase configurados (["lunes","miercoles",...]), devuelve
// [{ dia, nombreDia, fechaISO }] ordenado de lunes a domingo,
// solo para los días configurados.
export function fechasDeLaSemana(fechaReferencia, diasClase) {
  const lunes = lunesDeLaSemana(fechaReferencia)
  const diasOrdenados = Object.keys(DIA_A_INDICE_ISO).filter((d) =>
    diasClase?.includes(d)
  )

  return diasOrdenados.map((dia) => {
    const indiceISO = DIA_A_INDICE_ISO[dia]
    const fecha = new Date(lunes)
    fecha.setDate(lunes.getDate() + (indiceISO - 1))
    return { dia, nombreDia: NOMBRE_DIA[dia], fechaISO: toISODate(fecha) }
  })
}

// Suma/resta N semanas a una fecha de referencia (para los
// botones de navegación anterior/siguiente del tablero).
export function sumarSemanas(fechaReferencia, n) {
  const d = new Date(fechaReferencia)
  d.setDate(d.getDate() + n * 7)
  return d
}

// Formatea una fecha ISO (YYYY-MM-DD) como "Lunes 8 sep" en español.
export function formatFechaCorta(fechaISO) {
  if (!fechaISO) return null
  return new Date(`${fechaISO}T00:00:00`).toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "short",
  })
}

// Formatea el rango "9:00 a. m.–11:00 a. m." de una sesión a partir
// de su hora de inicio ("HH:MM") y su duración en minutos. null si
// no hay hora de inicio configurada para ese día.
export function formatRangoHora(horaInicio, duracionMinutos) {
  if (!horaInicio) return null
  const [h, m] = horaInicio.split(":").map(Number)
  const inicio = new Date(2000, 0, 1, h, m)
  const fin = new Date(inicio.getTime() + (duracionMinutos ?? 120) * 60000)
  const fmt = (d) => d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })
  return `${fmt(inicio)}–${fmt(fin)}`
}

// Fecha de hoy en formato ISO (YYYY-MM-DD) — usada para traducir la
// zona droppable "hoy" (SesionDeHoy.js) a una fecha real al soltar
// un chip de tema ahí (MateriaContenido.js).
export function hoyISO() {
  return toISODate(new Date())
}

// ¿`fechaISO` (YYYY-MM-DD) es la fecha de hoy? Usado para resaltar
// el día actual en el Horario dentro de una materia.
export function esHoy(fechaISO) {
  if (!fechaISO) return false
  return fechaISO === toISODate(new Date())
}

// ¿`fechaISO` ya pasó (es anterior a hoy)? Usado para detectar temas
// que debieron impartirse y siguen con estatus "planeada" — se
// resaltan como alerta en los chips del Horario interno.
export function fechaYaPaso(fechaISO) {
  if (!fechaISO) return false
  return fechaISO < toISODate(new Date())
}
