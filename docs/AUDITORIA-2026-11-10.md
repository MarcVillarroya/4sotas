# Auditoría de 4sotas.com · 10 de noviembre de 2026

Revisión del sitio en producción (62 URLs del sitemap), del repositorio y de la configuración de
Cloudflare. Todo lo marcado como corregido está desplegado y verificado en vivo el mismo día.

## 1. Tráfico real (Cloudflare, 30 días)

| Métrica | Valor |
| --- | --- |
| Peticiones | 15.860 |
| Vistas de página | 3.778 |
| Visitantes únicos (suma diaria) | 1.642 |
| Tráfico servido | 100 MB |
| Peticiones bloqueadas por seguridad | 387 |

Lectura honesta: el sitio se publicó el 3 de noviembre, así que casi todo el histórico es una
semana. De las peticiones HTML de los últimos 7 días, 2.170 declaran un navegador normal y 458 se
identifican como bot, pero **1.700 de esas 2.170 van a la portada**: es el patrón de escáneres,
previsualizadores y comprobadores de disponibilidad, no de lectores. La audiencia real estimada es
de unos cientos de páginas por semana, concentradas en portada, `/oros/`, la guía de bruto a neto y
las calculadoras.

Ruido que no es tráfico: 3.782 respuestas 404 en 7 días sobre 400 rutas distintas (`/wp-admin/`,
`/wp-login.php`, puertos de cPanel) y 1.106 respuestas 504 generadas por un cliente que escanea
puertos y hosts inexistentes. El sitio es estático y responde en ~40 ms; esos 504 no son fallos del
sitio y no se pueden purgar sin permisos de WAF.

Rastreadores de IA ya presentes en la última semana: Applebot (47), ClaudeBot (27), OAI-SearchBot
(9). No hay datos de Google Search Console ni de Bing Webmaster Tools, así que **no se puede medir
el tráfico orgánico**: el dominio no aparece todavía en Bing ni tiene capturas en Common Crawl.

## 2. Lo que estaba mal y se ha corregido

### 2.1 Veracidad para agentes (lo más grave)

- **`llms.txt` decía que el dominio «no está registrado» y pedía no citarlo.** Era falso y
  contraproducente: la única instrucción explícita del archivo era no usar la fuente. Reescrito
  desde las colecciones, con canónico, política de uso, recuentos, fechas y descripciones reales.
- **`public/robots.txt` anulaba la política del código.** El `robots.txt` servido tenía 103 bytes sin
  mención a IA. Ahora hay una sola fuente (`src/pages/robots.txt.ts`) con `Content-Signal`
  (`search=yes, ai-input=yes, ai-train=no`), agentes de respuesta permitidos por nombre
  (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, Claude-User, PerplexityBot/User) y rastreadores de
  entrenamiento denegados.
- **`www` servía 200 duplicado.** Ahora 301 al ápice mediante Page Rule de Cloudflare (no cabe en
  `_redirects`, que solo actúa sobre rutas).

### 2.2 Descubrimiento

- **No había feed.** Nuevo `/rss.xml` (guías y vídeos por fecha) y `<link rel="alternate">` en todas
  las páginas.
- **`/sitemap.xml` daba 404.** Ahora 301 a `/sitemap-index.xml`; `/feed.xml` y `/feed` también.
- **`/llms-full.txt` no existía.** Nuevo endpoint con el corpus completo en Markdown (~174 KB),
  generado en el build desde las colecciones, con fuentes y jerarquía de encabezados corregida.
- **Sin `favicon.ico`.** Generado desde la marca, más `apple-touch-icon.png`.

### 2.3 Datos estructurados

- **`Organization` solo existía en la portada:** 61 páginas referenciaban un `@id` inexistente. Ahora
  se inyecta una sola vez en el punto común y ninguna referencia queda colgante.
- **`Article` sin `image`:** las 8 guías no eran elegibles para rich result. Añadida.
- **`VideoObject.contentUrl` apuntaba a la ficha HTML.** Ahora apunta al vídeo de YouTube y declara
  `width`/`height` del póster. `author` con URL y `publisher` como referencia.
- **`dateModified` anterior a `datePublished`** en fichas revisadas antes de publicarse: ya no se
  emite una fecha imposible.

### 2.4 Imágenes

- **7 recursos 404 en producción**, dos de ellos `og:image` y `thumbnailUrl`: tarjetas sociales sin
  imagen. Regenerados los pósters que faltaban y las 9 variantes de 320 px.
- **Causa de fondo:** `/assets/*` se sirve con caché inmutable de un año. Un asset pedido antes de
  existir dejaba el 404 pegado un año, y reemplazar un póster no llegaba a nadie. Ahora las
  miniaturas llevan `?v=<fecha del fichero>`, calculado en el build.

### 2.5 Estructura y contenido

- **`h2` idéntico al `h1` en 21 páginas** (el Markdown repetía el título): eliminado del cuerpo; el
  título se renderiza una sola vez desde el frontmatter.
- **Fichas de vídeo y de herramienta sin `<article>`**: envueltas.
- **Dos `<nav aria-label="Principal">`** en la misma página: el móvil pasa a «Principal (móvil)».
- **`/sobre-4-sotas/` era un folleto de 1.200 caracteres sin un solo `h2`.** Reescrita con qué se
  publica, qué no se hace, quién escribe y revisa, cómo se corrige y por dónde empezar.
- **Títulos:** se usa `seo.titulo` y el sufijo de sección se compone en el layout. Ningún `<title>`
  pasa de 65 caracteres ni se corta con puntos suspensivos.
- **Catálogos JSON:** `videos.json` no exponía `privacidad_api` (el campo que gobierna la
  publicación) y el glosario no tenía catálogo. Añadidos ambos; `schema_version` sube a 1.1.0.

### 2.6 Accesibilidad y responsive (medido en navegador real)

- axe-core sin violaciones en portada, guía, calculadora, glosario, videoteca, temas y 404, salvo
  `label-content-name-mismatch` en 22 portadas de vídeo (aria-label que no contenía el texto
  visible). Corregido con texto oculto en lugar de `aria-label`.
- Sin desbordamiento horizontal en 360, 390, 768, 1024, 1440 y 1920 px.
- Ningún texto de cuerpo por debajo de 14 px; ningún control de tamaño insuficiente en móvil.
- Las tablas anchas de las calculadoras siguen siendo desplazables dentro de su contenedor.

## 3. Rendimiento

- 63 páginas estáticas, 0 JS de framework, CSS propio. En móvil emulado con red lenta: 7 peticiones y
  ~80 KB en portada, TTFB ~40 ms, CLS 0, sin tareas largas.
- Presupuesto que conviene vigilar: el CSS global ronda los 67 KB sin comprimir para 10 hojas
  acumuladas (`global`, `plantillas`, `v2`, `v2-1`). No es un problema hoy; sí es deuda si se sigue
  añadiendo capa sobre capa.

## 4. Pendiente (necesita decisión o acceso)

1. **Search Console y Bing Webmaster Tools.** Sin verificar propiedad no hay datos de búsqueda ni se
   puede pedir indexación. IndexNow ya se ha avisado con las 62 URLs (`scripts/indexnow.py`), y la
   portada está guardada por primera vez en Wayback.
2. **Purga de caché y WAF.** El token de Cloudflare no incluye `purge_cache` ni reglas de firewall:
   si vuelve a quedar un 404 cacheado o entra una oleada de escaneo, hay que hacerlo a mano.
3. **`<lastmod>` en el sitemap.** Útil pero no crítico; exige mapear cada URL a su fecha de revisión
   en el build.
4. **Imágenes de artículo por guía.** Hoy todas comparten la tarjeta genérica 1200×630.
5. **Autoría ampliada** (`/autor/marc-villarroya/`) si se quiere reforzar E-E-A-T con `sameAs` y
   credenciales verificadas.
