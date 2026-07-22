"use client"

import { useActionState } from "react"
import config from "@/config"
import { loginAction } from "./actions"

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null)

  return (
    <div className="w-full max-w-sm rounded-2xl border border-base-200 bg-base-100 p-8 shadow-sm">
      <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h1 className="text-2xl font-bold">Panel de administración</h1>
      <p className="mt-1 mb-8 text-sm text-base-content/60">
        {config.app.name} · Solo para uso interno
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            placeholder="••••••••"
            className="input input-bordered w-full"
          />
        </div>

        {state?.error && (
          <div role="alert" className="rounded-lg border border-error/40 bg-error/10 px-3 py-2.5 text-sm text-error">
            {state.error}
          </div>
        )}

        <button type="submit" disabled={isPending} className="btn btn-primary w-full">
          {isPending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  )
}
