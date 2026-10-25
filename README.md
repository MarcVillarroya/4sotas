# 4 Sotas · sitio

Sitio estático de **4 Sotas** (marca paraguas) con **Sota de Oros** como primera sección operativa.
Astro en SSG, TypeScript strict, cero SSR, cero base de datos, cero secretos.

El **repositorio es la única fuente de verdad**: las rutas, la navegación, el `<head>`, el JSON-LD y el
sitemap se generan desde `src/content/**`. No se duplica metadato a mano.

## Requisitos

- Node.js `>= 22.23.4` (probado con `v26.7.0`)
- npm `>= 9.6.5` (probado con `11.19.0`)

## Comandos (verificados en este repo)

```bash
npm ci          # instalación reproducible desde package-lock.json
npm run dev     # servidor local: http://localhost:4321/4sotas/
npm run check   # astro check (TS + esquemas de contenido)
npm test        # tests unitarios de lib/ (node:test + type stripping)
npm run build   # build estático -> dist/
npm run validate # integridad de contenido + comprobaciones sobre dist/
npm run preview # sirve dist/ con la base real
```

Orden obligatorio antes de commit y en CI: `check` → `test` → `build` → `validate`.

Resultado actual de referencia (26-oct-2026):

| comando | resultado |
|---|---|
| `npm run check` | 0 errores, 0 warnings, 0 hints (20 ficheros) |
| `npm test` | 15 tests, 15 pasan |
| `npm run build` | 3 páginas estáticas (`/`, `/oros/`, `404.html`) + `robots.txt` + sitemap |
| `npm run validate` | `ok · 0 bloqueantes · 12 avisos` (los 12 avisos son vídeos públicos que aún no tienen ficha) |

## Origen y base path

Nada de esto se escribe a mano: se configura por entorno.

```bash
# GitHub Pages de proyecto (por defecto)
SITE_ORIGIN=https://marcvillarroya.github.io SITE_BASE=/4sotas npm run build

# Dominio raíz (día que exista un dominio propio)
SITE_ORIGIN=https://example.org SITE_BASE=/ npm run build
```

- Toda ruta interna pasa por `url()` de `src/lib/rutas.ts`, que añade `import.meta.env.BASE_URL`.
- Los assets de `public/` se referencian como `url('/assets/x.png')`; los de `src/assets/` los versiona Astro.
- La canónica se deriva en `Base.astro` con `new URL(Astro.url.pathname, Astro.site).href`.
- `robots.txt` es un endpoint (`src/pages/robots.txt.ts`): la línea `Sitemap:` sale del origen configurado.
- El dominio `4sotas.com` **no está registrado**: el validador bloquea cualquier canónica o JSON-LD que lo nombre.

Comprobado con ambos entornos: con `SITE_BASE=/` la salida no contiene ninguna ruta `/4sotas` y las canónicas
pasan a `https://example.org/…`.

## Estructura

```
src/
├─ content.config.ts        # modelo Zod (copia canónica de architecture/content.config.ts)
├─ content/
│  ├─ sotas/               # YAML: universo/palo
│  ├─ autores/             # YAML: autoría verificable
│  └─ temas|articulos|videos|series|herramientas|glosario|fuentes/   # vacías a propósito en F1
├─ lib/
│  ├─ rutas.ts             # url(), canonica(), BASE, rutas de la V1
│  ├─ publicacion.ts       # única definición de "publicado"
│  ├─ seo.ts               # título ≤65, descripción ≤160, OG absoluta
│  └─ jsonld.ts            # Organization / WebSite / WebPage / CollectionPage
├─ layouts/Base.astro      # head completo + skip link + shell
├─ components/             # Header, Footer, JsonLd
├─ pages/                  # index, oros/index, 404, robots.txt
└─ styles/                 # tokens.css (marca F0) + global.css
scripts/
├─ validate-content.mjs    # validador editorial y de salida (3 capas)
└─ build-og.mjs            # regenera public/assets/og/*.png con Chromium local
data/inventory-snapshot.json  # copia versionada del bloque `videos` del inventario real
tests/                        # node:test sobre lib/
```

## Contenido y publicación

- Una entidad por fichero. `id` permanente en el frontmatter (`art-`, `vid-`, `tema-`…); `slug` cambiable.
- Estados: `borrador` → `revision` → `aprobado` → `publicado` → `archivado`.
- `status: publicado` exige fecha `publicado`, `revisado_factual`, `seo.descripcion` y (si YMYL) al menos una
  fuente tipada. Zod falla el build si falta.
- Aislamiento de borradores: `publicados()` de `src/lib/publicacion.ts` es el único filtro; el validador
  comprueba además que ningún borrador tenga página en `dist/`.
- Vídeos: solo se fichan los que existen en `data/inventory-snapshot.json` (copia de la API real, sin tokens).
  Actualizar el snapshot es una tarea manual con fecha en el commit.

### Añadir una guía

1. Crear `src/content/articulos/<slug>.md` con el frontmatter del modelo (`architecture/DATA-MODEL.md` §2.3).
2. `npm run check && npm test && npm run build && npm run validate`.
3. Si `validate` bloquea, no se publica: se corrige el contenido, no el validador.

## Estado de esta fase (F1 · scaffold)

Hecho: repositorio, colecciones, layouts, home `/`, home `/oros/`, SEO técnico, sitemap, robots, 404, CI y tests.

No hecho todavía (cards posteriores, no huecos silenciosos):

- Plantillas de tema, guía, watch page, glosario y calculadora; catálogos `/data/*.json` y `llms.txt`.
- Fichas de vídeo: el catálogo está vacío y la home lo dice explícitamente; los 12 avisos de
  `W-VIDEO-SIN-FICHA` son ese estado real, no un fallo.
- `AGENTS.md`: el contenido está aprobado en `architecture/AGENTS.skeleton.md` y se copia cuando el
  propietario lo autorice.
- Páginas legales (`/sobre-nosotros/`, `/aviso-legal/`…): necesitan datos reales del titular.
- El validador calcula mal el prefijo esperado con `SITE_BASE=/` (dominio raíz): compara contra `origin//`.
  Afecta solo a ese modo; el build raíz es correcto (comprobado). Se corrige al migrar de dominio.

## CI

`.github/workflows/ci.yml`: un workflow, dos jobs.

- `build`: `npm ci` → `check` → `test` → `build` → `validate`, con `SITE_ORIGIN`/`SITE_BASE` en `env`, artefactos
  `validate-report` y `sitio-dist`.
- `deploy`: solo en `main` y solo si `vars.DEPLOY_ENABLED == 'true'`. Despublica nada por sí mismo: sube el
  `dist` que ya pasó los gates, sin reconstruir.

Sin secretos en el workflow: la web nunca llama a la API de YouTube en build.

## Reglas que el validador hace cumplir

Bloqueantes (`B-*`): IDs y slugs duplicados, referencias colgantes o a borradores desde contenido publicado,
vídeo no público publicado, vídeo inventado, herramienta anunciada sin implementar, secretos, canónica ausente
o fuera de origen/base, borradores en `dist`, enlaces sin base o rotos, sitemap huérfano, JSON-LD no parseable
con ratings o con `4sotas.com`, falta de `404.html`/`robots.txt`/`sitemap-index.xml`.

Avisos (`W-*`): caducidad de revisión, longitudes de SEO, vídeos públicos sin ficha, fuente vencida, enlaces
relativos. Nunca se silencian con `|| true`.
