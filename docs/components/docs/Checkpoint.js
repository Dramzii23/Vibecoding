import { Flag } from "lucide-react"

export default function Checkpoint({ children }) {
  return (
    <div className="my-6 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 p-4">
      <div className="mb-2 flex items-center gap-2 font-semibold text-primary">
        <Flag className="size-4" />
        Checkpoint
      </div>
      <div className="text-sm leading-6 text-base-content/80 [&>p]:my-1">{children}</div>
    </div>
  )
}
