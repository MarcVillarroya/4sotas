# AGENTS.md · 4 Sotas · sitio

Guía operativa para un agente que llega al repositorio sin la conversación original.
**Fuente de verdad del contenido y las rutas: este repo.** Si este documento y el código discrepan,
gana el código; corrige el documento en el mismo PR.

- Repo: `/home/mvf/4sotas/site` (GitHub `MarcVillarroya/4sotas`, rama `main`)
- Arquitectura de referencia: `../architecture/ARCHITECTURE.md`, `../architecture/DATA-MODEL.md`,
  `../architecture/ROUTES.md`, `../architecture/VALIDATION.md`, `../architecture/SEO-AGENT.md`,
  `../architecture/CI.md`
- Documentos hermanos: `README.md` (visión y detalle), `DEPLOY.md` (evidencia del despliegue),
  `docs/MAINTENANCE.md` (operación), `docs/CALCULADORA.md` (motor de la calculadora)

## 0 · Qué es esto

Plataforma editorial sobre los cuatro palos de la baraja española. En V1 solo está activa
**Sota de Oros**: economía y finanzas personales en España, contenido YMYL (dinero, impuestos,
vivienda). El sitio es estático y sin backend: no hay comentarios, auth, analytics ni API.

Idioma del producto, del contenido y de los commits: **español de España**.

## 1 · Stack real

| Pieza | Versión / decisión |
|---|---|
| Astro | `7.4.2`, `output: 'static'` (SSG puro, cero SSR) |
| TypeScript | `6.0.3`, `astro check` en CI |
| Node / npm | `>=22.23.4` / `>=9.6.5`; probado con `v26.7.0` y `11.19.0` |
| Markdown | `@astrojs/markdown-remark` 7.3.4 (procesador clásico, para poder usar plugins remark) |
| Sitemap | `@astrojs/sitemap` 3.7.4 (`/sitemap-index.xml` → `/sitemap-0.xml`) |
| UI | Sin framework. Un solo `<script>` nativo en la calculadora |
| Datos | Ficheros Markdown/YAML en `src/content/**`. Sin base de datos |
| Dominio | `SITE_ORIGIN` + `SITE_BASE` por entorno; por defecto `https://marcvillarroya.github.io` + `/4sotas` |

`4sotas.com` **no está registrado**. El validador bloquea cualquier canónica, JSON-LD o enlace que lo nombre.

## 2 · Mapa del repositorio

```
src/
├─ content.config.ts         # modelo Zod de las 9 colecciones (copia de ../architecture/content.config.ts)
├─ content/
│  ├─ sotas/                 # YAML: palo, nombre, lema, estado, color
│  ├─ autores/               # YAML: autoría verificable (redactor / revisor-factual / editor)
│  ├─ temas/                 # MD: tema troncal
│  ├─ articulos/             # MD: guías, explicadores, análisis
│  ├─ videos/                # YAML: ficha de un vídeo real de YouTube
│  ├─ series/                # YAML: serie editorial
│  ├─ herramientas/          # YAML: calculadora (fórmula, parámetros, límites)
│  ├─ glosario/              # MD: término
│  └─ fuentes/               # YAML: fuente tipada y fechada
├─ lib/
│  ├─ rutas.ts               # url(), canonica(), ruta.*() — única fuente de rutas
│  ├─ publicacion.ts         # publicados() / visibles(): única regla de "publicado"
│  ├─ catalogos.ts           # constructores de /data/*.json
│  ├─ migas.ts               # migas visibles + BreadcrumbList
│  ├─ seo.ts                 # título, descripción, OG absoluta
│  ├─ jsonld.ts              # Organization/WebSite/CollectionPage/Article/VideoObject/DefinedTerm/SoftwareApplication
│  ├─ format.ts              # fechas UTC, duraciones ISO
│  ├─ calculadora.ts         # motor puro de interés compuesto (v1.0.0)
│  └─ calculadora-svg.ts     # SVG de barras derivado de la tabla
├─ layouts/                  # Base.astro (head completo, skip link), Herramienta.astro
├─ components/               # Header, Footer, JsonLd, Breadcrumbs, FacadeVideo, CalculadoraInteresCompuesto
├─ pages/                    # index, oros/**, 404, robots.txt, llms.txt, data/*.json
└─ styles/                   # tokens.css, global.css, plantillas.css
scripts/                     # validate-content, verificar-plantillas, pendiente-publicacion, remark-*, build-og
tests/                       # node:test sobre lib/ y el validador
data/inventory-snapshot.json # copia fechada del inventario real de YouTube (sin tokens)
qa/                          # informes de verificación (entrada/salida de QA)
```

Rutas públicas (todas derivadas del `slug`, nunca del título, siempre con `/` final):

| Ruta | Contenido | Fuente |
|---|---|---|
| `/` | portada | `sotas` + colecciones |
| `/oros/` | índice de sección | — |
| `/oros/temas/` · `/oros/temas/<slug>/` | temas troncales | `temas` |
| `/oros/guias/` · `/oros/guias/<slug>/` | artículos | `articulos` |
| `/oros/videos/` · `/oros/videos/<slug>/` | catálogo y watch page (facade, 0 iframes hasta el clic) | `videos` |
| `/oros/glosario/` · `/oros/glosario/<slug>/` | glosario | `glosario` |
| `/oros/herramientas/` · `/oros/herramientas/<slug>/` | metodología + calculadora | `herramientas` |
| `/data/{catalog,topics,videos,tools}.json` | catálogos para agentes | `src/lib/catalogos.ts` |
| `/llms.txt`, `/robots.txt`, `/sitemap-index.xml`, `/404.html` | endpoints generados | `src/pages/**` |

## 3 · Comandos verificados

Ejecutados en este repo el **2026-10-26** con `SITE_ORIGIN=https://marcvillarroya.github.io SITE_BASE=/4sotas`:

| Comando | Resultado real |
|---|---|
| `npm ci` | instalación reproducible desde `package-lock.json`, 0 vulnerabilidades |
| `npm run check` | 0 errores, 0 warnings, 5 hints (65 ficheros) |
| `npm test` | 118 tests, 118 pasan, 0 fallos |
| `npm run build` | 47 páginas en `dist/` |
| `npm run build:fixtures` | 52 páginas en `dist-fixtures/` (`PUBLIC_FIXTURES=1`) |
| `npm run verificar:plantillas` | `ok · 13 comprobaciones correctas · 0 fallos` |
| `npm run validate` | `0 bloqueantes · 1 aviso` (46 URLs en sitemap, 47 HTML) |
| `npm run publicacion:pendiente` | `contenido 45 · publicadas 39 · sin publicar 6 · con refs a no publicadas 6` |
| `SITE_ORIGIN=https://example.org SITE_BASE=/ npx astro build --outDir <tmp>` | 47 páginas, canónicas en `https://example.org/` (migración de dominio comprobada) |

No ejecutados en esta pasada (marcados como no verificados): `npm run dev`, `npm run preview`,
`npm run build:og` (`scripts/build-og.mjs` requiere Chromium local), scripts de QA visual
(`scripts/visual-*.mjs`, `scripts/visual-*.py`).

Orden obligatorio antes de commit y en CI:

```bash
npm ci
npm run check
npm test
npm run build
npm run build:fixtures
npm run verificar:plantillas
npm run validate
```

Prohibido silenciar fallos con `|| true`, `continue-on-error` o `--no-verify`.

## 4 · Modelo de contenido: IDs, slugs y estados

- Una entidad por fichero. `id` permanente e **inmutable**, con prefijo por colección:
  `sota-`, `tema-`, `art-`, `vid-<youtube_id>`, `ser-`, `herr-`, `glo-`, `src-`, `aut-`.
- `slug` sí puede cambiar (kebab-case, minúsculas, sin acentos ni barra); es lo que genera la URL.
  Cambiarlo rompe enlaces: exige página puente y está en `../architecture/ROUTES.md`.
- Estados: `borrador` → `revision` → `aprobado` → `publicado` → `archivado`.
- Reglas bloqueantes al pasar a `publicado` (las aplica Zod y `scripts/validate-content.mjs`):
  fecha `publicado`, fecha `revisado_factual`, `seo.descripcion` (50–160), `seo.noindex: false`,
  y si `sensibilidad != baja` (YMYL): al menos 1 fuente tipada y `autorias.revisor`.
  `sensibilidad: alta` publicada exige revisor. Artículo publicado exige al menos 1 tema.
  Herramienta publicada no puede estar `no-implementada`. Vídeo publicado exige
  `estado_youtube: publico` + `privacidad_api: public`.
- `id` de vídeo = `vid-` + los 11 caracteres de `youtube_id`.
- Referencias tipadas (`temas`, `videos`, `fuentes`, `glosario`, `herramientas`, `series`) se validan:
  referencia colgante o referencia a borrador desde una entrada publicada = bloqueante
  (`B-REF-COLGANTE`, `B-REF-PRIVADA`). Publicar una pieza aislada en un grafo conectado falla:
  la publicación es un interruptor de conjunto.
- `src/content.config.ts` es copia literal de `../architecture/content.config.ts`: si hace falta un
  campo nuevo, primero se documenta en `../architecture/DATA-MODEL.md` y se cambian los dos ficheros.

## 5 · Recetas

Todas siguen el mismo patrón: crear el fichero, ejecutar la batería de §3, no tocar plantillas ni rutas.
Los ejemplos de frontmatter están tomados del contenido real (`src/content/**.md|yaml`).

### 5.1 Añadir un artículo / guía

1. Crear `src/content/articulos/<slug>.md`. Frontmatter mínimo:
   `id: art-<kebab>`, `status: borrador`, `creado`, `sensibilidad`, `procedencia`,
   `autorias.redactor`, `fuentes`, `seo.descripcion`, `actualizacion.politica`, `slug`,
   `titulo` (10–90), `resumen` (60–220), `tipo` (`guia|explicador|analisis`), `nivel`
   (`basico|intermedio|avanzado`), `temas: [<id de tema existente>]`.
   Opcionales: `videos`, `herramientas`, `glosario`, `serie`+`orden_en_serie`, `preguntas`, `destacado`.
2. Cuerpo Markdown con un único `#` (el `h1`) y secciones `##`. Los enlaces internos se escriben
   como rutas raíz (`/oros/guias/otra-guia/`): `scripts/remark-enlaces-base.mjs` les añade la base
   del build. Un enlace relativo no se corrige solo: el validador avisa (`W-ENLACE-RELATIVO`).
3. Para publicar: rellenar `publicado` y `revisado_factual`, `autorias.revisor`, fuentes tipadas
   y `status: publicado`. Sin revisión factual real, se queda en `revision`.
4. Ejecutar la batería de §3. Comprobar que aparece en `/oros/guias/`, en el sitemap y en
   `/data/catalog.json`.

Verificación ejecutada en esta card: con un artículo de prueba (`art-prueba-agents`), en `borrador`
el build siguió en 47 páginas y no generó ruta; al pasarlo a `publicado` con fuente y revisor, el
build dio 48 páginas, creó `dist/oros/guias/prueba-agents/index.html`, entró en `sitemap-0.xml` y en
`/data/catalog.json`, y `validate` siguió en 0 bloqueantes. El fichero se retiró después y el build
volvió a 47 páginas.

### 5.2 Añadir un vídeo

1. El vídeo debe existir de verdad: `youtube_id` de 11 caracteres presente en
   `data/inventory-snapshot.json` (copia fechada del inventario; no se inventan IDs).
2. Crear `src/content/videos/vid-<youtube_id>.yaml` con: `id`, `status`, `youtube_id`, `slug`,
   `titulo` (título real de la API), `descripcion_corta` (40–220), `publicado_en`, `duracion_iso`
   (`PT#H#M#S`), `miniatura` (URL https de la miniatura), `estado_youtube`, `privacidad_api`,
   `verificado_en`, `idioma`, `temas` (1–3), y opcionalmente `relacionados`, `capitulos`, `transcripcion`.
3. Solo se publica con `estado_youtube: publico` y `privacidad_api: public`. Un vídeo privado u
   oculto publicado en el sitio es bloqueante.
4. Actualizar el snapshot solo con datos reales y fecha en el commit; el token de YouTube no se
   copia al repo (vive fuera).
5. Batería de §3. La watch page debe quedar con **0 iframes** hasta el clic (facade).

### 5.3 Añadir un tema troncal

1. Crear `src/content/temas/<slug>.md` con `id: tema-<kebab>`, `titulo` (3–80),
   `descripcion_corta` (40–200), `cluster` (`nomina|fiscal|inflacion|ahorro|inversion|banca|vivienda|historia`),
   `orden` (1–99, define el orden del índice), `pilar` (referencia a un artículo), y opcionalmente
   `temas_relacionados`, `videos_destacados`, `herramientas`, `icono`.
2. No se crea ninguna ruta: sale del `slug` y de `pages/oros/temas/[slug].astro`.
3. Batería de §3; comprobar el orden en `/oros/temas/`.

### 5.4 Añadir un término de glosario

1. `src/content/glosario/<slug>.md` con `id: glo-<kebab>`, `termino` (2–60),
   `definicion_corta` (40–160), `ejemplo` (20–240), `categoria` (mismo enum `cluster`),
   `sinonimos` (≤4), `relacionados` (≤6, ids existentes) y el bloque base.
2. Cuerpo Markdown con `#` + definición desarrollada. Batería de §3.

### 5.5 Añadir una Sota nueva (palo)

No es una receta mecánica: `universo` es `z.enum(['oros'])` y el esquema de `sotas` exige que
`oros` sea el único `estado: activa` y que cualquier palo activo sea `oros`. Añadir Copas/Espadas/Bastos
exige **decisión del propietario**, cambio de esquema en `src/content.config.ts` (repo) y
`../architecture/content.config.ts` (fuente canónica), cambio de `src/lib/rutas.ts` y de las rutas.
Sin esa decisión: parar y escalar. Los tres palos ya
existen como fichas con `estado: sin-contenido`.

### 5.6 Añadir o cambiar una calculadora

1. Ficha en `src/content/herramientas/<slug>.yaml`: `id: herr-<kebab>`, `tipo: calculadora`,
   `estado_implementacion` (`no-implementada|beta|estable`), `version_motor` (semver), `formula`,
   `unidad_salida` (`EUR|EUR-por-mes|porcentaje`), `parametros` (1–10, con `clave`, `etiqueta`,
   `tipo`, `defecto`, `min`, `max`, `paso`), `supuestos` (2–8), `limites` (1–8),
   `tests` (`tests/<nombre>.ts|mjs`), `temas` (1–2).
2. Motor puro en `src/lib/`, gráfico aparte, interfaz en el componente; la página se monta desde
   `pages/oros/herramientas/[slug].astro` sin crear ruta propia.
3. `SoftwareApplication` solo se emite si el layout recibe `calcula={true}`.
4. Vectores de prueba calculados fuera del motor (como `tests/calculadora.ts`, 27 vectores) y
   metodología en `docs/CALCULADORA.md`. `tests:` debe apuntar a un fichero que existe.
5. Herramienta publicada no puede estar `no-implementada`. Batería de §3.

### 5.7 Añadir una serie

`src/content/series/<slug>.yaml` con `id: ser-<kebab>`, `titulo`, `descripcion`, `estado`
(`abierta|cerrada`), `temas` (1–2), `entregas_previstas` (2–50). Los artículos que la usan deben
declarar `serie` + `orden_en_serie`.

## 6 · Pipeline editorial y aprobación

1. Redacción: la entrada nace con `status: borrador`.
2. Revisión factual: se contrastan cifras y fuentes; se rellena `revisado_factual` y
   `autorias.revisor` (un autor con rol `revisor-factual`).
3. Aprobación humana: **el contenido financiero no se auto-aprueba**. El paso a `publicado` lo
   autoriza una persona. Un agente puede preparar la entrada y verificar comandos, no firmar la
   revisión.
4. Publicación: `status: publicado` + fechas + fuentes tipadas. El grafo conectado hace que se
   publique en bloque: `npm run publicacion:pendiente` lista, entrada por entrada, qué falta
   (no publica nada).
5. Archivo: `status: archivado` exige `seo.noindex: true` (aviso si falta).

Regla de honestidad editorial: hecho / cálculo / hipótesis / opinión se distinguen en el texto
(`[hecho]`, `[cálculo: …]`, `[opinión]`); lo no verificado se etiqueta `[no verificado]` y no se publica.

## 7 · Reglas de fuentes

- Toda cifra financiera lleva fuente primaria fechada (AEAT, BOE, Seguridad Social, BdE, BCE, INE,
  CNMV) en `fuentes:` con `dato` (qué afirma esa fuente en el texto).
- Ficha en `src/content/fuentes/src-<kebab>.yaml`: `titulo`, `editor`, `url` (https),
  `tipo` (`primaria|oficial|secundaria|academica`), `jurisdiccion` (`ES|ES-CT|UE|OTRA`),
  `consultado_en`, y opcionalmente `publicado_en`, `vigencia_hasta`, `cita`, `acceso`,
  `nota_verificacion`, `archivo_local`.
- Una fuente `acceso: de-pago` exige `nota_verificacion`. `vigencia_hasta` no puede ser anterior
  a `consultado_en`. Fuente vencida genera aviso `W-FUENTE-CADUCADA`.
- No se inventan títulos profesionales, ratings, reseñas, precios, suscriptores ni IDs de YouTube.
  `autores` no permite `titulacion_declarada` sin `creditos_verificados: true`.

## 8 · Tests y validación (qué cubre cada capa)

| Capa | Herramienta | Qué demuestra |
|---|---|---|
| Tipos y esquemas | `npm run check` | Zod + TS: frontmatter, campos, enums, longitudes |
| Unitarios | `npm test` (`node --test`) | `lib/` (rutas, catálogos, migas, JSON-LD, SEO, calculadora) y el validador de contenido; 118 tests |
| Integridad editorial | `npm run validate` | IDs/slugs duplicados, referencias colgantes o a borradores, reglas de publicación, vídeos no públicos o inventados, secretos, fuentes caducadas, longitudes SEO |
| Salida | `npm run validate` (sobre `dist/`) | canónica única y dentro de origen/base, sin `noindex` en público, JSON-LD parseable y sin ratings/`4sotas.com`, enlaces con base y no rotos, sitemap sin huérfanas, `404.html`/`robots.txt` |
| Plantillas | `npm run verificar:plantillas` | ninguna ruta de borrador en `dist/`, todas las plantillas renderizadas en `dist-fixtures/`, JSON-LD esperado, migas que terminan en la canónica, 0 iframes |
| Datos para agentes | `npm run validate` | `/data/*.json` y `/llms.txt` derivados del mismo filtro `publicados()` |
| Accesibilidad | **no hay auditoría automática** (sin axe/lighthouse en repo) | lo cubierto por plantillas: `lang`, skip link, un `h1` por página, facade sin iframes. Cualquier afirmación de a11y más amplia exige auditoría manual y no debe darse por hecha |

Avisos conocidos y aceptados: `W-VIDEO-SIN-FICHA` para el vídeo público `LL1EJttJPrs` (GTA VI, fuera
del alcance V1, sin ficha). Los avisos no se silencian.

## 9 · GitHub Pages y migración de dominio

Estado verificado (detalle y evidencia en `DEPLOY.md`):

- URL pública: `https://marcvillarroya.github.io/4sotas/`
- Repo público `MarcVillarroya/4sotas`; Pages con `build_type: workflow` (sin rama `gh-pages`),
  HTTPS forzado.
- `.github/workflows/ci.yml`: job `build` (gates de §3, artefactos `validate-report`, `sitio-dist`)
  y job `deploy`, que solo corre en `push` a `main` con `vars.DEPLOY_ENABLED == 'true'` y publica el
  `dist` ya validado (no reconstruye). Sin secretos en el workflow.
- El sitemap canónico es `/sitemap-index.xml`; `/sitemap.xml` devuelve 404 por diseño y
  `robots.txt` apunta al índice.

Migración a dominio propio (comprobada en local, no ejecutada en Pages):

```bash
SITE_ORIGIN=https://dominio.example SITE_BASE=/ npm run build
```

- Todo pasa por `url()` de `src/lib/rutas.ts` y por `Astro.site`: canónicas, OG, JSON-LD y sitemap
  cambian con esas dos variables; no hay rutas `/4sotas` escritas a mano.
- Antes de migrar: registrar el dominio, actualizar `SITE_ORIGIN`/`SITE_BASE` en el workflow,
  añadir `public/CNAME` si se sirve desde la raíz y volver a ejecutar los gates. El validador
  bloquea cualquier resto de `4sotas.com`.
- No cambiar el origen ni el base sin decisión del propietario.

## 10 · Qué NO se cambia sin aprobación del propietario

- Stack (Astro SSG, TS, npm) y saltos de versión mayor de Astro.
- Nombres de colecciones, campos obligatorios, enums (`status`, `sensibilidad`, `cluster`), formato de `id`.
- Forma de las rutas públicas y convención de slug.
- Política de publicación (fuentes + revisión factual + `noindex` fuera de `publicado`).
- `robots.txt` (búsqueda permitida / entrenamiento denegado) y cualquier mención de dominio.
- Origen/base del despliegue, visibilidad del repo y `DEPLOY_ENABLED`.
- Añadir dependencias de UI, analytics, comentarios o servicios de terceros en cliente.
- Este propio `AGENTS.md`: cambios vía PR que expliquen el motivo.

## 11 · Cuándo parar y escalar

- Un dato clave no tiene fuente primaria → parar y pedir decisión; no rellenar con estimaciones.
- Hay que publicar contenido financiero sin revisor factual humano → parar.
- El validador devuelve un `B-*`: se corrige el contenido, nunca la regla. Pegar código y fichero.
- La tarea pide dominio propio, auth, comentarios, analytics o API → fuera de V1.
- Se pide cambiar la identidad cromática → la paleta publicada (`#0B1526` + oro/ámbar/teal) es la
  decisión tomada; escalar, no rediseñar.
- Aparece trabajo que excede este repo (contenido en bruto, investigación, diseño) → crear tarjeta
  para el perfil correspondiente en vez de improvisar aquí.

## 12 · Definición de hecho

- `check`, `test`, `build`, `build:fixtures`, `verificar:plantillas`, `validate` verdes, con la
  salida real pegada en el handoff.
- Cero borradores en `dist/`, cero menciones a `4sotas.com`, cero datos o IDs inventados.
- Rutas nuevas solo si están justificadas en `../architecture/ROUTES.md`.
- Diff mínimo: sin refactors de paso, sin reformateos masivos, sin ficheros generados de más.
