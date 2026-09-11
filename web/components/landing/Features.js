import config from "@/config"

// Íconos SVG reales exportados del diseño de Figma (no redibujados a
// mano) — uno por feature, en el mismo orden que config.landing.features.items.
const ICONOS = ["history", "bullseye", "folder-open"]

export default function Features() {
  const { eyebrow, title, subtitle, items } = config.landing.features

  return (
    <section id="features" className="border-t border-base-200 bg-base-100 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
          {subtitle && <p className="mt-4 text-base-content/70">{subtitle}</p>}
        </div>

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((item, i) => (
            <li
              key={item.title}
              className="flex items-start gap-4 rounded-xl border border-base-300 bg-base-100 px-6 py-6 transition hover:border-primary/40 hover:shadow-md"
            >
              <img src={`/icons/landing/${ICONOS[i % ICONOS.length]}.svg`} alt="" className="h-16 w-auto shrink-0" />
              <div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-base-content/70">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
