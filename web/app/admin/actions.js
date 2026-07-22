"use server"

// ============================================================
// Admin · server actions (login / logout)
// ------------------------------------------------------------
// Auth simple por contraseña (ADMIN_PASSWORD en .env.local) +
// cookie httpOnly. Suficiente para un proyecto de curso; en
// producción real usarías Supabase Auth con una lista de
// emails admin (ver docs/features/panel-admin).
// ============================================================

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// El token es la versión en base64 de la contraseña.
function makeToken(password) {
  return Buffer.from(password).toString("base64")
}

export async function loginAction(prevState, formData) {
  const password = formData.get("password")
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!password || !adminPassword || password !== adminPassword) {
    return { error: "Contraseña incorrecta. Inténtalo de nuevo." }
  }

  const cookieStore = await cookies()
  cookieStore.set("admin_token", makeToken(adminPassword), {
    httpOnly: true, // JS del navegador no puede leerla
    secure: process.env.NODE_ENV === "production", // solo HTTPS en producción
    maxAge: 60 * 60 * 8, // expira en 8 horas
    path: "/",
    sameSite: "lax",
  })

  redirect("/admin")
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_token")
  redirect("/admin")
}
