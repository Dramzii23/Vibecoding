import { updateSession } from "@/lib/supabase/middleware"

// Refresca la sesión de Supabase en cada request y protege las
// rutas privadas. La lógica vive en lib/supabase/middleware.js.
export async function middleware(request) {
  return updateSession(request)
}

export const config = {
  matcher: [
    // Todo excepto estáticos, imágenes y favicon.
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
