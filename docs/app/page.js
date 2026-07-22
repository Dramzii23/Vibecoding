import { redirect } from "next/navigation"

// La home de la app de docs redirige al índice de documentación.
export default function Home() {
  redirect("/docs")
}
