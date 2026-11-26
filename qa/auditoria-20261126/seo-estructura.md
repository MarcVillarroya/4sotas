# Auditoría SEO on-page y arquitectura de enlazado — 4sotas.com

**Fecha:** 26 de noviembre de 2026
**Sitio auditado:** https://4sotas.com (producción)
**Alcance:** las 71 URLs de `sitemap-index.xml` → `sitemap-0.xml`
**Método:** descarga de las 71 URLs, parseo del HTML con un parser propio (Python stdlib), validación de JSON-LD con `json.loads`, reconstrucción del grafo interno y BFS desde la home. No se ha modificado nada de `src/`, `public/` ni `dist/`.

---

## 0. Resumen ejecutivo

El marcado on-page está en buen estado y no es el cuello de botella: **0 títulos por encima de 65 caracteres, 0 descripciones fuera de 60-160, 0 duplicados, 71/71 páginas con un solo H1, canonical única y exacta en 71/71, JSON-LD válido en 71/71 sin `@id` colgantes y 0 enlaces internos rotos**.

Donde sí hay trabajo:

1. **Un defecto alto:** el `<title>` de `/oros/herramientas/interes-compuesto/` no contiene la consulta objetivo ("Evolución del capital frente a lo aportado", 42 caracteres; 0 apariciones de "interés compuesto" o "calculadora").
2. **El reparto de enlaces internos es el problema real:** 12 fichas de vídeo tienen **exactamente un enlace entrante** (el índice `/oros/videos/`). Los 7 hubs de tema enlazan **10 de sus 47 pares vídeo-tema**; faltan 37.
3. `/oros/temas/vivienda-y-hipoteca/` **no enlaza ninguna** de las 5 fichas de vídeo de su tema, y `/oros/guias/comprar-piso-coste-real/` no enlaza **ningún** vídeo pese a ser la guía con más intención comercial.
4. Cuatro guías sirven **dos bloques "Fuentes" y el mismo `id="fuentes"`** en los dos (HTML inválido y ancla ambigua); el build local ya separa los identificadores.
5. `llms.txt` declara "Última actualización de contenido: 2026-11-22" y en la línea 49 publica un vídeo del 2026-11-25.
6. **El vivo sirve un build anterior.** `dist/` ya tiene 7 títulos nuevos y la colisión de `id="fuentes"` resuelta; el dominio público no. Ver §1.b.

---

## 1. Cuadro de mando

| Comprobación | Resultado medido | Veredicto |
|---|---|---|
| URLs del sitemap que responden 200 | 71/71 | ✔ |
| `<title>` > 65 caracteres | 0/71 (máx. 65, media 47,3) | ✔ |
| `<title>` < 25 caracteres | 5/71 | ⚠ §2 D4 |
| `<meta description>` fuera de 60-160 | 0/71 (mín. 97, máx. 160, media 128,3) | ✔ |
| Duplicados exactos de title / description | 0 / 0 | ✔ |
| Casi duplicados (similitud ≥ 0,90) | 0 pares | ✔ |
| H1 por página | 1 en las 71 | ✔ |
| H2 idéntico al H1 | 0 | ✔ |
| Saltos de jerarquía (h2→h4) o encabezados vacíos | 0 / 0 | ✔ |
| Canonical única y == URL del sitemap | 71/71 | ✔ |
| Variantes: `www`, sin barra final, `/index.html` | 301 / 308 / 308 a la canónica | ✔ |
| JSON-LD parsea sin error | 71/71 bloques | ✔ |
| `@id` colgantes (referencias sin nodo) | 0 | ✔ |
| Propiedades requeridas ausentes (VideoObject, Article, SoftwareApplication, Organization, WebSite, BreadcrumbList, DefinedTerm) | 0 | ✔ |
| BreadcrumbList bien formado (posiciones 1..n y último ítem = URL) | 66/66 de las que lo tienen | ✔ |
| Páginas sin BreadcrumbList | 5 (home, /oros/, /metodologia/, /privacidad/, /sobre-4-sotas/) | ⚠ §2 D12 |
| Enlaces internos rotos | 0 | ✔ |
| Anclas `#fragmento` que no existen en destino | 0 | ✔ |
| Imágenes sin `alt` | 0 de 378 | ✔ |
| Anchors genéricos ("ver más", "aquí", "leer más", texto vacío) | 0 | ✔ |
| Páginas huérfanas (sin entrantes salvo sitemap) | 0 | ✔ |
| Profundidad de clic desde la home | máx. 2 (0→1, 1→17, 2→53) | ✔ |
| Páginas con un solo enlace entrante | 12 | ⚠ §3.3 |

### 1.b El vivo no es el build actual (comprobado el 26-nov, 19:49)

`dist/` tiene fecha de build de las 19:47 de hoy y `git status` mostraba **20 archivos modificados sin commit** a las 19:49. Comparación página a página entre `dist/` y el HTML servido:

| Comprobación | `dist/` (local) | Vivo |
|---|---|---|
| `id="fuentes"` en `/oros/guias/bruto-a-neto/` | 1 (`+ section id="fuentes-citadas"`) | **2** |
| Índice "Fuentes (8)" apunta a | `#fuentes-citadas` | `#fuentes` (bloque equivocado) |
| Title `/oros/guias/` | Guías de finanzas personales en España · Sota de Oros | Guías · Sota de Oros |
| Title `/oros/glosario/` | Glosario de economía y finanzas en España · Sota de Oros | Glosario · Sota de Oros |
| Title `/oros/videos/` | Vídeos de economía y finanzas personales · Sota de Oros | Vídeos · Sota de Oros |
| Title `/oros/herramientas/`, `/oros/temas/`, `/`, `/oros/` | reescritos con términos de consulta | versión corta anterior |
| Title `/oros/herramientas/interes-compuesto/` | Calculadora de interés compuesto · Sota de Oros (50) | Evolución del capital frente a lo aportado (42) |
| `dist/robots.txt`, `dist/llms.txt`, `dist/sitemap-0.xml` | idénticos en lo auditado (rutas WP, fecha 2026-11-22, sin `lastmod`) | igual |

**Consecuencia:** desplegar el build actual resuelve D2 (colisión de id) y la mitad de D4 (títulos de hubs). No resuelve D1 del todo (el build ya incluye "Calculadora de interés compuesto", pero mi propuesta añade el modificador), ni D3, D5, D6, D9, D10, D11, D12, D13 ni el enlazado interno. Antes de desplegar hay que revisar los 20 archivos sin commit: no todos son de esta auditoría (`docs/`, `packs/`, `src/content/videos/`).

---

## 2. Defectos por URL

Gravedad: **Alta** = afecta a la consulta objetivo de una página clave · **Media** = pérdida de rendimiento o incoherencia visible · **Baja** = pulido.

| # | URL | Defecto | Evidencia medida | Grav. | Corrección concreta |
|---|---|---|---|---|---|
| D1 | `/oros/herramientas/interes-compuesto/` | El title no contiene la consulta objetivo | title servido = "Evolución del capital frente a lo aportado" (42 car.); 0 apariciones de "interés compuesto" y de "calculadora"; el H1 sí dice "Calculadora de interés compuesto". En `dist/` ya es "Calculadora de interés compuesto · Sota de Oros" (50) | **Alta** | Desplegar el build y, ya puestos, title: **"Calculadora de interés compuesto: capital y aportaciones"** (56 car.) |
| D2 | `/oros/guias/bruto-a-neto/`, `/oros/guias/inflacion-poder-adquisitivo/`, `/oros/guias/primeros-1000-euros/`, `/oros/guias/tramos-irpf-y-retencion/` | Dos secciones "Fuentes" y `id="fuentes"` duplicado **en el vivo** | Vivo: 2 nodos con `id="fuentes"` (`<h2 id="fuentes">` + `<section id="fuentes">`), 2 H2 visibles verificados en navegador y el índice "Fuentes (8)" cayendo en el bloque equivocado. `dist/`: 1 `id="fuentes"` + `<section id="fuentes-citadas">` | Media | Desplegar resuelve la colisión. Si se mantienen los dos bloques (lista + tabla), renombrar el H2 de la tabla a "Tabla de fuentes" |
| D3 | 8 guías (`/oros/guias/*`) | Dos entradas de índice etiquetadas "Fuentes" | TOC: `Fuentes → #fuentes` y `Fuentes (8) → #fuentes` (vivo) / `→ #fuentes-citadas` (`dist/`); en ambos casos el lector ve dos "Fuentes" | Baja | Renombrar la segunda entrada y su H2: "Tabla de fuentes" |
| D4 | `/oros/videos/`, `/oros/guias/`, `/oros/glosario/`, `/oros/glosario/ipc/` | Títulos cortos: solo categoría + marca | Servidos: 21, 20, 23 y 18 caracteres, sin modificadores. `dist/` ya reescribe los tres primeros; **IPC sigue en 18** en ambos | Media | IPC: **"IPC: qué es y cómo se calcula el índice de precios"** (50). Tras desplegar, revisar los tres hubs: sus nuevos títulos no llevan modificador ("Guías de finanzas personales en España") |
| D5 | 13 fichas de vídeo (lista abajo) | La descripción empieza con una plantilla y gasta 33-42 de sus ~128 caracteres en "Vídeo corto de Sota de Oros" | 13/30 descripciones con prefijo; las otras 17 ya empiezan por el dato (p. ej. black-friday, reto-centimo, trampa-3-plazos, letras-tesoro, sp500-riesgo-oculto) | Media | Empezar por el dato y el número, como en las 17 que ya lo hacen. Ej.: `/oros/videos/tu-casa-50k/` → **"TU CASA: hasta 50.000 € al 0 % para la primera vivienda, con un límite al precio de venta y una condición al venderla."** (127) |
| D6 | 30 fichas de vídeo | `og:image` en WebP | 30/30 apuntan a la miniatura `.webp` de YouTube (1280×720, formato correcto pero WebP); Facebook, LinkedIn y WhatsApp no renderizan WebP en la tarjeta | Media | Exportar la misma imagen a JPG/PNG y usarla como `og:image` (mantener el WebP para la ficha) |
| D7 | 12 fichas de vídeo | Un único enlace entrante en todo el sitio | in-degree total = 1 y contextual = 1, siempre desde `/oros/videos/` | Media | §3.3 |
| D8 | `/oros/temas/vivienda-y-hipoteca/` | Hub de tema sin un solo enlace a fichas de vídeo | 0 de sus 5 vídeos enlazados (los 5 tienen in-degree 1) | Media | Añadir los 5 enlaces de §3.4 |
| D9 | `/llms.txt` | Fecha de actualización falsa | Línea 5: "Última actualización de contenido: 2026-11-22"; línea 49 lista un vídeo de 2026-11-25 y la 50 uno de 2026-11-23 | Media | Regenerar la fecha desde el contenido publicado (o eliminarla) |
| D10 | `/robots.txt` | Rutas de WordPress que no existen | Líneas 8-10: `/wp-admin/`, `/wp-login.php`, `/xmlrpc.php`; el sitio es Astro y esas rutas devuelven 404 | Baja | Borrar las tres líneas |
| D11 | `/sitemap-0.xml` | Sin `lastmod` | 71/71 `<url>` solo con `<loc>` | Baja | Emitir `lastmod` por página |
| D12 | `/oros/` | Hub principal sin BreadcrumbList | 0 nodos; 66/71 páginas sí lo tienen | Baja | `BreadcrumbList`: Inicio → Sota de Oros |
| D13 | Todas las páginas | Navegación principal duplicada en el DOM | 2 `<nav aria-label="Principal">` (escritorio y móvil) con los mismos 5 enlaces: 2.010 anchors internos frente a 933 aristas únicas | Baja | Servir una sola nav; la otra por CSS, no duplicada en el HTML |
| D14 | Varias | Mismo anchor para destinos distintos | "Abrir la calculadora" → `/oros/herramientas/hipoteca/` (5 veces) y → `/oros/herramientas/interes-compuesto/` (8) | Baja | "Abrir la calculadora de hipoteca" / "Abrir la de interés compuesto" |
| D15 | `/oros/videos/` | Doble puntuación en el texto accesible de las tarjetas | 30 tarjetas con `sr-only`: "Ver la ficha: ¿seguro que estás ahorrando?." | Baja | No añadir "." si el título ya acaba en "?" o "!" |
| D16 | `bruto-a-neto` ↔ `temas/nomina`; `primeros-1000-euros` ↔ `temas/ahorro` | Títulos con solapamiento de intención | Jaccard de tokens (sin marca) 0,67 y 0,50 | Baja | Mantener hub = recorrido, guía = cálculo; diferenciar title y anchors (no hay datos de posiciones para afirmar canibalización) |
| D17 | `/metodologia/` | Página de metodología muy corta | 166 palabras en `<main>` (mediana del sitio 479; guías 1.900-2.100); es el `publishingPrinciples` de las 71 páginas | Baja | Añadir: qué se comprueba, cómo se corrige un error y historial de cambios |
| D18 | `/privacidad/`, `/sobre-4-sotas/` | 0 enlaces contextuales (solo footer) | in-degree contextual 0; total 71 (footer) | Baja | Enlazar desde el cuerpo de `/metodologia/` |

**13 fichas con descripción-plantilla:** `bruto-vs-neto-2000`, `como-leer-una-nomina`, `crisis-de-2008-espana`, `deuda-o-inversion-1000`, `fondo-de-emergencia`, `gastos-hormiga`, `inflacion-sobre-10000`, `irpf-en-la-nomina`, `quien-se-queda-tu-dinero-tarjeta`, `sp500-4-de-cada-10-euros-a-10-posiciones`, `tramos-del-irpf`, `tres-cuentas-un-sueldo`, `tu-casa-50k`.

**Observación (no defecto):** 14 títulos miden 61-65 caracteres, dentro del límite, pero pueden truncarse en la SERP de escritorio. No se tocan salvo reescritura por otro motivo.

---

## 3. Arquitectura de enlazado interno

### 3.1 Volumen y forma del grafo

- 2.010 anchors internos, **933 aristas únicas**, media de 28,3 enlaces internos por página.
- Profundidad desde la home: **0 → 1 página, 1 → 17 páginas, 2 → 53 páginas. Máximo 2 clics.**
- **0 páginas huérfanas**: las 71 reciben al menos un enlace interno (las 2 legales solo desde el footer).
- 273 anchors externos; el destino interno fuera del sitemap es únicamente `/rss.xml` (200, `application/rss+xml`).

### 3.2 Distribución de in-degree contextual (sin contar nav ni footer)

| in-degree contextual | páginas |
|---|---|
| 0 | 2 |
| 1 | 12 |
| 2 | 5 |
| 3 | 11 |
| 4 | 5 |
| 5 | 6 |
| 6 | 13 |
| 7 | 2 |
| 8 | 8 |
| 9 | 1 |
| 10 | 1 |
| 12 | 1 |
| 13 | 1 |
| 18 | 1 |
| 36 | 1 |
| 71 | 1 |

La media es 6,1, pero la distribución está polarizada: la home recibe 71 enlaces contextuales y `/oros/videos/` recibe 36, mientras 12 fichas de contenido reciben uno y dos páginas legales, ninguno.

### 3.3 Páginas peor enlazadas y desde dónde enlazarlas

12 fichas de vídeo tienen un solo enlace entrante; 5 páginas tienen dos. Las dos legales solo aparecen en el footer. Tabla completa con `in-degree` total (incluye nav y footer) y contextual:

| URL | in-deg contextual | in-deg total | enlazan desde |
|---|---|---|---|
| `/privacidad/` | 0 | 71 | — |
| `/sobre-4-sotas/` | 0 | 71 | — |
| `/oros/videos/black-friday/` | 1 | 1 | `/oros/videos/` |
| `/oros/videos/burbuja-ia-2000/` | 1 | 1 | `/oros/videos/` |
| `/oros/videos/comprar-piso-40000-no-llegan/` | 1 | 1 | `/oros/videos/` |
| `/oros/videos/cuentas-pareja/` | 1 | 1 | `/oros/videos/` |
| `/oros/videos/gta-vi-imperio/` | 1 | 1 | `/oros/videos/` |
| `/oros/videos/letras-tesoro/` | 1 | 1 | `/oros/videos/` |
| `/oros/videos/reto-centimo/` | 1 | 1 | `/oros/videos/` |
| `/oros/videos/sp500-4-de-cada-10-euros-a-10-posiciones/` | 1 | 1 | `/oros/videos/` |
| `/oros/videos/sp500-riesgo-oculto/` | 1 | 1 | `/oros/videos/` |
| `/oros/videos/te-suben-el-sueldo-3/` | 1 | 1 | `/oros/videos/` |
| `/oros/videos/trampa-3-plazos/` | 1 | 1 | `/oros/videos/` |
| `/oros/videos/tu-casa-50k/` | 1 | 1 | `/oros/videos/` |
| `/oros/` | 2 | 71 | `/`, `/sobre-4-sotas/` |
| `/oros/glosario/amortizacion-francesa/` | 2 | 2 | `/oros/glosario/`, `/oros/guias/comprar-piso-coste-real/` |
| `/oros/videos/comprar-piso-250k/` | 2 | 2 | `/oros/videos/`, `/oros/videos/comprar-piso-40000-no-llegan/` |
| `/oros/videos/fondo-emergencia-336-euros/` | 2 | 2 | `/oros/videos/`, `/oros/videos/te-suben-el-sueldo-3/` |
| `/oros/videos/tu-saldo-no-es-tu-presupuesto/` | 2 | 2 | `/oros/videos/`, `/oros/videos/trabajar-ya-no-basta-comprar-casa/` |

**Plan de enlazado concreto** (cada enlace, desde una página que ya existe y sin enlace previo a ese destino):

| Destino | Enlazar desde | Anchor propuesto |
|---|---|---|
| `/oros/videos/black-friday/` | `/oros/temas/ahorro/` | "Black Friday: cuándo la oferta es real" |
| `/oros/videos/burbuja-ia-2000/` | `/oros/temas/burbujas/` y `/oros/temas/inversion-desde-cero/` | "La burbuja de la IA en tres datos" |
| `/oros/videos/comprar-piso-40000-no-llegan/` | `/oros/temas/vivienda-y-hipoteca/` y `/oros/guias/comprar-piso-coste-real/` | "Por qué 40.000 € no llegan para un piso de 200.000 €" |
| `/oros/videos/cuentas-pareja/` | `/oros/temas/banca-y-credito/` | "Cuenta conjunta o separada: los números" |
| `/oros/videos/gta-vi-imperio/` | `/oros/temas/burbujas/` | "GTA VI: 3.790 M$ en un solo día" |
| `/oros/videos/letras-tesoro/` | `/oros/temas/inversion-desde-cero/` | "Letras del Tesoro: 242 € netos por 10.000 €" |
| `/oros/videos/reto-centimo/` | `/oros/temas/ahorro/` | "El reto del céntimo y su trampa" |
| `/oros/videos/sp500-4-de-cada-10-euros-a-10-posiciones/` | `/oros/temas/inversion-desde-cero/` y `/oros/guias/fondos-indexados-vs-etf/` | "S&P 500: 4 de cada 10 € en 10 posiciones" |
| `/oros/videos/sp500-riesgo-oculto/` | `/oros/temas/inversion-desde-cero/` y `/oros/guias/fondos-indexados-vs-etf/` | "El riesgo oculto de creerte diversificado" |
| `/oros/videos/te-suben-el-sueldo-3/` | `/oros/temas/inflacion/` y `/oros/guias/inflacion-poder-adquisitivo/` | "Un 3 % de subida que no compensa la inflación" |
| `/oros/videos/trampa-3-plazos/` | `/oros/temas/banca-y-credito/` y `/oros/guias/tarjetas-y-comisiones/` | "3 plazos sin intereses: la cuota que no ves" |
| `/oros/videos/tu-casa-50k/` | `/oros/temas/vivienda-y-hipoteca/` y `/oros/guias/comprar-piso-coste-real/` | "TU CASA: 50.000 € al 0 % y qué pasa al vender" |

### 3.4 Cobertura tema → vídeo

Cada vídeo declara sus temas en `/data/videos.json`; el hub del tema casi nunca enlaza sus fichas:

| Hub de tema | Vídeos del tema | Enlazados desde el hub | Faltan |
|---|---|---|---|
| `/oros/temas/nomina/` | 10 | 3 | 7 |
| `/oros/temas/ahorro/` | 15 | 3 | 12 |
| `/oros/temas/inversion-desde-cero/` | 6 | 1 | 5 |
| `/oros/temas/vivienda-y-hipoteca/` | 5 | 0 | 5 |
| `/oros/temas/banca-y-credito/` | 4 | 1 | 3 |
| `/oros/temas/burbujas/` | 4 | 1 | 3 |
| `/oros/temas/inflacion/` | 3 | 1 | 2 |
| **Total** | **47 pares** | **10** | **37** |

### 3.5 Otras observaciones del grafo

- **Nav duplicada** (D13): cada página tiene dos veces los mismos 5 enlaces de navegación. Google los deduplica, pero infla el recuento de enlaces y desplaza el contenido en el HTML.
- **Anchors repetidos sanos**: "Ver todo el glosario" (13), "Ver los vídeos" (6), "Todos los temas" (7). Son CTA hacia el hub correcto, no genéricos; no hay ningún "clic aquí" ni "ver más".
- Todos los enlaces internos usan barra final, minúsculas y sin parámetros: **0 hrefs con query, 0 sin barra, 0 con mayúsculas, 0 nofollow internos**.

---

## 4. `robots.txt` y `llms.txt` servidos

| Recurso | Estado | Tamaño |
|---|---|---|
| `/robots.txt` | 200 `text/plain` | 1.086 B |
| `/llms.txt` | 200 `text/plain` | 14.664 B |
| `/llms-full.txt` | 200 `text/plain` | 184.749 B |
| `/sitemap-index.xml` | 200, apunta a `sitemap-0.xml` | 181 B |

### 4.1 Coherencia de `robots.txt`: correcta en lo importante

- **Búsqueda permitida:** `Googlebot`, `Googlebot-Image`, `Bingbot`, `DuckDuckBot`, `Applebot` con `Allow: /`.
- **Agentes de IA con cita permitidos:** `OAI-SearchBot`, `ChatGPT-User`, `Claude-SearchBot`, `Claude-User`, `PerplexityBot`, `Perplexity-User`.
- **Entrenamiento denegado:** `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Bytespider`, `meta-externalagent`.
- `Content-Signal: search=yes, ai-input=yes, ai-train=no` (línea 4) coincide con los grupos anteriores. Sin contradicciones.
- `Sitemap:` declarado (línea 54). `/llms.txt` no está bloqueado.

**Único defecto:** las tres rutas de WordPress (D10). No hay `Disallow` que bloquee contenido real: solo afectan a rutas inexistentes, así que el riesgo es de imagen/limpieza, no de indexación.

### 4.2 `llms.txt`: contenido correcto, tres desajustes

Verificado contra el sitio:
- "7 recorridos" = 7 hubs en `/oros/temas/` ✔ · "8 explicadores" = 8 guías ✔ · "30 fichas" = 30 vídeos ✔ · "12 términos" = 12 entradas de glosario ✔ · "4 calculadoras" ✔.
- Los 5 JSON de `/data/` y `/rss.xml` responden 200 ✔.
- `www.4sotas.com` → 301 a `https://4sotas.com/` ✔ (coincide con lo que declara).
- "sin cookies propias": 0 scripts de analítica en el HTML ✔.

Desajustes:
1. **Fecha obsoleta (D9):** declara 2026-11-22 y lista contenido del 2026-11-25.
2. **Omite el hub `/oros/`** en "Secciones" (lista `/oros/temas/`, `/oros/guias/`, `/oros/videos/`, `/oros/glosario/`, `/oros/herramientas/`, pero no la raíz de la sección).
3. `llms-full.txt` cubre **69 de las 71 URLs**: faltan `/sobre-4-sotas/` y `/privacidad/`.

---

## 5. Acciones priorizadas

### P0 — esta semana (impacto directo, cambios pequeños)

0. **Revisar y desplegar el build pendiente** (§1.b): resuelve D2 y los títulos de hubs de D4. Hay 20 archivos modificados sin commit, no todos de esta auditoría.
1. **Title de la calculadora de interés compuesto** (D1): `Calculadora de interés compuesto: capital y aportaciones` (o al menos desplegar el que ya está en `dist/`).
2. **Renombrar la tabla de fuentes** (D3): `Tabla de fuentes` en el H2 y en el índice de las 8 guías.
3. **Añadir los 12 enlaces de §3.3** (D7, D8) y los 5 del hub de vivienda (§3.4). Es el cambio con más recorrido: convierte 12 páginas de 1 enlace entrante en páginas con 2-3.
4. **`og:image` en JPG/PNG para las 30 fichas de vídeo** (D6).

### P1 — próximas dos semanas

5. Title de `/oros/glosario/ipc/` (D4); tras desplegar, revisar si los nuevos títulos de los hubs necesitan modificador ("en España" sin "qué es/cómo").
6. Reescribir las 13 descripciones con prefijo de plantilla (D5), copiando el patrón de las 17 que ya empiezan por el dato.
7. Corregir `llms.txt`: fecha real y añadir `/oros/` en "Secciones" (D9).
8. Limpiar las rutas de WordPress de `robots.txt` (D10).

### P2 — backlog

9. `lastmod` en el sitemap (D11).
10. BreadcrumbList en `/oros/` (D12).
11. Eliminar la nav duplicada del DOM (D13).
12. Anchors específicos en los CTA "Abrir la calculadora" (D14).
13. Ampliar `/metodologia/` (D17) y enlazar `/sobre-4-sotas/` y `/privacidad/` desde su cuerpo (D18).
14. Diferenciar los pares hub/guía con título solapado (D16) y quitar la doble puntuación de las tarjetas (D15).

---

## 6. Límites de esta auditoría

- **No hay datos de tráfico, impresiones ni posiciones**: no se afirma nada sobre rankings ni sobre canibalización real; D16 se basa solo en el solapamiento de tokens del título.
- La validación de JSON-LD es estructural (parseo, propiedades requeridas, referencias `@id`), no una validación contra el Rich Results Test de Google.
- El HTML se descargó sin ejecutar JavaScript. El sitio es SSG y todo el contenido crítico (títulos, H1, JSON-LD, enlaces) está en el HTML servido.
- Los enlaces externos no se han rastreado (solo se contaron: 273 anchors).

---

## Anexo A. Las 71 URLs medidas

`title` y `desc` en caracteres, medidos sobre el HTML **servido** el 26-nov-2026 (no sobre `dist/`). `in-deg` = enlaces entrantes totales / sin contar nav ni footer. `words` = palabras del documento completo (incluye navegación).

| # | URL | title | desc | h1 | in-deg (total / contextual) | depth | words |
|---|---|---|---|---|---|---|---|
| 1 | `/` | 44 | 139 | 1 | 71 / 71 | 0 | 700 |
| 2 | `/metodologia/` | 31 | 111 | 1 | 71 / 3 | 1 | 270 |
| 3 | `/oros/` | 47 | 128 | 1 | 71 / 2 | 1 | 1006 |
| 4 | `/oros/glosario/` | 23 | 135 | 1 | 71 / 13 | 1 | 540 |
| 5 | `/oros/glosario/amortizacion-francesa/` | 36 | 123 | 1 | 2 / 2 | 2 | 506 |
| 6 | `/oros/glosario/base-de-cotizacion/` | 33 | 144 | 1 | 6 / 6 | 2 | 574 |
| 7 | `/oros/glosario/dca-aportacion-periodica/` | 41 | 114 | 1 | 4 / 4 | 2 | 435 |
| 8 | `/oros/glosario/diversificacion/` | 30 | 120 | 1 | 5 / 5 | 2 | 445 |
| 9 | `/oros/glosario/fondo-de-emergencia/` | 34 | 131 | 1 | 3 / 3 | 2 | 525 |
| 10 | `/oros/glosario/inflacion-subyacente/` | 35 | 142 | 1 | 4 / 4 | 2 | 461 |
| 11 | `/oros/glosario/ipc/` | 18 | 136 | 1 | 6 / 6 | 2 | 543 |
| 12 | `/oros/glosario/tae/` | 43 | 120 | 1 | 6 / 6 | 2 | 456 |
| 13 | `/oros/glosario/tin/` | 44 | 114 | 1 | 3 / 3 | 2 | 412 |
| 14 | `/oros/glosario/tipo-de-retencion/` | 32 | 139 | 1 | 6 / 6 | 2 | 567 |
| 15 | `/oros/glosario/tipo-marginal/` | 28 | 122 | 1 | 6 / 6 | 2 | 584 |
| 16 | `/oros/glosario/traspaso-de-fondos/` | 33 | 115 | 1 | 4 / 4 | 2 | 453 |
| 17 | `/oros/guias/` | 20 | 126 | 1 | 71 / 6 | 1 | 610 |
| 18 | `/oros/guias/bruto-a-neto/` | 64 | 144 | 1 | 12 / 12 | 1 | 2135 |
| 19 | `/oros/guias/comprar-piso-coste-real/` | 62 | 118 | 1 | 5 / 5 | 2 | 2336 |
| 20 | `/oros/guias/dca-interes-compuesto/` | 58 | 115 | 1 | 7 / 7 | 2 | 2021 |
| 21 | `/oros/guias/fondos-indexados-vs-etf/` | 59 | 109 | 1 | 6 / 6 | 2 | 1988 |
| 22 | `/oros/guias/inflacion-poder-adquisitivo/` | 65 | 142 | 1 | 8 / 8 | 1 | 1796 |
| 23 | `/oros/guias/primeros-1000-euros/` | 63 | 156 | 1 | 8 / 8 | 1 | 2088 |
| 24 | `/oros/guias/tarjetas-y-comisiones/` | 63 | 120 | 1 | 6 / 6 | 2 | 2155 |
| 25 | `/oros/guias/tramos-irpf-y-retencion/` | 63 | 159 | 1 | 8 / 8 | 2 | 1817 |
| 26 | `/oros/herramientas/` | 27 | 146 | 1 | 71 / 6 | 1 | 315 |
| 27 | `/oros/herramientas/hipoteca/` | 38 | 143 | 1 | 9 / 9 | 1 | 1056 |
| 28 | `/oros/herramientas/interes-compuesto/` | 42 | 151 | 1 | 18 / 18 | 2 | 1466 |
| 29 | `/oros/herramientas/prestamo/` | 38 | 127 | 1 | 5 / 5 | 1 | 866 |
| 30 | `/oros/herramientas/viabilidad-hipoteca/` | 40 | 144 | 1 | 4 / 4 | 1 | 1221 |
| 31 | `/oros/temas/` | 30 | 115 | 1 | 8 / 8 | 2 | 400 |
| 32 | `/oros/temas/ahorro/` | 61 | 136 | 1 | 8 / 8 | 2 | 1106 |
| 33 | `/oros/temas/banca-y-credito/` | 30 | 97 | 1 | 6 / 6 | 2 | 1677 |
| 34 | `/oros/temas/burbujas/` | 33 | 108 | 1 | 3 / 3 | 2 | 1246 |
| 35 | `/oros/temas/inflacion/` | 51 | 131 | 1 | 6 / 6 | 2 | 975 |
| 36 | `/oros/temas/inversion-desde-cero/` | 35 | 119 | 1 | 8 / 8 | 2 | 1724 |
| 37 | `/oros/temas/nomina/` | 65 | 129 | 1 | 8 / 8 | 2 | 1072 |
| 38 | `/oros/temas/vivienda-y-hipoteca/` | 34 | 109 | 1 | 7 / 7 | 2 | 1930 |
| 39 | `/oros/videos/` | 21 | 127 | 1 | 71 / 36 | 1 | 2614 |
| 40 | `/oros/videos/ahorro-33-anos/` | 55 | 127 | 1 | 3 / 3 | 2 | 580 |
| 41 | `/oros/videos/black-friday/` | 57 | 128 | 1 | 1 / 1 | 2 | 643 |
| 42 | `/oros/videos/bruto-vs-neto-2000/` | 52 | 121 | 1 | 5 / 5 | 2 | 645 |
| 43 | `/oros/videos/burbuja-ia-2000/` | 64 | 126 | 1 | 1 / 1 | 2 | 614 |
| 44 | `/oros/videos/como-leer-una-nomina/` | 56 | 109 | 1 | 6 / 6 | 2 | 686 |
| 45 | `/oros/videos/comprar-piso-250k/` | 51 | 144 | 1 | 2 / 2 | 2 | 688 |
| 46 | `/oros/videos/comprar-piso-40000-no-llegan/` | 55 | 155 | 1 | 1 / 1 | 2 | 653 |
| 47 | `/oros/videos/crisis-de-2008-espana/` | 53 | 111 | 1 | 3 / 3 | 2 | 537 |
| 48 | `/oros/videos/cuentas-pareja/` | 65 | 125 | 1 | 1 / 1 | 2 | 620 |
| 49 | `/oros/videos/deuda-o-inversion-1000/` | 63 | 110 | 1 | 10 / 10 | 2 | 658 |
| 50 | `/oros/videos/fondo-de-emergencia/` | 52 | 117 | 1 | 6 / 6 | 2 | 627 |
| 51 | `/oros/videos/fondo-emergencia-336-euros/` | 53 | 145 | 1 | 2 / 2 | 2 | 561 |
| 52 | `/oros/videos/gastos-hormiga/` | 56 | 105 | 1 | 8 / 8 | 2 | 579 |
| 53 | `/oros/videos/gta-vi-imperio/` | 56 | 160 | 1 | 1 / 1 | 2 | 606 |
| 54 | `/oros/videos/gta6-primer-dia/` | 64 | 121 | 1 | 3 / 3 | 1 | 520 |
| 55 | `/oros/videos/inflacion-sobre-10000/` | 52 | 117 | 1 | 4 / 4 | 2 | 600 |
| 56 | `/oros/videos/irpf-en-la-nomina/` | 59 | 140 | 1 | 5 / 5 | 2 | 692 |
| 57 | `/oros/videos/letras-tesoro/` | 51 | 131 | 1 | 1 / 1 | 2 | 613 |
| 58 | `/oros/videos/quien-se-queda-tu-dinero-tarjeta/` | 58 | 114 | 1 | 3 / 3 | 2 | 597 |
| 59 | `/oros/videos/reto-centimo/` | 53 | 132 | 1 | 1 / 1 | 2 | 640 |
| 60 | `/oros/videos/salario-minimo-2027-14-o-12-pagas/` | 51 | 133 | 1 | 3 / 3 | 1 | 540 |
| 61 | `/oros/videos/sp500-4-de-cada-10-euros-a-10-posiciones/` | 58 | 127 | 1 | 1 / 1 | 2 | 519 |
| 62 | `/oros/videos/sp500-riesgo-oculto/` | 65 | 136 | 1 | 1 / 1 | 2 | 605 |
| 63 | `/oros/videos/te-suben-el-sueldo-3/` | 61 | 122 | 1 | 1 / 1 | 2 | 658 |
| 64 | `/oros/videos/trabajar-ya-no-basta-comprar-casa/` | 58 | 151 | 1 | 3 / 3 | 1 | 784 |
| 65 | `/oros/videos/tramos-del-irpf/` | 58 | 118 | 1 | 5 / 5 | 2 | 661 |
| 66 | `/oros/videos/trampa-3-plazos/` | 52 | 140 | 1 | 1 / 1 | 2 | 669 |
| 67 | `/oros/videos/tres-cuentas-un-sueldo/` | 57 | 111 | 1 | 3 / 3 | 2 | 689 |
| 68 | `/oros/videos/tu-casa-50k/` | 51 | 155 | 1 | 1 / 1 | 2 | 538 |
| 69 | `/oros/videos/tu-saldo-no-es-tu-presupuesto/` | 54 | 140 | 1 | 2 / 2 | 2 | 654 |
| 70 | `/privacidad/` | 20 | 127 | 1 | 71 / 0 | 1 | 317 |
| 71 | `/sobre-4-sotas/` | 36 | 110 | 1 | 71 / 0 | 1 | 391 |
