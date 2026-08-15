// ============================================================
// Vibecoding · config.js
// ------------------------------------------------------------
// ESTE ES EL ARCHIVO MÁS IMPORTANTE DEL BOILERPLATE.
// Todo el branding, copy, features y configuración del producto vive aquí.
// Cambiar este archivo cambia el producto entero — sin abrir JSX.
//
// Estructura:
//   - app:      identidad del producto (nombre, descripción, dominio, color)
//   - features: toggles para encender/apagar funcionalidades
//   - ai:       configuración de OpenAI
//   - email:    configuración de Resend
//   - auth:     providers habilitados
//   - landing:  copy de la página pública
//   - pricing:  planes (si features.pricing está activo; el cobro real es features.paypal)
//
// Tip Sem 1: empieza editando `app` y `landing.hero` con los datos de tu producto.
// ============================================================

const config = {
  // -----------------------------------------------------------
  // Identidad del producto
  // -----------------------------------------------------------
  app: {
    name: "VibeCode",
    description:
      "Boilerplate para crear páginas y productos web con IA, pensado para estudiantes y profesionistas de Chihuahua que quieren estar al día con la tecnología.",
    domain: "vibecode.mx", // sin https://, sin www
    locale: "es", // "es" | "en"
    // URL pública: usa NEXT_PUBLIC_APP_URL en .env. En este config solo definimos el default.
    defaultUrl: "http://localhost:3000",
  },

  // -----------------------------------------------------------
  // Identidad visual
  // -----------------------------------------------------------
  brand: {
    // Color primario en HEX. DaisyUI lo aplica como --color-primary via theme.
    primary: "#4F46E5", // indigo-600: tech, IA y confianza profesional
    // Logo: puede ser texto o ruta a /public/logo.svg
    logoText: "Vibecoding",
    logoSrc: null,
    // Estilo del bordeado global (DaisyUI usa esto para botones, cards)
    radius: "1rem",
  },

  // -----------------------------------------------------------
  // Toggles de features — encienden/apagan rutas y componentes
  // -----------------------------------------------------------
  features: {
    waitlist: true, // Captura emails en landing — Sem 1
    googleAuth: true, // Login con Google — Sem 2
    emailLogin: false, // Magic link email — opcional
    aiChat: true, // Chat AI en /chat — Sem 3
    toolUse: true, // Tool use registry — Sem 4
    agents: true, // LangGraph agents — Sem 5 (opcional-avanzado)
    resend: true, // Email — Sem 1+
    pricing: true, // Muestra la sección de precios en la landing (vitrina; el cobro real es `paypal`)
    paypal: false, // Botón PayPal.me en Pricing (configura `payment` abajo)
    adminPanel: true, // Panel /admin de leads (waitlist) — requiere ADMIN_PASSWORD en .env.local
  },

  // -----------------------------------------------------------
  // PayPal.me (si features.paypal está activo)
  // -----------------------------------------------------------
  payment: {
    paypalMeUsername: "", // tu usuario de https://paypal.me (sin @ ni URL)
    defaultAmount: 0, // 0 = el comprador elige el monto
    currency: "USD",
    buttonText: "Pagar con PayPal",
  },

  // -----------------------------------------------------------
  // OpenAI
  // -----------------------------------------------------------
  ai: {
    chatModel: "gpt-4o-mini", // default barato y rápido
    structuredModel: "gpt-4o-mini",
    agentModel: "gpt-4o", // los agentes razonan mejor con full gpt-4o
    maxTokens: 1500,
    temperature: 0.4,
  },

  // -----------------------------------------------------------
  // Resend (email transaccional)
  // -----------------------------------------------------------
  email: {
    // Asegúrate de tener el dominio verificado en Resend antes de cambiar `from`.
    // En desarrollo Resend permite enviar a tu propio correo desde `onboarding@resend.dev`.
    from: "Vibecoding <onboarding@resend.dev>",
    replyTo: "hola@vibecoding.dev",
    supportEmail: "soporte@vibecoding.dev",
  },

  // -----------------------------------------------------------
  // Auth providers
  // -----------------------------------------------------------
  auth: {
    loginUrl: "/login",
    afterLoginUrl: "/dashboard",
    afterLogoutUrl: "/",
    providers: ["google"], // se sincroniza con features.googleAuth / emailLogin
  },

  // -----------------------------------------------------------
  // Landing — todo el copy de la página pública
  // -----------------------------------------------------------
  landing: {
    nav: [
      { label: "Características", href: "#features" },
      { label: "Precios", href: "#pricing" },
      { label: "Preguntas", href: "#faq" },
      { label: "Docs", href: "/docs" },
    ],
    hero: {
      eyebrow: "Boilerplate con IA · Chihuahua",
      title: "Crea tu producto web con IA y quédate al día.",
      subtitle:
        "La base para estudiantes y profesionistas de Chihuahua que quieren lanzar páginas reales sin quedarse atrás en tecnología.",
      cta: { label: "Empieza ahora", href: "#waitlist" },
      ctaSecondary: { label: "Ver docs", href: "/docs" },
    },
    problem: {
      eyebrow: "El problema",
      title: "Tu negocio necesita presencia digital, no un título en sistemas.",
      subtitle:
        "La mayoría de los emprendedores se quedan fuera de lo digital por creer que es caro o complicado.",
      items: [
        {
          icon: "Timer",
          title: "Meses cotizando",
          body: "Una página 'profesional' te la cotizan cara y tarda meses. Mientras, tus clientes te buscan y no te encuentran.",
        },
        {
          icon: "Puzzle",
          title: "Herramientas que abruman",
          body: "Dominio, hosting, base de datos… cada término suena a otro idioma y nadie te lo explica en simple.",
        },
        {
          icon: "PlugZap",
          title: "La IA cambió las reglas",
          body: "Hoy puedes construirlo tú, describiendo lo que necesitas en español. Solo te falta la base correcta.",
        },
      ],
    },
    features: {
      eyebrow: "Lo que ya viene listo",
      title: "Todo lo del curso, ya cableado.",
      subtitle: "Tú te enfocas en tu negocio; la plantilla pone la parte técnica.",
      items: [
        {
          icon: "LayoutTemplate",
          title: "Páginas listas para publicar",
          body: "Parte de un boilerplate y lanza tu landing o producto web sin empezar de cero.",
        },
        {
          icon: "Sparkles",
          title: "IA integrada de verdad",
          body: "Chat, tools y agentes ya cableados para construir y operar tu producto con IA.",
        },
        {
          icon: "RefreshCw",
          title: "Stack del día a día",
          body: "Usas las herramientas que el mercado pide hoy, no las de hace cinco años.",
        },
      ],
    },
    faq: {
      eyebrow: "Preguntas frecuentes",
      title: "Lo que todos preguntan antes de arrancar.",
      items: [
        {
          q: "¿Necesito saber programar para usarlo?",
          a: "No. Describes lo que quieres en español y la IA escribe el código sobre este boilerplate; tú revisas y publicas.",
        },
        {
          q: "¿Sirve para un proyecto de la uni o para un negocio?",
          a: "Sí. Estudiantes lo usan para entregar algo real; profesionistas, para lanzar una landing o un producto con IA integrada.",
        },
        {
          q: "¿Esto me actualiza de verdad o es otra plantilla vieja?",
          a: "El stack es el que se usa hoy: Next.js, Supabase e IA con chat, tools y agentes. Lo aprendes construyendo, no viendo tutoriales de hace años.",
        },
        {
          q: "¿Cuánto cuesta tenerlo en línea desde Chihuahua?",
          a: "Vercel y Supabase tienen planes gratuitos. OpenAI cobra por uso; un MVP típico ronda US$5–20 al mes.",
        },
      ],
    },
    finalCta: {
      eyebrow: "Tu turno",
      title: "Deja de posponerlo. Publica tu negocio.",
      subtitle:
        "Edita config.js con los datos de tu negocio, describe lo que quieres y ten tu página en línea esta misma semana.",
      cta: { label: "Apúntate a la lista", href: "#waitlist" },
      ctaSecondary: { label: "Leer las docs", href: "/docs" },
    },
    waitlist: {
      eyebrow: "Únete primero",
      title: "Sé de los primeros en saber.",
      subtitle: "Déjanos tu correo y te avisamos cuando esto arranque.",
      successMessage: "¡Listo! Te avisamos en cuanto haya novedades.",
      buttonLabel: "Quiero entrar",
      placeholder: "tu@email.com",
    },
    footer: {
      tagline:
        "Hecho por Pedro Gutiérrez (Roni) para el curso Vibe Code · Change and Code × Startup Chihuahua.",
      columns: [
        {
          title: "Producto",
          links: [
            { label: "Características", href: "#features" },
            { label: "Precios", href: "#pricing" },
            { label: "Preguntas", href: "#faq" },
          ],
        },
        {
          title: "Recursos",
          links: [
            { label: "Docs", href: "/docs" },
            { label: "Quick start", href: "/docs/setup/quick-start" },
            { label: "Troubleshooting", href: "/docs/troubleshooting/errores-comunes" },
          ],
        },
        {
          title: "Comunidad",
          links: [
            { label: "GitHub", href: "https://github.com/RoniHY/Vibecoding", external: true },
            { label: "Change and Code", href: "https://changeandcode.com", external: true },
          ],
        },
      ],
      // Compat: links planos usados en el bar inferior
      links: [
        { label: "Docs", href: "/docs" },
        { label: "GitHub", href: "https://github.com/RoniHY/Vibecoding", external: true },
      ],
    },
  },

  // -----------------------------------------------------------
  // Pricing — vitrina de planes.
  // Se muestra en la landing si features.pricing === true.
  // El cobro real (PayPal.me) depende de features.paypal.
  // -----------------------------------------------------------
  pricing: {
    eyebrow: "Precios",
    title: "Simple y sin sorpresas.",
    subtitle: "Empieza gratis. Sube de plan cuando tu producto crezca.",
    plans: [
      {
        id: "starter",
        name: "Starter",
        price: 0,
        currency: "USD",
        interval: "mes",
        description: "Para probar el producto.",
        features: ["Hasta 100 usuarios", "Soporte por email", "Branding Vibecoding"],
        cta: "Empezar gratis",
      },
      {
        id: "pro",
        name: "Pro",
        price: 29,
        currency: "USD",
        interval: "mes",
        description: "Para founders que ya facturan.",
        features: ["Usuarios ilimitados", "Soporte prioritario", "Sin branding"],
        cta: "Probar Pro",
        highlighted: true,
      },
    ],
  },
}

export default config
