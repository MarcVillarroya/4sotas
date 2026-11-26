# Auditoría de accesibilidad y rendimiento — 4sotas.com

**Fecha:** 26 de noviembre de 2026 · **Sitio:** https://4sotas.com (producción, CDN Cloudflare)
**Autor:** auditoría automatizada de laboratorio (subagente Hermes)
**Alcance:** 7 plantillas × 5 viewports (360, 390, 768, 1024, 1440 px) + comprobación de reflow a 320 px.

| Página | Estado |
|---|---|
| `/` | 200 |
| `/oros/` | 200 |
| `/oros/guias/bruto-a-neto/` | 200 |
| `/oros/videos/` | 200 |
| `/oros/herramientas/` | 200 |
| `/oros/glosario/` | 200 |
| `/oros/videos/salario-minimo-2027-14-o-12-pagas/` | 200 (ficha de vídeo) |

> **Nota de alcance:** la ruta pedida `/oros/videos/salario-minimo-2027` devuelve **404**. El slug real en el sitemap es `/oros/videos/salario-minimo-2027-14-o-12-pagas/`, que es la que se ha medido. No se ha encontrado ningún enlace interno que apunte al slug inexistente (grep sobre `dist/**/*.html`: 0 coincidencias).

---

## 1. Método y herramientas (qué se pudo usar y qué no)

| Herramienta | Estado | Uso |
|---|---|---|
| Playwright (Python) | **No instalado** | — |
| Puppeteer | **No instalado** | — |
| Lighthouse CLI | **No instalado** | — (no hay métricas “Lighthouse score”) |
| axe-core en `node_modules` del repo | **No presente** | Se descargó `axe-core@4.10.3` desde jsDelivr y se inyectó con `addScriptTag` |
| `playwright-core` | Disponible en `/home/hermesiarco/Escritorio/Proyectos/hermes-hq-app/node_modules` | Motor de navegación |
| Chromium | Playwright bundled **Chromium 156.0.8078.4** (headless) | Navegador real, HTTP/3, sin caché entre pasadas |

**Cómo se midió**

- Navegador real por cada combinación página × viewport, **contexto nuevo** (caché vacía), `deviceScaleFactor: 1`, UA móvil real (Pixel 8 / Android 14) por debajo de 768 px y `hasTouch` por debajo de 1024 px.
- **LCP / CLS / FCP / long tasks**: `PerformanceObserver` inyectado *antes* de la carga (`buffered: true`), leído a los 2,6 s del evento `load`.
- **TBT**: suma de `(duración − 50 ms)` de las `longtask`. **Sin throttling de CPU** → es una **cota inferior** (Lighthouse aplica 4× de CPU; aquí no).
- **Peso y peticiones**: `PerformanceResourceTiming` (`transferSize`) + cabeceras `content-length` de cada respuesta. Dos pasadas: (a) carga inicial sin scroll, (b) tras recorrer la página completa para disparar el `loading="lazy"`.
- **axe**: tags `wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa, best-practice` en cada página × viewport. Se verificó que `color-contrast` y `target-size` **se ejecutan** (aparecen en `passes`, no en `inapplicable`).
- **Contraste manual**: cálculo WCAG 2.x (luminancia relativa) sobre 60 nodos de texto por página/viewport, con el fondo efectivo heredado.
- **Foco**: 12 pulsaciones reales de `Tab` (no `.focus()` programático, que no dispara `:focus-visible`) por página y viewport.
- **Reflow**: viewport 320 px, comprobación de `scrollWidth`.

**Limitaciones honestas**

1. No hay datos de campo (CrUX/PSI): requieren clave de API. Todo lo de este informe es **laboratorio**.
2. Sin throttling de red/CPU: las cifras absolutas son optimistas (host en España, fibra, CDN en `HIT`). Sirven para comparar páginas y detectar causas, no como nota de campo.
3. No se probó con lectores de pantalla reales (NVDA/VoiceOver) ni con zoom de texto 200 %; sí reflow a 320 px y targets.

---

## 2. Resumen ejecutivo

- **Accesibilidad: 0 violaciones axe en las 35 combinaciones** (0 `critical`, 0 `serious`, 0 `moderate`, 0 `minor`), incluyendo `best-practice`. El sitio es de los pocos que salen limpios: contraste mínimo medido **8,84:1** (mínimo exigido 4,5:1), foco visible en los 12 primeros tab stops de cada página, `lang="es-ES"`, un solo `h1`, sin saltos de jerarquía, sin controles sin etiqueta, sin iframes, sin enlaces vacíos y `prefers-reduced-motion` contemplado.
- **Sin overflow horizontal en ningún viewport**, ni siquiera a 320 px (reflow WCAG 1.4.10 OK).
- **El único defecto real de rendimiento es CLS por intercambio de fuentes**: `/oros/guias/bruto-a-neto/` a 768 px da **CLS 0,184** (umbral “needs improvement” es 0,1). Verificado que la causa es `font-display: swap` sin `preload`: recarga en caliente → **CLS 0,000**.
- **El peso lo dominan las fuentes**: 65,9 KB de woff2 en *todas* las páginas, el **58 % del peso móvil** de la home y el **86 %** de una página de texto. La home móvil entera pesa 115 KB.
- **`/oros/videos/` es la página pesada**: 693 KB iniciales y 1,58 MB tras scroll en escritorio (261 KB → 1,0 MB en móvil), con una miniatura de **209,9 KB** para 640×360 px (su variante 320w pesa 23 KB: la compresión es el problema, no el tamaño).
- **TBT 0 ms en 34 de 35 combinaciones** (37 ms una vez): prácticamente no hay JS. Excelente base.
- Objetivos táctiles: cumplen WCAG 2.2 AA (`target-size` de axe pasa en todas las páginas) pero **no llegan a 44×44** en migas, nav de escritorio y pie (40×44 y 42×44). Es criterio Apple HIG, no WCAG.

---

## 3. Accesibilidad

### 3.1 Violaciones axe-core (WCAG 2.2 AA + best-practice) por página y viewport

Cifra = nº de violaciones (críticas/serias/moderadas/menores). **Todas las celdas son 0/0/0/0.**

| Página | 360 | 390 | 768 | 1024 | 1440 |
|---|---|---|---|---|---|
| `/` | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| `/oros/` | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| `/oros/guias/bruto-a-neto/` | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| `/oros/videos/` | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| `/oros/herramientas/` | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| `/oros/glosario/` | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |
| `/oros/videos/salario-minimo-2027-14-o-12-pagas/` | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 | 0/0/0/0 |

Reglas de axe que **pasan** (19–27 por página/viewport, ejemplo de la guía a 1440): `aria-allowed-attr`, `aria-conditional-attr`, `aria-hidden-body`, `aria-hidden-focus`, `aria-prohibited-attr`, `aria-valid-attr-value`, `aria-valid-attr`, `avoid-inline-spacing`, `bypass`, `color-contrast`, `document-title`, `duplicate-id-aria`, `html-has-lang`, `html-lang-valid`, `image-alt`, `link-in-text-block`, `link-name`, `list`, `listitem`, `meta-viewport`, `nested-interactive`, `summary-name`, `target-size`, `td-headers-attr`, `th-has-data-cells`.

No hubo **`incomplete`** relevantes: no hay falsos “no evaluable” en contraste ni en tamaño de objetivo.

### 3.2 Hallazgos por página y viewport (comprobaciones propias, no axe)

`ovf` = overflow horizontal px · `txt` = nodos de texto <14 px · `tgt` = objetivos <44×44 px · `CLS` = peor valor de la página.

| Página | Métrica | 360 | 390 | 768 | 1024 | 1440 |
|---|---|---|---|---|---|---|
| `/` | ovf / txt / tgt | 0 / 2 / 1 | 0 / 1 / 1 | 0 / 0 / 1 | 0 / 0 / 1 | 0 / 0 / 3 |
| `/oros/` | ovf / txt / tgt | 0 / 2 / 2 | 0 / 1 / 2 | 0 / 0 / 2 | 0 / 0 / 2 | 0 / 0 / 9 |
| `/oros/guias/bruto-a-neto/` | ovf / txt / tgt | 0 / 1 / 10 | 0 / 0 / 10 | 0 / 0 / 14 | 0 / 0 / 15 | 0 / 0 / 17 |
| `/oros/videos/` | ovf / txt / tgt | 0 / 1 / 3 | 0 / 0 / 3 | 0 / 0 / 7 | 0 / 0 / 2 | 0 / 0 / 14 |
| `/oros/herramientas/` | ovf / txt / tgt | 0 / 1 / 2 | 0 / 0 / 2 | 0 / 0 / 2 | 0 / 0 / 2 | 0 / 0 / 4 |
| `/oros/glosario/` | ovf / txt / tgt | 0 / 1 / 3 | 0 / 0 / 3 | 0 / 0 / 3 | 0 / 0 / 3 | 0 / 0 / 10 |
| `/oros/videos/salario-minimo-2027-14-o-12-pagas/` | ovf / txt / tgt | 0 / 1 / 2 | 0 / 0 / 2 | 0 / 0 / 2 | 0 / 0 / 2 | 0 / 0 / 4 |

Lectura importante del recuento `tgt`: **la mayoría no son incumplimientos**. En la guía, 17 de los 17 objetivos pequeños son **enlaces inline dentro de párrafos** (20–21 px de alto), exentos explícitamente por WCAG 2.2 (2.5.8, excepción “inline”). El desglose tratable está en 3.3.

### 3.3 Detalle con selector y corrección concreta

#### (a) Texto por debajo de 14 px — solo en móvil pequeño

| Vista | Selector | Texto | Tamaño | Corrección |
|---|---|---|---|---|
| 360, 390 | `section.wrap.hero > figure.v21-character > div.v21-card-label > span` | “SOTA DE OROS” / “TUS CARTAS, CLARAS” | **12 px** | Etiqueta decorativa sobre la carta. Si se quiere legibilidad mínima: `font-size: .8125rem` (13 px) y `letter-spacing: .08em`; o `clamp(.75rem, 3.4vw, .875rem)`. No es incumplimiento WCAG (texto no esencial, contraste 12,87:1). |
| 360 | `body > header.site-header > .header-row > a.logo` | “4 Sotas / OROS, inicio” | **12,8 px** | En 360 el nombre completo se parte; subir a 13,5–14 px o acortar a “4 Sotas” en `<360px` con `@media (max-width: 374px) { .logo .logo-long { display:none } }`. El enlace ya tiene nombre accesible correcto. |

No hay texto <14 px en 768, 1024 ni 1440 en ninguna página.

#### (b) Objetivos táctiles <44×44 px (criterio Apple HIG; WCAG 2.2 AA **sí** se cumple)

| Selector | Medidas | Dónde | Corrección |
|---|---|---|---|
| `nav.breadcrumbs > a` (Inicio, Guías) | **40×44** y **42×44** | Guía, vídeos, herramientas, glosario, ficha · 390 y 1440 | Solo falla el ancho. `nav.breadcrumbs a { padding-inline: .5rem; margin-inline: -.25rem; }` → 40+8 = 48×44 sin mover el layout. |
| `header .desktop-nav > a` | **40×44** / **42×44** | 1440, todas | `nav.desktop-nav a { padding-inline: .625rem }` (ya tiene 44 de alto). |
| `div.wrap.footer-row > div > p > a` (“Inicio”) | **40×44** | 390 y 1440, todas | `footer a { padding-block: .25rem; padding-inline: .5rem; margin-inline: -.5rem }`. |
| `dl.v2-terms > div > dt > a` (“IPC”) | **30×21** | `/oros/` 390 y 1440 | Es un enlace de término en una lista de definiciones: `dt a { display: inline-block; min-height: 24px; padding-block: .25rem; }`. Pasa WCAG por la excepción de espaciado (axe `target-size` lo valida), pero 21 px de alto es frágil con dedo. |
| `ul.catalog > li > h3 > a` | alto **31** | `/oros/glosario/` 390 y 1440 | El objetivo es el `h3` completo; 31 px de alto cumple 24×24 y el enlace de la tarjeta suele existir aparte. Si se quiere 44: `ul.catalog > li > h3 > a { display:block; padding-block:.375rem }`. |
| `ul.v2-video-grid > li > h3 > a` | alto **21–31** | `/oros/videos/` | Enlaces de título de tarjeta; el `li` entero es clicable visualmente. Recomendado: hacer que el enlace cubra la tarjeta con `ul.v2-video-grid li { position: relative } :is(h3>a)::after { content:""; position:absolute; inset:0 }`, lo que además elimina la ambigüedad de dos zonas clicables por tarjeta. |

**Enlaces inline en prosa (exentos):** 19 en la guía (17 de 21 px, 2 de 20 px). No requieren acción; si se tocan, que sea con `text-underline-offset` y no con padding que rompa el ritmo del párrafo.

#### (c) Imágenes

**0 problemas**: 66 imágenes en `/oros/videos/`, 12 en la home, todas con `width` + `height` (sin CLS por imágenes) y con `alt` presente. Las miniaturas de vídeo usan `alt=""` de forma coherente: son decorativas porque el `h3` adyacente da el nombre al enlace. No hay imágenes rotas.

#### (d) Estructura, formularios, foco y movimiento

| Comprobación | Resultado |
|---|---|
| `html lang` | `es-ES` en las 7 páginas |
| `h1` | exactamente 1 por página |
| Saltos de jerarquía de encabezados | **0** |
| Landmarks | 1 `main`, 2 `nav`, 1 `header`, 1 `footer` por página |
| Enlace “Saltar al contenido” | Presente y visible al foco (191×62 px, outline 3 px `rgb(240,216,120)`) |
| Controles de formulario / etiquetas | `/oros/videos/` tiene 1 control (`<select id="filtro-tema">`) **con `<label for>` correcto**; **0 sin etiquetar** en todo el sitio |
| Iframes | 0 (las fichas usan miniatura + enlace, no embed de YouTube: gran decisión de rendimiento y privacidad) |
| Enlaces/botones vacíos | 0 |
| Foco visible | 12/12 tab stops con indicador en las 14 combinaciones medidas (outline sólido 3 px `#f0d878`) |
| Animaciones CSS | 0 elementos animados; existe bloque `prefers-reduced-motion` |
| Contraste mínimo medido | **8,84:1** (peor caso: párrafo 16 px en la home) — todos ≥ 4,5:1 |
| Reflow 320 px | `scrollWidth` = 320 en las 7 páginas → **0 overflow** |

---

## 4. Rendimiento (laboratorio, sin throttling)

### 4.1 Métricas por página y viewport

LCP en ms · CLS adimensional · TBT en ms (cota inferior, sin 4× CPU) · req = peticiones · W0 = peso transferido en carga inicial · W1 = peso tras recorrer la página (lazy).

| Página | LCP 360 / 390 / 768 / 1024 / 1440 | CLS peor | TBT peor | req 390 / 1440 | W0 390 / 1440 | W1 390 / 1440 |
|---|---|---|---|---|---|---|
| `/` | 192 / 228 / 172 / 192 / 296 | 0,007 | 0 | 13 / 15 | 115 K / 228 K | 228 K / 229 K |
| `/oros/` | 148 / 180 / 148 / 188 / **704** | 0,009 | 0 | 10 / 13 | 113 K / 227 K | 231 K / 232 K |
| `/oros/guias/bruto-a-neto/` | 276 / 168 / 172 / 196 / 196 | **0,184** | 37 (solo a 360) | 6 / 6 | 76 K / 76 K | 76 K / 76 K |
| `/oros/videos/` | 252 / 216 / 228 / 180 / 172 | 0,009 | 0 | 13 / 21 | 261 K / **693 K** | **1.008 K / 1.390 K** (máx. 1.477 K a 1024) |
| `/oros/herramientas/` | 280 / 160 / 140 / 168 / 188 | 0,000 | 0 | 7 / 7 | 77 K / 77 K | 77 K / 77 K |
| `/oros/glosario/` | 172 / 356 / 164 / 180 / 176 | 0,009 | 0 | 6 / 6 | 76 K / 76 K | 76 K / 76 K |
| `/oros/videos/salario-minimo-2027-14-o-12-pagas/` | 156 / 180 / 208 / **452** / 164 | 0,020 | 0 | 10 / 10 | 112 K / 112 K | 112 K / 112 K |

**Cómo interpretar los outliers de LCP** (`/oros/` 704 ms y ficha 452 ms): en ambos casos el **TTFB de esa carga concreta** fue 432 ms y 262 ms, frente a 84–154 ms del resto de pasadas. El LCP sigue al TTFB, no a un recurso lento → es **ruido de red del host**, no un defecto de la página. Mediana de LCP en el conjunto: **~180 ms**.

### 4.2 Desglose del peso (1440 px, carga inicial)

| Página | HTML | CSS | **Fuentes woff2** | Imágenes | Total |
|---|---|---|---|---|---|
| `/` | 4,6 K | 9,6 K | **65,9 K** | 152,9 K | 228 K |
| `/oros/` | 5,6 K | 9,6 K | **65,9 K** | 151,0 K | 227 K |
| `/oros/guias/bruto-a-neto/` | 8,3 K | 9,6 K | **65,9 K** | 0,5 K | 76 K |
| `/oros/videos/` | 9,7 K | 9,6 K | **65,9 K** | 617,9 K | 693 K |
| `/oros/herramientas/` | 3,4 K | 9,6 K | **65,9 K** | 1,1 K | 77 K |
| `/oros/glosario/` | 3,9 K | 9,6 K | **65,9 K** | 0,5 K | 76 K |
| ficha de vídeo | 4,8 K | 9,6 K | **65,9 K** | 36,1 K | 112 K |

- Un único CSS de **41,4 KB sin comprimir / 9,6 KB en Brotli** para todo el sitio.
- Tres woff2: `inter-latin-400-normal` **23,4 K**, `inter-latin-700-normal` **24,1 K**, `archivo-black-latin-400-normal` **18,5 K**. `font-display: swap`, **sin `preload`** (`dist/index.html` tiene 0 `<link rel="preload">`).
- 0 peticiones a terceros: solo `4sotas.com/assets` y `4sotas.com/_astro`.
- HTTP/3 y `cache-control: public, max-age=31536000, immutable` en `_astro/*` y `assets/*` (Cloudflare `HIT` tras el primer acesso). El **HTML** sale con `public, max-age=0, must-revalidate`.

### 4.3 Diagnóstico del CLS (causa raíz confirmada)

`/oros/guias/bruto-a-neto/` a 768 px: **CLS 0,184** en un único shift a t≈204 ms:

```
div.wrap.article-layout  [683×280 → 683×246]   ← encoge 34 px
span                     [434×26  → 444×26 ]   ← el texto crece 10 px (cambio de métricas de fuente)
```

- `document.fonts.status` = `loaded`; las 3 woff2 se resuelven a t≈92 ms y el repintado con métricas nuevas llega a 204 ms.
- **Recarga en caliente (fuentes en caché): CLS = 0,000.** Mismo patrón en la ficha de vídeo a 1024: frío 0,018 → caliente 0,000.
- Conclusión: **no es una imagen ni un anuncio**, es el swap de Inter/Archivo Black sin reserva de métricas.

Corrección (dos capas, ambas baratas):

```html
<!-- 1. adelantar la descarga de las dos fuentes que pintan above-the-fold -->
<link rel="preload" href="/_astro/inter-latin-400-normal.C38fXH4l.woff2"
      as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/_astro/inter-latin-700-normal.Yt3aPRUw.woff2"
      as="font" type="font/woff2" crossorigin>
```

```css
/* 2. fallback con métricas ajustadas: evita el salto aunque el preload llegue tarde */
@font-face{
  font-family:"Inter Fallback";
  src:local("Arial"),local("Helvetica Neue");
  size-adjust:102.3%;      /* medido: 434 px → 444 px (+2,3 %) */
  ascent-override:91%;
  descent-override:23%;
  line-gap-override:0%;
}
body{ font-family:"Inter","Inter Fallback",system-ui,sans-serif; }
```

Para Archivo Black (solo titulares) la vía más simple es `font-display: optional`: si no llega en ~100 ms se queda el fallback toda la sesión, **CLS 0 garantizado** y sin reflow visible.

---

## 5. Top 10 recursos más pesados (máximo medido por URL, todo el sitio)

| # | Recurso | Peso | Tipo | Dónde | Recomendación |
|---|---|---|---|---|---|
| 1 | `/assets/videos/LL1EJttJPrs.webp` | **209,9 K** | imagen 640×360 | `/oros/videos/` | Reencodear a WebP q≈75 / AVIF: su variante 320w pesa **23 K**, así que hay ~9× de margen. Objetivo <60 K. |
| 2 | `/assets/videos/xZhIn2gYPJQ.webp` | 104,7 K | imagen 640×360 | `/oros/videos/` | Misma pasada de recompresión (objetivo <45 K). |
| 3 | `/assets/videos/iat5xP27vqo.webp` | 93,5 K | imagen 640×360 | `/oros/videos/` | Recompresión; usar AVIF con fallback WebP. |
| 4 | `/assets/videos/JDknkZIke1o.webp` | 93,5 K | imagen 640×360 | `/` y `/oros/` | Es la miniatura del “feature”: añadir `fetchpriority="high"` si es el LCP y recompresión. |
| 5 | `/assets/videos/2aepHTLOjIQ.webp` | 76,9 K | imagen 640×360 | `/oros/videos/` | Recompresión. |
| 6 | `/assets/videos/9gtjuYIdBg4.webp` | 74,5 K | imagen 640×360 | `/oros/videos/` | Recompresión. |
| 7 | `/assets/videos/3xz04lRAW0k.webp` | 68,0 K | imagen 640×360 | `/oros/videos/` | Recompresión. |
| 8 | `/assets/videos/xOBQ8cZPguU.webp` | 52,3 K | imagen 640×360 | `/oros/videos/` | Recompresión. |
| 9 | `/assets/videos/LfMVmUW9Hq0.webp` | 51,1 K | imagen 640×360 | `/oros/videos/` | Recompresión. |
| 10 | `inter-latin-700-normal.woff2` | 24,1 K | fuente | todas | Agrupar con #11 y #12 (ver grupo fuentes). |

**Grupo fuentes = 65,9 K (entraría en el puesto 2 del ranking real):** `inter-700` 24,1 K + `inter-400` 23,4 K + `archivo-black` 18,5 K. Con subsetting (`pyftsubset --text-file=<corpus del sitio>`, unicodes `U+0020-00FF`) se quedan en **~15–20 K totales**; el ahorro es de **~45 K en cada una de las 71 URLs del sitemap**.

**39 peticiones y 1,58 MB** en `/oros/videos/` a 1440 tras scroll: 35 miniaturas (1.506 K) + 3 fuentes + CSS + HTML. Con recompresión al objetivo medio (~45 K) esa página bajaría a **~1,6 MB → ~0,65 MB**.

---

## 6. Lista priorizada

### P0 — arreglar ya (defecto real medido, impacto directo en Core Web Vitals)

1. **CLS 0,184 en `/oros/guias/bruto-a-neto/` a 768 px** (y 0,017–0,020 en la ficha). `preload` de las dos Inter + `@font-face` de fallback con `size-adjust:102.3%`. Evidencia: frío 0,184 / caliente 0,000. Coste: ~10 líneas. Efecto esperado: CLS ≤0,02 en todo el sitio.
2. **`font-display: optional` para Archivo Black** (titulares). Elimina el swap del display font, que es el que cambia la altura del bloque de 280→246 px.

### P1 — la palanca de peso más grande

3. **Recompresión de las miniaturas de vídeo** (9 imágenes >50 K, una de 210 K para 640×360). Pipeline AVIF/WebP q75–80, `sizes` ya correcto. Ahorro medido potencial: **~700 K en `/oros/videos/`**.
4. **Subset de las 3 woff2** (65,9 K → ~18 K) y `preload` de las 2 críticas. Ahorro de 45–48 K **en todas las páginas**; en la guía es el **86 % del peso total**.
5. **`/oros/videos/` descarga 12 miniaturas (616 K) antes de cualquier scroll a 1440 px**, aunque 62 de las 66 imágenes llevan `loading="lazy"`: Chrome aplica su umbral de carga anticipada (~1.250 px) y el grid entra completo. El `loading` está bien puesto, así que **la única palanca real es el peso por imagen** (punto 3): con 45 K de media esas 12 pasarían de 616 K a ~180 K. En móvil son 261 K iniciales / 13 peticiones, ya con variante 320w.

### P2 — accesibilidad fina y caché

6. **Objetivos táctiles a 44×44** en migas, nav de escritorio y “Inicio” del pie (`padding-inline`, sin cambiar el layout). WCAG AA ya se cumple; esto es ergonomía móvil y Apple HIG.
7. **Texto 12 px / 12,8 px a 360–390** en la etiqueta de la carta y el logo. Subir a 13–14 px o acortar la cadena del logo en <375 px.
8. **HTML con `max-age=0, must-revalidate`**: añadir `s-maxage=300, stale-while-revalidate=86400` para que el edge sirva sin revalidar en cada navegación. Los picos de TTFB de 262–432 ms desaparecen del camino crítico.
9. **`/oros/videos/` a 1024 px es el peor caso de peso (1.477 K)**: el layout de 3 columnas pide la variante 640w en todas las tarjetas; añadir `sizes` con 2/3 columnas explícitas para que solo la destacada pida 640w.

### P3 — higiene

10. **404 de `/oros/videos/salario-minimo-2027`**: no hay enlaces internos rotos, pero conviene una redirección 301 al slug real `-14-o-12-pagas` por si circula externamente (YouTube, redes).
11. **`fetchpriority="high"` + `preload`** de la imagen LCP de `/oros/videos/` y `/oros/` cuando el LCP sea imagen (hoy lo es en 4 de 7 páginas a 1440).
12. **Enlaces de tarjeta**: unificar la zona clicable de las tarjetas de vídeo y glosario con `::after { inset:0 }`, que además resuelve el recuento de objetivos pequeños.
13. **`archivo-black`**: si solo se usa en 2–3 titulares, valorar sustituirlo por la propia Inter 800 (ahorra 18,5 K y una familia).

---

## 7. Lo que está bien y conviene no romper

- **Cero JS de terceros y prácticamente cero JS**: 2–3 scripts inline, TBT 0 ms. Cualquier analítica o embed que se añada debe ir con `defer` y idealmente con `requestIdleCallback`.
- **Miniaturas en vez de iframes de YouTube**: ahorra ~1 MB y evita CLS de terceros.
- **`width`/`height` en el 100 % de las imágenes** y `srcset` con variante 320w: la base móvil ya está resuelta.
- **Contraste 8,84:1 mínimo** y paleta consistente: no tocar los tokens de color sin volver a medir.
- **Detalles de a11y poco habituales y correctos**: `sr-only` para “(se abre en otra pestaña)”, `summary` con nombre, un solo `h1`, `lang` regional, `prefers-reduced-motion`.

---

## 8. Reproducibilidad

Scripts usados (fuera del repo, no se ha tocado `src/`, `public/` ni `dist/`):

```
/home/hermesiarco/.hermes/profiles/orchestrator/cache/scratch/a11y4s/
  measure.mjs   # 35 combinaciones: overflow, texto, targets, imágenes, axe, LCP/CLS/TBT, red
  extras.mjs    # 320 px reflow, clasificación inline/standalone de targets, foco, contraste manual
  final.mjs     # foco por Tab real, axe target-size, @font-face, CLS frío vs caliente, recursos
  raw.json, extras.json, final.json   # datos crudos
```

Reproducir: `node measure.mjs` (requiere `playwright-core` de `hermes-hq-app` y `axe.min.js` en el mismo directorio).

**Cifras de este informe = medidas en producción el 26/11/2026 entre 19:39 y 19:47 CET, Chromium 156 headless, HTTP/3, sin throttling.**
