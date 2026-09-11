import "./globals.css"
import { Space_Grotesk, DM_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import config from "@/config"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-dm-sans",
  display: "swap",
})

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || config.app.defaultUrl
  ),
  title: {
    default: config.app.name,
    template: `%s · ${config.app.name}`,
  },
  description: config.app.description,
  openGraph: {
    title: config.app.name,
    description: config.app.description,
    type: "website",
    locale: config.app.locale === "es" ? "es_MX" : "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: config.app.name,
    description: config.app.description,
  },
  icons: { icon: "/favicon.svg" },
}

export const viewport = {
  themeColor: config.brand.primary,
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html
      lang={config.app.locale}
      data-theme="vibecoding"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${dmSans.variable}`}
      style={{ "--color-primary": config.brand.primary }}
    >
      <head>
        {/* Satoshi (Fontshare) — solo para el logo y el H1 del hero de
            landing, según el diseño de Figma. El resto del sitio sigue
            en Space Grotesk/DM Sans (next/font, ya cargadas arriba). */}
        <link
          href="https://api.fontshare.com/v2/css?f[]=satoshi@700,900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-base-100 text-base-content">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='vibecoding'||t==='vibecoding-dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}`,
          }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
