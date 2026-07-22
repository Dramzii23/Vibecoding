import { Info, AlertTriangle, CheckCircle2, AlertOctagon } from "lucide-react"

const VARIANTS = {
  info: {
    Icon: Info,
    classes: "border-info/40 bg-info/10 text-info-content",
    iconClass: "text-info",
  },
  warning: {
    Icon: AlertTriangle,
    classes: "border-warning/40 bg-warning/10",
    iconClass: "text-warning",
  },
  success: {
    Icon: CheckCircle2,
    classes: "border-success/40 bg-success/10",
    iconClass: "text-success",
  },
  danger: {
    Icon: AlertOctagon,
    classes: "border-error/40 bg-error/10",
    iconClass: "text-error",
  },
}

export default function Callout({ type = "info", title, children }) {
  const v = VARIANTS[type] || VARIANTS.info
  const { Icon } = v
  return (
    <div className={`my-6 flex gap-3 rounded-xl border p-4 ${v.classes}`}>
      <Icon className={`mt-0.5 size-5 flex-shrink-0 ${v.iconClass}`} />
      <div className="flex-1">
        {title && <p className="mb-1 font-semibold">{title}</p>}
        <div className="text-sm leading-6 [&>p]:my-0">{children}</div>
      </div>
    </div>
  )
}
