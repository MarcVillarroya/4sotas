# 4 Sotas · F1 · QA visual

Resultado: PASS visual de la implementación local. No es autorización de publicación editorial ni GO de despliegue.

## Alcance y procedencia

- Tarea `t_455d6972`, rama `wt/t_455d6972`, worktree `/home/mvf/4sotas/site/.worktrees/t_455d6972`.
- Base inicial de la tarea: scaffold `138b50e`. Fast-forward al ensamblado padre `1bbbae8` antes de tomar el baseline. No se han creado commits ni publicado cambios.
- Referencia contrastada: `/home/mvf/4sotas/design/DESIGN-SYSTEM.md`, tokens, mockups y capturas F0.
- Chromium real con Playwright y axe del toolkit F0, fuentes locales cargadas y red externa bloqueada durante la matriz.
- Las fichas reales están en revisión. Para ver las seis tipologías se usa exclusivamente `npm run build:fixtures`, servido en loopback bajo `/4sotas`. Los borradores NO se han publicado. El build público sigue teniendo 8 páginas HTML.
- No se modifican `src/content/`, modelo de datos, motor financiero, fuentes ni dependencias de la aplicación.

## Matriz y evidencia

| Tipo | Ruta tras `/4sotas` | Composición conservada |
|---|---|---|
| Home paraguas | `/` | Manifiesto, naipe protagonista y friso de cuatro palos |
| Home Oros | `/oros/` | Promesa ancha, arte secundario teal y recorrido editorial |
| Tema | `/oros/temas/ahorro/` | Apertura, mapa lateral y secuencia recomendada |
| Artículo | `/oros/guias/primeros-1000-euros/` | Cabecera editorial, respuesta, índice y lectura |
| Watch | `/oros/videos/como-leer-una-nomina/` | Escenario 16:9, acompañamiento y contexto |
| Calculadora | `/oros/herramientas/interes-compuesto/` | Formulario/resultado equilibrados, tabla y metodología |

Cada tipo tiene PNG full-page a viewport 1440, 768 y 390, antes y después: 18 + 18 originales. Reflow adicional a 320 sin PNG. Los archivos `visual/{before,after}/manifest.json` registran ruta, viewport, scrollWidth, H1, fuentes, errores JS, axe y SHA-256 de cada PNG. Las capturas antes con overflow son más anchas que su viewport; no se recortó el defecto.

- `visual/{before,after}-top-{1440,768,390}.png`: seis hojas de contacto derivadas de los originales, no diseños nuevos.
- `visual/states/`: cinco capturas de foco/error/carga/recuperación/iframe de prueba y resultados UI.
- `visual/route-sweep.json`: barrido de las 52 páginas HTML de fixtures en 1440/768/390/320, 208 vistas sin overflow, con HTTP 200 y un H1.
- `visual/verification.json`: salidas completas, códigos de salida, agregación de manifests y hashes del código fuente. Comprueba los 36 hashes originales y ausencia de diff editorial.

## Hallazgos y correcciones

| Hallazgo observado | Corrección implementada | Evidencia / aceptación |
|---|---|---|
| Guía móvil desborda a 450 px; calculadora a 440 px sobre viewport 390. También fallan a 320. | `min-width:0` en hijos de grids; columnas de calculadora `minmax(0,1fr)`; wrap seguro en texto editorial. No se esconde overflow del documento. | 4 vistas con overflow antes; 0 después. Tablas conservan scroll local. |
| Tabla imponía ancho intrínseco: formulario de 262 px frente a resultado de 420 px en tablet. | Dos pistas flexibles iguales. Campos internos siguen en una columna a 768 y layout apilado ≤650. | `calculadora-768.png` antes/después; controles sin recorte. |
| H1 de Markdown repetía el de la cabecera en tema/guía. | Plugin de presentación `remark-jerarquia.mjs`: si el cuerpo contiene H1, baja un nivel todos sus encabezados, con tope H6. Conserva texto e IDs; si no hay H1 no interviene. | 8 vistas con H1 duplicado antes; ninguna después. Dos tests unitarios nuevos. |
| Prosa y secciones de watch se pegaban al bloque siguiente. | Ritmo explícito entre párrafos/títulos/secciones: 16/32/48 px según contexto, sin alturas fijas ni fuente pixel para leer. | Recortes de lectura inspeccionados y PNG full-page. |
| Las dos homes repetían escala y superficie del naipe; letras `[O/C/E/B]` no eran iconografía de palos. | Oros usa proporción 1.5/.75 y naipe secundario sobre forest. Nuevo `SuitIcon.astro`, SVG geométricos de 40 px, decorativos y sin foco. | Hojas de contacto: seis tipologías distinguibles, misma paleta, tipografía y bordes. |
| Catálogo de vídeos a 320 alcanzaba 338 px. Mínimo de tarjeta fijo y H2 sin escala de tarjeta permitían hashtags desbordados. | Mínimo de pista acotado al contenedor; H2/H3 de tarjeta comparten escala y wrap. | Barrido final: 208 vistas, 0 fallos. |
| Calculadora mantenía resultados anteriores ante entrada inválida y recalculaba mientras se escribía. | Editar retira importes/gráfico/filas y anuncia «Calcula para actualizar». Submit calcula; inválido muestra error, marca campo y enfoca primero. Aviso sin JS identifica ejemplo inicial. | Pruebas UI de edición, submit a tasa cero, inválido y sin JS. Motor sin cambios. |
| Al contener el scroll, axe detectó tabla no operable con teclado. | Región con nombre y `tabindex=0`; flecha derecha desplaza solo la tabla. | Prueba UI y axe final 0 violaciones. |
| Facade descartaba su status al crear iframe y no tenía carga recuperable. | Mensaje visible, `aria-busy`, prevención de doble clic, timeout de 12 s y reintento. Enlace directo siempre visible. Frame titulado sin autoplay, 16:9 también en móvil. | Capturas loading/error; pruebas de recuperación y frame con fixture controlada. |
| CTA sin señal pressed específica. | Active elimina sombra; hover ámbar, foco marfil 3 px exterior; disabled conserva legibilidad. | Hover/foco/reduced-motion comprobados en Chromium. |

## Revisión perceptiva y accesibilidad

Inspeccionadas las seis aperturas a los tres anchos mediante hojas de contacto antes/después, y detalles ampliados de prosa móvil, calculadora tablet y recuperación de watch. Se conserva jerarquía Archivo Black / Inter, cuerpos a 18 px, ayudas a 16 px, contraste oscuro/oro y geometría sin radios ni efectos pesados. No se ha intentado convertir la lectura en texto bitmap.

El artículo sigue siendo largo y repite su título editorial como encabezado de sección: ahora no compite como segundo H1. Se conserva ese texto porque la tarea prohíbe cambiar contenido. Índices van antes de la lectura en móvil; no se ocultan fuentes ni avisos. La altura del formulario en tablet responde al texto de ayuda real, no a relleno decorativo.

Axe WCAG A/AA/2.1/2.2: 0 violaciones en las 24 vistas finales. Es evidencia automatizada sobre esta matriz, no certificación WCAG completa. Pruebas UI reales: skip primero, destino main, foco 3 px, hover ámbar, reduced-motion sin transición/smooth-scroll, scroll de tabla por teclado, formulario con estado/error y privacidad antes de activar vídeo. `14 UI checks passed`.

## Validación final ejecutada

Todos estos comandos terminan con exit 0; salidas íntegras en `visual/verification.json`:

- `npm run check`: 58 archivos, 0 errores, 0 warnings, 0 hints.
- `npm test`: 118 tests, 118 pass, 0 fail.
- `npm run build`: 8 páginas públicas.
- `npm run build:fixtures`: 52 páginas HTML.
- `npm run verificar:plantillas`: 13 comprobaciones correctas, 0 fallos.
- Validador canónico contra `dist`: 0 bloqueantes, 1 aviso conocido `W-VIDEO-SIN-FICHA` para `LL1EJttJPrs`.
- `node scripts/visual-qa.mjs after`: 24 vistas, 18 PNG, 0 fallos.
- `node scripts/visual-states.mjs`: 14 pruebas UI correctas.
- `node scripts/visual-sweep.mjs`: 52 páginas × 4 anchos, 0 fallos.
- `git diff --check`: limpio.

Fallos intermedios resueltos: preview arrancado con Node del shell de background demasiado antiguo (se usa binario absoluto); primera comprobación de plantillas sin `dist` (se generó build público); tabla no enfocable detectada por axe; wrap del catálogo a 320 y línea vacía final de CSS. No quedan fallos visuales bloqueantes en el alcance probado.

## Reproducción

Desde este worktree, `npm ci`. Usar Node compatible (ejecución verificada con 26.7.0). El toolkit de navegador/Pillow es de QA, no dependencia web. `VISUAL_QA_PACKAGE` permite apuntar a otro package.json que tenga Playwright y @axe-core/playwright; valor local por defecto `/home/mvf/4sotas/design/qa/package.json`.

1. `npm run build:fixtures`.
2. En otra terminal: `"$(command -v node)" node_modules/astro/bin/astro.mjs preview --host 127.0.0.1 --port 4327 --outDir dist-fixtures`.
3. `/usr/bin/python3 scripts/visual-verify.py` (requiere preview ya disponible; ejecuta gates y regenera evidencia after, no baseline).
4. `VISUAL_QA_URL` permite cambiar origen/base del preview en scripts de navegador. No ejecutar fase `before` sobre código corregido: sobrescribiría la referencia.

## Límites / pendientes para QA integral

- Publicación editorial sigue bloqueada por su revisión factual (tarjeta existente `t_13d5dbeb`); fixtures no son contenido aprobado. Esta tarea no modifica ese estado.
- Las homes conservan textos de preparación y recuentos públicos a cero. En fixtures, directorios pueden tener entradas en revisión: esa diferencia es propia del modo de prueba, no señal de publicación.
- La prueba de carga de iframe usa una respuesta local controlada y lo declara en `states/results.json` y nombre `watch-loaded-fixture-390.png`. NO se verifican reproducción real, consentimiento ni disponibilidad de YouTube. Un iframe cross-origin puede disparar load con error de reproducción interno; enlace directo permanece como recuperación.
- Auditoría en Chromium local, no dispositivo físico ni Safari/Firefox. No certifica screen reader, rendimiento de producción ni exactitud de cifras.
- Astro avisa de deprecación de remarkPlugins; no rompe build. No se añade una migración de arquitectura a este ajuste visual.
- Handoff a QA integral `t_6ef580fd`. Cambios sin commit: revisar/aplicar el parche entregado, no asumir que el HEAD del repo principal contiene estos fixes.
