"use client"

import { useMemo, useState } from "react"
import { Search, ChevronDown, Trash2, AlertTriangle } from "lucide-react"
import { formatFechaCorta } from "@/lib/fechas/semanaClase"
import { agruparEnSemanas } from "@/lib/fechas/calendarioAcademico"

// Paso "Revisa tu calendario": vista de REVISIÓN (no de edición campo
// por campo) del calendario ya calculado — mismo layout/estructura
// que el HTML de referencia que el usuario compartió (agrupado por
// unidad con divisor, semanas colapsables con fecha real, buscador,
// abrir/cerrar todo, avisos por semana), adaptado a los tokens de
// color/tipografía que ya usa el resto de la app (DaisyUI/Tailwind),
// no la paleta morada/negra literal del HTML.
//
// A diferencia del intento anterior de este mismo paso (formulario
// editable agrupado por TEMA), aquí:
// - La unidad de agrupación colapsable es la SEMANA con fecha real,
//   no el tema — una fila puede contener "martes y jueves" si ambos
//   caen en la misma semana calendario.
// - Es solo lectura (confirmado con el usuario: ajustar campos se
//   hace después, ya con la materia creada, desde /materias/[id]).
//   La única acción disponible aquí es DESCARTAR un tema/subtema que
//   la IA extrajo mal, antes de crear la materia.
function nuevoSubtema() {
  return {
    nombre: "",
    accion_docente: "",
    accion_alumno: "",
    actividad_preasignada: "",
    materiales_equipo: "",
    semana_sugerida: null,
    fecha: "",
  }
}

// Texto resumido de un subtema, usado para el filtro de búsqueda y
// como "teaser" de la fila de semana.
function textoBuscable(subtema) {
  return [subtema.nombre, subtema.accion_docente, subtema.accion_alumno, subtema.actividad_preasignada]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

export default function PasoConfirmarTemas({ temas, onChange, advertencias, unidades }) {
  const [busqueda, setBusqueda] = useState("")
  const [semanasAbiertas, setSemanasAbiertas] = useState(() => new Set())

  function quitarTema(temaIndex) {
    onChange(temas.filter((_, i) => i !== temaIndex))
  }

  function quitarSubtema(temaIndex, subtemaIndex) {
    onChange(
      temas.map((t, i) =>
        i !== temaIndex
          ? t
          : { ...t, subtemas: t.subtemas.filter((_, si) => si !== subtemaIndex) }
      )
    )
  }

  // Genera N subtemas placeholder con fechas reales de la unidad —
  // usado cuando la carta indica explícitamente que un tema no tiene
  // subtemas definidos (tema.sin_subtemas_definidos).
  function generarSesionesPlaceholder(temaIndex, unidad, cantidad) {
    const fechas = (unidad?.fechasSesion ?? []).slice(0, cantidad)
    const subtemas = Array.from({ length: cantidad }, (_, i) => ({
      ...nuevoSubtema(),
      nombre: `Sesión ${i + 1}`,
      fecha: fechas[i] ?? "",
    }))
    onChange(temas.map((t, i) => (i === temaIndex ? { ...t, sin_subtemas_definidos: false, subtemas } : t)))
  }

  // Arma, por unidad, la lista de bloques-semana con sus sesiones y
  // los subtemas (con su índice real en `temas` para poder
  // quitarlos) que caen en cada fecha.
  const unidadesConSemanas = useMemo(() => {
    // Índice fecha → [{temaIndex, subtemaIndex, tema, subtema}]
    const porFecha = new Map()
    temas.forEach((tema, temaIndex) => {
      tema.subtemas.forEach((subtema, subtemaIndex) => {
        if (!subtema.fecha) return
        if (!porFecha.has(subtema.fecha)) porFecha.set(subtema.fecha, [])
        porFecha.get(subtema.fecha).push({ temaIndex, subtemaIndex, tema, subtema })
      })
    })

    return unidades.map((unidad) => {
      const fechasSesion = unidad.fechasSesion ?? []
      const bloques = agruparEnSemanas(fechasSesion)
      const semanas = bloques.map((bloque) => ({
        ...bloque,
        sesiones: bloque.fechas.map((fechaISO) => ({
          fechaISO,
          entradas: porFecha.get(fechaISO) ?? [],
        })),
      }))
      // Temas de esta unidad sin ninguna fecha (sin_subtemas_definidos
      // pendiente de resolver, o subtemas que no alcanzaron sesión).
      const temasSinFecha = temas
        .map((tema, temaIndex) => ({ tema, temaIndex }))
        .filter(({ tema }) => tema.unidad_numero === unidad.numero && tema.sin_subtemas_definidos)
      return { unidad, semanas, temasSinFecha }
    })
  }, [temas, unidades])

  const busquedaNormalizada = busqueda.trim().toLowerCase()

  function semanaCoincide(semana) {
    if (!busquedaNormalizada) return true
    return semana.sesiones.some((s) =>
      s.entradas.some(({ subtema }) => textoBuscable(subtema).includes(busquedaNormalizada))
    )
  }

  function idSemana(unidadNumero, fechaInicioSemana) {
    return `${unidadNumero}-${fechaInicioSemana}`
  }

  function toggleSemana(id) {
    setSemanasAbiertas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function abrirTodo() {
    const todas = new Set()
    unidadesConSemanas.forEach(({ unidad, semanas }) => {
      semanas.forEach((s) => todas.add(idSemana(unidad.numero, s.fechaInicioSemana)))
    })
    setSemanasAbiertas(todas)
  }

  function cerrarTodo() {
    setSemanasAbiertas(new Set())
  }

  // Huecos del documento: advertencias de la IA + las que se pueden
  // derivar aquí (temas marcados sin_subtemas_definidos que siguen
  // sin resolver, temas sin unidad asignada).
  const huecos = useMemo(() => {
    const lista = [...(advertencias ?? [])]
    const pendientes = temas.filter((t) => t.sin_subtemas_definidos)
    if (pendientes.length) {
      lista.push(
        `${pendientes.length} ${pendientes.length === 1 ? "unidad no tiene" : "unidades no tienen"} temas definidos en la carta — genera sus sesiones abajo antes de continuar.`
      )
    }
    const sinUnidad = temas.filter((t) => t.unidad_numero == null)
    if (sinUnidad.length) {
      lista.push(`${sinUnidad.length} ${sinUnidad.length === 1 ? "tema" : "temas"} sin unidad asignada.`)
    }
    return lista
  }, [advertencias, temas])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Revisa tu calendario</h2>
        <p className="mt-1 text-sm text-base-content/60">
          Así queda organizado tu semestre — si algo necesita ajuste, lo editas después ya
          creada la materia.
        </p>
      </div>

      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-base-200 bg-base-100 py-3">
        <label className="input input-bordered input-sm flex flex-1 items-center gap-2">
          <Search className="size-4 text-base-content/40" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar tema, subtema o actividad…"
            aria-label="Buscar en el calendario"
            className="grow"
          />
        </label>
        <button type="button" onClick={abrirTodo} className="btn btn-outline btn-sm">
          Abrir todo
        </button>
        <button type="button" onClick={cerrarTodo} className="btn btn-outline btn-sm">
          Cerrar todo
        </button>
      </div>

      <div className="space-y-5">
        {unidadesConSemanas.map(({ unidad, semanas, temasSinFecha }) => (
          <div key={unidad.numero} className="space-y-2">
            <div className="rounded-lg bg-primary px-4 py-2.5 text-primary-content">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  Unidad {unidad.numero} · {unidad.nombre || `Unidad ${unidad.numero}`}
                </p>
                {semanas.length > 0 && (
                  <p className="text-xs opacity-80">
                    {formatFechaCorta(semanas[0].fechas[0])} al{" "}
                    {formatFechaCorta(semanas[semanas.length - 1].fechas.at(-1))}
                  </p>
                )}
              </div>
              {unidad.objetivo && <p className="mt-0.5 text-xs opacity-80">{unidad.objetivo}</p>}
            </div>

            {temasSinFecha.map(({ tema, temaIndex }) => (
              <div key={temaIndex} className="rounded-lg border border-dashed border-warning/50 bg-warning/10 p-3">
                <p className="mb-2 flex items-center gap-1.5 text-sm text-warning-content">
                  <AlertTriangle className="size-4 shrink-0" />
                  "{tema.nombre || `Unidad ${unidad.numero}`}" no tiene temas definidos en tu carta
                  descriptiva.
                </p>
                <SinSubtemasDefinidos
                  unidad={unidad}
                  onGenerar={(cantidad) => generarSesionesPlaceholder(temaIndex, unidad, cantidad)}
                />
              </div>
            ))}

            <div className="space-y-1.5">
              {semanas.filter(semanaCoincide).map((semana) => {
                const id = idSemana(unidad.numero, semana.fechaInicioSemana)
                // Con texto de búsqueda activo, las semanas que
                // llegan aquí ya pasaron el filtro (coinciden) — se
                // auto-expanden, igual que el buscador del HTML de
                // referencia. Sin búsqueda, respeta el toggle manual.
                const abierta = busquedaNormalizada ? true : semanasAbiertas.has(id)
                const primerSubtema = semana.sesiones.flatMap((s) => s.entradas)[0]?.subtema

                return (
                  <div key={id} className="rounded-box border border-base-200 bg-base-100">
                    <button
                      type="button"
                      onClick={() => toggleSemana(id)}
                      className="flex w-full items-center gap-3 p-3 text-left"
                    >
                      <ChevronDown
                        className={`size-4 shrink-0 text-base-content/50 transition-transform ${abierta ? "" : "-rotate-90"}`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {primerSubtema?.nombre || "Sesión sin tema registrado"}
                        </p>
                        <p className="text-xs text-base-content/50">
                          {semana.fechas.map((f) => formatFechaCorta(f)).join(" · ")}
                        </p>
                      </div>
                    </button>

                    {abierta && (
                      <div className="space-y-3 border-t border-base-200 p-4">
                        {semana.sesiones.map((sesion) => (
                          <div key={sesion.fechaISO} className="rounded-lg border border-base-200 p-3">
                            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                              {formatFechaCorta(sesion.fechaISO)}
                            </p>
                            {sesion.entradas.length ? (
                              <ul className="list-disc space-y-1 pl-4 text-sm text-base-content/80">
                                {sesion.entradas.map(({ temaIndex, subtemaIndex, subtema }) => (
                                  <li key={subtemaIndex} className="flex items-start justify-between gap-2">
                                    <span>{subtema.nombre || "Sin nombre"}</span>
                                    <button
                                      type="button"
                                      onClick={() => quitarSubtema(temaIndex, subtemaIndex)}
                                      className="btn btn-ghost btn-xs btn-square shrink-0 text-error"
                                      title="Quitar de la materia"
                                      aria-label={`Quitar ${subtema.nombre || "subtema"}`}
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm italic text-base-content/40">Sin sesión registrada.</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {huecos.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Huecos del documento</h3>
          <ul className="list-disc space-y-1 rounded-lg bg-base-200/60 p-4 pl-8 text-sm text-base-content/70">
            {huecos.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ul>
        </div>
      )}

      {temas.length > 0 && (
        <details className="collapse-arrow collapse rounded-box border border-base-200">
          <summary className="collapse-title text-sm font-medium">
            Quitar temas completos ({temas.length})
          </summary>
          <div className="collapse-content space-y-1.5">
            {temas.map((tema, temaIndex) => (
              <div key={temaIndex} className="flex items-center justify-between gap-2 rounded-lg border border-base-200 px-3 py-1.5 text-sm">
                <span className="truncate">{tema.nombre || "Tema sin nombre"}</span>
                <button
                  type="button"
                  onClick={() => quitarTema(temaIndex)}
                  className="btn btn-ghost btn-xs gap-1 text-error"
                >
                  <Trash2 className="size-3.5" /> Quitar
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

// Aviso + captura de "¿cuántas sesiones ocupa esta unidad?" cuando
// la carta descriptiva indica explícitamente que no hay
// temas/subtemas definidos (tema.sin_subtemas_definidos).
function SinSubtemasDefinidos({ unidad, onGenerar }) {
  const [cantidad, setCantidad] = useState(unidad?.fechasSesion?.length || 1)

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={1}
        value={cantidad}
        onChange={(e) => setCantidad(Number(e.target.value) || 1)}
        aria-label="Número de sesiones"
        className="input input-bordered input-sm w-24"
      />
      <span className="text-sm text-base-content/60">días de clase</span>
      <button type="button" onClick={() => onGenerar(cantidad)} className="btn btn-primary btn-sm">
        Generar sesiones
      </button>
    </div>
  )
}
