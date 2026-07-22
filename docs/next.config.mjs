/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    // Páginas de docs que se movieron de sección (reorg de la IA)
    return [
      // Páginas eliminadas o renombradas en el recorte G4 (fuera hardware/MCP/RAG/Stripe)
      {
        source: "/docs/tutoriales/semana-5-agentes-mcp",
        destination: "/docs/tutoriales/semana-5-agentes",
        permanent: true,
      },
      {
        source: "/docs/tutoriales/semana-10-demo-day",
        destination: "/docs/tutoriales/semana-8-demo-day",
        permanent: true,
      },
      { source: "/docs/tutoriales/semana-8-hardware-fundamentos", destination: "/docs", permanent: true },
      { source: "/docs/tutoriales/semana-9-hardware-caso-uso", destination: "/docs", permanent: true },
      { source: "/docs/features/hardware-esp-claw", destination: "/docs", permanent: true },
      { source: "/docs/features/mcp", destination: "/docs", permanent: true },
      { source: "/docs/features/rag", destination: "/docs", permanent: true },
      { source: "/docs/configuracion/stripe", destination: "/docs/configuracion/paypal", permanent: true },
      // PostHog -> Vercel Analytics
      { source: "/docs/configuracion/posthog", destination: "/docs/configuracion/vercel-analytics", permanent: true },
      { source: "/docs/setup/posthog", destination: "/docs/configuracion/vercel-analytics", permanent: true },
      { source: "/docs/recetas/chatbot-con-rag", destination: "/docs", permanent: true },
      { source: "/docs/recetas/saas-con-suscripcion", destination: "/docs", permanent: true },
      // Rebrand VibeFast -> Vibecoding (slug viejo)
      {
        source: "/docs/intro/que-es-vibefast",
        destination: "/docs/intro/que-es-vibecoding",
        permanent: true,
      },
      {
        source: "/docs/fundamentos/prepara-tu-compu",
        destination: "/docs/setup/prepara-tu-compu",
        permanent: true,
      },
      // github-ssh se eliminó: el flujo con HTTPS + Cursor no necesita SSH
      {
        source: "/docs/fundamentos/github-ssh",
        destination: "/docs/setup/quick-start",
        permanent: true,
      },
      {
        source: "/docs/setup/github-ssh",
        destination: "/docs/setup/quick-start",
        permanent: true,
      },
      {
        source: "/docs/setup/instalacion",
        destination: "/docs/setup/prepara-tu-compu",
        permanent: true,
      },
      // Páginas movidas a la sección Configuración
      ...["variables-de-entorno", "google-oauth", "openai", "resend"].map(
        (slug) => ({
          source: `/docs/setup/${slug}`,
          destination: `/docs/configuracion/${slug}`,
          permanent: true,
        })
      ),
    ]
  },
}

export default nextConfig
