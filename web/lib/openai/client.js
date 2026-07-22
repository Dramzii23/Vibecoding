// ============================================================
// OpenAI · cliente compartido
// ------------------------------------------------------------
// TODO el acceso a OpenAI pasa por aquí. Un solo cliente para
// chat, structured outputs, agentes y embeddings — así la API key
// y la configuración del SDK viven en un único lugar.
//
// Importa desde aquí en server-only (Route Handlers, Server
// Actions). Nunca expongas este cliente al browser.
//
// El cliente se construye de forma perezosa (Proxy): el SDK valida
// la presencia de OPENAI_API_KEY al instanciarse, y `next build`
// importa cada route para recolectar su metadata. Si construyéramos
// el cliente al importar, el build fallaría sin la key. Difiriendo
// la construcción al primer uso, el build pasa y una request sin
// key falla de forma controlada dentro del try/catch de la route.
// ============================================================

import OpenAI from "openai"

let client = null

function getClient() {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return client
}

export const openai = new Proxy(
  {},
  {
    get(_target, prop) {
      const value = getClient()[prop]
      return typeof value === "function" ? value.bind(getClient()) : value
    },
  }
)
