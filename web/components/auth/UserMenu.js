import Link from "next/link"
import { ChevronsUpDown, ShieldCheck } from "lucide-react"
import { signOut } from "@/lib/auth/actions"

// Menú de usuario con avatar de Google y botón de cerrar sesión.
// Server Component: el logout es un Server Action (form action).
//
// variant="header" (default): trigger compacto para el header
// superior (avatar + nombre truncado).
// variant="sidebar": bloque de perfil expandido para el pie del
// sidebar de la zona privada (avatar + nombre + email, con chevron)
// — mismo dropdown, solo cambia el trigger visual.
export default function UserMenu({ user, variant = "header", esSuperAdmin = false }) {
  const meta = user.user_metadata || {}
  const name = meta.full_name || meta.name || user.email
  const avatar = meta.avatar_url || meta.picture
  const initial = (name || "?").charAt(0).toUpperCase()

  const avatarEl = avatar ? (
    <img
      src={avatar}
      alt={name}
      referrerPolicy="no-referrer"
      className={variant === "sidebar" ? "size-8 rounded-full" : "size-7 rounded-full"}
    />
  ) : (
    <span
      className={`flex items-center justify-center rounded-full bg-primary font-semibold text-primary-content ${
        variant === "sidebar" ? "size-8 text-sm" : "size-7 text-sm"
      }`}
    >
      {initial}
    </span>
  )

  return (
    <div className={`dropdown ${variant === "sidebar" ? "dropdown-top w-full" : "dropdown-end"}`}>
      {variant === "sidebar" ? (
        <div
          tabIndex={0}
          role="button"
          className="flex w-full items-center gap-2 rounded-lg border border-base-200 bg-base-100 px-2 py-2 text-left hover:bg-base-200"
        >
          {avatarEl}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-base-content/50">{user.email}</p>
          </div>
          <ChevronsUpDown className="size-3.5 shrink-0 text-base-content/40" />
        </div>
      ) : (
        <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-2">
          {avatarEl}
          <span className="hidden max-w-32 truncate sm:inline">{name}</span>
        </div>
      )}

      <ul
        tabIndex={0}
        className="dropdown-content menu z-50 mt-2 w-52 rounded-box border border-base-200 bg-base-100 p-2 shadow-lg"
      >
        <li className="menu-title truncate">{user.email}</li>
        <li>
          <Link href="/dashboard">Dashboard</Link>
        </li>
        {esSuperAdmin && (
          <li>
            <Link href="/superadmin" className="gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Super admin
            </Link>
          </li>
        )}
        <li>
          <form action={signOut}>
            <button type="submit" className="w-full text-left text-error">
              Cerrar sesión
            </button>
          </form>
        </li>
      </ul>
    </div>
  )
}
