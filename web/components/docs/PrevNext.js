import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"

export default function PrevNext({ prev, next }) {
  if (!prev && !next) return null
  return (
    <div className="mt-12 grid gap-3 border-t border-base-200 pt-8 sm:grid-cols-2">
      {prev ? (
        <Link
          href={prev.href}
          className="group flex flex-col gap-1 rounded-xl border border-base-200 p-4 transition hover:border-primary/40"
        >
          <span className="flex items-center gap-1 text-xs text-base-content/50">
            <ArrowLeft className="size-3.5" /> Anterior
          </span>
          <span className="font-medium group-hover:text-primary">{prev.label}</span>
        </Link>
      ) : (
        <span />
      )}

      {next ? (
        <Link
          href={next.href}
          className="group flex flex-col gap-1 rounded-xl border border-base-200 p-4 text-right transition hover:border-primary/40 sm:items-end"
        >
          <span className="flex items-center gap-1 text-xs text-base-content/50">
            Siguiente <ArrowRight className="size-3.5" />
          </span>
          <span className="font-medium group-hover:text-primary">{next.label}</span>
        </Link>
      ) : (
        <span />
      )}
    </div>
  )
}
