import "./globals.css"
import { Space_Grotesk, DM_Sans } from "next/font/google"

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
  title: {
    default: "VibeFast · Docs",
    template: "%s · VibeFast Docs",
  },
  description: "Documentación de VibeFast — el boilerplate del Curso de Vibecoding.",
  icons: { icon: "/favicon.svg" },
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html
      lang="es"
      data-theme="vibefast"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${dmSans.variable}`}
    >
      <body className="bg-base-100 text-base-content">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='vibefast'||t==='vibefast-dark'){document.documentElement.setAttribute('data-theme',t)}}catch(e){}`,
          }}
        />
        {children}
      </body>
    </html>
  )
}
