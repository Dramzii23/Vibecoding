import config from "@/config"

// Marca de "¿Qué toca hoy?": cuadrado redondeado bg-primary con el
// ícono de libro abierto. Si config.brand.logoSrc apunta a un
// archivo en /public (ver config.js), se usa esa imagen tal cual
// (ya trae su propio fondo) — si es null, cae al SVG dibujado a
// mano (entypo:open-book) coloreado con bg-primary + invert, mismo
// resultado visual sin depender de un asset externo.
export default function Logo({ className = "size-7" }) {
  if (config.brand.logoSrc) {
    return (
      <img
        src={config.brand.logoSrc}
        alt=""
        className={`rounded-[22%] object-cover ${className}`}
      />
    )
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-[10px] bg-primary p-[16.6%] ${className}`}
      aria-hidden
    >
      <img src="/icons/landing/logo-book.svg" alt="" className="size-full brightness-0 invert" />
    </span>
  )
}
