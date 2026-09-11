import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import config from "@/config"

// Filas del mockup "agenda de hoy" — contenido de EJEMPLO fijo para
// ilustrar el producto en la landing pública (no son datos reales de
// ningún usuario ni materia; nombres genéricos y creíbles). Íconos
// SVG reales exportados del diseño de Figma (no redibujados a mano).
const AGENDA_EJEMPLO = [
  { icon: "calendar", label: "Materia", valor: "Introducción a HTML, CSS y JS" },
  { icon: "layers", label: "Unidad", valor: "Unidad 2. HTML" },
  { icon: "crosshairs", label: "Tema de hoy", valor: "Etiquetas y estructura HTML", acento: true },
  { icon: "pencil", label: "Actividad planeada", valor: "Análisis de la anatomía de las etiquetas HTML", acento: true },
]

const MATERIALES_EJEMPLO = ["Laptop", "Presentación (PPTX)", "Hojas de ejercicios 1, 2 y 3 de unidad 2"]

function IconoFila({ nombre, acento }) {
  return (
    <span
      className={`flex size-12 shrink-0 items-center justify-center rounded-[10px] border ${
        acento ? "border-accent/30 bg-accent/10" : "border-primary/20 bg-primary/10"
      }`}
    >
      <img src={`/icons/landing/${nombre}.svg`} alt="" className={`size-6 ${acento ? "opacity-80" : ""}`} />
    </span>
  )
}

export default function Hero() {
  const { eyebrow, title, subtitle, cta, ctaSecondary } = config.landing.hero

  return (
    <section className="relative overflow-hidden">
      {/* Fondo: cuadrícula + glows de marca */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(75%_60%_at_50%_0%,#000,transparent)]"
        aria-hidden
      >
        <div className="hero-grid absolute inset-0 opacity-70" />
        <div className="absolute left-1/2 top-[-8rem] size-[640px] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-[8%] top-[3rem] size-[360px] rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-16 md:grid-cols-2 md:items-center md:pt-20 md:pb-24">
        {/* Columna izquierda: mensaje + CTA */}
        <div>
          {eyebrow && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-base-300 bg-base-100/70 px-3 py-1.5 text-xs font-semibold text-primary backdrop-blur">
              <Sparkles className="size-3.5" />
              {eyebrow.toUpperCase()}
            </div>
          )}

          <h1 className="font-satoshi text-balance text-5xl font-black leading-[0.98] tracking-tight text-base-content md:text-7xl">
            {title}
          </h1>

          <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-base-content/60 md:text-xl">
            {subtitle}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href={cta.href} className="btn btn-primary btn-lg rounded-[5px]">
              {cta.label}
            </Link>
            {ctaSecondary && (
              <Link
                href={ctaSecondary.href}
                className="flex items-center gap-1 text-lg font-semibold text-primary hover:underline"
              >
                {ctaSecondary.label}
                <ArrowRight className="size-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Columna derecha: mockup "agenda de hoy" */}
        <div className="rounded-[10px] border-2 border-base-300 bg-base-100 p-7 shadow-2xl shadow-primary/10">
          <div className="divide-y divide-base-200">
            {/* Fila Hoy + Horario (única fila de dos bloques) */}
            <div className="flex items-start justify-between gap-3 pb-4">
              <div className="flex items-start gap-3.5">
                <IconoFila nombre="calendar" />
                <div>
                  <p className="text-2xl font-black text-base-content">Hoy</p>
                  <p className="text-sm font-semibold text-base-content/60">21 de mayo de 2025</p>
                </div>
              </div>
              <div className="flex items-center gap-3.5">
                <span className="flex size-12 shrink-0 items-center justify-center">
                  <img src="/icons/landing/clock.svg" alt="" className="size-8" />
                </span>
                <div className="text-right">
                  <p className="text-lg font-bold text-base-content">9:00 – 11:00</p>
                  <p className="text-sm font-semibold text-base-content/60">Horario de clase</p>
                </div>
              </div>
            </div>

            {AGENDA_EJEMPLO.map(({ icon, label, valor, acento }) => (
              <div key={label} className="flex items-start gap-3.5 py-4">
                <IconoFila nombre={icon} acento={acento} />
                <div className="min-w-0">
                  <p className="text-base font-medium text-base-content/60">{label}</p>
                  <p className="text-sm font-semibold text-base-content">{valor}</p>
                </div>
              </div>
            ))}

            <div className="flex items-start gap-3.5 pt-4">
              <IconoFila nombre="paper" acento />
              <div className="min-w-0">
                <p className="text-base font-medium text-base-content/60">Materiales de hoy</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm font-semibold text-base-content marker:text-base-content/40">
                  {MATERIALES_EJEMPLO.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
