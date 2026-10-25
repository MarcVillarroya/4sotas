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
npm run build:fixtures       # build de verificación con fixtures en borrador -> dist-fixtures/
npm run verificar:plantillas # comprueba plantillas, JSON-LD e aislamiento de borradores
npm run validate # integridad de contenido + comprobaciones sobre dist/
npm run preview # sirve dist/ con la base real
```

Orden obligatorio antes de commit y en CI: `check` → `test` → `build` → `build:fixtures` →
`verificar:plantillas` → `validate`.

Resultado actual de referencia (26-oct-2026):

| comando | resultado |
|---|---|
| `npm run check` | 0 errores, 0 warnings, 0 hints (38 ficheros) |
| `npm test` | 59 tests, 59 pasan |
| `npm run build` | 8 páginas estáticas (`/`, `/oros/`, 5 índices de sección, `404.html`) + `robots.txt` + sitemap |
| `npm run build:fixtures` | 14 páginas (los 8 públicos + 6 plantillas de detalle con fixture) |
| `npm run verificar:plantillas` | `ok · 13 comprobaciones · 0 fallos` |
| `npm run validate` | `ok · 0 bloqueantes · 11 avisos` (los 11 avisos son vídeos públicos que aún no tienen ficha) |

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
│  ├─ rutas.ts             # url(), canonica(), BASE, constructoras de ruta tipadas
│  ├─ publicacion.ts       # única definición de "publicado" + resolución de referencias
│  ├─ migas.ts             # migas visibles y BreadcrumbList desde una sola lista
│  ├─ seo.ts               # título ≤65, descripción ≤160, OG absoluta
│  ├─ format.ts            # fechas en UTC, duraciones ISO y marcas de tiempo
│  └─ jsonld.ts            # Organization / WebSite / CollectionPage / Article / VideoObject / DefinedTerm / SoftwareApplication
├─ layouts/Base.astro      # head completo + skip link + shell
├─ layouts/Herramienta.astro # metodología de herramienta (fórmula, parámetros, supuestos, límites)
├─ components/             # Header, Footer, JsonLd, Breadcrumbs, FacadeVideo
├─ pages/                  # index, oros/**, 404, robots.txt
└─ styles/                 # tokens.css (marca F0) + global.css + plantillas.css
scripts/
├─ validate-content.mjs    # validador editorial y de salida (3 capas)
├─ verificar-plantillas.mjs # plantillas renderizadas, JSON-LD coherente, 0 borradores en dist
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

## Plantillas editoriales

| ruta | plantilla | se genera desde |
|---|---|---|
| `/oros/temas/` | índice en orden editorial (`orden`) | `temas` |
| `/oros/temas/<slug>/` | tema troncal: introducción, mapa, orden recomendado, herramientas, relacionados | `temas` + referencias |
| `/oros/guias/` | índice por fecha de publicación descendente | `articulos` |
| `/oros/guias/<slug>/` | guía: respuesta corta, cuerpo, índice lateral, supuestos, tabla de fuentes, relacionados, preguntas | `articulos` |
| `/oros/videos/` | catálogo con miniatura diferida y sin iframes | `videos` públicas |
| `/oros/videos/<slug>/` | watch page con facade de reproductor, resumen propio y metadata real | `videos` públicas |
| `/oros/glosario/` | glosario agrupado por letra + `DefinedTermSet` | `glosario` |
| `/oros/glosario/<slug>/` | término: definición, ejemplo, vecinos y guías que lo usan | `glosario` |
| `/oros/herramientas/` | índice de herramientas y su estado real | `herramientas` |
| `/oros/herramientas/<slug>/` | metodología (fórmula, parámetros, supuestos, límites, revisión) | `herramientas` |

Reglas que no se negocian en estas plantillas:

- La metadata (título, descripción, canónica, OG, JSON-LD, migas) se **deriva** de la colección; nada se escribe por página.
- Las migas visibles y el `BreadcrumbList` salen de la misma lista (`lib/migas.ts`); la última miga es la canónica.
- Los enlaces internos pasan por `ruta.tema()`, `ruta.guia()`, `ruta.video()`… y una referencia a un borrador se descarta
  (nunca se enlaza algo que el build no ha generado).
- Listados: cero iframes. La watch page inserta el iframe de `youtube-nocookie` **solo** tras pulsar el botón;
  sin JS queda el enlace directo a YouTube.
- Estados vacíos explícitos: un índice sin contenido lo dice y explica por qué, en lugar de mostrar tarjetas de relleno.

### Fixtures y aislamiento de borradores

`src/content/fixture-*` no es una convención: los fixtures viven en las colecciones reales con `status: borrador`,
`id` y `slug` que llevan `fixture` en el nombre, y textos que dicen que son de prueba.

```bash
npm run build              # build público: 0 páginas de borradores (8 páginas)
npm run build:fixtures     # PUBLIC_FIXTURES=1: renderiza cada plantilla con su fixture (14 páginas)
npm run verificar:plantillas
```

`PUBLIC_FIXTURES=1` es la única excepción de `visibles()` en `src/lib/publicacion.ts`. `verificar-plantillas.mjs`
comprueba en el mismo paso que **ninguna** ruta de borrador existe en `dist/` y que **todas** existen en
`dist-fixtures/`, además de que cada página tiene una sola canónica, un solo bloque JSON-LD parseable, migas
coherentes y ningún iframe.

### Contrato con la calculadora

`layouts/Herramienta.astro` publica la metodología y deja la interfaz en el slot:

```astro
<Herramienta ficha={ficha} calcula={true}>
  <form>…</form>   <!-- el JS interactivo vive aquí, no en el layout -->
</Herramienta>
```

`SoftwareApplication` solo se emite cuando `calcula` es `true`. La ruta fija `/oros/herramientas/interes-compuesto/`
queda reservada a su propia card: `pages/oros/herramientas/[slug].astro` la excluye para no competir con ella.

## Estado de esta fase (F1 · plantillas editoriales)

Hecho: repositorio, colecciones, layouts, homes `/` y `/oros/`, SEO técnico, sitemap, robots, 404 útil, CI y tests;
y las plantillas de tema, guía, watch page con facade, catálogos, glosario y metodología de herramienta,
verificadas con fixtures en borrador y con `verificar-plantillas`.

No hecho todavía (cards posteriores, no huecos silenciosos):

- Contenido editorial real: las colecciones solo tienen fixtures; la sustitución por guías y temas revisados es la
  card de ensamblado. La calculadora (motor, UI y vectores) tiene su propia card y usa `layouts/Herramienta.astro`.
- Catálogos `/data/*.json` y `llms.txt`.
- Fichas de vídeo: el catálogo está vacío y las páginas lo dicen explícitamente; los 11 avisos de
  `W-VIDEO-SIN-FICHA` son ese estado real, no un fallo.
- `AGENTS.md`: el contenido está aprobado en `architecture/AGENTS.skeleton.md` y se copia cuando el
  propietario lo autorice.
- Páginas legales (`/sobre-nosotros/`, `/aviso-legal/`…): necesitan datos reales del titular.
- El validador calcula mal el prefijo esperado con `SITE_BASE=/` (dominio raíz): compara contra `origin//`.
  Afecta solo a ese modo; el build raíz es correcto (comprobado). Se corrige al migrar de dominio.
- `B-DRAFT-EN-DIST` del validador canónico no puede dispararse: su set de rutas pierde la barra final y compara
  contra rutas que sí la llevan. Detectado en esta card y reportado a `staff-engineer`; mientras tanto el
  aislamiento de borradores lo comprueba `npm run verificar:plantillas`.

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
