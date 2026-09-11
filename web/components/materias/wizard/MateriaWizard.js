"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import PasoSubirPDF from "./PasoSubirPDF"
import PasoDatosGenerales from "./PasoDatosGenerales"
import PasoCalendario from "./PasoCalendario"
import PasoEvaluacion from "./PasoEvaluacion"
import PasoUnidades from "./PasoUnidades"
import PasoConfirmarTemas from "./PasoConfirmarTemas"
import { confirmarMateriaCompleta } from "./actions"
import { distribuirEnUnidades, sesionesHabiles } from "@/lib/fechas/calendarioAcademico"

const PASOS = ["Carta descriptiva", "Datos generales", "Calendario", "Evaluación", "Unidades", "Temas"]

// Unidades por defecto SIN número de la IA — el docente lo decide en
// el paso Calendario (datos.numeroUnidades), este helper solo arma
// la lista inicial de N unidades con semanas de relleno (4 c/u) que
// PasoUnidades.js luego sobreescribe con fechas reales si ya hay
// calendario capturado (ver recalcularUnidadesConFechas). `nombres`
// (ver nombresUnidadDesdeTemas) prellena el nombre/objetivo real de
// cada unidad si la IA lo extrajo de la carta — si no hay match para
// ese número, cae al genérico "Unidad N".
function unidadesPorDefecto(n, nombres = new Map()) {
  const cantidad = n && n > 0 ? Math.min(n, 12) : 3
  return Array.from({ length: cantidad }, (_, i) => {
    const numero = i + 1
    const real = nombres.get(numero)
    return {
      numero,
      nombre: real?.nombre || `Unidad ${numero}`,
      objetivo: real?.objetivo || "",
      semanaInicio: i * 4 + 1,
      semanaFin: (i + 1) * 4,
    }
  })
}

// A partir de los temas ya extraídos por la IA (cada uno con
// unidad_sugerida + unidad_nombre/unidad_objetivo, ver
// schemas/cartaDescriptiva.js), arma un mapa número de unidad → { nombre,
// objetivo } tomando el primer valor no vacío que aparezca para ese
// número — varios temas comparten la misma unidad y deberían traer el
// mismo nombre, pero por si acaso alguno vino null se usa el primero
// que sí tenga dato.
export function nombresUnidadDesdeTemas(temas) {
  const mapa = new Map()
  for (const t of temas ?? []) {
    if (t.unidad_sugerida == null) continue
    if (mapa.has(t.unidad_sugerida)) continue
    if (!t.unidad_nombre) continue
    mapa.set(t.unidad_sugerida, { nombre: t.unidad_nombre, objetivo: t.unidad_objetivo || "" })
  }
  return mapa
}

// Resuelve el número de unidad que propuso la IA (unidad_sugerida)
// al `unidad_numero` que usa el paso de Temas — mismo criterio simple
// de "coincide el número" que v1 usaba contra unidad_id real. Ya no
// controla CUÁNTAS unidades hay (eso lo decide el docente), solo a
// cuál de las unidades ya configuradas cae cada tema por posición.
function temasConUnidadNumero(temas) {
  return (temas ?? []).map((t) => ({ ...t, unidad_numero: t.unidad_sugerida ?? null }))
}

// Suma de horas_totales de los temas asignados a cada número de
// unidad — usado por distribuirEnUnidades() para repartir sesiones
// proporcionalmente en vez de equitativo, cuando la IA sí extrajo
// horas por tema.
function pesoHorasPorUnidad(temas) {
  const pesos = {}
  for (const t of temas ?? []) {
    if (t.unidad_numero == null) continue
    pesos[t.unidad_numero] = (pesos[t.unidad_numero] || 0) + (t.horas_totales || 0)
  }
  return pesos
}

export default function MateriaWizard() {
  const router = useRouter()
  const [pasoActual, setPasoActual] = useState(0)
  const [error, setError] = useState(null)
  const [pending, startTransition] = useTransition()

  const [estado, setEstado] = useState({
    cartaId: null,
    nombre: "",
    horarioUniforme: true,
    horaUniforme: "",
    horarioPorDia: {},
    duracionSesionMinutos: 120,
    formatoSemestre: "semestral",
    // Calendario del semestre (paso nuevo) — ver calendarioAcademico.js.
    fechaInicioSemestre: "",
    fechaFinSemestre: "",
    pais: "mx",
    numeroUnidades: 3,
    tieneSemanaEntregaFinal: false,
    festivosExcluidos: [],
    prioridadHoras: "calendario",
    unidadesDeclaradasCarta: null,
    semanaEntregaFinalDetectada: false,
    criteriosEvaluacion: [{ criterio: "Examen", porcentaje: 100 }],
    unidades: unidadesPorDefecto(3),
    temas: [],
    advertencias: [],
  })

  function handleExtraido(data) {
    const { resultado } = data
    const temas = temasConUnidadNumero(resultado.temas)
    const nombres = nombresUnidadDesdeTemas(temas)
    setEstado((prev) => ({
      ...prev,
      cartaId: data.cartaId,
      nombre: resultado.nombre_materia || prev.nombre,
      criteriosEvaluacion:
        resultado.criterios_evaluacion?.length
          ? resultado.criterios_evaluacion
          : prev.criteriosEvaluacion,
      unidadesDeclaradasCarta: resultado.unidades_declaradas_carta ?? null,
      semanaEntregaFinalDetectada: resultado.semana_entrega_final_detectada ?? false,
      tieneSemanaEntregaFinal: resultado.semana_entrega_final_detectada ?? false,
      // Prellena nombres reales de unidad ya en este paso (con la
      // cantidad default de unidades) — avanzarDesdeCalendario() los
      // vuelve a aplicar cuando el docente ajuste numeroUnidades.
      unidades: unidadesPorDefecto(prev.numeroUnidades, nombres),
      temas,
      advertencias: resultado.advertencias ?? [],
    }))
    setPasoActual(1)
  }

  function handleOmitir() {
    setPasoActual(1)
  }

  function actualizar(campo, valor) {
    setEstado((prev) => ({ ...prev, [campo]: valor }))
  }

  // Al avanzar del paso Calendario al de Unidades, se recalculan las
  // unidades (cantidad = numeroUnidades del docente) con fechas
  // reales repartidas por distribuirEnUnidades() — reemplaza los
  // defaults de 4-semanas-arbitrarias por rangos reales del
  // semestre. Determinístico, sin IA, se recalcula cada vez que se
  // entra a este paso por si el docente ajustó fechas/festivos.
  function avanzarDesdeCalendario() {
    const diasClaseSemana = Object.keys(estado.horarioPorDia ?? {})
    const sesiones = sesionesHabiles({
      fechaInicioISO: estado.fechaInicioSemestre,
      fechaFinISO: estado.fechaFinSemestre,
      diasClaseSemana,
      festivosExcluidos: estado.festivosExcluidos,
    })

    const base = unidadesPorDefecto(estado.numeroUnidades, nombresUnidadDesdeTemas(estado.temas))
    if (!sesiones.length) {
      setEstado((prev) => ({ ...prev, unidades: base }))
      setPasoActual(3)
      return
    }

    const reparto = distribuirEnUnidades(sesiones, base, pesoHorasPorUnidad(estado.temas))
    const unidadesConFechas = base.map((u, i) => {
      const fechas = reparto[i]?.fechas ?? []
      return {
        ...u,
        fechasSesion: fechas, // usado por PasoConfirmarTemas para prellenar subtema.fecha
      }
    })

    setEstado((prev) => ({ ...prev, unidades: unidadesConFechas }))
    setPasoActual(3)
  }

  function siguiente() {
    if (pasoActual === 2) {
      avanzarDesdeCalendario()
      return
    }
    setPasoActual((p) => Math.min(p + 1, PASOS.length - 1))
  }

  function atras() {
    setPasoActual((p) => Math.max(p - 1, 0))
  }

  function handleCrearMateria() {
    setError(null)
    if (!estado.nombre.trim()) {
      setError("El nombre de la materia es obligatorio.")
      setPasoActual(1)
      return
    }

    startTransition(async () => {
      const resultado = await confirmarMateriaCompleta(estado)
      if (resultado?.error) {
        setError(resultado.error)
      } else if (resultado?.materiaId) {
        router.push(`/materias/${resultado.materiaId}`)
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Progreso */}
      <div className="h-1.5 overflow-hidden rounded-full bg-base-200"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((pasoActual + 1) / PASOS.length) * 100}%` }} /></div>
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {PASOS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-center text-xs font-medium ${
              i === pasoActual
                ? "bg-primary text-primary-content"
                : i < pasoActual
                  ? "bg-success/20 text-success"
                  : "bg-base-200 text-base-content/50"
            }`}
          >
            {i < pasoActual && <Check className="size-3" />}
            {label}
          </li>
        ))}
      </ol>

      {error && (
        <div role="alert" className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {pasoActual === 0 && (
        <PasoSubirPDF onExtraido={handleExtraido} onOmitir={handleOmitir} />
      )}
      {pasoActual === 1 && (
        <PasoDatosGenerales
          datos={estado}
          onChange={(datos) => setEstado((prev) => ({ ...prev, ...datos }))}
        />
      )}
      {pasoActual === 2 && (
        <PasoCalendario
          datos={estado}
          onChange={(datos) => setEstado((prev) => ({ ...prev, ...datos }))}
        />
      )}
      {pasoActual === 3 && (
        <PasoEvaluacion
          criterios={estado.criteriosEvaluacion}
          onChange={(v) => actualizar("criteriosEvaluacion", v)}
        />
      )}
      {pasoActual === 4 && (
        <PasoUnidades unidades={estado.unidades} onChange={(v) => actualizar("unidades", v)} />
      )}
      {pasoActual === 5 && (
        <PasoConfirmarTemas
          temas={estado.temas}
          onChange={(v) => actualizar("temas", v)}
          advertencias={estado.advertencias}
          unidades={estado.unidades}
        />
      )}

      {/* Navegación — el paso 0 tiene su propia navegación interna (subir/omitir) */}
      {pasoActual > 0 && (
        <div className="flex justify-between">
          <button type="button" onClick={atras} className="btn btn-ghost">
            Atrás
          </button>
          {pasoActual < PASOS.length - 1 ? (
            <button type="button" onClick={siguiente} className="btn btn-primary">
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCrearMateria}
              disabled={pending}
              className="btn btn-primary"
            >
              {pending ? "Creando materia…" : "Crear materia"}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
