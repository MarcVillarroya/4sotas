# DEPLOY · 4Sotas

## Ahora: Cloudflare Pages (producción)

| Dato | Valor |
| --- | --- |
| URL | **https://4sotas.com** (y `www` → 301 al apex por Page Rule) |
| Proyecto | `4sotas` en la cuenta de Marc Villarroya (`7cc5b8908a55337b3541ca4f69977b23`) |
| Modo | *Direct upload*: no hay build en Cloudflare; se sube `dist/` ya construido |
| Preview | https://4sotas.pages.dev |
| Build | `SITE_ORIGIN=https://4sotas.com SITE_BASE=/ npm run build` |
| Publicar | `npx wrangler pages deploy dist --project-name=4sotas --branch=main` |
| Token | `~/.hermes/secrets/cloudflare.env` (Pages + DNS + Zone Settings; sin caché ni WAF) |

Los valores por defecto de `astro.config.mjs` ya son producción: un build sin variables publica
canónicas de `4sotas.com` y base `/`. `SITE_ORIGIN`/`SITE_BASE` solo hacen falta para
reproducir el host antiguo.

### Verificación después de publicar

1. `curl -sI https://4sotas.com/` → 200 y cabeceras de `public/_headers`.
2. `/robots.txt` contiene `Content-Signal` y el `Sitemap:` absoluto; `/llms.txt`, `/llms-full.txt`
   y `/rss.xml` responden 200.
3. `/sitemap.xml` responde 301 a `/sitemap-index.xml`.
4. Una ficha de vídeo carga su póster (`?v=` cambia cuando cambia el fichero).
5. `npm run validate` en local antes de subir: 0 bloqueantes.

### Trampas conocidas

- **Caché de assets**: `/assets/*` y `/_astro/*` van con `max-age=31536000, immutable`. Si un
  asset se pidió antes de existir, el 404 queda cacheado un año y el token no puede purgar
  (`purge_cache` sin permiso). Por eso los pósters llevan `?v=<mtime>`: cambiar el fichero
  cambia la URL.
- **`public/robots.txt` ya no existe**: el `robots.txt` se genera en `src/pages/robots.txt.ts`.
  Un fichero en `public/` con el mismo nombre gana y silencia la ruta (Astro solo avisa).
- **www**: el apex es el canónico. La redirección vive en una Page Rule de Cloudflare, no en el
  repo; si se borra, `www` vuelve a servir 200 duplicado.
- **Redirecciones**: `public/_redirects` (Pages) resuelve `/sitemap.xml` y `/feed.xml`.

## Historial: GitHub Pages (V1, retirado)


Evidencia real del despliegue público de la V1 (2026-10-26).

## URL pública

**https://marcvillarroya.github.io/4sotas/**

- HTTP 200 verificado con `curl` (no solo workflow verde).
- HTTPS forzado (`https_enforced: true`), `public: true`, `build_type: workflow`.

## Repositorio

| Dato | Valor |
| --- | --- |
| Repo | `MarcVillarroya/4sotas` |
| Visibilidad | **PUBLIC** (`isPrivate: false`) — necesario para Pages gratuito |
| Rama por defecto | `main` |
| Remote en local | `origin` → `https://github.com/MarcVillarroya/4sotas.git` |
| Pages | source `GitHub Actions` (workflow), sin rama `gh-pages` |
| Variable de repo | `DEPLOY_ENABLED=true` (gate del job `deploy`) |

`main` se avanzó por fast-forward `138b50e..ec29a28` (sin reescritura de historia, sin `--force`).

## Despliegue del contenido

| Dato | Valor |
| --- | --- |
| Commit desplegado | `ec29a2836d9be32eb2788e9132b62b0f0e88c769` |
| Workflow run | `40264322558` (`ci`) — `success` |
| Job build | `121383259344` — 32 s |
| Job deploy | `121383406570` — 12 s |
| Deployment API id | `7323416605` (environment `github-pages`) |
| Inicio / fin del run | 2026-10-26T03:29:27Z / 03:30:20Z |

Pasos del job `build` en CI, todos en verde: `npm ci`, `npm run check`, `npm test`, `npm run build`,
build de fixtures, verificación de plantillas/JSON-LD/aislamiento de borradores, `npm run validate`,
publicación de artefactos (`sitio-dist`). El job `deploy` consume `sitio-dist` con
`actions/configure-pages` + `upload-pages-artifact` + `deploy-pages`, con permisos mínimos
`pages: write` e `id-token: write` (el job `build` solo tiene `contents: read`).

> Este fichero se añade en un commit posterior de documentación; ese commit se redespliega por el
> mismo workflow sin cambiar contenido publicado. El run y SHA exactos de esa pasada quedan
> registrados en el handoff de la tarea `t_9856bbda`.

## Smoke test público (curl + Node, 2026-10-26T03:31Z)

Script: `verificar-publico.mjs` (fetch real contra la URL pública). Resultado **PASS**.

| Ruta | Estado | Comprobaciones |
| --- | --- | --- |
| `/` | 200 | 3 bloques JSON-LD, 1 canonical, 1 h1, `lang="es-ES"` |
| `/oros/` | 200 | 2 JSON-LD, canonical, 1 h1 |
| `/oros/temas/vivienda-y-hipoteca/` | 200 | 4 JSON-LD, canonical, 1 h1 |
| `/oros/guias/bruto-a-neto/` | 200 | 3 JSON-LD (Article), canonical, 1 h1 |
| `/oros/videos/como-leer-una-nomina/` | 200 | 3 JSON-LD (VideoObject), **0 iframes** hasta el clic |
| `/oros/herramientas/interes-compuesto/` | 200 | 4 JSON-LD (SoftwareApplication), formulario + `<noscript>` |
| `/oros/glosario/tae/` | 200 | 3 JSON-LD (DefinedTerm), canonical, 1 h1 |
| `/robots.txt` | 200 | permite Googlebot/Bingbot/OAI-SearchBot/PerplexityBot; bloquea GPTBot/ClaudeBot/Google-Extended/CCBot/Bytespider; `Sitemap:` correcto |
| `/sitemap-index.xml` | 200 | índice → `sitemap-0.xml` |
| `/sitemap-0.xml` | 200 | **46 URLs, 46/46 con HTTP 200** |
| `/llms.txt` | 200 | 6.073 B |
| `/404.html` | 200 | página de error estática |
| `/data/catalog.json`, `/data/videos.json`, `/data/topics.json`, `/data/tools.json` | 200 | catálogos públicos |

Notas:

- El sitemap canónico del sitio es **`/sitemap-index.xml`** (convención de `@astrojs/sitemap`).
  `/sitemap.xml` devuelve 404 y `robots.txt` apunta al índice, no a `/sitemap.xml`.
- JSON-LD: todos los bloques parsean (`JSON.parse`), sin `aggregateRating`, sin `review`, sin
  precios inventados y sin referencias a `4sotas.com`.
- Canonical: exactamente uno por página, siempre dentro de `https://marcvillarroya.github.io/4sotas`.
- Ningún `href`/`src` raíz queda fuera de la base `/4sotas` (0 enlaces sin prefijo).

## Higiene de la build pública

- **0 borradores**: ninguna página/catálogo público contiene `fixture`/`draft` (comprobado en `/`,
  `/oros/`, `/data/*.json`).
- **0 secretos**: sin `yt_token.json`, `gho_*`, `github_pat_*`, `AKIA*` ni claves PEM en el HTML
  servido; `.gitignore` excluye `.env*`, `*.token`, `yt_token.json`, `*.pem`, `*.key`.
- **0 referencias a `4sotas.com`**: dominio no registrado ni configurado (fuera de alcance).
- Repo sigue siendo público; no se ha cambiado a privado.

## Reproducir

```bash
# Estado del despliegue
gh api repos/MarcVillarroya/4sotas/pages
gh run list --repo MarcVillarroya/4sotas --limit 3
gh api repos/MarcVillarroya/4sotas/deployments --jq '.[0] | {sha,environment}'

# Verificación pública
curl -sI https://marcvillarroya.github.io/4sotas/ | head -1
curl -s https://marcvillarroya.github.io/4sotas/sitemap-0.xml | grep -c '<loc>'
```

## Límite conocido: `robots.txt` en un sitio de proyecto de GitHub Pages

Los rastreadores solo leen `robots.txt` en la **raíz del origen**. Aquí el origen es
`https://marcvillarroya.github.io` (host compartido que no se puede publicar desde este repositorio),
así que el archivo servido en `https://marcvillarroya.github.io/4sotas/robots.txt` (HTTP 200) **no anuncia
la política a ningún rastreador**: sus reglas de búsqueda y de entrenamiento son hoy decorativas.

Consecuencias y control real:

- Lo que sí se aplica es el `<meta name="robots">` de cada página, y el `404.html` es el único con
  `noindex`. El resto de páginas públicas no bloquea indexación.
- Para que la política sea efectiva hay que cambiar de modelo de publicación (dominio propio o repositorio
  `<usuario>.github.io`, donde la raíz sí es del propietario) o servir el `robots.txt` desde una capa
  propia. Ninguna de las dos está en este repositorio.
- `src/pages/robots.txt.ts` deja el aviso en el propio archivo y mantiene el `Sitemap:`, útil si algún día
  se sirve desde la raíz del origen.

