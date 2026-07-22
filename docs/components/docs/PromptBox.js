"use client"

import { useState } from "react"
import { Copy, Check, Sparkles } from "lucide-react"

export default function PromptBox({ children, label = "Prompt para Cursor" }) {
  const [copied, setCopied] = useState(false)
  const text = typeof children === "string" ? children : extractText(children)

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  return (
    <div className="my-6 overflow-hidden rounded-xl border border-primary/30 bg-primary/5">
      <div className="flex items-center justify-between gap-3 border-b border-primary/20 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
        <span className="flex items-center gap-2">
          <Sparkles className="size-4" /> {label}
        </span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-primary/15"
          type="button"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-sm leading-6 whitespace-pre-wrap font-mono text-base-content">
        {text}
      </pre>
    </div>
  )
}

function extractText(node) {
  if (typeof node === "string") return node
  if (Array.isArray(node)) return node.map(extractText).join("")
  if (node && node.props && node.props.children) return extractText(node.props.children)
  return ""
}
