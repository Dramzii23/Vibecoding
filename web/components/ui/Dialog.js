"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

// Modal genérico reutilizable, wrapper sobre <dialog> nativo de
// HTML (cero dependencias nuevas). Clases DaisyUI `modal`/
// `modal-box` ya disponibles en el design system del proyecto.
// Uso: <Dialog open={open} onClose={...} title="..."><contenido/></Dialog>
//
// Se renderiza vía createPortal directo a document.body — NO en el
// lugar del árbol donde se declara. Un trigger que vive dentro de un
// menú/dropdown (ej. el dropdown-content de DaisyUI en
// MateriaCard.js) puede cerrarse por CSS :focus-within justo cuando
// el <dialog> abre; sin portal, React intenta reconciliar ese
// subárbol mientras el <dialog> nativo sigue en el top layer del
// navegador, produciendo un crash real (removeChild/NotFoundError).
// El portal desacopla el modal de dónde se disparó, evitando el
// problema de raíz para cualquier uso futuro, no solo este caso.
export default function Dialog({ open, onClose, title, children }) {
  const ref = useRef(null)
  const [montado, setMontado] = useState(false)

  useEffect(() => setMontado(true), [])

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  if (!montado) return null

  return createPortal(
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      className="modal"
    >
      <div className="modal-box max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-lg font-bold">{title}</h3>}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-square"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose} aria-label="Cerrar">
          cerrar
        </button>
      </form>
    </dialog>,
    document.body
  )
}
