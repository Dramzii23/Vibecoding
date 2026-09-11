// ============================================================
// Prompt · interpretar carta descriptiva (2 pasadas)
// ------------------------------------------------------------
// Estas plantillas describen el FORMATO típico de una carta
// descriptiva universitaria en abstracto — no contienen contenido
// literal de ninguna carta real.
//
// El PDF completo se adjunta como content part aparte (ver
// pdfContentPart.js, api/cartas-descriptivas/route.js) para que la
// IA lea la tabla visualmente (columnas reales) en vez de texto
// plano donde esa estructura ya se perdió.
//
// DOS PASADAS, no una — confirmado con pruebas directas contra la
// API usando un PDF real de 14 páginas: pedirle a la IA que
// devuelva TODOS los temas + TODOS los subtemas en una sola llamada
// es no determinista (3, 33 y 18 subtemas en 3 intentos idénticos
// con el mismo modelo/prompt/PDF). Dividir en llamadas de scope
// chico lo hace confiable:
// - buildTemasResumenPrompt(): pasada 1, solo la lista de temas
//   grandes (nivel 2 de numeración) — respuesta corta, sin subtemas.
// - buildSubtemasDeTemaPrompt(nombre): pasada 2, una llamada POR
//   TEMA, pidiendo solo sus subtemas (nivel 3) — el modelo solo
//   cubre un fragmento del documento por llamada.
// ============================================================

const INTRO_TABLA = `Lee el PDF adjunto visualmente, prestando atención a su LAYOUT DE TABLA,
no solo al texto: muchas cartas descriptivas institucionales usan una
tabla con (al menos) tres columnas paralelas:

- **UNIDAD**: nombre de la unidad, su objetivo, y sus horas totales.
- **TEMAS**: uno o más temas grandes que pertenecen a esa unidad, cada uno
  con sus subtemas numerados dentro de la misma celda o celdas vecinas.
- **ACTIVIDADES**: una fila de actividad por cada fila de tema/subtema,
  con quién la hace (docente o alumno), en qué consiste, sus horas y su
  semana.

**Jerarquía de numeración — MUY IMPORTANTE, es la fuente #1 de errores**:
la columna de Temas suele traer una numeración de TRES niveles, no dos:

- Nivel 1 (implícito, es la propia UNIDAD): "1", "2", "3"...
- Nivel 2 ("1.1", "1.2", "1.3"...): esto es un **TEMA grande**, con su
  propio nombre (toma el texto que sigue al número, ej. "1.1.- Principios
  de narratología" → nombre del tema es "Principios de narratología").
- Nivel 3 ("1.1.1", "1.1.2", "1.1.3"...): esto es un **SUBTEMA** dentro
  de ese tema, con su propio nombre (ej. "1.1.1.- Definición de
  narrativa" → nombre del subtema es "Definición de narrativa").

**Lee la tabla columna por columna, cruzando filas relacionadas** — no
proceses el documento como texto corrido de arriba a abajo. El nombre de
una unidad suele repetirse visualmente en varias filas de la tabla (una
vez por cada tema/subtema que contiene) — eso es la MISMA unidad
repetida, nunca una unidad nueva por cada aparición de su nombre.

**No ignores la columna UNIDAD** — es tan importante como la columna
Temas. Cada unidad suele tener su propio nombre/título descriptivo (ej.
"Aplicaciones de la narrativa y el guionismo para videojuego") y a veces
un objetivo ("Que el estudiante conozca..."), distintos del nombre de
cualquiera de sus temas — nunca copies el nombre de un tema como si fuera
el nombre de la unidad, ni dejes el nombre de la unidad vacío si el
documento sí lo declara.`

// Pasada 1: solo la lista de temas grandes, sin subtemas. Respuesta
// corta a propósito — cubre el documento completo sin arriesgarse a
// truncar por exceso de contenido a devolver.
export function buildTemasResumenPrompt() {
  return `Eres un asistente que ayuda a un docente universitario a convertir
su carta descriptiva (documento oficial que planea el semestre, adjunto
como PDF) en una estructura de datos. Este es el primer paso de dos: aquí
identificas SOLO la lista de TEMAS GRANDES (numeración de segundo nivel,
ej. 1.1, 1.2, 1.3, 2.1, 2.2...) — NO extraigas subtemas todavía, eso pasa
en un segundo paso aparte para cada tema.

${INTRO_TABLA}

Una carta descriptiva institucional típica incluye además:

- Un encabezado con el NOMBRE DE LA MATERIA/ASIGNATURA (a veces junto a
  una clave o código).
- Un apartado de "Criterios de evaluación" o "Puntos a evaluar", con una
  tabla de ponderaciones (ej. proyectos 70%, exámenes 20%, reportes 10%).

Reglas:

- La MAYORÍA de cartas descriptivas NO declaran cuántas unidades tiene el
  semestre de forma explícita y clara — eso lo decide el docente al
  configurar su curso, no algo que debas inferir o inventar tú. SOLO
  reporta un número en "unidades_declaradas_carta" si el documento lo
  dice de forma inequívoca, contando nombres de unidad DISTINTOS (no
  apariciones/repeticiones de fila). Si tienes cualquier duda, usa null.
- Para cada tema grande, extrae su nombre, horas totales, a qué unidad
  pertenece (primer número), y sus materiales/equipo si se especifican a
  ese nivel.
- Para cada tema, extrae TAMBIÉN el nombre real y el objetivo de la
  UNIDAD a la que pertenece (columna Unidad de esa misma fila) en
  "unidad_nombre"/"unidad_objetivo" — texto literal del documento, no el
  nombre del tema ni un genérico tipo "Unidad 1". Si la columna Unidad
  para esa fila no trae más que el número/etiqueta ("Unidad 1"), usa
  null en ambos campos.
- Algunas unidades/temas dicen literalmente algo como "Sin temas
  definidos" o "Sin actividades definidas" — en ese caso marca
  "sin_subtemas_definidos": true para ese tema, en vez de inventar
  contenido.
- Si el documento menciona una semana o sesión de entrega/presentación
  del proyecto final al cierre del semestre, repórtalo en
  "semana_entrega_final_detectada": true.

No inventes información que no esté en el documento — si algo no se
puede determinar con certeza, usa null en vez de adivinar. Si no puedes
determinar con certeza a qué unidad pertenece un tema, propón el número
que te parezca más razonable según su posición en el documento y anota la
duda en "advertencias".

**Identifica TODOS los temas grandes del documento, sin excepción** —
esta pasada es la única oportunidad de listarlos todos; un tema que
falte aquí no se procesará después.`
}

// Pasada 2: solo los subtemas de UN tema específico — el modelo ya
// sabe (por la pasada 1) que ese tema existe; aquí solo profundiza
// en su numeración de tercer nivel.
export function buildSubtemasDeTemaPrompt(temaNombre) {
  return `Eres un asistente que ayuda a un docente universitario a convertir
su carta descriptiva (documento oficial que planea el semestre, adjunto
como PDF) en una estructura de datos. Este es el segundo paso: ya se
identificó la lista de temas grandes del documento; ahora enfócate
ÚNICAMENTE en el tema "${temaNombre}".

${INTRO_TABLA}

Ese tema tiene subtemas numerados de TERCER nivel (ej. si el tema es
"1.1", sus subtemas son "1.1.1", "1.1.2", "1.1.3"...) listados en la
misma celda o celdas vecinas de la columna Temas, dentro de la fila de
ese tema. **Extrae TODOS esos subtemas de tercer nivel como entradas
separadas — no te saltes ninguno, ni te quedes solo con los primeros.**

Para cada subtema, toma su acción docente y acción alumno de la columna
Actividades en la fila correspondiente. Si el documento solo tiene UNA
fila de actividad/acción para todo el tema (no una por cada subtema),
repite esa MISMA acción/actividad en cada uno de los subtemas — no la
pierdas ni la dejes vacía.

Si el tema "${temaNombre}" NO tiene sub-numerales de tercer nivel en la
columna de Temas (solo tiene su propio texto, sin "X.Y.1", "X.Y.2"...),
entonces ese texto del tema ES su único subtema — créalo como una sola
entrada con el mismo nombre que el tema.

No inventes información que no esté en el documento — si algo no se
puede determinar con certeza (acción docente, acción alumno, materiales),
usa null en vez de adivinar.`
}
