// Marca de "¿Qué toca hoy?": cuadrado redondeado bg-primary con el
// ícono de libro abierto (entypo:open-book) tal cual se definió en
// el diseño de Figma — asset SVG real, no redibujado a mano.
export default function Logo({ className = "size-7" }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[10px] bg-primary p-[16.6%] ${className}`}
      aria-hidden
    >
      <img src="/icons/landing/logo-book.svg" alt="" className="size-full brightness-0 invert" />
    </span>
  )
}
