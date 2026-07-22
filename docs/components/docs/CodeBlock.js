"use client"

import { useRef, useState } from "react"
import { Copy, Check } from "lucide-react"

// Etiquetas amigables por lenguaje (data-language que pone rehype-pretty-code).
const LANG_LABELS = {
  bash: "Terminal",
  sh: "Terminal",
  shell: "Terminal",
  zsh: "Terminal",
  powershell: "PowerShell",
  ps1: "PowerShell",
  js: "JavaScript",
  jsx: "JavaScript",
  ts: "TypeScript",
  tsx: "TypeScript",
  json: "JSON",
  css: "CSS",
  html: "HTML",
  md: "Markdown",
  mdx: "MDX",
  env: ".env",
  txt: "Texto",
  python: "Python",
  py: "Python",
  sql: "SQL",
  yaml: "YAML",
  yml: "YAML",
}

// Override de <pre>: header con lenguaje + botón Copiar, envolviendo la
// salida de Shiki. Reusa el patrón de copiar de PromptBox.
export default function CodeBlock({ children, ...props }) {
  const preRef = useRef(null)
  const [copied, setCopied] = useState(false)

  const lang =
    props["data-language"] ||
    (children && children.props && children.props["data-language"]) ||
    ""
  const label = LANG_LABELS[lang] || (lang ? lang : "código")

  async function copy() {
    try {
      await navigator.clipboard.writeText(preRef.current?.innerText || "")
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-base-300">
      <div className="flex items-center justify-between border-b border-base-300 bg-base-200 px-4 py-1.5 text-xs">
        <span className="font-mono text-base-content/60">{label}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-base-content/60 transition hover:bg-base-300 hover:text-base-content"
          aria-label="Copiar código"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre ref={preRef} {...props} className="bg-base-100">
        {children}
      </pre>
    </div>
  )
}
