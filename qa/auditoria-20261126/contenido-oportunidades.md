# Auditoría de contenido y oportunidades de posicionamiento — 4sotas.com

**Fecha:** 26 de noviembre de 2026
**Ámbito:** contenido, arquitectura de información y encaje con intención de búsqueda. No es una auditoría técnica de rendimiento ni de Core Web Vitals.
**Fuente de datos del sitio:** descarga directa de `https://4sotas.com/sitemap-index.xml` → `sitemap-0.xml` y de las **71 URLs** del sitemap (26/11/2026), parseadas en local.
**Fuente de datos de competencia:** 11 consultas lanzadas en buscador web el 26/11/2026 y lectura de los resultados devueltos.

---

## 0. Resumen ejecutivo

1. **El sitio tiene 71 URLs reales, no 80:** 8 guías, 7 temas, 30 fichas de vídeo, 12 términos de glosario, 4 calculadoras y 10 páginas de sistema. El brief hablaba de 9 guías, 33 vídeos y 13 términos; el sitemap dice 8, 30 y 12. Conviene corregir el inventario interno.
2. **El problema no es el volumen de contenido, es el emparejamiento con la consulta.** Las guías están bien escritas (1.800–2.200 palabras, fuentes fechadas, límites declarados) pero sus H1 son tesis editoriales, no consultas: «Comprar vivienda: de los 200.000 € al dinero que sale de tu cuenta», «Tramos del IRPF: por qué subir de tramo no te quita el sueldo». Nadie busca eso.
3. **Falta la calculadora que sostiene el tema principal del sitio.** Hay 4 calculadoras (hipoteca, préstamo, interés compuesto, viabilidad) y **ninguna de sueldo neto**, siendo la nómina el eje de marca. Es el hueco más grande y el más coherente con el modelo.
4. **La página de mayor autoridad interna está mal explotada.** `/oros/herramientas/interes-compuesto/` recibe 17 enlaces internos de contenido (el máximo del sitio) y su título es genérico. Es el activo desde el que se debe empujar el resto del clúster de inversión.
5. **15 fichas de vídeo no reciben ni un enlace contextual** (solo aparecen en el listado `/oros/videos/`). Son el 21 % del sitio emitiendo señal débil.
6. **Cero `FAQPage` en las 71 URLs**, teniendo ya bloques de preguntas visibles («Preguntas que responde esta página»). Es el quick win de schema más barato que existe aquí.
7. **El sitemap no lleva `<lastmod>`**, en un nicho donde todo el mundo compite con «actualizado el…» y con el IPC al 4,9 %. Se está renunciando gratis a una señal de frescura.
8. **Canibalización real en tres clústeres** (nómina, IRPF, inflación), no teórica: hay 4–5 URLs con la misma intención y sin jerarquía declarada.
9. **Dos consultas donde la competencia española es débil y el sitio ya tiene el material**: «hipoteca de 200.000 €» y «cuánto se paga de IRPF con 30.000 €». Ahí están los dos primeros resultados alcanzables.
10. **Una consulta que conviene no pelear**: «IPC España qué es» (INE y bancos) e «calculadora sueldo neto» (CaixaBank, Santander, TaxDown). Se atacan por cola larga y por dato, no de frente.

---

## 1. Método y límites — qué sé y qué no

**Lo que he medido, con dato:**

- Las 71 URLs del sitemap, con `<title>`, `meta description`, H1/H2/H3, palabras del `<main>`, canonical, JSON-LD y enlaces internos salientes de cada una.
- El grafo de enlaces internos completo (quién enlaza a quién), separando navegación global de enlaces contextuales.
- Presencia de schema por página y tipos usados.
- `robots.txt`, `rss.xml`, `llms.txt`, `llms-full.txt` y catálogos `/data/*.json`.
- Resultados de SERP de 11 consultas, con el tipo de sitio que ocupa cada posición leída.

**Lo que NO tengo y no voy a inventar:**

- **Volúmenes de búsqueda.** No hay acceso a Keyword Planner, Semrush ni Ahrefs en esta auditoría. Cualquier cifra de demanda que aparezca en un informe de este proyecto sin esa fuente es inventada.
- **Posiciones actuales de 4sotas.com.** Sin Search Console ni rastreo de rankings, no sé en qué puesto está ninguna URL. Las SERPs que he leído no incluían 4sotas.com en las posiciones devueltas, lo cual es un indicio, no una medición.
- **CTR, impressions y consultas reales** que ya traen tráfico.
- Los resultados de SERP son **una foto única del 26/11/2026**, con posible personalización y con un backend que devolvió resultados contaminados de Latinoamérica en varias consultas (lo señalo donde ocurre, porque es un dato en sí mismo).
- **No he podido leer tres SERPs por truncamiento de la herramienta** («bruto a neto calculadora», «cuánto se paga de IRPF 2026», «calculadora hipoteca españa»). Las he sustituido por variantes equivalentes que sí devolvieron contenido, y lo indico en la tabla.

Todo lo que sigue sobre dificultad competitiva es **hipótesis razonada por tipo de dominio observado**, no una métrica de dificultad calculada.

---

## 2. Inventario real del sitio

| Sección | URLs | Palabras medias | Observación |
|---|---:|---:|---|
| Guías | 8 | ~1.960 | Sólidas, con fuentes, supuestos y límites. H1 editorial, no consulta. |
| Temas | 7 | ~1.240 | Solo `nomina` (962 w) y `vivienda` (1.786 w) funcionan como hub real. |
| Vídeos | 30 | ~500 | Fichas correctas, pero 15 sin enlace contextual entrante. |
| Glosario | 12 | ~390 | Fichas de 299–477 palabras: definición + ejemplo + relaciones. Bien enlazadas entre sí, cortas para competir por «qué es X». |
| Herramientas | 4 | ~1.077 | `hipoteca` 996 w, `interes-compuesto` 1.382 w, `prestamo` 777 w, `viabilidad-hipoteca` 1.153 w. Solo la primera y la última tienen FAQ; ninguna tiene schema de FAQ. |
| Sistema | 10 | — | Home, `/oros/`, 4 índices de sección, metodología, privacidad, sobre. |

**Cobertura temática real** (deducida del contenido, no del brief): nómina e IRPF, inflación, ahorro, inversión indexada, banca y tarjetas, vivienda/hipoteca, burbujas históricas.

**Lo que el sitio hace bien y hay que proteger:**

- `metodologia/` + «Supuestos y límites» + «Fuentes» en cada guía. Es exactamente lo que un contenido YMYL necesita y lo que casi ningún competidor pequeño tiene.
- `llms.txt` + `llms-full.txt` + catálogos JSON + política de `robots.txt` que permite buscadores de IA y bloquea entrenamiento. Está por delante de la media del nicho en AEO. No lo toques; úsalo como argumento de marca.
- Calculadoras que se ejecutan en el navegador sin enviar datos, con fórmula publicada.

---

## 3. Radiografía de las SERP

Formato dominante por consulta y veredicto. «Formato» es lo que ocupa, no lo que debería ocupar.

| Consulta | Quién ocupa (leído 26/11/2026) | Formato | Veredicto para 4sotas |
|---|---|---|---|
| `calculadora sueldo neto españa 2026` | CaixaBank, calculadora.org, Santander, TaxDown, herramientapp, Cifra Neta, Calcfolio, HazTuCuenta, Convertilo, CalculadorNómina | Calculadora en página + tabla de sueldos + FAQ + «actualizado el…» | **Cabeza saturada.** Bancos con marca y 6–7 herramientas especializadas. No atacar con texto. Solo tiene sentido con calculadora propia y a 6–12 meses. |
| `cuánto se paga de IRPF con 30.000 euros` | Floritax, Stratexlab, Sueldocalc, EchaCuentas, Vértice, TuNomina2026, Kulturo, CalculadoraRenta, Catalunyainfo | Página por importe con el resultado exacto en el H1 («30.000 € brutos en neto: 1.652 € al mes») + tabla por tramos + FAQ | **Ganable.** Ningún dominio fuerte; todos son herramientas o gestorías pequeñas. El sitio ya tiene el cálculo exacto dentro de la guía de tramos. |
| `cuánto cuesta comprar un piso` / `…gastos e impuestos` | hipotecas.me (formato preguntas-frecuentes), Enley, Acierto, AlexHomeInvest, Gloval, Arquitasa, CuantoMeCuesta, IberianTax, ImpuestosVivienda | Respuesta directa + tabla de gastos + tabla por CCAA + ejemplo con 200.000 € + FAQ + «actualizado» | **Ganable a medio plazo.** Hay 4–5 sitios pequeños rankeando. La guía actual solo cubre ITP catalán: le falta la tabla por comunidad, que es justo lo que sostiene la consulta nacional. |
| `cuánto cuesta una hipoteca de 200.000 euros al mes` | hipotecas.me, GoHipoteca, EvHipotecas, HongLifeCalc, Rankia, Gibobs, HablandoDeHipotecas, EconomíaResponsable, NetoYBruto, RegistrosDePropiedad | Tabla cuota × plazo (20/25/30/35 años) × tipo + «ingresos necesarios» + FAQ | **El mejor objetivo del sitio.** Todos publican la misma tabla; el sitio tiene el motor que la genera y ninguna atadura comercial con bancos. No existe la página. |
| `fondo de emergencia cuántos meses de gastos` | Condusef (MX), Banco de España (PDF), AXA, Ayuntamiento de Madrid (PDF), BBVA México/Colombia, AARP (US) | Artículo genérico + calculadora | **Hueco claro.** La SERP está invadida por México, Colombia y EE. UU.; en España solo responden un PDF del BdE y una aseguradora. |
| `finiquito calculadora España` | finiquitocalculadora.es, Calzix, Fube, Herramática, LaboralPedia, EspañaLaboral, INEAF, Clicivo, CalculaLaboral, Contadorix | Calculadora + desglose por conceptos + tabla de días de indemnización | **Ganable solo con calculadora.** El texto no entra; la herramienta sí, y encaja con el modelo nómina. |
| `método 50 30 20 presupuesto España` | CaixaBank, Finanzas Fáciles, Bolsa Financiera, N26, BBVA (calculadora), Iván Escudero, CuantoDinero | Guía + calculadora + adaptación a España | **Competida pero abordable con ángulo propio**: aquí la vivienda se come el 50 % y casi todos lo admiten; nadie lo cuantifica con datos. |
| `Letras del Tesoro 2026 rentabilidad` | OCU, Cartera con Criterio, GDI Finanzas, Rankia, El Español, El Folio, DineroEnClaro, AhorroRemunerado | Dato de la última subasta + tabla por plazo + «¿merece la pena?» + comparativa con depósitos | **Estacional y ganable.** Hay mucho hueco de herramientas pequeñas. El sitio tiene un vídeo huérfano sobre el tema y ninguna página. |
| `declaración de la renta 2026 novedades` | ABC, 20minutos, Antena 3, El Economista, Legálitas, MicroBank, OkDiario | Noticia/actualidad de campaña (abril–junio) | **No pelear.** Es consulta de medios y de temporada; requeriría redacción de actualidad diaria. |
| `IPC España qué es` | INE (nota de prensa + metodología), Openbank, BBVA AM, Aegon, Domestica tu Economía | Definición institucional + dato del mes | **No pelear la definición.** El INE es la respuesta y va a seguir siéndolo. Sí pelear «IPC de octubre 2026: 4,9 %» y «cuánto ha subido el IPC». |
| `interés compuesto calculadora` | Investor.gov (US), Bankinter, miPlanificaciónFinanciera, Gerencie (CO), ArrayKit, Finguru (AR), CalculaInterésCompuesto, UtilityApp (LatAm) | Calculadora + tabla año a año | **Ganable con el ángulo España.** Más de la mitad de resultados son de EE. UU. y Latinoamérica. La calculadora del sitio ya descuenta inflación y habla de impuestos españoles: eso no lo tiene ninguno de los que aparecen. |

**Lectura de conjunto sobre formato:** en este nicho, la posición la ocupa quien responde **en el primer párrafo con una cifra**, publica **una tabla** y repite **«actualizado en [mes] [año]»**. 4sotas.com hace lo tercero (fechas y fuentes) y no hace lo primero ni lo segundo. Eso es una diferencia de plantilla, no de redacción.

---

## 4. Canibalización

No es hipotética: hay URLs con la misma intención y sin jerarquía declarada.

**Clúster nómina (5 URLs para 3 intenciones)**

| URL | Intención que cubre | Problema |
|---|---|---|
| `/oros/temas/nomina/` (962 w) | hub de tema | Correcto como hub, pero su H2 «Un ejemplo cerrado» repite el cálculo de la guía. |
| `/oros/guias/bruto-a-neto/` (2.151 w) | cómo se calcula bruto→neto | Debería ser la página canónica de la intención. |
| `/oros/videos/como-leer-una-nomina/` | **cómo leer una nómina** | Su H1 es «Cómo leer una nómina en España (2026): del bruto al neto»: compite con la guía por la misma consulta desde una ficha de 500 palabras. |
| `/oros/videos/bruto-vs-neto-2000/` | bruto vs neto con 2.000 € | Canibaliza la cola larga de la guía. |
| `/oros/videos/te-suben-el-sueldo-3/` | subida de sueldo y tramo | Solapa con la guía de tramos. |

**Clúster IRPF (4 URLs)**

`/oros/guias/tramos-irpf-y-retencion/` (el activo, 1.812 w) compite con `/oros/videos/tramos-del-irpf/`, `/oros/videos/irpf-en-la-nomina/` y `/oros/videos/bruto-vs-neto-2000/`. Las tres fichas están tituladas como si fueran guías y ninguna declara «esto es el vídeo de esta guía».

**Clúster inflación (5 URLs)**

`/oros/temas/inflacion/` + `/oros/guias/inflacion-poder-adquisitivo/` + `/oros/glosario/ipc/` + `/oros/glosario/inflacion-subyacente/` + `/oros/videos/inflacion-sobre-10000/`. El problema no es que sobren, es que **`/oros/glosario/ipc/` (434 w) es la URL con más potencial de la consulta informativa y la más débil del grupo**.

**Regla que propongo para cerrar esto (sprint 1, es plantilla):** una sola intención = una sola URL de guía. Toda ficha de vídeo cuyo título coincida con la intención de una guía pasa a titularse con el gancho específico del vídeo, no con la consulta. Ejemplo: «Cómo leer una nómina…» → «Las 9 casillas de tu nómina, una por una (en 4 minutos)».

---

## 5. Huecos de contenido

Ordenados por encaje con el modelo (economía cotidiana española con dato oficial) y por la debilidad observada de la competencia.

**Hueco 1 — Calculadora de sueldo neto (bruto a neto).**
El sitio explica el cálculo en 2.151 palabras y no lo ejecuta. Es el tema central de la marca, la consulta con más volumen del nicho y la única de las cuatro grandes que no tiene herramienta. Requiere: base de cotización con topes, escala de retención, mínimos personales y familiares, 12/14 pagas, Ceuta/Melilla/La Palma, aviso de forales.

**Hueco 2 — Página de hipoteca por importe.**
«Cuánto se paga por una hipoteca de 200.000 €», 150.000 €, 250.000 €, 300.000 €. Es la consulta con competencia más débil y más repetitiva del nicho: todos publican la misma tabla. El motor de `/oros/herramientas/hipoteca/` ya la genera; solo hay que publicarla. Verificado con la fórmula francesa: 200.000 € a 30 años al 3,00 % = **843,21 €/mes** y **103.554,90 €** de intereses totales, cifra que coincide con la que publican los competidores, así que la tabla es defendible.

| Importe | 2,5 % | 3,0 % | 3,5 % | 4,0 % | (30 años) |
|---|---:|---:|---:|---:|---|
| 150.000 € | 593 € | 632 € | 674 € | 716 € | |
| 200.000 € | 790 € | 843 € | 898 € | 955 € | |
| 250.000 € | 988 € | 1.054 € | 1.123 € | 1.194 € | |
| 300.000 € | 1.185 € | 1.265 € | 1.347 € | 1.432 € | |

**Hueco 3 — Finiquito.**
Consulta con intención clarísima, competencia de herramientas pequeñas y cero cobertura en el sitio, a pesar de que la nómina es su tema. Es la pieza que más amplía el modelo sin salirse de él (derecho laboral cuantificado, fuentes: ET y Ley 35/2006).

**Hueco 4 — Gastos de compra por comunidad autónoma (ITP y AJD 2026).**
La guía de vivienda solo usa el ITP catalán. La consulta nacional pide tabla por CCAA; es además la página que puede sostener el clúster de vivienda y absorber búsquedas de 17 comunidades. Fuente: resúmenes tributarios autonómicos del Ministerio de Hacienda, con fecha de consulta.

**Hueco 5 — Fondo de emergencia en euros, con tu sueldo.**
La SERP está ocupada por México, Colombia y EE. UU. En España responden un PDF del Banco de España y una aseguradora. El sitio tiene una ficha de glosario de 414 palabras, un vídeo huérfano y una guía de ahorro que lo menciona. Falta la página que convierte «3–6 meses» en una cifra con el sueldo neto del lector.

**Hueco 6 — Letras del Tesoro / dónde aparcar el dinero a corto plazo.**
Con la letra a 12 meses al 3,045 % y el IPC al 4,9 %, la pregunta «¿merece la pena?» tiene respuesta numérica y el sitio no la da. Tiene un vídeo, huérfano.

**Hueco 7 — Presupuesto 50/30/20 adaptado a España.**
Competido, pero el ángulo honesto («en España no cuadra y aquí está cuánto se desvía») es exactamente la voz del sitio y nadie lo cuantifica con datos de vivienda sobre renta.

**Huecos que descarto conscientemente:** declaración de la renta (actualidad de medios), «qué es el IPC» (INE), deducciones autonómicas (mantenimiento mensual inviable ahora), criptomonedas y trading (fuera de modelo y de tono).

---

## 6. Qué debe ser hub y qué no

| URL | Rol propuesto | Por qué |
|---|---|---|
| `/oros/temas/nomina/` | **Hub de nómina** | Ya tiene la estructura narrativa. Debe absorber el ejemplo cerrado y enlazar a la calculadora de sueldo neto, la guía de tramos y el glosario de base de cotización y retención. |
| `/oros/temas/vivienda-y-hipoteca/` | **Hub de vivienda** | 1.786 w y 4 enlaces entrantes. Debe apuntar a: calculadora de hipoteca, calculadora de viabilidad, guía de coste real y (nuevo) gastos por CCAA. |
| `/oros/herramientas/hipoteca/` | **Hub de calculadoras de deuda** | Debe incluir el modo «cuota por importe» y enlazar a préstamo y viabilidad. Hoy es una isla de 996 w con 7 entrantes. |
| `/oros/herramientas/interes-compuesto/` | **Nodo de autoridad del clúster inversión** | 17 enlaces entrantes, el mayor del sitio. Es desde donde se reparte autoridad a DCA, fondos vs ETF y primeros 1.000 €. |
| `/oros/glosario/ipc/` | **No es hub: es la ficha que debe crecer** | 434 w no sostienen la consulta informativa más rentable del clúster. Objetivo: 900–1.100 w con dato del mes, qué no incluye (hipoteca) y general vs subyacente. |
| `/oros/temas/banca-y-credito/` | **Hub infradotado** | 1.545 w pero solo 3 entrantes y 2 herramientas; es el tema con más hueco comercial del nicho (depósitos, cuentas, letras). |
| `/oros/temas/burbujas/` | **No invertir en SEO** | 1.127 w, 1 entrante, cero intención comercial. Es marca y diferenciación; que se quede como está y se enlace desde la home, no desde el resto. |

---

## 7. Enlazado interno

**Datos del grafo (enlaces contextuales, excluida la navegación global):**

| Página | Entrantes | Diagnóstico |
|---|---:|---|
| `/oros/herramientas/interes-compuesto/` | 17 | Bien. Es el nodo que hay que usar para empujar. |
| `/oros/guias/bruto-a-neto/` | 9 | Bien. |
| `/oros/videos/deuda-o-inversion-1000/` | 9 | Anómalo: una ficha de vídeo con más autoridad interna que la guía de tramos (7). |
| `/oros/guias/tramos-irpf-y-retencion/` | 7 | Debe subir: es la página con mejor oportunidad de cola larga. |
| `/oros/herramientas/hipoteca/` | 7 | Insuficiente para ser hub de vivienda. |
| `/oros/herramientas/prestamo/` | **2** | Infraenlazada. Ninguna guía la menciona. |
| `/oros/herramientas/viabilidad-hipoteca/` | **1** | Solo la enlaza el tema. Es la herramienta más diferencial y la más escondida. |
| `/oros/glosario/amortizacion-francesa/` | **1** | Y su única entrada es la guía de vivienda. Debería entrar desde hipoteca, viabilidad y préstamo. |
| `/oros/glosario/fondo-de-emergencia/` | **1** | Solo desde la guía de ahorro. Entra desde el tema de ahorro y desde tres vídeos. |
| 15 fichas de vídeo | **0** | Huérfanas: `black-friday`, `burbuja-ia-2000`, `comprar-piso-40000-no-llegan`, `cuentas-pareja`, `gta-vi-imperio`, `gta6-primer-dia`, `letras-tesoro`, `reto-centimo`, `salario-minimo-2027`, `sp500-4-de-cada-10`, `sp500-riesgo-oculto`, `te-suben-el-sueldo-3`, `trabajar-ya-no-basta`, `trampa-3-plazos`, `tu-casa-50k`. |

**Movimientos concretos (todos son plantilla o un enlace, no contenido nuevo):**

1. **Bloque «Herramientas de este tema»** al pie de cada guía y cada tema, generado desde frontmatter (`tool:` + `related:`) con 2–3 enlaces y ancla descriptiva. Resuelve de golpe `prestamo`, `viabilidad-hipoteca` y los dos glosarios con 1 entrante.
2. **Bloque «Vídeos de este tema»** con 3 fichas por guía/tema. Cierra las 15 huérfanas sin tocar una línea de texto.
3. **Enlaces contextuales dentro del cuerpo** desde las cinco páginas con más entrantes:
   - `interes-compuesto` → `guias/dca-interes-compuesto` (ancla: «aportar cada mes o de golpe»), `guias/fondos-indexados-vs-etf` (ancla: «traspaso sin tributar»), `glosario/tae`.
   - `bruto-a-neto` → `glosario/base-de-cotizacion` (ancla: «base de cotización con topes»), `herramientas/prestamo` (ancla: «cuota de un préstamo personal»), y el futuro `herramientas/sueldo-neto`.
   - `tramos-irpf-y-retencion` → `glosario/tipo-marginal`, `glosario/tipo-de-retencion`, `videos/tramos-del-irpf` (ancla: «los tramos en 4 minutos»).
   - `herramientas/hipoteca` → `glosario/amortizacion-francesa`, `herramientas/viabilidad-hipoteca` (ancla: «¿me la puedo permitir?»), `guias/comprar-piso-coste-real`.
   - `guias/primeros-1000-euros` → `glosario/fondo-de-emergencia`, `videos/fondo-de-emergencia`, `videos/tres-cuentas-un-sueldo`.
4. **Anclas de vídeo genéricas fuera.** Hoy hay enlaces con el título completo del vídeo. Cambiar a anclas de intención («cuánto cuesta de verdad un piso de 200.000 €») mejora la relevancia del destino.
5. **Breadcrumbs:** 66 de 71 URLs tienen `BreadcrumbList`. Las 5 que no son la home, `/oros/`, `/metodologia/`, `/privacidad/` y `/sobre-4-sotas/`, donde el breadcrumb no aporta: **déjalo como está**. El schema está mejor de lo que parece.

---

## 8. Quick wins on-page por URL

Cambios que no requieren contenido nuevo. «Título» es propuesta literal; entre paréntesis, longitud.

### `/oros/herramientas/hipoteca/` — prioridad 1
- **Título:** `Calculadora de hipoteca 2026: cuota e intereses (España)` (57)
- **H1:** `Calculadora de hipoteca: cuota mensual, intereses y tabla por plazo`
- **H2 nuevos:** «Cuánto se paga por una hipoteca de 200.000 €» · «Cuota según plazo: 20, 25, 30 y 35 años» · «Qué ingresos necesitas para que te la den» · «Preguntas frecuentes».
- Publicar la tabla del punto 5 y el bloque de ingresos mínimos (cuota ≤ 35 % del neto) con fuente Banco de España.
- `FAQPage` + `SoftwareApplication` (este ya existe) en la misma página.
- Enlazar desde el tema de vivienda con ancla «cuánto se paga al mes por 200.000 €».

### `/oros/guias/tramos-irpf-y-retencion/` — prioridad 2
- **Título:** `Tramos del IRPF 2026 y cuánto se paga con 30.000 €` (52)
- **H1:** mantener el actual, pero añadir un H2 literal: **«Cuánto se paga de IRPF con 30.000 € brutos»** justo antes del cálculo que ya existe.
- Añadir tabla bruto → retención → neto para 18.000, 20.000, 25.000, 30.000, 35.000, 40.000, 45.000, 50.000 y 60.000 (los datos ya están calculados en la guía, es tabularlos).
- `FAQPage` sobre «Preguntas que responde esta página».

### `/oros/guias/bruto-a-neto/` — prioridad 3
- **Título:** `Bruto a neto en 2026: cuánto te queda de tu sueldo` (48). Hoy el título tiene 64 caracteres y pierde la expresión que usa la gente («bruto a neto» está, pero enterrada).
- Añadir «Respuesta rápida» de 50 palabras al principio con el ejemplo de 2.000 € (ya está en el cuerpo).
- Falta el enlace a la calculadora (inexistente) → dejar el hueco preparado en plantilla.

### `/oros/guias/comprar-piso-coste-real/` — prioridad 4
- **Título:** `Cuánto cuesta comprar un piso en 2026: gastos, ITP y entrada` (58)
- **H1:** `Cuánto cuesta comprar un piso en 2026 (y cuánto dinero sale de tu cuenta)`
- Añadir H2 «Gastos de compra por comunidad autónoma» con tabla ITP/AJD. Hoy la página solo tiene el caso catalán: es la razón por la que no compite por la consulta nacional.
- Añadir «Respuesta rápida»: «Entre un 8 % y un 13 % del precio, más el 20 % de entrada».

### `/oros/glosario/ipc/` — prioridad 5
- **Título:** `IPC 2026: qué es, cómo se calcula y último dato` (45)
- Estructura: «Qué es» → «Cómo se calcula (cesta, ponderaciones, base 2025)» → «Qué NO incluye: tu hipoteca» → «IPC general vs subyacente» → «Último dato: 4,9 % en octubre de 2026 (INE)».
- Objetivo 900–1.100 palabras. Es la ficha con mejor retorno del glosario.

### `/oros/herramientas/interes-compuesto/` — prioridad 6
- **Título:** `Calculadora de interés compuesto con inflación e impuestos` (60)
- H2: «Cuánto pierde tu ahorro con la inflación» (ya lo calcula, no lo dice el título) y «Interés compuesto con aportación mensual».
- Es el nodo con 17 entrantes: cada mejora aquí rinde más que en cualquier otra URL.

### `/oros/herramientas/viabilidad-hipoteca/` — prioridad 7
- **Título:** `¿Puedo permitirme esta casa? Calculadora de viabilidad` (58). Hoy el título es «¿Puedo comprar esta casa?»: no contiene ninguna consulta real.
- Enlazar desde `hipoteca` y desde el tema de vivienda.

### `/oros/herramientas/prestamo/` — prioridad 8
- **Título:** `Calculadora de préstamo personal: cuota y TAE 2026` (50)
- Añadir «Preguntas frecuentes» (hoy no tiene) y enlace desde tarjetas-y-comisiones.

### Resto de guías (7, 8)
- `dca-interes-compuesto`: título sin «interés compuesto» explícito en el H1 («Aportar cada mes o de golpe»). Añadir «interés compuesto» al `<title>`.
- `inflacion-poder-adquisitivo`: bien. Añadir «IPC» al título.
- `tarjetas-y-comisiones`, `fondos-indexados-vs-etf`, `primeros-1000-euros`: correctos en título; solo falta «Respuesta rápida» y FAQ schema.

### Transversal a las 71 URLs
- **`<lastmod>` en el sitemap.** Cada URL tiene fecha de revisión en el frontmatter; hoy no se emite. Es la señal de frescura más barata del sitio.
- **`FAQPage`** en las 8 guías, las 4 herramientas y las 12 fichas de glosario, donde ya hay preguntas visibles.
- **Bloque «Respuesta rápida»** de 40–60 palabras al inicio de toda guía. Es lo que ocupa el fragmento destacado y lo que citan los buscadores de IA — y el sitio ya está preparado para AEO.
- **`Article` + `dateModified` visible** en las guías: solo 8 páginas tienen `Article` hoy, correctamente, pero la fecha no se muestra junto al H1 como hacen los competidores.

---

## 9. Plan de 3 sprints

### Sprint 1 — esta semana: plantilla y enlazado, cero contenido nuevo

Objetivo: dejar de perder señal. Todo esto se hace en el layout y en el frontmatter.

| # | Acción | Dónde | Resultado esperado |
|---|---|---|---|
| 1 | Bloque «Herramientas de este tema» (2–3 enlaces desde frontmatter) | plantilla de guía y tema | `prestamo`, `viabilidad-hipoteca` y 2 glosarios salen de 1–2 entrantes |
| 2 | Bloque «Vídeos de este tema» (3 fichas) | plantilla de guía y tema | 15 páginas huérfanas pasan a tener enlaces |
| 3 | Bloque «Respuesta rápida» (40–60 palabras, campo de frontmatter) | plantilla de guía | fragmento destacado y citabilidad en IA |
| 4 | `FAQPage` automático desde el bloque de preguntas existente | plantilla de guía, herramienta y glosario | 24 URLs con FAQ schema, hoy 0 |
| 5 | `<lastmod>` en `sitemap-0.xml` | build del sitemap | señal de frescura en las 71 |
| 6 | Retitular las 5 herramientas y las 4 guías del punto 8 (solo `<title>` y H1) | frontmatter | emparejamiento con la consulta |
| 7 | Regla de titulación de fichas de vídeo: nunca el título de la guía | plantilla de vídeo + 12 fichas | fin de la canibalización nómina/IRPF |
| 8 | Enlaces contextuales del punto 7.3 (5 páginas origen) | cuerpo de 5 páginas | reparto de autoridad interna hacia hubs |
| 9 | Tabla bruto → IRPF → neto en la guía de tramos | cuerpo | abre la cola larga «cuánto se paga de IRPF con X €» |
| 10 | Completar los 5 breadcrumbs que faltan | plantilla | consistencia de schema |

**No hacer en sprint 1:** escribir artículos nuevos, cambiar la home, tocar `llms.txt` ni la política de `robots.txt`.

### Sprint 2 — contenido nuevo: 5 piezas

Cada pieza nace con su hueco de enlace ya previsto.

| # | Título propuesto | URL | Intención | Enlaces internos |
|---|---|---|---|---|
| 1 | **Calculadora de sueldo neto 2026: de bruto a neto en 12 o 14 pagas** | `/oros/herramientas/sueldo-neto/` | Transaccional. La consulta central del nicho; el sitio explica el cálculo y no lo ejecuta. | Desde `guias/bruto-a-neto` (ancla «calcula tu neto»), `temas/nomina`, `glosario/base-de-cotizacion`, `glosario/tipo-de-retencion`; hacia `guias/tramos-irpf-y-retencion` y `guias/bruto-a-neto`. |
| 2 | **Cuánto se paga por una hipoteca de 200.000 € (y de 150.000, 250.000 y 300.000)** | `/oros/herramientas/hipoteca/importe/` o variante de la calculadora | Transaccional-informacional. Competencia débil y repetitiva; el motor ya existe. | Desde `herramientas/hipoteca` (ancla «cuota por importe»), `temas/vivienda-y-hipoteca`, `guias/comprar-piso-coste-real`; hacia `glosario/amortizacion-francesa`, `herramientas/viabilidad-hipoteca`. |
| 3 | **Finiquito: qué te tienen que pagar al dejar el trabajo (y cómo calcularlo)** | `/oros/guias/finiquito/` | Informacional con calculadora. Amplía el modelo nómina sin salirse de él. | Desde `temas/nomina`, `guias/bruto-a-neto` (ancla «qué pasa cuando terminas el contrato»), `glosario/tipo-de-retencion`; hacia la calculadora de sueldo neto. |
| 4 | **Gastos de comprar casa por comunidad autónoma: ITP y AJD en 2026** | `/oros/guias/gastos-compra-por-comunidad/` | Informacional con tabla. Es la página que sostiene la consulta nacional de vivienda. | Desde `guias/comprar-piso-coste-real` (ancla «tu comunidad»), `temas/vivienda-y-hipoteca`, `herramientas/hipoteca`; hacia `glosario/amortizacion-francesa`. |
| 5 | **Letras del Tesoro, depósitos o cuenta remunerada: dónde aparcar el dinero en 2026** | `/oros/guias/letras-vs-deposito/` | Comparativa con dato de la última subasta y del IPC. Rescata el vídeo huérfano de letras. | Desde `temas/banca-y-credito`, `videos/letras-tesoro` (ancla «la comparativa completa»), `guias/primeros-1000-euros`; hacia `glosario/tae`, `guias/inflacion-poder-adquisitivo`. |

**Criterio de cada pieza:** cifra en el primer párrafo, tabla, fuente con fecha de consulta, límites declarados y FAQ con schema. Sin eso, no se publica.

### Sprint 3 — profundidad y mantenimiento

| Acción | Por qué | Esfuerzo |
|---|---|---|
| Ampliar `glosario/ipc/` a 900–1.100 w con «qué no incluye» y dato del mes | Es la ficha con más retorno del glosario y hoy no sostiene la consulta | M |
| **Página de dato recurrente: «El IPC de [mes] en euros»** con serie y actualización mensual | Frescura mensual, consulta informativa y uso natural de la calculadora de inflación | M–A (mantenimiento) |
| Página de fondo de emergencia en euros («cuánto necesitas con tu sueldo neto») | SERP invadida por LatAm/US; hueco claro | M |
| Calculadora de presupuesto 50/30/20 adaptada a España | Cierra el tema de ahorro con herramienta y admite el ángulo honesto del sitio | M |
| Ampliar guía de vivienda: variable vs fija, Euríbor, subrogación y gastos de hipoteca tras la Ley 5/2019 | Profundidad donde ya hay motor y autoridad | A |
| Subir las 12 fichas de glosario a 700–900 w con ejemplo numérico | Hoy son definiciones de 300–470 w; no compiten por «qué es X» | M |
| Calculadora «¿me sale a devolver?» (IRPF anual vs retención) | Cierra el recorrido nómina→renta; muy buscada en mayo–junio | A |
| Revisar trimestralmente fechas y cifras de las 8 guías (IPC, SMI, tipos) | YMYL: una cifra vieja con fecha visible es peor que no tener fecha | Recurrente |

**Fuera de alcance por ahora, y por qué:** declaración de la renta en campaña (competencia de medios, requiere actualidad diaria), «qué es el IPC» como cabeza (INE), cripto y trading (fuera de tono), deducciones autonómicas (mantenimiento mensual inviable con el equipo actual).

---

## 10. Anexo — inventario por URL (datos medidos)

| Palabras | URL | Título actual (long.) |
|---:|---|---|
| 599 | `/` | La vida no viene con instrucciones · 4 Sotas (44) |
| 166 | `/metodologia/` | Metodología y fuentes · 4 Sotas (31) |
| 903 | `/oros/` | Tu dinero, con las cartas claras · Sota de Oros (47) |
| 431 | `/oros/glosario/` | Glosario (23) |
| 392 | `/oros/glosario/amortizacion-francesa/` | Amortización francesa (36) |
| 477 | `/oros/glosario/base-de-cotizacion/` | Base de cotización (33) |
| 318 | `/oros/glosario/dca-aportacion-periodica/` | DCA (aportación periódica) (41) |
| 331 | `/oros/glosario/diversificacion/` | Diversificación (30) |
| 414 | `/oros/glosario/fondo-de-emergencia/` | Fondo de emergencia (34) |
| 351 | `/oros/glosario/inflacion-subyacente/` | Inflación subyacente (35) |
| 434 | `/oros/glosario/ipc/` | IPC (18) |
| 342 | `/oros/glosario/tae/` | TAE (43) |
| 299 | `/oros/glosario/tin/` | TIN (44) |
| 458 | `/oros/glosario/tipo-de-retencion/` | Tipo de retención (32) |
| 472 | `/oros/glosario/tipo-marginal/` | Tipo marginal (28) |
| 339 | `/oros/glosario/traspaso-de-fondos/` | Traspaso de fondos (33) |
| 496 | `/oros/guias/` | Guías (20) |
| 2151 | `/oros/guias/bruto-a-neto/` | Bruto y neto: cómo se calcula tu nómina en España (64) |
| 2199 | `/oros/guias/comprar-piso-coste-real/` | Comprar vivienda: de 200.000 € al dinero que sale de tu cuenta (62) |
| 1868 | `/oros/guias/dca-interes-compuesto/` | Aportar cada mes o de golpe: la aritmética del largo plazo (58) |
| 1847 | `/oros/guias/fondos-indexados-vs-etf/` | Fondos indexados y ETF: qué cambia de verdad (59) |
| 1763 | `/oros/guias/inflacion-poder-adquisitivo/` | Inflación: cuánto dinero pierdes y cómo se calcula (65) |
| 2032 | `/oros/guias/primeros-1000-euros/` | Tus primeros 1.000 euros: orden, deuda y colchón (63) |
| 2014 | `/oros/guias/tarjetas-y-comisiones/` | Débito, crédito y revolving: cómo se paga de verdad (63) |
| 1812 | `/oros/guias/tramos-irpf-y-retencion/` | Tramos del IRPF: marginal, medio y por qué no pierdes el sueldo (63) |
| 206 | `/oros/herramientas/` | Herramientas (27) |
| 996 | `/oros/herramientas/hipoteca/` | Calculadora de hipoteca (38) |
| 1382 | `/oros/herramientas/interes-compuesto/` | Calculadora de interés compuesto (47) |
| 777 | `/oros/herramientas/prestamo/` | Calculadora de préstamo (38) |
| 1153 | `/oros/herramientas/viabilidad-hipoteca/` | ¿Puedo comprar esta casa? (40) |
| 284 | `/oros/temas/` | Temas troncales (30) |
| 977 | `/oros/temas/ahorro/` | Ahorro: cómo llegar a tus primeros 1.000 euros (61) |
| 1545 | `/oros/temas/banca-y-credito/` | Banca y crédito (30) |
| 1127 | `/oros/temas/burbujas/` | Burbujas y pánicos (33) |
| 862 | `/oros/temas/inflacion/` | Inflación y poder adquisitivo: qué pierde tu dinero (51) |
| 1576 | `/oros/temas/inversion-desde-cero/` | Inversión desde cero (35) |
| 962 | `/oros/temas/nomina/` | Nómina en España: bruto, neto, IRPF y cotizaciones (65) |
| 1786 | `/oros/temas/vivienda-y-hipoteca/` | Vivienda e hipoteca (34) |
| 213 | `/privacidad/` | Privacidad (20) |
| 286 | `/sobre-4-sotas/` | Sobre 4 Sotas: el proyecto editorial (36) |
| ~500 ×30 | `/oros/videos/*` | 30 fichas; 12 con 0–1 enlaces entrantes |

**Schema actual:** `Organization`, `WebSite`, `Person`, `ImageObject` en las 71; `BreadcrumbList` en 66; `WebPage` en 44; `VideoObject` en 30; `DefinedTerm` en 13 (12 fichas + índice); `CollectionPage` en 12; `Article` en 8; `SoftwareApplication` en 5 (4 calculadoras + índice); `Offer` en 5; `AboutPage` en 2. **`FAQPage`: 0.**
