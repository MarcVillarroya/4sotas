# QA independiente · verificación de la revisión factual y de la publicación

Ejecutado: **2026-10-26** (segunda pasada, rol `qa-reviewer`, no autor de la revisión).
Objeto: comprobar que la revisión factual de `qa/f1-revision/REVISION-FACTUAL.md` es real y que
el paso a `publicado` no publica nada sin respaldo. Rama `wt/t_13d5dbeb`, commit `681cf45`.

## 1. Cadena re-ejecutada por QA (no se acepta la salida del autor)

| comando | resultado real |
|---|---|
| `npm run check` | 52 files · 0 errors · 0 warnings · 0 hints |
| `npm test` | 116 tests · 116 pass · 0 fail |
| `npm run build` | 47 page(s) built |
| `npm run validate` | ok · **0 bloqueantes** · 1 aviso (`W-VIDEO-SIN-FICHA`, intencional) · dist 47 html / 46 urls |
| `npm run build:fixtures` | 52 page(s) built |
| `npm run verificar:plantillas` | ok · 13 comprobaciones · 0 fallos |
| `npm run publicacion:pendiente` | contenido 45 · publicadas 39 · sin publicar 6 · sin metadata pendiente 0 |

Aviso único del validador: `W-VIDEO-SIN-FICHA audit/inventory.json: vídeo público sin ficha en el
sitio: LL1EJttJPrs` — declarado intencional en §6 del informe; no es un fallo de publicación.

## 2. Coherencia de catálogos, llms.txt y HTML publicado

Recuento sobre `dist/` recién construido, contra lo que declara `/llms.txt`:

| bloque | páginas de detalle en `dist/oros/…` | `/data/*.json` | `/llms.txt` |
|---|---|---|---|
| temas | 7 | `topics.json` 7 | «7 temas troncales» |
| guías | 8 | `catalog.json` 8 | «8 guías publicadas» |
| glosario | 12 | (en catalog) | «12 términos» |
| vídeos | 11 | `videos.json` 11 | «11 vídeos» |
| herramientas | 1 | `tools.json` 1 | «1 herramientas locales» |

Cero apariciones de `example.org` o `fixture` en `dist/` ni en `dist/data/*.json`:
los 6 borradores del banco de pruebas no se filtran.

## 3. Contraste independiente de las cifras que el propio autor no pudo cachear

`check_claims.py` deja 10 afirmaciones con cifras «no localizadas» en el texto descargado. Tres son
identificadores o fechas, no cifras publicadas (art. 96.3 LIRPF, RDL 23/2026, Garber 1989,
27-jun-2025, 30-sep-2026). Las de `tema-burbujas` sí son cifras publicadas y se han verificado en
esta pasada contra las series originales, en vivo:

| dato publicado | fuente re-consultada ahora | valor real |
|---|---|---|
| Nasdaq 751,96 el 30-dic-1994 | FRED `NASDAQCOM` CSV | `1994-12-30, 751.960` ✔ |
| Nasdaq 5.048,62 el 10-mar-2000 | FRED `NASDAQCOM` CSV | `2000-03-10, 5048.620` ✔ |
| Nasdaq 1.114,11 el 9-oct-2002 | FRED `NASDAQCOM` CSV | `2002-10-09, 1114.110` ✔ |
| S&P 500 1.565,15 el 9-oct-2007 | Yahoo `^GSPC` diario | `2007-10-09, 1565.15` ✔ |
| S&P 500 676,53 el 9-mar-2009 | Yahoo `^GSPC` diario | `2009-03-09, 676.53` ✔ |

Porcentajes del cuerpo recalculados: +571,4 % (5048.62/751.96), −77,9 % (1114.11/5048.62),
+353 % (5048.62/1114.11), −56,8 % (676.53/1565.15). Los cuatro coinciden con el texto.

## 4. Recálculo reproducible de las cifras `[cálculo]`

`python3 qa/f1-revision/verify-vivienda.py` y `verify-dca.py` se han vuelto a ejecutar: todas las
cifras que el informe declara (cuotas 836,14 / 948,42 / 843,21 / 954,83 / 832,51 / 759,86 / 929,89,
intereses 80.090,78 / 84.526,79 / 103.554,90 / 143.739,01 / 13.806,01, DCA 81.160,90 / 244.612,77 /
12.272,58 / 65.370,89 / 1.628,89 / 2.653,30, tipo mensual 0,407412 %) se reproducen dígito a dígito.
Las cifras de cuerpo que `check_body.py` marca como «no localizadas» son, en su totalidad,
resultados de `[cálculo]`, que por definición no están en la fuente: no hay ninguna cifra de fuente
publicada sin respaldo.

## 5. Metadatos de publicación

- 39 entradas con `status: publicado` y `revisado_factual: 2026-10-26` (fecha real de la sesión,
  comprobada con `date -I`); ninguna otra fecha.
- 39 con `autorias.revisor: aut-revision-factual-qa`, entrada de autor existente y descrita.
- `publicacion:pendiente` → «sin metadata pendiente 0»: no queda entrada publicada sin
  `seo.descripcion`.
- 6 restantes (`tema/art/glo/glo-dos/herr/ser`-fixture y `src-fixture-demo`) siguen en borrador.

## 6. Observaciones (no bloqueantes)

1. **Node del sistema insuficiente para el build.** `npm run build` con `/usr/bin/node` (v22.23.3)
   aborta con `Node.js v22.23.3 is not supported by Astro! Please upgrade … ">=22.23.4"`. Con
   `/home/mvf/.hermes/tools/node-26.7.0-linux-x64/bin` el build sale verde. Cualquier CI o shell que
   use el Node del sistema romperá el gate sin que el contenido tenga nada que ver.
2. `architecture`/informe citaban 51 ficheros en `npm run check`; el número real es 52 (corregido en
   `REVISION-FACTUAL.md` §8).
3. La caché de fuentes (`qa/f1-revision/cache/`, 86 ficheros) está en `.gitignore`: los informes se
   pueden auditar pero no se reproducen sin re-ejecutar `fetch_sources.py` (requiere red).
4. Decisión abierta §7 del informe: el revisor registrado es una entrada no personal. Es honesto y
   no bloquea la publicación; si Marc quiere un revisor humano con nombre, se cambia el autor y
   `autorias.revisor` en las entradas de sensibilidad alta.

## Veredicto

**PASS.** La revisión factual existió, es reproducible en sus cálculos, las cifras de fuente
publicadas están verificadas (las que no se podían cachear se han verificado ahora en vivo), los
catálogos y `/llms.txt` reflejan exactamente lo publicado (7 / 8 / 12 / 11 / 1) y el validador da
0 bloqueantes con un aviso intencional declarado.
