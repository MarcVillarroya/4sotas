# F1 · Revisión factual y paso a publicado

Revisión ejecutada: **2026-10-26** (una sola pasada, sin fechas inventadas).
Rama: `wt/t_13d5dbeb` (parte de `wt/t_89e4e004`).
Revisor registrado: `aut-revision-factual-qa` (ver §7, decisión abierta para Marc).

---

## 1. Qué se revisó y con qué método

| bloque | método | evidencia |
|---|---|---|
| 44 fichas de fuente | `curl -L` real a cada URL (UA de navegador, 25-40 s), guardando cuerpo y código | `qa/f1-revision/http-check.tsv` |
| 109 afirmaciones con cifra (`dato:`) | extracción de cada cifra y búsqueda de su secuencia de dígitos en el texto descargado de su fuente | `qa/f1-revision/claims.json` (`check_claims.py`) |
| cifras del cuerpo de los 8 artículos y 7 temas | extracción de todas las cifras y contraste con la unión de fuentes del propio fichero | `qa/f1-revision/body-claims.json` (`check_body.py`) |
| toda cifra etiquetada `[cálculo]` | recálculo independiente en Python (fórmula francesa, DCA, capitalización, escalas IRPF, inflación) | §3 |
| datos de vivienda del F0 | `calculos.py` ejecutado | §3 |

Los cuerpos descargados (PDF/HTML de terceros) se cachearon en `qa/f1-revision/cache/`, **fuera del repo** (`.gitignore`) y se borran al cerrar: se regeneran con `fetch_sources.py`.

Scripts en `qa/f1-revision/`: `check_http.py`, `fetch_sources.py`, `check_claims.py`,
`check_body.py`, `verify-vivienda.py`, `verify-dca.py`, `inventory.py`, `aplicar-publicacion.py`.

## 2. Comprobación HTTP de las URLs (44 fichas)

Resultado final (`qa/f1-revision/http-check.tsv`): **40 con 2xx · 4 sin 2xx**, todas justificadas.

| ficha | estado | lectura |
|---|---|---|
| `src-aeat-algoritmo-retenciones-2026` | 404 → **corregido a 200** | la URL usaba `Algoritmo+Retenciones…pdf`; el fichero real lleva un espacio (`Algoritmo%20Retenciones…pdf`). PDF descargado (1,1 MB) y leído: RDL 23/2026, de 8-sep, amplía la reducción del tipo a residentes en La Palma y **no** toca la escala general |
| `src-s6-01` (Nasdaq) | `000` en curl (HTTP/2 rechazado), **200 por CSV** | `fredgraph.csv` descargado desde el navegador: 751,96 (30-dic-1994), **5.048,62 (10-mar-2000)** y **1.114,11 (9-oct-2002)** confirmados; último dato 2026-10-23 |
| `src-s6-02` (S&P 500) | `000` en curl, **200 por CSV** | FRED solo sirve 10 años (24-oct-2016 → 21-oct-2026): **no contiene** 2007-2009. Los cierres **1.565,15 (9-oct-2007)** y **676,53 (9-mar-2009)** se verificaron con el histórico de `^GSPC` (Yahoo Finance) y quedan anotados en la ficha |
| `src-s6-03` (Garber 1989) | 403 (muro anti-bot, `acceso: de-pago`) | cita bibliográfica verificada en CrossRef: JPE 97(3), 535-560, jun-1989. No se publica ninguna cifra del artículo |
| `src-fixture-demo` | 404 | ficha de prueba (`example.org`); **no se publica** y no respalda ninguna cifra |

Los dos avisos de FRED son honestos: se mantiene la URL institucional como fuente y se deja
escrito en `nota_verificacion` qué se pudo comprobar y con qué serie alternativa.

## 3. Recálculo de cifras `[cálculo]` (todas coinciden)

- **Hipotecas** (`verify-vivienda.py`): 180.785 € @3,01 %/26 a → cuota 836,14 €, total 260.875,78 €,
  intereses 80.090,78 €. 200.000 € @3 %/25 a → 948,42 / 84.526,79. @3 %/30 a → 843,21 / 103.554,90.
  @4 %/30 a → 954,83 / 143.739,01. 180.000 € @3,01 %/26 a: primer recibo 451,50 € intereses +
  381,01 € capital; 12 meses 9.990,12 € y −4.635,72 € de saldo; 26→30 años: −72,65 €/mes y
  +13.806,01 € de intereses. Euríbor +1 p.: 832,51 → 929,89 €.
- **`calculos.py` del F0 ejecutado**: 843,21 / 948,42 / 954,83 €; acumulado a 30 años **381.554,90 €**
  (el brief decía 381.555: la cifra publicada es la calculada). Los 3 `CORREGIR` del dossier F0
  quedan resueltos: ITP = escala (no tipo único), reducción del 5 % con requisitos, y 381.554,90.
- **Interés compuesto / DCA** (`verify-dca.py`): tipo mensual 0,407412 %; 200 €/mes 20 a → 81.160,90 €;
  300 €/mes 30 a → 244.612,77 €; 1.000 €/mes 12 m → 12.272,58 € (frente a 12.600 € de golpe);
  3 % → 65.370,89 €; 1.000 € 10 a → 1.628,89 €; 20 a → 2.653,30 €; valor real con IPC 4,9 % →
  31.177 € y 1.009 €.
- **Revolving**: 3.000 € al 1,5 % mensual con cuota de 60 € → 94 meses y **2.586,71 €** de intereses
  (86 %); TAE equivalente 19,56 %.
- **IRPF**: 30.000 € → 3.582,75 € de escala, −527,25 € de mínimo = 3.055,50 € (10,19 % medio,
  15 % marginal); salto 20.200 → 20.201 € = +0,15 €.
- **Inflación**: 1.000/1,049 = 953,29; 10.000/1,049⁵ = 7.872,68; tipo real −2,29 % y −1,58 %.
- **Burbujas**: +571,4 %, −77,9 %, factor 4,53 (+353 %), −56,8 %.

## 4. Correcciones aplicadas

1. `art-bruto-a-neto`: «la empresa aporta un 30,20 %» → **30,65 %** (suma de su propia tabla:
   23,60 + 5,50 + 0,60 + 0,20 + 0,75). Era el único error aritmético del bloque.
2. URL del algoritmo de retenciones 2026: 404 → 200 (`%20`). En la ficha y en los dos enlaces del artículo.
3. `art-tramos-irpf-y-retencion`: el `dato` atribuía los límites de 22.000 € y 1.500 € a la página del
   RDL 4/2024, que solo documenta el 15.876 €. Reworded y **añadida la fuente que sí los contiene**
   (`src-boe-ley-35-2006-lirpf`, art. 96.3). Lo mismo en `art-bruto-a-neto`.
4. `src-legia-art66-escala-ahorro`: es un espejo servido por JS, no verificable por HTTP. Se retira de
   las cuatro entradas que lo citaban y la escala del ahorro (19/21/23/27/30 %, Ley 7/2024 desde
   1-ene-2025) se cita contra el **BOE consolidado, art. 66**. La ficha queda con
   `acceso: requiere-navegador`.
5. Se eliminan los «pendiente de confirmar / re-verificar / descargar» que ya no son ciertos:
   ATC del ITP (verificada hoy), 40 % de endeudamiento (frase literal comprobada), PDF de la CNMV,
   escala estatal, CSV de FRED, PDF del algoritmo y art. 66/96/101 LIRPF.

## 5. Publicación efectuada

**39 entradas a `publicado`**, todas con `publicado: 2026-10-26`, `revisado_factual: 2026-10-26`,
`seo.descripcion` (se añadió en las 14 que no lo tenían) y `autorias.revisor`:

- 7 temas (ahorro, banca, burbujas, inflación, inversión, nómina, vivienda)
- 8 artículos (bruto-a-neto, comprar-piso-coste, dca, fondos-vs-etf, inflación, primeros-1000,
  tarjetas, tramos-irpf)
- 12 términos de glosario · 11 fichas de vídeo · 1 herramienta (interés compuesto)

## 6. Qué NO se publica y por qué

| entrada | motivo |
|---|---|
| `tema-fixture-demo`, `art-fixture-demo`, `glo-fixture-demo`, `glo-fixture-demo-dos`, `herr-fixture-metodologia`, `ser-fixture-demo` | material de banco de pruebas (`status: borrador`, fuente `example.org` 404). Solo existen para `build:fixtures` |
| `src-fixture-demo` (fuente) | ficha de prueba; no respalda ninguna cifra |
| vídeo `LL1EJttJPrs` (GTA VI) | público en YouTube pero fuera de la promesa editorial: sin ficha en el sitio. Aviso `W-VIDEO-SIN-FICHA` **intencional** |
| importes del SMI (RD 126/2026) | no se leen como cifra en el texto del RD → no se publican como número |

## 7. Decisión abierta (para Marc)

`autorias.revisor` apunta a `aut-revision-factual-qa` («Revisión factual QA»), una entrada de autor
que describe **lo que realmente ocurrió** (pasada automatizada del 26-oct-2026: HTTP, citas y
recálculo). Se ha evitado a propósito atribuir la revisión a una persona que no la hizo. Si Marc
prefiere un revisor humano con nombre, basta editar `src/content/autores/aut-revision-factual-qa.yaml`
o añadir otro autor y cambiar `autorias.revisor` en las 11 entradas de sensibilidad alta.

## 8. Cadena re-ejecutada (26-oct-2026)

```
npm run check            → 0 errors, 0 warnings, 0 hints (51 files)
npm test                 → 116 tests, 116 pass, 0 fail
npm run build            → 47 páginas
npm run validate         → ok · 0 bloqueantes · 1 aviso (W-VIDEO-SIN-FICHA, intencional)
                           dist 47 html / 46 urls en sitemap
npm run build:fixtures   → 52 páginas
npm run verificar:plantillas → ok · 13 comprobaciones · 0 fallos
npm run publicacion:pendiente → contenido 45 · publicadas 39 · sin publicar 6 · sin metadata pendiente 0
```

Catálogos y `llms.txt` coherentes con lo publicado: `topics.json` 7 · `catalog.json` (guías) 8 ·
`videos.json` 11 · `tools.json` 1 · glosario 12 → **39**; `llms.txt` declara 7 / 8 / 11 / 12 / 1.
