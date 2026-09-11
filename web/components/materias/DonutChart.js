// Dona SVG hecha a mano (sin librería de charts — cálculo puro,
// mismo criterio que lib/fechas/*.js). Recibe `datos: [{label,
// valor, color}]` (color = clase Tailwind de texto, ej. "text-primary",
// reusada tanto para el stroke del arco vía currentColor como para
// el punto de la leyenda) y dibuja un anillo con un segmento por
// cada valor > 0, más el total en el centro.
const RADIO = 60
const GROSOR = 16
const CIRCUNFERENCIA = 2 * Math.PI * RADIO
// Los arcos SVG empiezan a las 3 en punto; -25% de la circunferencia
// como offset base los arranca a las 12, sin rotar el <svg> completo
// (evitaba tener que contra-rotar el texto central).
const OFFSET_INICIAL = CIRCUNFERENCIA * 0.25

export default function DonutChart({ datos, total, totalLabel = "sesiones" }) {
  let acumulado = 0

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 160" className="size-[120px] shrink-0">
        <circle cx="80" cy="80" r={RADIO} fill="none" stroke="currentColor" strokeWidth={GROSOR} className="text-base-200" />
        {datos.map(({ label, valor, color }) => {
          if (!valor) return null
          const fraccion = total > 0 ? valor / total : 0
          const largo = fraccion * CIRCUNFERENCIA
          const offset = OFFSET_INICIAL + acumulado
          acumulado += largo
          return (
            <circle
              key={label}
              cx="80"
              cy="80"
              r={RADIO}
              fill="none"
              stroke="currentColor"
              strokeWidth={GROSOR}
              strokeDasharray={`${largo} ${CIRCUNFERENCIA - largo}`}
              strokeDashoffset={offset}
              className={color}
            />
          )
        })}
        <text x="80" y="88" textAnchor="middle" className="fill-current text-base-content" style={{ fontSize: "22px", fontWeight: 700 }}>
          {total}
        </text>
        <text x="80" y="106" textAnchor="middle" className="fill-current text-base-content/50" style={{ fontSize: "9px" }}>
          {totalLabel}
        </text>
      </svg>

      <ul className="space-y-1.5 text-sm">
        {datos.map(({ label, valor, color }) => (
          <li key={label} className="flex items-center gap-1.5">
            <span className={`size-[9px] shrink-0 rounded-full bg-current ${color}`} />
            <span className="text-xs font-semibold tabular-nums">{valor}</span>
            <span className="text-xs text-base-content/60">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
