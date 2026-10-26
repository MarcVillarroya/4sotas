# QA integral F1 — 4 Sotas (Sota de Oros, V1)

Fecha: 26-oct-2026 · Revisión QA independiente · Card `t_6ef580fd`
Node v26.7.0 · npm 11.19.0 (el repo exige `>=22.23.4`: **`/usr/bin/node` 22.23.3 no sirve**, hay que usar el 26.7.0 del entorno)

## Candidato evaluado (exacto)

| Pieza | Valor |
|---|---|
| Commit | `83b93d3` (contenido publicado: revisión factual + paso a `publicado`) |
| Cambios visuales | `HANDOFF.patch` de `t_455d6972`, sha256 `bd6642eb9d99701b2738d43cba697be5a4942e6ae90e66f0e1c1367305daa4b2` |
| Aplicación | `git apply --check` OK sobre `83b93d3` → aplicado (8 ficheros modificados, 5 nuevos) |
| Rama QA | `qa/f1-final` en `/home/mvf/4sotas/site/.worktrees/t_6ef580fd` |
| Construcción | `rm -rf dist dist-fixtures .astro` + `npm ci` (392 paquetes) + cadena completa |

Historial de esta revisión: la primera pasada se hizo sobre `1bbbae8`, que tenía **0 entradas publicadas** (8 páginas, catálogos vacíos). Esa build era **NO-GO** por sitio vacío. Tras cerrarse `t_13d5dbeb` (39 publicados) y arreglarse la URL AEAT, **todo se ha vuelto a medir** sobre `83b93d3`; los números de este informe son de esa build.

## Veredicto: **GO**

0 bloqueantes. Los 10 criterios del brief quedan PASS con evidencia reproducible; 7 avisos documentados, ninguno impide publicar. El smoke test público que exige `t_9856bbda` (home, `/oros/`, un tema, un artículo, una watch page, la calculadora, `sitemap.xml`, `robots.txt`, un JSON-LD) tiene hoy página real para cada punto.

---

## Correcciones verificadas respecto a la pasada anterior

- **Contenido publicado**: 39 entradas `publicado` (7 temas, 8 guías, 11 vídeos, 12 términos, 1 herramienta), 6 borradores que son fixtures y no llegan a `dist`. `build` pasa de 8 a **47 páginas**; `sitemap` de 7 a **46 URLs**; catálogos `items` 7/8/11/1; `llms.txt` con conteos reales (6.073 B).
- **URL de la fuente AEAT** (`src-aeat-algoritmo-retenciones-2026`): ya está como `Algoritmo%20Retenciones-…` en `83b93d3`. El enlace **renderizado** en `/oros/guias/tramos-irpf-y-retencion/` devuelve **200** (`application/pdf`, 1.137.373 B) y la ficha registra «PDF descargado y leído el 26-oct-2026 (HTTP 200)». La versión con `+` que sí da 404 sigue en el dossier F0 `research/sources.json` (fuera del sitio) — aviso 4.

---

## Avisos (no bloquean; decisión o seguimiento)

1. **`vid-O1V9_of7g1w` («IRPF en la nómina») parece no ser embebible.** Está publicado, es real (snapshot de la API `privacy_status: public`, miniatura 200, título idéntico) pero `youtube.com/oembed` responde **401**, mientras un vídeo privado da 403 (`xZhIn2gYPJQ`). Todo apunta a *inserción deshabilitada*: la facade cargaría un reproductor que falla. No entra en la lista bloqueante del brief (no es vídeo inventado), pero conviene habilitar la inserción o marcar la ficha como «solo YouTube» con enlace directo.
   Comprobación: `curl -s -o /dev/null -w '%{http_code}' 'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=O1V9_of7g1w&format=json'`
2. **Catálogo de vídeos: miniaturas de terceros y pesadas.** `/oros/videos/` transfiere **926 KB / 4 imágenes a 390 px** y **2,12 MB / 17 peticiones a 1440 px** desde `i.ytimg.com` (`maxresdefault.jpg`, ~190 KB cada una). Ya hay mitigación (`loading="lazy"`, `width`/`height`, `decoding="async"`, `referrerpolicy="no-referrer"`), pero rompe la promesa de «sin terceros» del pie y penaliza en 3G. Sugerencia: reescalar a 320 px en local o usar `hqdefault`.
3. **Sin páginas legales** (`/sobre-nosotros/`, `/metodologia/`, `/politica-editorial/`, `/privacidad/`, `/aviso-legal/` no existen). El brief lo permite («solo con información real del titular»), pero el pie afirma «sin analítica, sin cuentas, sin cookies de seguimiento»: al abrir al público conviene una página donde eso se sostenga y donde se identifique al titular.
4. **Dossier F0 desactualizado en un dato**: `/home/mvf/4sotas/research/sources.json:35` conserva la URL con `+` (404). No se publica, pero cualquier QA futuro que valide el dossier en vez del contenido se llevará un falso positivo (me pasó a mí en la primera pasada).
5. **`W-VIDEO-SIN-FICHA` para `LL1EJttJPrs`** (GTA VI): aviso esperado y documentado, fuera de alcance editorial V1. Sin acción.
6. **Deuda de tooling**: `astro check` marca `markdown.remarkPlugins` como deprecado (migrar a `unified({...})` de `@astrojs/markdown-remark`).
7. **FRED/ALFRED intermitentes desde esta máquina**: `fred.stlouisfed.org` y `alfred.stlouisfed.org` responden 200 en una pasada y `000` en otra (Akamai; IPv6 roto en local). `t_13d5dbeb` los verificó por CSV vía navegador. No es defecto del sitio, pero la comprobación HTTP de esas dos fuentes no es fiable aquí.

---

## Checklist de aceptación (10 comprobaciones del brief)

| # | Criterio | Veredicto | Evidencia (medida, no afirmada) |
|---|---|---|---|
| 1 | Build reproducible desde limpio, typecheck, tests | **PASS** | `rm -rf dist dist-fixtures .astro` + `npm ci` + cadena: `check` 64 ficheros **0 errores / 0 warnings** (4 *hints* provienen de mis propios scripts de QA, ausentes en el repo de entrega); `test` **118 pass / 0 fail**; `build` **47 páginas**; `validate` **0 bloqueantes / 1 aviso**; `build:fixtures` 52 páginas; `verificar:plantillas` **13 ok / 0 fallos**. `01-gates.log` |
| 2 | Rutas V1, 404, sin rutas fantasma | **PASS** | 47 HTML; 27 combinaciones página×ancho con **status 200** y `/no-existe/` → **404 real**; **0 enlaces internos rotos** (todos los `href` internos de las 47 páginas resueltos contra fichero); `/data/*.json` y `llms.txt` presentes; `/`, `/oros/`, tema, guía, vídeo, glosario, herramienta y catálogo existen de verdad. `dist-report.json` |
| 3 | IDs únicos, referencias válidas, slugs estables, borradores fuera | **PASS** | 95 entradas, **95 IDs únicos**, **140 referencias tipadas, 0 rotas**; estados **39 `publicado` + 6 `borrador`**; `publicadosSinPagina: []`, `publicadosSinRevisor: []`, `publicadosSinFechaRevision: []`; los 6 borradores son fixtures y **no aparecen en `dist`** (`fugasFixture: []`, 0 apariciones de `example.org`/`fixture`). Único apunte de mi comprobador: slug `fondo-de-emergencia` repetido en glosario y vídeos — **namespaces distintos** (`/oros/glosario/…` vs `/oros/videos/…`), sin colisión de ruta. `07-datos.json`, `08-salida.json` |
| 4 | SEO: canonical, sitemap, robots, OG, `lang`, H1 único, enlaces, JSON-LD veraz | **PASS** | 47 páginas: `lang="es-ES"` en todas, **1 canonical por página**, todas dentro de `https://marcvillarroya.github.io/4sotas` (0 a `4sotas.com`), **1 `<h1>`** por página, `title` y `description` propios; **46 bloques JSON-LD, 0 inválidos**, tipos Organization 1, WebSite 46, WebPage 2, Article 8, VideoObject 11, DefinedTerm 12 + DefinedTermSet 1, BreadcrumbList 44, CollectionPage 12, ItemList 11, SoftwareApplication 2 — **sin `aggregateRating`/`review`/precios inventados** (la calculadora declara `price 0 EUR` + `isAccessibleForFree: true`, que es verdad); `sitemap-0.xml` con **46 URLs, todas con fichero** + `sitemap-index.xml`; `robots.txt` deliberado (Googlebot/Bingbot/OAI-SearchBot/PerplexityBot permitidos; GPTBot/ClaudeBot/Google-Extended/CCBot/Bytespider denegados; `Sitemap:` correcto); OG completo (`og:type article`, `og:locale es_ES`, `og:image` 1200×630, `twitter:card`) en la página de ejemplo; fechas, autor y revisor **visibles** («Publicada / Actualizada / Revisión factual: 26 de octubre de 2026»). 98 URLs externas distintas: **0 no resueltas** salvo las del propio sitio (aún sin desplegar). `dist-report.json`, `08-salida.json` |
| 5 | Vídeos: solo IDs reales, watch page correcta, sin iframes masivos | **PASS con aviso 1** | 11 fichas **publicadas**, 11 IDs presentes en el snapshot de la API, **10 con `oEmbed 200` y título idéntico** al de YouTube, miniaturas 200; 1 con `oEmbed 401` (aviso 1). **0 iframes en las 47 páginas**: antes del clic `iframe=0`; tras el clic, un único `youtube-nocookie.com/embed/M9EhU06FlUA?rel=0` con `title` correcto, `allow` mínimo y **sin `autoplay`**. Los 2 vídeos privados programados (`xZhIn2gYPJQ`, `DzH02NfDqM4`) no tienen ficha. `04-videos.log`, `evidence-final/browser-qa.json` |
| 6 | Calculadora: vectores, cero, límites, inválidas, accesibilidad, sin red | **PASS** | **34/34 comprobaciones independientes** (simulación propia periodo a periodo, sin fórmula cerrada): 9 escenarios con **delta 0,000000 €**, incluidos aportación al inicio/fin, trimestral, anual, tasa 0 (`7.000,00 €`), un solo mes y el límite de 720 periodos; caso canónico 10.000 al 5 % 10 años → `16.288,95 €` = `10000·1,05¹⁰` (tasa efectiva anual, como declara la UI); tabla coherente (60 filas: capital final, interés por periodo y acumulado); inflación 2 % bien deflactada; **14 entradas inválidas** devuelven error en el campo correcto (capital negativo/fuera de rango/NaN, aportación negativa, tasa ±, años decimales, meses 12, plazo 0, plazo no múltiplo, 720 periodos, frecuencia y momento inválidos, inflación fuera de rango); `parsearNumero` es-ES e internacional (9 casos). Navegador real (390 y 1440): `aria-invalid="true"`, `aria-describedby` con ayuda + error, foco al primer campo erróneo, anuncio en `role="status"`, resultado invalidado al editar («Calcula para actualizar»), **sin JS** declara el ejemplo y renderiza 2 tablas con `caption`; **0 peticiones de red**. `02-calc-independiente.log`, `calc-a11y.mjs` |
| 7 | Accesibilidad: teclado, foco, labels, contraste, tablas, reduced-motion, axe | **PASS** | axe-core 4.14 real (`wcag2a/2aa/21a/21aa` + best-practice) sobre **27 combinaciones** (9 tipologías × 390/768/1440): **0 violaciones, 0 critical/serious** (incluye contraste). 60 `<img>` y **0 sin `alt`**; 9 controles, todos con `label for`/`aria-label`; `skip-link` en las 47 páginas; la tabulación recorre los 9 controles del formulario en orden; `prefers-reduced-motion: reduce` deja **0 animaciones CSS activas**; tablas con `caption` y cabeceras. `evidence-final/browser-qa.json` |
| 8 | Rendimiento: peso, imágenes, fuentes, JS, LCP/CLS (laboratorio) | **PASS con aviso 2** | Página típica: **86-96 KB** transferidos = CSS 17,9 KB + fuentes 67,5 KB (3 woff2) + HTML, con **JS 0 B** en home/tema/guía/watch y **8,9 KB** solo en la calculadora; 6-7 peticiones. LCP **36-176 ms** y CLS **0-0,0407** en Chromium local sin latencia (**laboratorio, no campo**). Excepción: catálogo de vídeos 926 KB (390) / 2,12 MB (1440) por miniaturas de YouTube (aviso 2). `06-perf-publico.json` |
| 9 | Seguridad y privacidad | **PASS** | 0 secretos en repo y en `dist` (`grep` de `yt_token`, `AIza…`, `ghp_…`, `client_secret`, `access_token`, claves privadas): única aparición, `yt_token.json` en `.gitignore`. JS de la calculadora sin `fetch`/`XHR`/`sendBeacon`/`WebSocket` y **0 peticiones** en su página; home/tema/guía/watch con 0 peticiones externas; canonical limitado a `marcvillarroya.github.io/4sotas`. Único punto de privacidad abierto: miniaturas de terceros (aviso 2). |
| 10 | Móvil 390 y 768, sin overflow ni controles inaccesibles | **PASS** | `scrollWidth − clientWidth` medido en 9 tipologías × 3 anchos: **0 px de overflow** en los 27 casos; 29 capturas full-page en `qa/f1-integral/evidence-final/`; formulario usable y enfocable a 390. Auditoría en Chromium; **no** cubre dispositivo físico, Safari ni Firefox. |

### Verificación específica pedida por el orquestador

- **Fuentes del contenido publicado** (`src/content/fuentes/*.yaml`, 44 fichas): **40 × 200**; `journals.uchicago.edu` **403 esperado y honesto** (`src-s6-03` declara `acceso: de-pago` y su nota dice que solo se consultó el resumen y que **no se citan precios ni fechas** del artículo: el claim es cualitativo); `src-fixture-demo` **404** es la fuente de prueba (`example.org`) y no se publica; FRED/ALFRED intermitentes (aviso 7, verificados en `t_13d5dbeb` vía CSV). **Ninguna cifra publicada queda sin fuente accesible.** `09-fuentes-publicadas.tsv`
- **Algoritmo de retenciones AEAT**: enlace renderizado → **200 PDF** (verificado con `curl` sobre el `href` real de la página publicada).
- **URLs de `research/sources.json` (44 únicas)**: 40 × 200; 1 × 403 declarado; FRED/ALFRED intermitentes; la entrada AEAT con `+` da 404 **en el dossier**, no en el sitio (aviso 4). `05-sources-http.tsv`
- **Cifras de vivienda**: `python3 calculos.py` re-ejecutado en `_entregas-sota/vivienda-250k` (sin dependencias, salida completa). Contraste con lo publicado: `843,21 € / 103.554,90 €` (3 %, 30 a), `948,42 € / 84.526,79 €` (3 %, 25 a), `954,83 € / 143.739,01 €` (4 %, 30 a) — **coincidencia exacta con el recálculo**. Los 3 `CORREGIR` del dossier quedan resueltos: ITP formulado como **escala** catalana («10 % hasta 600.000 €») con aviso autonómico explícito, y la cifra `381.554,90 €` **no se publica**. ITP del 10 % sobre 200.000 € = 20.000 € correcto y trazado a `src-s7-05` (ATC, 200 verificado).

## Evidencia en disco

```
qa/QA-REPORT.md                          este informe
qa/f1-integral/01-gates.log              cadena de gates con exit codes
qa/f1-integral/02-calc-independiente.log 34 comprobaciones de la calculadora
qa/f1-integral/03-browser-final.log      matriz de navegador (resumen)
qa/f1-integral/04-videos.log             fichas vs snapshot vs oEmbed
qa/f1-integral/05-sources-http.tsv       44 URLs del dossier con código, MIME y tamaño
qa/f1-integral/09-fuentes-publicadas.tsv 44 fuentes del contenido con código HTTP
qa/f1-integral/06-perf-publico.json      LCP/CLS/pesos de la build pública
qa/f1-integral/07-datos.json             integridad de colecciones
qa/f1-integral/08-salida.json            fugas, JSON-LD y enlaces externos
qa/f1-integral/dist-report.json          auditoría HTML de las 47 páginas
qa/f1-integral/fixtures-report.json      auditoría HTML de las 52 de fixtures
qa/f1-integral/evidence-final/*.png      29 capturas 390/768/1440
qa/f1-integral/evidence-final/browser-qa.json  axe + overflow + facade + red
qa/f1-integral/*.mjs, *.sh               scripts reproducibles de este informe
```

## Mantenimiento del gate

```bash
node qa/f1-integral/datos.mjs        # integridad + publicados sin página
node qa/f1-integral/check-html.mjs dist
node qa/f1-integral/videos.mjs      # IDs reales vs snapshot vs oEmbed
node qa/f1-integral/salida.mjs dist # fugas de fixtures, JSON-LD, externos
bash qa/f1-integral/sources-http.sh
NODE_PATH=/home/mvf/.hermes/hermes-agent/node_modules node qa/f1-integral/browser-qa.mjs dist
```

## Lo que este informe NO cubre

- Reproducción real de los vídeos en YouTube (se comprobó oEmbed, miniatura y el iframe que monta la facade; no se vio playback).
- LCP/CLS de campo: son de laboratorio local, sin CDN ni red móvil.
- Navegadores distintos de Chromium y dispositivo físico.
- Lighthouse/PageSpeed (no instalado; axe-core sí se ejecutó de verdad).
- Lectura línea a línea de los 8 artículos frente a sus fuentes (se validó la cadena de fuentes, las cifras de cálculo y Vivienda; la revisión factual del bloque corresponde a `t_13d5dbeb`, commits `681cf45`/`c467b79`).
- El sitio desplegado en GitHub Pages (eso es `t_9856bbda`).
