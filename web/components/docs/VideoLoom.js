import { Video } from "lucide-react"

export default function VideoLoom({ url, title = "Video del docente" }) {
  if (!url) {
    return (
      <div className="my-6 flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-base-300 bg-base-200/50 p-8 text-base-content/50">
        <Video className="size-5" />
        <span className="text-sm">[ Video pendiente · grábalo con Loom ]</span>
      </div>
    )
  }

  // Convierte URLs de Loom share a embed
  const embedUrl = url
    .replace("loom.com/share/", "loom.com/embed/")
    .replace(/\?.*$/, "")

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-base-300">
      <div className="aspect-video w-full bg-black">
        <iframe
          src={embedUrl}
          title={title}
          allow="fullscreen; clipboard-write"
          className="size-full"
        />
      </div>
    </div>
  )
}
