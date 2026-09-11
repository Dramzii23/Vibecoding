"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("No autenticado")
  return { supabase, user }
}

// Borra una materia y, por cascade del schema (migraciones 009-012),
// todas sus unidades → temas → subtemas y cualquier carta_descriptiva
// asociada. RLS ya filtra por dueño; el .eq("user_id",...) es
// defensa en profundidad adicional.
//
// Devuelve { ok: true } o { error } — NO hace redirect() aquí. Un
// redirect() lanzado dentro de una Server Action invocada desde un
// useTransition en cliente puede no propagarse limpio (el throw de
// control de Next se puede topar con el propio try/catch del caller,
// o el componente que originó la llamada puede desmontarse a mitad
// de camino si estaba dentro de /materias/[id] navegando fuera de sí
// misma) — se vio como crash real en vez de una navegación normal.
// El caller (ConfirmarEliminarMateria.js) navega con router.push()
// tras confirmar éxito, patrón más predecible en Client Components.
export async function eliminarMateria(formData) {
  const id = formData.get("id")?.toString()
  if (!id) return { error: "Falta el id de la materia." }

  const { supabase, user } = await requireUser()
  const { data, error } = await supabase
    .from("materias")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")

  if (error) {
    return { error: `No pudimos eliminar la materia: ${error.message}` }
  }
  if (!data?.length) {
    return { error: "No se eliminó ninguna materia — puede que ya no exista o no te pertenezca." }
  }

  revalidatePath("/materias")
  revalidatePath("/dashboard")
  return { ok: true }
}

// Edición simple de los datos generales de una materia ya creada
// (nombre, horario, duración, formato) — NO toca unidades/temas/
// subtemas, esos se editan desde dentro de la materia
// (/materias/[id], tarjeta expandida de cada subtema).
export async function actualizarDatosMateria(id, campos) {
  if (!id) return { error: "Falta el id de la materia." }

  const { supabase, user } = await requireUser()
  const { error } = await supabase
    .from("materias")
    .update({
      nombre: campos.nombre?.trim(),
      horario: campos.horario ?? [],
      duracion_sesion_minutos: campos.duracion_sesion_minutos || 120,
      formato_semestre: campos.formato_semestre || "semestral",
    })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: "No pudimos guardar los cambios." }

  revalidatePath("/materias")
  revalidatePath(`/materias/${id}`)
  revalidatePath("/dashboard")
  return { ok: true }
}

// ------------------------------------------------------------
// Materia de ejemplo "HTML, CSS y JS" — TEMPORAL, disparada desde
// un botón en /materias/page.js mientras el usuario no tenga una
// materia de referencia completamente llena. Se retira (botón +
// esta función) en cuanto se confirme que quedó creada.
// ------------------------------------------------------------
export async function crearMateriaPrototipo() {
  const { supabase, user } = await requireUser()

  // 1. Catálogo — se crea primero para poder asignarlo a subtemas.
  const { data: actividades } = await supabase
    .from("actividades")
    .insert([
      { user_id: user.id, nombre: "Ejercicio guiado en clase", descripcion: "El docente resuelve un caso mientras el grupo replica paso a paso." },
      { user_id: user.id, nombre: "Proyecto en parejas", descripcion: "Trabajo colaborativo con entrega al final de la unidad." },
      { user_id: user.id, nombre: "Quiz rápido", descripcion: "Evaluación corta de 10 minutos al inicio de la sesión." },
    ])
    .select("id, nombre")
  const actividadPorNombre = Object.fromEntries((actividades ?? []).map((a) => [a.nombre, a.id]))

  const { data: accionesDocente } = await supabase
    .from("acciones")
    .insert([
      { user_id: user.id, tipo: "docente", nombre: "Explica con ejemplos en vivo" },
      { user_id: user.id, tipo: "docente", nombre: "Guía la discusión y resuelve dudas" },
    ])
    .select("id, nombre")
  const docentePorNombre = Object.fromEntries((accionesDocente ?? []).map((a) => [a.nombre, a.id]))

  const { data: accionesAlumno } = await supabase
    .from("acciones")
    .insert([
      { user_id: user.id, tipo: "alumno", nombre: "Practica en su propio editor" },
      { user_id: user.id, tipo: "alumno", nombre: "Presenta su avance al grupo" },
    ])
    .select("id, nombre")
  const alumnoPorNombre = Object.fromEntries((accionesAlumno ?? []).map((a) => [a.nombre, a.id]))

  // 2. Materia
  const { data: materia, error: materiaError } = await supabase
    .from("materias")
    .insert({
      user_id: user.id,
      nombre: "HTML, CSS y JS",
      horario: [
        { dia: "lunes", hora_inicio: "09:00" },
        { dia: "miercoles", hora_inicio: "09:00" },
        { dia: "viernes", hora_inicio: "09:00" },
      ],
      duracion_sesion_minutos: 120,
      formato_semestre: "semestral",
      criterios_evaluacion: [
        { criterio: "Proyecto final", porcentaje: 40 },
        { criterio: "Prácticas", porcentaje: 30 },
        { criterio: "Examen", porcentaje: 20 },
        { criterio: "Participación", porcentaje: 10 },
      ],
      numero_unidades: 3,
      estatus_config: "configurada",
    })
    .select("id")
    .single()

  if (materiaError || !materia) return { error: "No pudimos crear la materia de ejemplo." }

  // 3. Unidades
  const { data: unidades } = await supabase
    .from("unidades")
    .insert([
      { materia_id: materia.id, numero: 1, nombre: "HTML", semana_inicio: 1, semana_fin: 5 },
      { materia_id: materia.id, numero: 2, nombre: "CSS", semana_inicio: 6, semana_fin: 10 },
      { materia_id: materia.id, numero: 3, nombre: "JavaScript", semana_inicio: 11, semana_fin: 16 },
    ])
    .select("id, numero")

  const idUnidad1 = unidades?.find((u) => u.numero === 1)?.id
  const idUnidad2 = unidades?.find((u) => u.numero === 2)?.id
  const idUnidad3 = unidades?.find((u) => u.numero === 3)?.id
  if (!idUnidad1 || !idUnidad2 || !idUnidad3) {
    return { error: "Creamos la materia pero no pudimos generar sus unidades." }
  }

  const TEMAS = [
    {
      unidad_id: idUnidad1,
      nombre: "Estructura básica de un documento HTML",
      materiales_equipo: "Laptop, editor de código (VS Code), navegador",
      orden: 0,
      subtemas: [
        {
          nombre: "Etiquetas semánticas y estructura del documento",
          accion_docente: "Explica la diferencia entre etiquetas semánticas y genéricas con ejemplos en vivo",
          accion_alumno: "Practica en su propio editor",
          materiales_equipo: "VS Code, navegador",
          referencias: "MDN Web Docs — HTML elements reference: https://developer.mozilla.org/es/docs/Web/HTML/Element",
          actividad: "Ejercicio guiado en clase",
          accionDocenteCat: "Explica con ejemplos en vivo",
          accionAlumnoCat: "Practica en su propio editor",
        },
        {
          nombre: "Formularios y validación básica",
          accion_docente: "Guía la discusión y resuelve dudas",
          accion_alumno: "Presenta su avance al grupo",
          materiales_equipo: "VS Code, navegador",
          referencias: "MDN — Formularios web: https://developer.mozilla.org/es/docs/Learn/Forms",
          actividad: "Proyecto en parejas",
          accionDocenteCat: "Guía la discusión y resuelve dudas",
          accionAlumnoCat: "Presenta su avance al grupo",
        },
      ],
    },
    {
      unidad_id: idUnidad1,
      nombre: "Accesibilidad y buenas prácticas",
      materiales_equipo: "Laptop, extensión de accesibilidad del navegador",
      orden: 1,
      subtemas: [
        {
          nombre: "Atributos ARIA y navegación por teclado",
          accion_docente: "Explica con ejemplos en vivo",
          accion_alumno: "Practica en su propio editor",
          materiales_equipo: "VS Code, lector de pantalla básico",
          referencias: "W3C — WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/",
          actividad: "Quiz rápido",
          accionDocenteCat: "Explica con ejemplos en vivo",
          accionAlumnoCat: "Practica en su propio editor",
        },
      ],
    },
    {
      unidad_id: idUnidad2,
      nombre: "Selectores y el modelo de caja",
      materiales_equipo: "Laptop, DevTools del navegador",
      orden: 0,
      subtemas: [
        {
          nombre: "Selectores, especificidad y cascada",
          accion_docente: "Explica con ejemplos en vivo",
          accion_alumno: "Practica en su propio editor",
          materiales_equipo: "VS Code, navegador con DevTools",
          referencias: "MDN — Especificidad en CSS: https://developer.mozilla.org/es/docs/Web/CSS/Specificity",
          actividad: "Ejercicio guiado en clase",
          accionDocenteCat: "Explica con ejemplos en vivo",
          accionAlumnoCat: "Practica en su propio editor",
        },
        {
          nombre: "Box model, márgenes y padding",
          accion_docente: "Guía la discusión y resuelve dudas",
          accion_alumno: "Practica en su propio editor",
          materiales_equipo: "VS Code, navegador con DevTools",
          referencias: "MDN — El modelo de caja: https://developer.mozilla.org/es/docs/Learn/CSS/Building_blocks/The_box_model",
          actividad: "Ejercicio guiado en clase",
          accionDocenteCat: "Guía la discusión y resuelve dudas",
          accionAlumnoCat: "Practica en su propio editor",
        },
      ],
    },
    {
      unidad_id: idUnidad2,
      nombre: "Layout moderno: Flexbox y Grid",
      materiales_equipo: "Laptop, editor de código",
      orden: 1,
      subtemas: [
        {
          nombre: "Flexbox: eje principal y cruzado",
          accion_docente: "Explica con ejemplos en vivo",
          accion_alumno: "Presenta su avance al grupo",
          materiales_equipo: "VS Code, navegador",
          referencias: "CSS-Tricks — A Complete Guide to Flexbox: https://css-tricks.com/snippets/css/a-guide-to-flexbox/",
          actividad: "Proyecto en parejas",
          accionDocenteCat: "Explica con ejemplos en vivo",
          accionAlumnoCat: "Presenta su avance al grupo",
        },
        {
          nombre: "CSS Grid: filas, columnas y áreas nombradas",
          accion_docente: "Explica con ejemplos en vivo",
          accion_alumno: "Practica en su propio editor",
          materiales_equipo: "VS Code, navegador",
          referencias: "CSS-Tricks — A Complete Guide to Grid: https://css-tricks.com/snippets/css/complete-guide-grid/",
          actividad: "Ejercicio guiado en clase",
          accionDocenteCat: "Explica con ejemplos en vivo",
          accionAlumnoCat: "Practica en su propio editor",
        },
      ],
    },
    {
      unidad_id: idUnidad3,
      nombre: "Fundamentos del lenguaje",
      materiales_equipo: "Laptop, consola del navegador",
      orden: 0,
      subtemas: [
        {
          nombre: "Variables, tipos de dato y operadores",
          accion_docente: "Explica con ejemplos en vivo",
          accion_alumno: "Practica en su propio editor",
          materiales_equipo: "VS Code, consola del navegador",
          referencias: "MDN — JavaScript basics: https://developer.mozilla.org/es/docs/Learn/JavaScript/First_steps",
          actividad: "Quiz rápido",
          accionDocenteCat: "Explica con ejemplos en vivo",
          accionAlumnoCat: "Practica en su propio editor",
        },
        {
          nombre: "Funciones, ámbito y closures",
          accion_docente: "Guía la discusión y resuelve dudas",
          accion_alumno: "Practica en su propio editor",
          materiales_equipo: "VS Code, consola del navegador",
          referencias: "MDN — Functions: https://developer.mozilla.org/es/docs/Web/JavaScript/Guide/Functions",
          actividad: "Ejercicio guiado en clase",
          accionDocenteCat: "Guía la discusión y resuelve dudas",
          accionAlumnoCat: "Practica en su propio editor",
        },
      ],
    },
    {
      unidad_id: idUnidad3,
      nombre: "El DOM y eventos",
      materiales_equipo: "Laptop, navegador con DevTools",
      orden: 1,
      subtemas: [
        {
          nombre: "Selección y manipulación del DOM",
          accion_docente: "Explica con ejemplos en vivo",
          accion_alumno: "Practica en su propio editor",
          materiales_equipo: "VS Code, navegador con DevTools",
          referencias: "MDN — Manipulando documentos: https://developer.mozilla.org/es/docs/Learn/JavaScript/Client-side_web_APIs/Manipulating_documents",
          actividad: "Ejercicio guiado en clase",
          accionDocenteCat: "Explica con ejemplos en vivo",
          accionAlumnoCat: "Practica en su propio editor",
        },
        {
          nombre: "Proyecto integrador: mini app interactiva",
          accion_docente: "Guía la discusión y resuelve dudas",
          accion_alumno: "Presenta su avance al grupo",
          materiales_equipo: "VS Code, navegador",
          referencias: "MDN — Introducción a eventos: https://developer.mozilla.org/es/docs/Learn/JavaScript/Building_blocks/Events",
          actividad: "Proyecto en parejas",
          accionDocenteCat: "Guía la discusión y resuelve dudas",
          accionAlumnoCat: "Presenta su avance al grupo",
        },
      ],
    },
  ]

  for (const tema of TEMAS) {
    const { data: temaCreado, error: temaError } = await supabase
      .from("temas")
      .insert({
        unidad_id: tema.unidad_id,
        nombre: tema.nombre,
        materiales_equipo: tema.materiales_equipo,
        orden: tema.orden,
      })
      .select("id")
      .single()

    if (temaError || !temaCreado) continue

    const subtemasAInsertar = tema.subtemas.map((s, i) => ({
      tema_id: temaCreado.id,
      nombre: s.nombre,
      accion_docente: s.accion_docente,
      accion_alumno: s.accion_alumno,
      materiales_equipo: s.materiales_equipo,
      referencias: s.referencias,
      estatus: "planeada",
      orden: i,
      actividad_id: actividadPorNombre[s.actividad] ?? null,
      accion_docente_id: docentePorNombre[s.accionDocenteCat] ?? null,
      accion_alumno_id: alumnoPorNombre[s.accionAlumnoCat] ?? null,
    }))

    await supabase.from("subtemas").insert(subtemasAInsertar)
  }

  revalidatePath("/materias")
  revalidatePath("/dashboard")
  revalidatePath("/catalogos")
  return { ok: true, materiaId: materia.id }
}
