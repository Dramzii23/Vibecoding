// ============================================================
// Schema · extracción de carta descriptiva
// ------------------------------------------------------------
// Shape que le pedimos a generateObject() al interpretar el PDF
// de una carta descriptiva. `unidad_sugerida` es un número
// (1..N), no un FK: la IA no conoce los UUIDs reales de las
// unidades — no existen todavía, la materia se crea al final del
// wizard.
//
// `unidad_nombre`/`unidad_objetivo` en cada tema: la carta real
// trae 3 columnas paralelas (Unidad | Temas | Actividades) — la
// columna Unidad tiene su PROPIO nombre/objetivo, distinto del
// nombre del tema. Antes solo se leía la columna Temas y se
// generaban unidades genéricas ("Unidad 1", "Unidad 2"); ahora
// cada tema trae consigo el nombre real de la fila de Unidad en la
// que aparece, para que MateriaWizard.js pueda proponer unidades
// con su nombre real en vez de un placeholder.
//
// Las cartas descriptivas reales normalmente NO declaran cuántas
// unidades tiene el semestre (ver caso real: la carta de "Narrativa
// y Guionismo" no lo dice, y el intento anterior de INFERIR ese
// número de la estructura del texto propuso 9 unidades sobre una
// carta con solo 4, porque el PDF repite cada fila de unidad por
// cada tema que contiene y la IA contó esas repeticiones). Por eso
// `unidades_declaradas_carta` es puramente INFORMATIVO ("¿el
// documento lo dice explícito?"), nunca una sugerencia que
// auto-rellena nada — el número real de unidades lo configura el
// docente en el paso de Calendario del wizard, antes de llegar a
// Unidades/Temas.
//
// nombre_materia y criterios_evaluacion sí prellenan directamente
// los pasos correspondientes — el PDF se sube ANTES de configurar
// nada, así que la IA debe inferir todo lo que pueda del propio
// documento donde sea seguro hacerlo.
//
// Los campos opcionales van `.nullable()` (no `.optional()`)
// porque los structured outputs de OpenAI en modo estricto
// requieren que todo campo declarado esté presente en la
// respuesta — "puede no aplicar" se expresa con null, no
// omitiendo la clave.
//
// EXTRACCIÓN EN 2 PASADAS (no determinismo confirmado con datos
// reales): pedirle a la IA que lea un PDF de 14 páginas de tabla
// densa y devuelva TODOS los temas + TODOS los subtemas en una sola
// respuesta estructurada es poco confiable — la misma llamada
// (mismo PDF, mismo modelo, mismo prompt) dio 3, 33 y 18 subtemas en
// 3 intentos idénticos. Solución probada: dividir en 2 llamadas de
// scope chico — `temasResumenSchema` (pasada 1: solo la lista de
// temas grandes, sin subtemas) y `subtemasDeTemaSchema` (pasada 2:
// una llamada POR TEMA, pidiendo solo sus subtemas) — ver
// api/cartas-descriptivas/route.js, que las orquesta y combina el
// resultado al shape de `cartaDescriptivaSchema` de siempre.
// ============================================================

import { z } from "zod"

export const subtemaSchema = z.object({
  nombre: z.string().describe("Nombre corto del subtema o actividad puntual"),
  accion_docente: z.string().nullable().describe("Qué hace el docente en esta actividad, o null si no se especifica"),
  accion_alumno: z.string().nullable().describe("Qué hace el alumno en esta actividad, o null si no se especifica"),
  actividad_preasignada: z.string().nullable().describe("Actividad ya definida explícitamente en la carta descriptiva, o null si no existe"),
  materiales_equipo: z.string().nullable().describe("Materiales o equipo requeridos para este subtema en particular, o null si no se especifican"),
  semana_sugerida: z.number().int().nullable().describe("Número de semana del semestre (1-N) sugerido para este subtema, o null si no es determinable"),
})

// Shape de un tema SIN subtemas — lo que pide la pasada 1
// (temasResumenSchema). Exportado para no duplicar la descripción
// de cada campo entre este archivo y route.js.
export const temaResumenSchema = z.object({
  nombre: z.string().describe("Nombre del tema grande"),
  horas_totales: z.number().nullable().describe("Horas totales indicadas para este tema en la carta descriptiva, o null si no se especifica"),
  unidad_sugerida: z.number().int().describe("Número de unidad (1-N) al que la IA propone asignar este tema, según su duración y orden en el documento — puede no coincidir con el número real de unidades que el docente configure después; el wizard resuelve esa diferencia por posición, no por este número exacto"),
  unidad_nombre: z.string().nullable().describe("Nombre/título REAL de la UNIDAD (columna Unidad de la tabla, nivel 1 de numeración) a la que pertenece este tema — tomado literalmente del documento, ej. 'Aplicaciones de la narrativa y el guionismo para videojuego'. null si la columna Unidad no trae un nombre propio (solo dice 'Unidad 1', 'Unidad 2'...)."),
  unidad_objetivo: z.string().nullable().describe("Objetivo/propósito de la UNIDAD si la columna Unidad lo declara (ej. 'Que el estudiante conozca las características de la narrativa interactiva'), o null si no se especifica a nivel unidad."),
  materiales_equipo: z.string().nullable().describe("Materiales o equipo que aplican a todo el tema en general, o null si no se especifican a este nivel"),
  sin_subtemas_definidos: z.boolean().describe("true si la carta descriptiva indica explícitamente que este tema/unidad no tiene subtemas o actividades definidas (ej. 'Sin temas definidos', 'Sin actividades definidas') — distinto de que la IA simplemente no haya encontrado nada; false en cualquier otro caso, incluido cuando subtemas SÍ tiene contenido"),
})

const temaSchema = temaResumenSchema.extend({
  subtemas: z.array(subtemaSchema),
})

export const criterioEvaluacionSchema = z.object({
  criterio: z.string().describe("Nombre del criterio de evaluación, ej. 'Proyectos', 'Exámenes', 'Reportes'"),
  porcentaje: z.number().describe("Ponderación en porcentaje (0-100) de este criterio"),
})

export const cartaDescriptivaSchema = z.object({
  nombre_materia: z.string().nullable().describe("Nombre de la materia/asignatura, tomado del encabezado del documento, o null si no se identifica con certeza"),
  unidades_declaradas_carta: z.number().int().nullable().describe("Número de unidades del semestre SOLO si el documento lo declara explícitamente (ej. dice literalmente 'Unidad 1', 'Unidad 2'... o una tabla con esa columna) — es un dato informativo sobre el documento, NO una sugerencia a aplicar: null si el documento no lo declara. El docente configura el número real de unidades después, en un paso aparte del calendario de su semestre."),
  semana_entrega_final_detectada: z.boolean().describe("true si el documento menciona explícitamente una semana o sesión dedicada a entrega/presentación del proyecto final al cierre del semestre; false en cualquier otro caso"),
  criterios_evaluacion: z.array(criterioEvaluacionSchema).nullable().describe("Tabla de ponderaciones de evaluación si el documento la incluye (ej. sección de 'Criterios de calificación'), o null si no existe esa información"),
  temas: z.array(temaSchema),
  advertencias: z
    .array(z.string())
    .describe("Notas sobre ambigüedades o datos que no se pudieron determinar con certeza al interpretar el documento"),
})

// Pasada 1 (ver cabecera del archivo): todo lo de cartaDescriptivaSchema
// EXCEPTO subtemas — el modelo cubre el documento completo pero con
// una respuesta chica, así que no trunca su cobertura de temas.
export const temasResumenSchema = z.object({
  nombre_materia: z.string().nullable().describe("Nombre de la materia/asignatura, tomado del encabezado del documento, o null si no se identifica con certeza"),
  unidades_declaradas_carta: z.number().int().nullable().describe("Número de unidades del semestre SOLO si el documento lo declara explícitamente — null si no lo declara. El docente configura el número real después."),
  semana_entrega_final_detectada: z.boolean().describe("true si el documento menciona explícitamente una semana o sesión dedicada a entrega/presentación del proyecto final al cierre del semestre; false en cualquier otro caso"),
  criterios_evaluacion: z.array(criterioEvaluacionSchema).nullable().describe("Tabla de ponderaciones de evaluación si el documento la incluye, o null si no existe esa información"),
  temas: z.array(temaResumenSchema),
  advertencias: z
    .array(z.string())
    .describe("Notas sobre ambigüedades o datos que no se pudieron determinar con certeza al interpretar el documento"),
})

// Pasada 2 (ver cabecera del archivo): una llamada por cada tema de
// la pasada 1, pidiendo solo los subtemas de ESE tema — el modelo
// solo tiene que cubrir un fragmento chico del documento por
// llamada, así que no trunca la lista de subtemas.
export const subtemasDeTemaSchema = z.object({
  subtemas: z.array(subtemaSchema),
})
