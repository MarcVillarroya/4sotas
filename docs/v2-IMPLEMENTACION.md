# Implementación V2-D · shell y portadas

## Alcance y decisiones

- Rama solicitada `v2` en `/home/mvf/4sotas/site`; no se modifica main ni se publica. Se mantiene el directorio explícito de la card: no se cambia la rama compartida a un worktree alternativo. Las cards E/F esperan esta dependencia.
- `src/styles/v2.css` adapta los tokens de `v2/design/tokens-v2.css` a las plantillas vigentes. No se importa a ciegas: `--ink` significa texto claro en V1, pero fondo oscuro en el documento de diseño; `--border` es un shorthand legacy, no un color. Se conservan ambos contratos y se usan `--text`, `--bg`, `--border-color`, superficies, espacios y escalas V2. Fuentes locales existentes y licencias intactas.
- Assets originales SVG del pack en `public/assets/v2/`: atlas en Home, Sota que explica en Oros, cuatro emblemas e iconos temáticos. Sin texto esencial dentro de ilustraciones. No se incorporan snapshot/catalog-snapshot.json ni listas editoriales del prototipo como datos de producción.
- Navegación definitiva: Inicio, Sota de Oros, Vídeos, Herramientas, Glosario. Temas y Guías conservan sus rutas y se descubren en Oros y los módulos. Canal explícito siempre fuera del menú. `aria-current=page` solo en ruta exacta; sección contextual en desktop sin falsear página actual.
- Menú móvil nativo `details` en flujo, sin JS imprescindible; Escape es mejora progresiva y devuelve foco al summary. Sin overlay, trap de foco ni header sticky. El cambio a menú se adelanta a 1000 px para no comprimir etiquetas.
- Palos futuros: texto «Próximamente», sin enlace, botón ni aria-disabled ficticio.
- `src/lib/portadas.ts` selecciona solo entradas publicadas. Vídeos además exigen `estado_youtube=publico` y `privacidad_api=public`; destacado = más reciente, recientes = primeros tres por `publicado_en`, desempate por id. La portada no introduce clasificación Short/Largo: corresponde a E y su card gobierna el umbral.
- Guías iniciales = primeras tres con `destacado`, ordenadas por fecha. Recuentos de temas = guías y vídeos públicos, cada entidad una vez aunque repita referencia. Siete temas reales, incluido Burbujas y pánicos sin guía pero con vídeo. Glosario = hasta seis términos públicos referenciados por las guías iniciales, orden alfabético; no una lista manual de «útiles».
- `PortadaModulos.astro` comparte selección y piezas entre Home y Oros: destacado real, banda teal de calculadora, lista numerada de tres guías, tres vídeos recientes y CTA al canal. Composiciones de revista/mapa/lista/banda, no panel universal.
- Orden Oros: hero, temas, destacado, calculadora, guías, vídeos, canal, glosario y límites. Se sigue el orden editorial de COPY cuando difiere del prototipo. En ambos heroes los CTA preceden al arte en móvil.
- Miniaturas nuevas de portada usan `miniatura_local` cuando existe, con fallback hqdefault real, no maxres. E generará WebP/srcset y retirará peticiones externas. No se modifica la ficha, catálogo ni motor financiero en D.
- Se crean las páginas reales Sobre, Metodología y Privacidad con el copy editorial disponible. No se inventan titular, NIF, domicilio, correo ni aviso legal. Privacidad corrige dos afirmaciones incorrectas del borrador: una miniatura externa sí contacta YouTube antes de pulsar; youtube-nocookie no implica ausencia de tratamiento de datos. También se reconoce infraestructura GitHub Pages y sus registros técnicos. No se presenta como aviso legal completo.
- Rutas previas, canonical, grafos JSON-LD, sitemap, catálogos y estados de publicación se mantienen; tres páginas institucionales añadidas al sitemap automáticamente. No se modifica contenido de colecciones.

## Archivos principales

- `src/components/Header.astro`, `Footer.astro`, `PortadaModulos.astro`.
- `src/layouts/Base.astro`, `src/styles/v2.css`, `src/lib/portadas.ts`.
- `src/pages/index.astro`, `src/pages/oros/index.astro`.
- `src/pages/sobre-4-sotas.astro`, `metodologia.astro`, `privacidad.astro`.
- `public/assets/v2/*.svg` (23 originales del pack de diseño).
- `tests/portadas.test.ts`, `scripts/qa-v2-d.mjs`.
- Evidencias `qa/v2-d/report.json` y cuatro PNG Home/Oros 1440/390.
- Copia versionada de este handoff: `site/docs/v2-IMPLEMENTACION.md` (el directorio externo v2 no pertenece al repo Git site).

## Validación ejecutada

- `npm run check`: 0 errores, 0 warnings, 5 hints preexistentes en scripts QA antiguos.
- `npm test`: 122/122 OK; cuatro nuevos tests de selección pública, destacados, recuentos y vacío.
- `npm run build`: 50 HTML, incluyendo 404; sitemap con 49 URL.
- `npm run validate`: 0 bloqueantes, 1 aviso previo W-VIDEO-SIN-FICHA para LL1EJttJPrs (GTA, fuera del catálogo educativo). No se añade ficha.
- `node scripts/qa-v2-d.mjs`: Chromium 156.0.8078.4; 8 vistas Home/Oros a 1440/768/390/320; 65 checks/interacciones; 0 fallos; 0 violaciones axe (WCAG A/AA, 2.1/2.2), imágenes completas, un H1, sin overflow, canonical y JSON-LD presentes. Otros 12 recorridos de regresión (seis páginas a 1440/390: institucionales, catálogo, guía y calculadora) validan HTTP, overflow y axe.
- Recorridos de clic real con JavaScript desactivado, escritorio y móvil: Home a Oros = 1; Home a Vídeos = 1; Home a ficha = 1 por destacado; Oros a calculadora = 1. Menú abre con Enter sin JS; canal visible en header y enlace en footer. Escape y devolución de foco comprobados con JS.
- Capturas completas: `qa/v2-d/home-1440.png`, `home-390.png`, `oros-1440.png`, `oros-390.png`. Inspección visual adicional mediante navegador; se corrigieron corte de «instrucciones», marcos legacy sobrepuestos y padding heredado de details.
- QA usa Playwright/axe ya instalados en `../design/qa`; ruta alternativa mediante `QA_PACKAGE=/ruta/package.json`. No añade dependencias runtime al sitio.
- `git diff --check`: OK.

## Límites y siguiente fase

- Solo Chromium; sin Safari, Firefox ni lector de pantalla. axe no demuestra accesibilidad completa. Capturas no equivalen a aprobación del arte por el propietario.
- Ficha O1V9_of7g1w conserva su fallo conocido en V1 hasta que E implemente estado no insertable; esta card no prueba reproducción ni lo declara resuelto.
- E: miniaturas locales WebP 640/320, srcset, catálogo/ficha/fachada y privacidad tras esa migración. `PortadaModulos` ya consume `miniatura_local`; añadir srcset allí cuando existan variantes reales.
- F: calculadora y relaciones editoriales, según sus cards. El motor no cambia aquí.
- Pendientes del propietario: datos legales y aprobación del arte. No bloquean una integración local sin publicar.
- Node foreground es 26.7.0. La shell background resolvió inicialmente Node 22.23.3, rechazado por Astro; preview se ejecutó con Node 26 explícito y `node_modules/.bin/astro`. Intento de ruta antigua `astro/astro.js` no existe en Astro 7; sin impacto en build/tests.

# Implementación V2-E · videoteca, ficha, miniaturas y SEO de vídeo

## Alcance y decisiones

- Rama `v2` en `/home/mvf/4sotas/site`; sin tocar `main`, sin publicar.
- **Hub `/oros/videos/`**: cabecera con CTA al canal, portada del vídeo más reciente, cola con los tres siguientes y catálogo completo. Filtros Todos · Shorts · Largos con recuento derivado y filtro por tema (solo aparecen temas que tienen vídeo). Los filtros son mejora progresiva: sin JavaScript se muestra el catálogo completo y la barra queda oculta. Cero iframes en el listado; cero peticiones a `i.ytimg.com`.
- **Segmento editorial derivado de la duración real**: `duracion_iso` de la API → segundos; Short ≤ 60 s, Largo > 60 s. Con el catálogo actual: 7 Shorts (53, 51, 59, 60, 60, 56 y 55 s) y 4 Largos (63, 65, 590 y 813 s) — el rótulo no afirma cómo clasifica YouTube la pieza. `src/lib/videos.ts` es la única fuente de la regla.
- **Ficha**: cabecera de pieza (formato · reloj · tema, título, fecha), escenario 16:9 con fachada, dos acciones igual de visibles («Reproducir aquí» primaria y «Ver en YouTube» secundaria en la misma fila) y rail lateral con la primera continuación real. Sin jerga de proceso: fuera «Ficha contrastada con la API», «Estado en YouTube» y «verificado». Sustituido por una línea editorial de última revisión y fuente de los datos.
- **Caso no insertable `O1V9_of7g1w`**: se declara en la ficha con `insercion: deshabilitada`; la página no ofrece un botón que sabemos que falla, muestra el aviso y convierte «Ver en YouTube» en la acción principal. El vídeo sigue en el catálogo.
- **«Sigue aprendiendo»**: tarjetas derivadas de referencias reales del contenido — guías publicadas cuyo campo `videos` cita esta pieza, calculadora publicada que comparte tema y vídeos de `relacionados`. Nada por etiqueta amplia ni por ranking.
- **Miniaturas**: 11 `maxresdefault.jpg` reales descargadas y convertidas a WebP con ffmpeg (`libwebp`): 640×360 en `public/assets/videos/<youtube_id>.webp` y 320×180 en `<youtube_id>-320.webp`. `miniatura_local` actualizada en las 11 fichas; `srcset` + `sizes` en listado, portada y home. El regex de `rutaAsset` admite mayúsculas para no renombrar los IDs reales.
- **SEO de vídeo**: VideoObject mantiene `name`, `description`, `thumbnailUrl` (absoluta de este sitio + la real de YouTube), `uploadDate`, `duration`, `embedUrl`, y ahora `contentUrl` = URL de YouTube y `dateModified` = última revisión editorial. Título y descripción son visibles en la página y el enlace directo no depende de JS.
- Rutas, canonical, sitemap, JSON-LD y tests conservados.

## Prueba de inserción de `O1V9_of7g1w` (26/10/2026)

- `GET https://www.youtube.com/oembed?url=...O1V9_of7g1w&format=json` → **HTTP 401**; el mismo oEmbed para `M9EhU06FlUA` (control) devuelve **200** con título y autor. 401 en oEmbed es la señal de inserción deshabilitada por el propietario.
- `https://www.youtube-nocookie.com/embed/O1V9_of7g1w` en Chromium headless (Playwright) devuelve HTTP 200 con el reproductor en **«Error 153 · Error de configuración del reproductor»**; el control `M9EhU06FlUA` da el mismo Error 153 en ese entorno, así que el iframe headless **no discrimina** entre piezas. Conclusión: se decide por oEmbed y se documenta el iframe como prueba no concluyente.
- Consecuencia implementada: `insercion: deshabilitada` en la ficha, aviso visible y YouTube como acción principal. No se declara que la reproducción esté resuelta.

## Medidas de peso (miniaturas del hub)

| Concepto | Antes (V1/V2-D) | Después (V2-E) | Diferencia |
|---|---:|---:|---:|
| 11 miniaturas del listado | 2.032.129 B (`maxresdefault.jpg` 1280×720) | 389.608 B (WebP 640×360) | −1.642.521 B (−80,8 %) |
| Variante móvil | — | 135.872 B (WebP 320×180) | disponible en `srcset` |
| Peticiones a `i.ytimg.com` en el hub | 11 | 0 | −11 |
| Bytes de miniaturas medidas en Chromium | 2.035.429 B (auditoría V2) | 389.608 B (11 respuestas) | −80,9 % |

El navegador elige 640 w en la mayoría de viewports (slot de 406 px a 1440 y 332 px a 390 con DPR 1–3); la variante de 320 existe para slots de 320 px o menos y no se sirve de más.

## Archivos

- `src/lib/videos.ts` (nuevo): segundos, umbral Short, reloj, rutas de miniatura y `srcset`.
- `src/components/FacadeVideo.astro`: escenario 16:9, aviso, dos acciones, fachada y fallback.
- `src/pages/oros/videos/index.astro`, `src/pages/oros/videos/[slug].astro`.
- `src/components/PortadaModulos.astro` (miniaturas locales con `srcset`).
- `src/styles/v2.css` (bloque V2-E), `src/content.config.ts` (`insercion`, ruta de asset con mayúsculas).
- `src/content/videos/*.yaml` (11 fichas: `miniatura_local`; `O1V9_of7g1w`: `insercion: deshabilitada`).
- `public/assets/videos/*.webp` (22 archivos, dos variantes por pieza).
- `src/lib/jsonld.ts` (`contentUrl`, `revisadoISO`).
- `tests/videos.test.ts` (7 tests nuevos), `scripts/qa-v2-e.mjs`.
- Evidencias: `qa/v2-e/report.json`, `qa/v2-e/{hub,ficha-insertable,ficha-no-insertable}-{1440,768,390,320}.png`.

## Validación ejecutada

- `npm run check`: 0 errores, 0 warnings, 5 hints preexistentes.
- `npm test`: 129/129 OK (7 nuevos de duración, segmento, miniaturas y VideoObject).
- `npm run build`: 50 HTML.
- `npm run validate`: 0 bloqueantes, 1 aviso previo `W-VIDEO-SIN-FICHA` (`LL1EJttJPrs`, GTA VI, fuera del catálogo educativo).
- `node scripts/qa-v2-e.mjs`: Chromium 156.0.8078.4; 12 vistas (hub, ficha insertable y ficha no insertable a 1440/768/390/320); 202 checks; 0 fallos; 0 violaciones axe (wcag2a/2aa/21aa/22aa); sin overflow; un H1; imágenes completas; 0 `i.ytimg.com`; 0 iframes antes del clic; filtros Short=7, Largo=4, tema banca=1, estado vacío y «Quitar filtros»; iframe creado solo tras pulsar «Reproducir aquí»; sin JS el catálogo muestra 11 tarjetas y el enlace directo de la ficha funciona; 0 peticiones de terceros al abrir una ficha.
- `git diff --check`: OK.

## Límites honestos

- La fachada **no garantiza indexabilidad ni reproducción**: el iframe solo se crea tras el clic y el sitio no puede leer el resultado del reproductor de YouTube (cross-origin). Si YouTube muestra un error dentro del iframe, la página no lo detecta; el fallback solo cubre el fallo de carga del propio iframe (timeout 12 s o evento `error`).
- `embedUrl` se mantiene en VideoObject para las 11 piezas por coherencia del modelo; en `O1V9_of7g1w` la página no ofrece inserción y así se explica al visitante. No se afirma que ese vídeo sea reproducible embebido.
- Solo Chromium; sin Safari/Firefox ni lector de pantalla. axe no demuestra accesibilidad completa.
- Las capturas no equivalen a aprobación del arte por el propietario. Sin push ni despliegue.
