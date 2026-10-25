# F1 · Plantillas editoriales y watch pages — verificación

Fecha: 26-oct-2026 · card `t_7644686c` · worktree `wt/t_7644686c`
Rama: `wt/t_7644686c` · base de partida: `138b50e`

## Qué se ha implementado

| ruta | plantilla | fuentes de datos |
|---|---|---|
| `/oros/temas/` | índice en `orden` editorial | `temas` |
| `/oros/temas/<slug>/` | introducción, mapa, orden recomendado, herramientas, relacionados | `temas` + referencias |
| `/oros/guias/` | índice por `publicado` desc | `articulos` |
| `/oros/guias/<slug>/` | respuesta corta, cuerpo, índice lateral, supuestos, tabla de fuentes, relacionados, preguntas | `articulos`, `fuentes`, `autores` |
| `/oros/videos/` | catálogo con miniatura diferida, sin iframes | `videos` públicas |
| `/oros/videos/<slug>/` | watch page con facade, resumen propio, metadata real, relacionados, `VideoObject` | `videos` |
| `/oros/glosario/` | glosario por letra + `DefinedTermSet` | `glosario` |
| `/oros/glosario/<slug>/` | término, ejemplo, vecinos, guías que lo usan | `glosario` |
| `/oros/herramientas/` | índice con estado real de cada herramienta | `herramientas` |
| `/oros/herramientas/<slug>/` | metodología: fórmula, parámetros, supuestos, límites, revisión | `herramientas` |
| `/404.html` | 404 útil con 5 destinos reales | rutas existentes |

Librería nueva: `src/lib/migas.ts` (migas + `BreadcrumbList` desde una lista),
`src/lib/format.ts` (fechas UTC, duraciones ISO, marcas de tiempo).
Ampliada: `rutas.ts` (constructoras tipadas `ruta.*`, `embedYouTube`, `verEnYouTube`),
`publicacion.ts` (`visibles`, `idRef`, `resolver`), `jsonld.ts` (`migas`, `lista`, `articulo`,
`videoObjeto`, `conjuntoTerminos`, `terminoDefinido`, `aplicacionSoftware`, `grafo`).
Componentes: `Breadcrumbs.astro`, `FacadeVideo.astro`. Layout: `Herramienta.astro`.
Estilos nuevos aislados en `src/styles/plantillas.css` (no se toca el sistema F0 vendoreado).

## Fixtures

Ocho ficheros, todos `status: borrador`, con `fixture` en `id`/`slug` y texto que se declara de prueba:
`tema-fixture-demo`, `art-fixture-demo` (guía), `vid-M9EhU06FlUA` (id real del inventario, título
idéntico al de la API), `glo-fixture-demo`, `glo-fixture-demo-dos`, `ser-fixture-demo`,
`herr-fixture-metodologia`, `src-fixture-demo`.

El único interruptor es `PUBLIC_FIXTURES=1`, que solo activa `npm run build:fixtures` (salida
`dist-fixtures/`, ignorada por git). En el build público `visibles()` es idéntico a `publicados()`.

## Comandos ejecutados y salida real

```
npm run check                → Result (38 files): 0 errors, 0 warnings, 0 hints
npm test                     → ℹ tests 59 · pass 59 · fail 0
npm run build                → 8 page(s) built · sitemap-index.xml
npm run build:fixtures       → 14 page(s) built · sitemap-index.xml
npm run verificar:plantillas → ok · 13 comprobaciones correctas · 0 fallos
npm run validate             → ok · 0 bloqueantes · 11 avisos
```

Páginas del build público (8): `/`, `/oros/`, `/oros/temas/`, `/oros/guias/`, `/oros/videos/`,
`/oros/glosario/`, `/oros/herramientas/`, `/404.html` + `robots.txt` + sitemap.

Páginas añadidas por el build de fixtures (6): `/oros/temas/tema-fixture-demo/`,
`/oros/guias/guia-fixture-demo/`, `/oros/videos/video-fixture-demo/`,
`/oros/glosario/termino-fixture-demo/`, `/oros/glosario/segundo-termino-fixture/`,
`/oros/herramientas/herramienta-fixture-demo/`.

Los 11 avisos de `validate` son `W-VIDEO-SIN-FICHA` (vídeos públicos del inventario sin ficha en el
sitio): estado real, no un fallo de esta card.

## Evidencia de las tres restricciones duras

1. **Aislamiento de borradores.** `verificar-plantillas` comprueba por separado que ninguna de las 6
   rutas de detalle en borrador existe en `dist/` y que las 6 existen en `dist-fixtures/`:
   `build público: 6 entradas no publicadas comprobadas, 0 con página` y
   `build de fixtures: 6/6 plantillas con borrador renderizadas`.
2. **Sin iframes en listados.** `0 iframes` en las 14 páginas del build de fixtures (medido en DOM con
   Chromium y sobre el HTML). La watch page inserta el iframe `youtube-nocookie` solo tras pulsar el
   botón; sin JS queda el enlace directo a YouTube.
3. **JSON-LD válido y coherente con el texto visible.** Cada página emite exactamente un bloque
   parseable; de cada uno se verifica: `@context`, tipo esperado por plantilla, `BreadcrumbList` cuya
   última miga es la canónica y cuyos nombres aparecen en el texto visible, `VideoObject` con
   `name/description/thumbnailUrl/uploadDate/duration/embedUrl/contentUrl` y `contentUrl` = watch page,
   `Article` con autor y editor, `DefinedTerm` dentro de su `DefinedTermSet`,
   `SoftwareApplication` solo en herramientas que calculan y con `price: "0"`. Sin `aggregateRating`,
   `review` ni `4sotas.com`.

Medidas de navegador (Chromium 1.56, 1440 y 390 px, 22 capturas): `h1 = 1` en todas, `iframe = 0`,
sin overflow horizontal, cero errores de consola, cero peticiones externas salvo la miniatura
diferida del catálogo (`i.ytimg.com`, imagen, no JS). Sistema visual aplicado en las 11 plantillas
(fondo `rgb(11,21,38)`, h1 en `Archivo Black`).
Capturas: `/home/mvf/4sotas/qa/f1-plantillas/screenshots/` (`medidas.json` con los datos por página).

Base path independiente: `SITE_ORIGIN=https://example.org SITE_BASE=/` genera las 14 páginas con
canónicas `https://example.org/...` y sin ninguna ruta `/4sotas` (las 22 coincidencias del grep son
el nombre de fichero `4sotas.png` del OG).

## Decisiones y desviaciones

- **`/oros/herramientas/` existe** aunque `ROUTES.md` §3 lo aplazaba: esta card pide índice de
  herramientas y su estado vacío honesto. Con 0 herramientas publicadas la página declara el estado
  y no enlaza nada.
- **Series**: no se crean páginas de serie. `ROUTES.md` §2 las condiciona a que haya una serie
  publicada y no entrará ninguna en V1; el fixture `ser-fixture-demo` sirve para probar la referencia
  artículo→serie, y `verificar-plantillas` excluye `series` de la comprobación de rutas por ese motivo.
- **Miniaturas del catálogo**: se usa la URL real de la API con `loading="lazy"`,
  `referrerpolicy="no-referrer"` y dimensiones fijas; si existe `miniatura_local`, gana la local.
  Cero iframes y cero JS de terceros.
- **`Article` sin fechas en borradores**: si la entrada no tiene `publicado`, el JSON-LD no declara
  `datePublished` en lugar de inventarlo.
- **Numericación del mapa de tema y del índice de guía**: derivada de lo que la página contiene.

## Hallazgo que no es de esta card

`B-DRAFT-EN-DIST` del validador canónico (`scripts/validate-content.mjs`, copiado byte-idéntico de
`architecture/`) es un **check muerto**: el set de rutas de salida pierde la barra final, así que
`rutas.has('/oros/temas/x/')` es siempre `false`. Comprobado: el validador da `ok · 0 bloqueantes`
sobre `dist-fixtures`, que contiene 6 páginas de borradores. Reportado en la card `t_e10fce1f`
(`staff-engineer`). El aislamiento de borradores de esta card se verifica con
`npm run verificar:plantillas`, que no depende de ese check.

## Riesgo abierto

- El contenido sigue siendo fixture: la sustitución por guías/temas revisados es la card de
  ensamblado (`t_89e4e004`). Cuando llegue contenido real con `status: revision`, los índices seguirán
  en estado vacío honesto hasta que se publique con revisión factual.
- La calculadora debe usar `layouts/Herramienta.astro` con `calcula={true}` y su propia ruta fija;
  `pages/oros/herramientas/[slug].astro` excluye `interes-compuesto` para no duplicar la ruta.
