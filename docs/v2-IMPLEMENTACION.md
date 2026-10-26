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
