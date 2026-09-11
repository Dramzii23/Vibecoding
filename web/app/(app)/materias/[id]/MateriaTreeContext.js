"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { esHoy, hoyISO } from "@/lib/fechas/semanaClase"
import {
  moverSubtemaFecha,
  moverTemaAUnidad,
  crearUnidad,
  eliminarUnidad,
  crearTema,
  eliminarTema,
} from "./actions"

// ============================================================
// MateriaTreeProvider — dueño único del estado del árbol
// Unidad → Tema → Subtema de la materia abierta, y del DndContext
// que lo mueve.
// ------------------------------------------------------------
// Vive envolviendo TODA la zona privada (app/(app)/layout.js) para
// que el árbol editable pueda renderizarse en el sidebar global
// (fuera de /materias/[id]) y seguir compartiendo el MISMO estado y
// el MISMO DndContext que el Horario interno (#horario-materia)
// dentro de la página. En cualquier otra ruta el provider no tiene
// materia registrada (`materiaId === null`) y es un simple
// passthrough — el DndContext sigue montado pero sin draggables, así
// que no cuesta nada.
//
// MateriaContenido.js (dentro de la página) registra los datos
// iniciales con registrarMateria() al montar, y luego consume el
// estado con useMateriaTree(). El sidebar hace lo mismo. No hay
// copia de datos: una sola fuente de verdad para las dos vistas.
//
// Drag: un tema arrastrable usa id `tema:<id>`, sus drop-zones (las
// unidades, en AMBOS paneles a la vez) usan `unidad:<id>`. Cualquier
// otro id (fecha ISO, "backlog", "hoy") es el flujo de subtemas →
// fecha de siempre.
// ============================================================

const MateriaTreeContext = createContext(null)

export function useMateriaTree() {
  const ctx = useContext(MateriaTreeContext)
  if (!ctx) throw new Error("useMateriaTree debe usarse dentro de <MateriaTreeProvider>")
  return ctx
}

export function MateriaTreeProvider({ children }) {
  const [materiaId, setMateriaId] = useState(null)
  const [unidades, setUnidades] = useState([])
  const [estructura, setEstructura] = useState([])
  const [subtemas, setSubtemas] = useState([])
  const [unidadesAbiertas, setUnidadesAbiertas] = useState(() => new Set())

  // Evita re-registrar (y pisar ediciones locales) en cada render de
  // MateriaContenido: solo acepta el registro inicial de una materia
  // nueva, o un cambio real de id.
  const registradaRef = useRef(null)

  // Espejo síncrono del estado, para leer el valor más reciente
  // dentro de callbacks async (revert de borrados optimistas) sin
  // encadenar setState.
  const snapshotRef = useRef({ unidades: [], estructura: [], subtemas: [] })
  useEffect(() => {
    snapshotRef.current = { unidades, estructura, subtemas }
  }, [unidades, estructura, subtemas])

  const registrarMateria = useCallback((datos) => {
    if (registradaRef.current === datos.materiaId) return
    registradaRef.current = datos.materiaId
    setMateriaId(datos.materiaId)
    setUnidades(datos.unidades ?? [])
    setEstructura(datos.estructura ?? [])
    setSubtemas(datos.subtemas ?? [])
    setUnidadesAbiertas(new Set())
  }, [])

  const abrirUnidad = useCallback((unidadId) => {
    setUnidadesAbiertas((prev) => new Set(prev).add(unidadId))
  }, [])

  const toggleUnidad = useCallback((unidadId) => {
    setUnidadesAbiertas((prev) => {
      const next = new Set(prev)
      if (next.has(unidadId)) next.delete(unidadId)
      else next.add(unidadId)
      return next
    })
  }, [])

  // Scroll al tema en el Horario interno (#tema-<id>), que puede
  // estar en otra parte del DOM (el sidebar dispara esto).
  const irATema = useCallback(
    (temaId, unidadId) => {
      abrirUnidad(unidadId)
      requestAnimationFrame(() => {
        document
          .getElementById(`tema-${temaId}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      })
    },
    [abrirUnidad]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // --- Drag de un tema completo entre unidades -------------------
  const moverTema = useCallback(
    (temaId, unidadDestinoId) => {
      const unidadOrigen = estructura.find((u) => u.temas.some((t) => t.id === temaId))
      if (!unidadOrigen || unidadOrigen.unidadId === unidadDestinoId) return
      const tema = unidadOrigen.temas.find((t) => t.id === temaId)
      const unidadDestino = unidades.find((u) => u.id === unidadDestinoId)
      const unidadOrigenCompleta = unidades.find((u) => u.id === unidadOrigen.unidadId)
      if (!tema || !unidadDestino) return

      const fechasAnteriores = new Map(
        subtemas.filter((s) => s.temaId === temaId).map((s) => [s.id, s.fecha])
      )

      setEstructura((prev) =>
        prev.map((u) => {
          if (u.unidadId === unidadOrigen.unidadId)
            return { ...u, temas: u.temas.filter((t) => t.id !== temaId) }
          if (u.unidadId === unidadDestinoId) return { ...u, temas: [...u.temas, tema] }
          return u
        })
      )
      setSubtemas((prev) =>
        prev.map((s) => (s.temaId === temaId ? { ...s, fecha: null, unidad: unidadDestino } : s))
      )

      moverTemaAUnidad(temaId, unidadDestinoId).then((resultado) => {
        if (resultado?.error) {
          setEstructura((prev) =>
            prev.map((u) => {
              if (u.unidadId === unidadDestinoId)
                return { ...u, temas: u.temas.filter((t) => t.id !== temaId) }
              if (u.unidadId === unidadOrigen.unidadId) return { ...u, temas: [...u.temas, tema] }
              return u
            })
          )
          setSubtemas((prev) =>
            prev.map((s) =>
              s.temaId === temaId
                ? { ...s, fecha: fechasAnteriores.get(s.id) ?? null, unidad: unidadOrigenCompleta }
                : s
            )
          )
        }
      })
    },
    [estructura, unidades, subtemas]
  )

  // --- Drag de un subtema hacia una fecha (o backlog / hoy) ------
  const moverSubtema = useCallback(
    (subtemaId, nuevaFecha) => {
      const anterior = subtemas.find((s) => s.id === subtemaId)?.fecha ?? null
      if (anterior === nuevaFecha) return
      setSubtemas((prev) =>
        prev.map((s) => (s.id === subtemaId ? { ...s, fecha: nuevaFecha } : s))
      )
      moverSubtemaFecha(subtemaId, nuevaFecha).then((resultado) => {
        if (resultado?.error) {
          setSubtemas((prev) =>
            prev.map((s) => (s.id === subtemaId ? { ...s, fecha: anterior } : s))
          )
        }
      })
    },
    [subtemas]
  )

  const handleDragEnd = useCallback(
    ({ active, over }) => {
      if (!over) return
      if (typeof active.id === "string" && active.id.startsWith("tema:")) {
        if (typeof over.id !== "string" || !over.id.startsWith("unidad:")) return
        moverTema(active.id.slice("tema:".length), over.id.slice("unidad:".length))
        return
      }
      const nuevaFecha =
        over.id === "backlog" ? null : over.id === "hoy" ? hoyISO() : over.id
      moverSubtema(active.id, nuevaFecha)
    },
    [moverTema, moverSubtema]
  )

  // --- CRUD ----------------------------------------------------------
  const handleCrearUnidad = useCallback(async () => {
    if (!materiaId) return
    const resultado = await crearUnidad(materiaId)
    if (resultado?.unidad) {
      const nueva = {
        id: resultado.unidad.id,
        numero: resultado.unidad.numero,
        nombre: resultado.unidad.nombre,
        objetivo: resultado.unidad.objetivo,
        semanaInicio: resultado.unidad.semana_inicio,
        semanaFin: resultado.unidad.semana_fin,
      }
      setUnidades((prev) => [...prev, nueva])
      setEstructura((prev) => [...prev, { unidadId: nueva.id, temas: [] }])
      abrirUnidad(nueva.id)
    }
    return resultado
  }, [materiaId, abrirUnidad])

  const handleEliminarUnidad = useCallback(async (unidadId) => {
    const anterior = snapshotRef.current
    setUnidades((prev) => prev.filter((x) => x.id !== unidadId))
    setEstructura((prev) => prev.filter((x) => x.unidadId !== unidadId))
    setSubtemas((prev) => prev.filter((s) => s.unidad?.id !== unidadId))
    const resultado = await eliminarUnidad(unidadId)
    if (resultado?.error) {
      setUnidades(anterior.unidades)
      setEstructura(anterior.estructura)
      setSubtemas(anterior.subtemas)
    }
    return resultado
  }, [])

  const handleCrearTema = useCallback(async (unidadId) => {
    const resultado = await crearTema(unidadId)
    if (resultado?.tema) {
      setEstructura((prev) =>
        prev.map((u) =>
          u.unidadId === unidadId
            ? {
                ...u,
                temas: [
                  ...u.temas,
                  {
                    id: resultado.tema.id,
                    nombre: resultado.tema.nombre,
                    horasTotales: resultado.tema.horas_totales,
                    orden: resultado.tema.orden,
                  },
                ],
              }
            : u
        )
      )
    }
    return resultado
  }, [])

  const handleEliminarTema = useCallback(async (temaId) => {
    const anterior = snapshotRef.current
    setEstructura((prev) => prev.map((u) => ({ ...u, temas: u.temas.filter((t) => t.id !== temaId) })))
    setSubtemas((prev) => prev.filter((s) => s.temaId !== temaId))
    const resultado = await eliminarTema(temaId)
    if (resultado?.error) {
      setEstructura(anterior.estructura)
      setSubtemas(anterior.subtemas)
    }
    return resultado
  }, [])

  const handleUnidadActualizada = useCallback((unidadId, campos) => {
    setUnidades((prev) => prev.map((u) => (u.id === unidadId ? { ...u, ...campos } : u)))
    setSubtemas((prev) =>
      prev.map((s) =>
        s.unidad?.id === unidadId ? { ...s, unidad: { ...s.unidad, ...campos } } : s
      )
    )
  }, [])

  const handleTemaActualizado = useCallback((temaId, campos) => {
    setEstructura((prev) =>
      prev.map((u) => ({
        ...u,
        temas: u.temas.map((t) => (t.id === temaId ? { ...t, ...campos } : t)),
      }))
    )
    if (campos.nombre != null) {
      setSubtemas((prev) =>
        prev.map((s) => (s.temaId === temaId ? { ...s, temaNombre: campos.nombre } : s))
      )
    }
  }, [])

  const subtemaHoy = useMemo(() => subtemas.find((s) => esHoy(s.fecha)) ?? null, [subtemas])

  const valor = useMemo(
    () => ({
      materiaId,
      registrarMateria,
      unidades,
      estructura,
      subtemas,
      subtemaHoy,
      unidadesAbiertas,
      toggleUnidad,
      irATema,
      onCrearUnidad: handleCrearUnidad,
      onEliminarUnidad: handleEliminarUnidad,
      onCrearTema: handleCrearTema,
      onEliminarTema: handleEliminarTema,
      onUnidadActualizada: handleUnidadActualizada,
      onTemaActualizado: handleTemaActualizado,
      // setter directo para el detalle de subtema (guardado desde el Dialog)
      aplicarCamposSubtema: (subtemaId, campos) =>
        setSubtemas((prev) => prev.map((s) => (s.id === subtemaId ? { ...s, ...campos } : s))),
    }),
    [
      materiaId,
      registrarMateria,
      unidades,
      estructura,
      subtemas,
      subtemaHoy,
      unidadesAbiertas,
      toggleUnidad,
      irATema,
      handleCrearUnidad,
      handleEliminarUnidad,
      handleCrearTema,
      handleEliminarTema,
      handleUnidadActualizada,
      handleTemaActualizado,
    ]
  )

  return (
    <MateriaTreeContext.Provider value={valor}>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        {children}
      </DndContext>
    </MateriaTreeContext.Provider>
  )
}
