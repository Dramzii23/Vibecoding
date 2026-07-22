# VibeFast · Docs (app standalone)

App Next.js que sirve **solo la documentación** de VibeFast, desplegable por separado de la app principal (`web/`). Lee el contenido de `../docs-content` (la misma fuente que usa `web`).

## Correr en local

Desde la raíz del monorepo:

```bash
yarn install
yarn docs:dev      # arranca en http://localhost:3001
```

`/` redirige a `/docs`.

## Deploy en Vercel (como sitio aparte)

1. Importa el repo en Vercel.
2. **Root Directory**: `docs`.
3. Framework: Next.js (autodetectado). Sin variables de entorno (las docs son estáticas).
4. Deploy.

## Mover a su propio repo (a futuro)

Esta app está desacoplada de la app principal (no importa `@/config`, ni Supabase, ni el Navbar/Footer de marketing). Para extraerla:

1. Copia la carpeta `docs/` **y** `docs-content/` al nuevo repo, con `docs-content/` como hermano de `docs/` (misma estructura que aquí).
2. La ruta se resuelve en `docs/lib/docs.js`: `path.join(process.cwd(), "..", "docs-content")`. Si prefieres `docs-content/` **dentro** de la app, cámbiala a `path.join(process.cwd(), "docs-content")` y mueve la carpeta.
3. `yarn install` + `yarn dev`.

## Notas

- Los componentes de docs (`components/docs/*`) y `lib/{docs,searchFilter}.js` son **copias** de los de `web/` (fuente compartida: `docs-content/`). Al editar un componente de docs, cámbialo en ambos lugares hasta consolidar en este repo.
- Tema, tipografía y estilos de prosa viven en `app/globals.css` y `app/layout.js` (sin dependencia de `config.js`).
