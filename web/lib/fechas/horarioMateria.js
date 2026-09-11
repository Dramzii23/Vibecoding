// ============================================================
// Fechas · horario de materia (Horario del dashboard)
// ------------------------------------------------------------
// Funciones puras para el Horario global (cuadrícula día×hora con
// TODAS las materias del docente). A diferencia de semanaClase.js
// (que resuelve fechas reales de una semana para el Horario DENTRO
// de una materia), aquí se trabaja directo con el shape
// materias.horario: [{dia, hora_inicio}] — sin fechas de calendario,
// solo día de la semana + hora.
// ============================================================

import { DIA_A_INDICE_ISO } from "./semanaClase"

// Minutos desde medianoche de una hora "HH:MM".
function minutosDesdeMedianoche(hora) {
  const [h, m] = hora.split(":").map(Number)
  return h * 60 + m
}

// Dado el horario de una materia y su duración, expande a
// [{dia, horaInicio, horaFin}] — una entrada por día configurado.
// horaFin se calcula sumando duracionMinutos a horaInicio, formato
// "HH:MM" (24h, para comparar/posicionar en la grilla). Descarta
// entradas sin hora_inicio (día marcado pero sin hora capturada —
// puede pasar con materias migradas de un horario previo sin hora)
// en vez de romper: esa materia queda como "sin horario asignado"
// para ese día, mostrada aparte en el Horario del dashboard.
export function expandirHorario(horario, duracionMinutos) {
  return (horario ?? [])
    .filter((h) => h?.dia && h?.hora_inicio)
    .map(({ dia, hora_inicio }) => {
      const finMin = minutosDesdeMedianoche(hora_inicio) + (duracionMinutos ?? 120)
      const horaFin = `${String(Math.floor(finMin / 60)).padStart(2, "0")}:${String(finMin % 60).padStart(2, "0")}`
      return { dia, horaInicio: hora_inicio, horaFin }
    })
}

// ¿Se cruzan dos rangos de hora "HH:MM"? (fin exclusivo: terminar a
// las 11:00 justo cuando otra empieza a las 11:00 no es traslape).
export function rangosSeCruzan(inicioA, finA, inicioB, finB) {
  const a1 = minutosDesdeMedianoche(inicioA)
  const a2 = minutosDesdeMedianoche(finA)
  const b1 = minutosDesdeMedianoche(inicioB)
  const b2 = minutosDesdeMedianoche(finB)
  return a1 < b2 && b1 < a2
}

// Dado el horario ya expandido de la materia que se acaba de mover
// (`entradaMovida`: {dia, horaInicio, horaFin}) y el resto de
// materias (cada una con {id, nombre, horario, duracionMinutos}),
// devuelve las materias con las que choca ese día: [{materia, dia}].
// Compara el conjunto completo de días de la otra materia — si
// comparte el día movido y sus horas se cruzan, hay traslape.
export function detectarTraslapes(entradaMovida, materiaId, materias) {
  const traslapes = []
  for (const materia of materias) {
    if (materia.id === materiaId) continue
    const entradas = expandirHorario(materia.horario, materia.duracionMinutos)
    for (const entrada of entradas) {
      if (entrada.dia !== entradaMovida.dia) continue
      if (rangosSeCruzan(entradaMovida.horaInicio, entradaMovida.horaFin, entrada.horaInicio, entrada.horaFin)) {
        traslapes.push({ materia, dia: entrada.dia })
      }
    }
  }
  return traslapes
}

// Sugiere hasta `cantidad` horarios libres (misma duración) cerca de
// una hora objetivo en un día, dentro de [horaMin, horaMax) (enteros,
// ej. 7 a 21). Prioriza el mismo día, probando primero horas más
// cercanas a la objetivo (alternando antes/después). `ocupacion` es
// la lista de entradas {dia, horaInicio, horaFin} de TODAS las
// materias del docente (incluida la que se está moviendo, se excluye
// por posición ya resuelta por el caller si hace falta).
export function sugerirHuecos(dia, horaObjetivo, duracionMinutos, ocupacion, { horaMin = 7, horaMax = 21, cantidad = 3 } = {}) {
  const objetivoMin = minutosDesdeMedianoche(horaObjetivo)
  const candidatos = []
  for (let m = horaMin * 60; m + duracionMinutos <= horaMax * 60; m += 30) {
    candidatos.push(m)
  }
  candidatos.sort((a, b) => Math.abs(a - objetivoMin) - Math.abs(b - objetivoMin))

  const libres = []
  for (const inicioMin of candidatos) {
    const horaInicio = `${String(Math.floor(inicioMin / 60)).padStart(2, "0")}:${String(inicioMin % 60).padStart(2, "0")}`
    const finMin = inicioMin + duracionMinutos
    const horaFin = `${String(Math.floor(finMin / 60)).padStart(2, "0")}:${String(finMin % 60).padStart(2, "0")}`

    const chocaEnEsteDia = ocupacion.some(
      (e) => e.dia === dia && rangosSeCruzan(horaInicio, horaFin, e.horaInicio, e.horaFin)
    )
    if (!chocaEnEsteDia) {
      libres.push({ dia, horaInicio, horaFin })
      if (libres.length >= cantidad) break
    }
  }
  return libres
}

// Dado un Date de referencia (normalmente "ahora") y la lista de
// materias con su `horario`/`duracion_sesion_minutos`, encuentra la
// próxima sesión dentro de los próximos 7 días (incluye hoy si aún
// no empezó/terminó). Devuelve {materia, dia, horaInicio, horaFin,
// fecha: Date} o null si ninguna materia tiene horario configurado.
// Usado por el panel "Próxima clase" del Horario del dashboard.
export function proximaClase(ahora, materias) {
  const diaActualISO = ahora.getDay() === 0 ? 7 : ahora.getDay() // 1=lunes..7=domingo
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()

  let mejor = null
  for (const materia of materias) {
    for (const entrada of expandirHorario(materia.horario, materia.duracion_sesion_minutos)) {
      const indiceISO = DIA_A_INDICE_ISO[entrada.dia]
      if (!indiceISO) continue

      // Días hasta esa entrada (0 = hoy). Si es hoy pero ya pasó su
      // hora de inicio, se considera la próxima semana (+7).
      let diasHasta = indiceISO - diaActualISO
      if (diasHasta < 0) diasHasta += 7
      if (diasHasta === 0 && minutosDesdeMedianoche(entrada.horaInicio) < minutosAhora) diasHasta = 7

      const fecha = new Date(ahora)
      fecha.setDate(ahora.getDate() + diasHasta)
      const [h, m] = entrada.horaInicio.split(":").map(Number)
      fecha.setHours(h, m, 0, 0)

      if (!mejor || fecha < mejor.fecha) {
        mejor = { materia, dia: entrada.dia, horaInicio: entrada.horaInicio, horaFin: entrada.horaFin, fecha }
      }
    }
  }
  return mejor
}

// Dado un Date de referencia ("ahora") y la lista de materias,
// encuentra la materia cuyo horario cubre EL DÍA Y LA HORA ACTUAL —
// a diferencia de proximaClase() (busca la más cercana en el
// futuro), esta filtra estrictamente "está pasando ahora mismo".
// Devuelve {materia, dia, horaInicio, horaFin} o null si ninguna
// materia tiene clase en este momento. Usado por el bloque "Sesión
// de hoy" del Dashboard general.
export function sesionEnCurso(ahora, materias) {
  const diaActual = diaDeHoyNombre(ahora)
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()

  for (const materia of materias) {
    for (const entrada of expandirHorario(materia.horario, materia.duracion_sesion_minutos)) {
      if (entrada.dia !== diaActual) continue
      if (cubreHoraActual(entrada, minutosAhora)) {
        return { materia, dia: entrada.dia, horaInicio: entrada.horaInicio, horaFin: entrada.horaFin }
      }
    }
  }
  return null
}

// Nombre del día ("lunes".."domingo") correspondiente a la fecha
// dada, en el mismo vocabulario que materias.horario — compartido
// por sesionEnCurso() y materiasConSesionHoy().
function diaDeHoyNombre(ahora) {
  const diasIndiceANombre = Object.fromEntries(
    Object.entries(DIA_A_INDICE_ISO).map(([nombre, indice]) => [indice, nombre])
  )
  return diasIndiceANombre[ahora.getDay() === 0 ? 7 : ahora.getDay()]
}

// ¿El rango horario de `entrada` ({horaInicio, horaFin}) cubre el
// minuto actual? Extraído de sesionEnCurso() para reusarse en
// materiasConSesionHoy() sin duplicar la comparación.
function cubreHoraActual(entrada, minutosAhora) {
  const inicio = minutosDesdeMedianoche(entrada.horaInicio)
  const fin = minutosDesdeMedianoche(entrada.horaFin)
  return minutosAhora >= inicio && minutosAhora < fin
}

// Dado un Date de referencia ("ahora") y la lista de materias,
// devuelve TODAS las materias que tienen alguna entrada de horario
// HOY (sin filtrar por hora, a diferencia de sesionEnCurso) —
// ordenadas por hora de inicio, cada una marcada con `enCurso` si su
// rango cubre el minuto actual. Usado por el acordeón "Sesión de
// hoy" del Dashboard general (AcordeonSesionesHoy.js): una fila por
// materia con clase hoy, la que está en curso se expande por
// default.
export function materiasConSesionHoy(ahora, materias) {
  const diaActual = diaDeHoyNombre(ahora)
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes()

  const resultado = []
  for (const materia of materias) {
    for (const entrada of expandirHorario(materia.horario, materia.duracion_sesion_minutos)) {
      if (entrada.dia !== diaActual) continue
      resultado.push({
        materia,
        dia: entrada.dia,
        horaInicio: entrada.horaInicio,
        horaFin: entrada.horaFin,
        enCurso: cubreHoraActual(entrada, minutosAhora),
      })
    }
  }
  resultado.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
  return resultado
}
