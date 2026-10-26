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
npm run test:calculadora     # solo los 27 vectores del motor de interés compuesto
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
| `npm run check` | 0 errores, 0 warnings, 0 hints (48 ficheros) |
| `npm test` | 116 tests, 116 pasan |
| `npm run build` | 8 páginas estáticas (`/`, `/oros/`, 5 índices de sección, `404.html`) + `robots.txt` + `llms.txt` + 4 catálogos `/data/*.json` + sitemap |
| `npm run build:fixtures` | 52 páginas (todo el contenido importado, publicado o no) |
| `npm run verificar:plantillas` | `ok · 13 comprobaciones · 0 fallos` |
| `npm run validate` | `ok · 0 bloqueantes · 1 aviso` (el aviso es el vídeo `LL1EJttJPrs`, público y fuera de alcance V1, sin ficha) |
| `npm run publicacion:pendiente` | informe de lo que falta para publicar el contenido importado (no publica nada) |

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
│  └─ temas|articulos|videos|series|herramientas|glosario|fuentes/   # contenido real importado + fixtures en borrador
├─ lib/
│  ├─ rutas.ts             # url(), canonica(), BASE, constructoras de ruta tipadas
│  ├─ publicacion.ts       # única definición de "publicado" + resolución de referencias
│  ├─ catalogos.ts         # constructores de /data/*.json (misma regla de publicación)
│  ├─ migas.ts             # migas visibles y BreadcrumbList desde una sola lista
│  ├─ seo.ts               # título ≤65, descripción ≤160, OG absoluta
│  ├─ format.ts            # fechas en UTC, duraciones ISO y marcas de tiempo
│  ├─ calculadora.ts       # motor puro de interés compuesto: tasa EA→periodo, validación, tabla
│  ├─ calculadora-svg.ts   # SVG de barras generado desde las filas de la tabla
│  └─ jsonld.ts            # Organization / WebSite / CollectionPage / Article / VideoObject / DefinedTerm / SoftwareApplication
├─ layouts/Base.astro      # head completo + skip link + shell
├─ layouts/Herramienta.astro # metodología de herramienta (fórmula, parámetros, supuestos, límites)
├─ components/             # Header, Footer, JsonLd, Breadcrumbs, FacadeVideo, CalculadoraInteresCompuesto
├─ pages/                  # index, oros/**, 404, robots.txt
└─ styles/                 # tokens.css (marca F0) + global.css + plantillas.css
scripts/
├─ validate-content.mjs    # validador editorial y de salida (3 capas)
├─ verificar-plantillas.mjs # plantillas renderizadas, JSON-LD coherente, 0 borradores en dist
├─ pendiente-publicacion.mjs # informe de lo que falta para publicar (no publica)
├─ remark-enlaces-base.mjs # prefija con la base del build los enlaces raíz del cuerpo Markdown
└─ build-og.mjs            # regenera public/assets/og/*.png con Chromium local
data/inventory-snapshot.json  # copia versionada del bloque `videos` del inventario real
tests/                        # node:test sobre lib/ (incluye catalogos.test.ts)
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

## Catálogos, `llms.txt` y enlaces del cuerpo

Todo sale de las mismas colecciones y del mismo filtro (`publicados()`), así que un catálogo no puede listar
lo que el HTML no publica:

| endpoint | contenido | filtro añadido |
|---|---|---|
| `/data/catalog.json` | artículos | `status: publicado` |
| `/data/topics.json` | temas troncales | `status: publicado` |
| `/data/videos.json` | vídeos | publicados **y** `estado_youtube: publico` + `privacidad_api: public` |
| `/data/tools.json` | herramientas | publicadas **y** `estado_implementacion != no-implementada` |
| `/llms.txt` | resumen para agentes con conteos y URLs | mismas reglas, incluidos los cuatro catálogos |

Cabecera común: `schema_version` (semver, `1.0.0`), `generated_at` ISO-8601 y `universo`. Los constructores
viven en `src/lib/catalogos.ts` y se prueban en `tests/catalogos.test.ts` con entradas sintéticas, porque un
build público vacío también es un estado válido y un catálogo vacío no demuestra nada.

Los enlaces escritos dentro del Markdown (`[texto](/oros/guias/x/)`) se prefijan en build con la base real
mediante `scripts/remark-enlaces-base.mjs` (remark sobre `@astrojs/markdown-remark`, el procesador clásico; el
nuevo procesador por defecto de Astro 7 no ejecuta plugins remark). Sin ese prefijo, el cuerpo publicado
apuntaría a `/oros/...` fuera de `/4sotas/` y el validador lo bloquearía con `B-ENLACE-SIN-BASE`.

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
npm run build:fixtures     # PUBLIC_FIXTURES=1: renderiza cada plantilla con su fixture (15 páginas)
npm run verificar:plantillas
```

`PUBLIC_FIXTURES=1` es la única excepción de `visibles()` en `src/lib/publicacion.ts`. `verificar-plantillas.mjs`
comprueba en el mismo paso que **ninguna** ruta de borrador existe en `dist/` y que **todas** existen en
`dist-fixtures/`, además de que cada página tiene una sola canónica, un solo bloque JSON-LD parseable, migas
coherentes y ningún iframe.

### Contrato con la calculadora

`layouts/Herramienta.astro` publica la metodología (fórmula, parámetros, supuestos, límites) y deja la interfaz en
slots: el formulario va en el slot por defecto, los resultados en `resultado` y los ejemplos verificados en
`ejemplos`. El JS interactivo vive en el componente, nunca en el layout:

```astro
<Herramienta ficha={ficha} calcula={true}>
  <form>…</form>
  <Fragment slot="resultado">…</Fragment>
  <Fragment slot="ejemplos">…</Fragment>
</Herramienta>
```

`SoftwareApplication` solo se emite cuando `calcula` es `true`. La calculadora de interés compuesto **no** tiene
archivo de ruta propio: `pages/oros/herramientas/[slug].astro` monta `components/CalculadoraInteresCompuesto.astro`
cuando la ficha es `interes-compuesto`, de modo que la página aparece y desaparece con el filtro `visibles()` igual
que el resto de plantillas.

## Calculadora de interés compuesto

Motor puro en `src/lib/calculadora.ts` (versión 1.0.0), gráfico en `src/lib/calculadora-svg.ts`, interfaz en
`src/components/CalculadoraInteresCompuesto.astro` y ficha en `src/content/herramientas/herr-interes-compuesto.yaml`.

- **Tasa efectiva anual**, convertida a tasa por periodo con `i = (1+r)^(1/m) − 1`. No se divide la tasa entre la
  frecuencia: capital único al 5 % EA da el mismo resultado con capitalización anual o mensual.
- Funciones puras, sin estado global, sin envío de datos y sin dependencias de gráficos: el SVG se genera desde la
  tabla.
- 27 pruebas con vectores calculados fuera del motor (`decimal.Decimal`, 40 dígitos) y tolerancias documentadas.

Metodología completa, decisiones y tabla de vectores: `docs/CALCULADORA.md`.
Verificación ejecutada (comandos y salidas reales): `qa/f1-calculadora/VERIFICACION.md`.

## Estado de esta fase (F1 · ensamblado de contenido)

Hecho en esta card:

- Contenido importado al modelo real desde `content/grupo-a/` y `content/grupo-b/`: **7 temas** troncales,
  **8 artículos** (guías y explicadores), **12 términos** de glosario y **43 fuentes** con id permanente.
  Cinco fuentes del carril B duplicaban por URL fuentes del carril A: se conservó el id descriptivo del carril A
  y se reescribieron las referencias del carril B (`src-s2-01` → `src-ine-ipc-septiembre-2026`, etc.).
- **11 fichas de vídeo** creadas desde `data/inventory-snapshot.json`, solo con IDs reales y `privacy_status:
  public` (excluido `LL1EJttJPrs`, GTA VI, sin encaje; excluidos los dos privados del inventario).
- Catálogos `/data/*.json`, `llms.txt`, enlaces del cuerpo con base y JSON-LD de tema ajustado al nombre visible.
- Corregido un enlace roto real del contenido (`/oros/videos/crisis-de-2008/` → `crisis-de-2008-espana/`).

Estado editorial honesto: **todo el contenido sigue en `status: revision`**. Publicar exige fecha de revisión
factual registrada y, en YMYL, fuentes tipadas; ni la revisión factual ni el revisor están asignados todavía
(`content/grupo-a/README-HANDOFF.md`, `content/grupo-b/README.md`). No se ha inventado ninguna fecha de revisión.

Consecuencia estructural (verificada, no supuesta): el grafo editorial está conectado, así que publicar una sola
pieza produce `B-REF-PRIVADA` (fuga de borrador) en el validador. La publicación es un interruptor único, no una
tarea por fichero. `npm run publicacion:pendiente` genera el informe exacto de qué falta entrada por entrada.

No hecho (fuera de alcance o dependiente de un humano):

- Revisión factual con revisor asignado y paso a `publicado` del bloque editorial.
- Comprobación HTTP real de las 24 URLs del carril A (el dossier solo verificó fragmentos de índice).
- Cifras de vivienda: no se publican hasta re-ejecutar `calculos.py` y corregir los tres datos marcados `CORREGIR`.
- `AGENTS.md`, páginas legales y despliegue: cards posteriores.
- El aviso `W-VIDEO-SIN-FICHA` de `LL1EJttJPrs` es intencional: vídeo público real fuera del alcance V1.

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
