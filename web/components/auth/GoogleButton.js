"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

// Botón de "Continuar con Google". Dispara el flujo OAuth de Supabase.
// Tras autenticar, Google redirige a /auth/callback, que intercambia
// el código por una sesión y manda al usuario a `next`.
export default function GoogleButton({ next = "/dashboard" }) {
  const [loading, setLoading] = useState(false)

  async function signIn() {
    setLoading(true)
    const supabase = createClient()
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    // #region agent log
    await fetch('http://127.0.0.1:7272/ingest/39df767c-b973-463f-a8a2-7edad4dec321',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6525be'},body:JSON.stringify({sessionId:'6525be',runId:'pre-fix',hypothesisId:'H1-H3',location:'GoogleButton.js:signIn',message:'oauth redirectTo before authorize',data:{origin:window.location.origin,next,redirectTo,hasHttps:redirectTo.startsWith('https://'),hasHttp:redirectTo.startsWith('http://'),hasNextQuery:redirectTo.includes('?next='),nextIsRelative:typeof next==='string'&&next.startsWith('/')},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    })
    let authorizeHost = null
    let authorizeRedirectTo = null
    try {
      if (data?.url) {
        const authorizeUrl = new URL(data.url)
        authorizeHost = authorizeUrl.host
        authorizeRedirectTo = authorizeUrl.searchParams.get("redirect_to")
      }
    } catch {
      /* ignore parse errors */
    }
    // #region agent log
    await fetch('http://127.0.0.1:7272/ingest/39df767c-b973-463f-a8a2-7edad4dec321',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6525be'},body:JSON.stringify({sessionId:'6525be',runId:'pre-fix',hypothesisId:'H3-H5',location:'GoogleButton.js:signIn:after',message:'oauth authorize url parsed',data:{hasError:!!error,errorMessage:error?.message||null,hasAuthorizeUrl:!!data?.url,authorizeHost,authorizeRedirectTo},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    if (error) {
      setLoading(false)
      return
    }
    if (data?.url) window.location.assign(data.url)
  }

  return (
    <button
      onClick={signIn}
      disabled={loading}
      aria-busy={loading}
      className="btn btn-outline w-full gap-3"
    >
      {loading ? (
        <span className="loading loading-spinner loading-sm" />
      ) : (
      <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
        />
      </svg>
      )}
      {loading ? "Conectando…" : "Continuar con Google"}
    </button>
  )
}
