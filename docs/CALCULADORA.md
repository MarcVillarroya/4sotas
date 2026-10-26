# Calculadora de interés compuesto · metodología y vectores de prueba

Versión del motor: **1.0.0** (`herr-interes-compuesto`). Código: `src/lib/calculadora.ts`
(motor), `src/lib/calculadora-svg.ts` (gráfico), `src/components/CalculadoraInteresCompuesto.astro`
(interfaz), `tests/calculadora.ts` (27 pruebas). Página: `/oros/herramientas/interes-compuesto/`.

Este documento es el contrato de la herramienta: si el motor y este texto discrepan, el fallo es
del sitio. Los valores de la tabla de vectores (§5) se calcularon **fuera** del motor, con
`decimal.Decimal` de Python a 40 dígitos de precisión, y por eso las pruebas valen como
verificación independiente y no como espejo del código.

---

## 1 · Qué calcula y qué no

Calcula, con aritmética de interés compuesto:

- capital final tras un plazo, con capital inicial y aportaciones periódicas;
- total aportado (capital inicial + suma de aportaciones);
- ganancia por intereses (capital final − aportado);
- evolución periodo a periodo y un cierre por año para presentación;
- valor real del capital final en euros de hoy, **solo** si se introduce una inflación.

No calcula, y la página lo dice antes de dar ningún número:

- **fiscalidad**: ni retenciones, ni tramos, ni exenciones. No modeladas.
- **comisiones**: ni de gestión, ni de custodia, ni de suscripción. No modeladas.
- **rentabilidad futura**: la tasa es una hipótesis constante que introduce la persona usuaria.
  No es una predicción ni una promesa; el motor no consulta ningún dato de mercado.
- **riesgo**: no simula caídas, volatilidad ni secuencias de rentabilidades distintas.

No hay backend: el cálculo ocurre en el navegador y no se envía nada a ningún servidor. La página
no incluye analítica, cookies ni peticiones a terceros.

## 2 · Convención de tasa: efectiva anual (EA), no nominal

Decisión vinculante de esta versión: **la rentabilidad que se introduce es una TASA EFECTIVA
ANUAL**. Un 5 % significa que 100 € se convierten en 105 € al cabo de un año, con independencia de
cada cuánto se capitalice.

La tasa por periodo se obtiene con una conversión efectiva explícita:

```
i = (1 + r)^(1/m) − 1
```

donde `m` es el número de periodos de capitalización por año (1 anual, 2 semestral, 4 trimestral,
12 mensual).

Consecuencias, todas comprobadas en las pruebas:

- **No se divide la tasa entre la frecuencia.** `5 % / 12` sería un tipo *nominal* mensual y daría
  otro resultado; el motor no lo usa.
- Un capital único al 5 % EA da el mismo capital final con capitalización anual que mensual
  (vector V2 = V3 = 1628,8946…). Es la prueba de que la tasa es efectiva: si fuera nominal, la
  capitalización más frecuente daría más.
- Con aportaciones, la frecuencia sí cambia el resultado, pero por el calendario de aportaciones
  (aportas 12 veces al año en vez de 1) y por el devengo del interés en cada periodo.

## 3 · Fórmula

Con `P` capital inicial, `A` aportación por periodo, `i` tasa por periodo, `k` número de periodos
y `C_0 = P`:

```
C_k = P · (1+i)^k  +  A · ((1+i)^k − 1) / i · φ
φ = (1+i)  si la aportación es al INICIO del periodo
φ = 1      si la aportación es al FINAL del periodo
```

Caso particular `i = 0` (tasa cero): la fórmula degenera en `C_k = P + A · k` y el motor usa esa
rama explícita, sin dividir por cero.

Derivados que se muestran en la página:

```
aportado   = P + A · n
ganancia   = C_n − aportado
interés_k  = C_k − C_(k−1) − A
valor real = C_n / (1 + π)^(meses/12)      (solo si hay inflación π)
ganancia real = valor real − aportado
```

El motor evalúa la fórmula cerrada en cada periodo (no acumula en un bucle con redondeo), así que
**la última fila de la tabla es exactamente el capital final**: la igualdad se prueba, no se supone.

## 4 · Entradas, unidades y límites

| Entrada | Unidad | Rango | Por defecto | Notas |
|---|---|---|---|---|
| Capital inicial | € | 0 – 1.000.000 | 1.000 | Se acepta coma o punto decimal; también `1.234,56`, `1 000 €`, `5 %` |
| Aportación por periodo | € | 0 – 20.000 | 100 | Es **por periodo de capitalización**, no «mensual» genérico |
| Plazo en años | entero | 0 – 60 | 10 | Entero; los meses sueltos van en el campo siguiente |
| Meses sueltos | entero | 0 – 11 | 0 | Se suman a los años: `meses = 12·años + meses` |
| Rentabilidad anual | % EA | −20 – 30 | 5 | Tasa efectiva anual (§2) |
| Frecuencia de capitalización | — | anual, semestral, trimestral, mensual | mensual | La aportación usa la misma frecuencia |
| Momento de la aportación | — | inicio, fin | fin | Inicio devenga el interés del periodo en el que entra |
| Inflación anual | % EA | −5 – 20 o vacío | vacío | Solo para el valor real; vacío = no se calcula |

Límite duro: **720 periodos** (60 años × 12) y **30 % de tasa**, porque por encima de ahí el
resultado deja de ser un plan y pasa a ser una curiosidad aritmética, y porque acota el tamaño de
la tabla a algo que una página puede renderizar.

### Decisiones de alcance (explícitas)

- **Frecuencia diaria, no incluida.** Exigiría desacoplar la aportación de la capitalización y
  multiplicar el tamaño de la tabla sin aportar nada al caso de uso real (ahorro periódico).
- **Plazo fraccionario, no admitido.** Con capitalización trimestral, 7 meses no completa un
  periodo; el motor lo rechaza con un mensaje que explica por qué en vez de inventar una fracción
  de periodo.
- **Mes suelto + periodo largo:** 10 años y 6 meses con capitalización mensual son 126 periodos.
- **Comparación de escenarios, no implementada.** Requiere una segunda simulación con su propia
  validación y su propia tabla accesible; sin eso sería un gráfico de dos líneas que promete más de
  lo que demuestra. Queda fuera de V1 a propósito.
- **Inflación, sí, pero solo como deflactor del capital final.** No se modelan aportaciones
  deflactadas ni rentabilidad real periodo a periodo: sería otra herramienta.

## 5 · Vectores de prueba

Todos los valores están en `tests/calculadora.ts` y se ejecutan con `npm run test:calculadora`.
El «cómo se dedujo» indica la cuenta hecha fuera del motor.

| # | Entrada | Esperado | Cómo se dedujo |
|---|---|---|---|
| V1 | 5 % EA, m = 12 | i = 0,004074123783648305 | `(1,05)^(1/12) − 1` con Decimal de 40 dígitos |
| V1b | 6 % EA, m = 4 | i = 0,014673846168659278 | `(1,06)^(1/4) − 1` |
| V2 | P=1.000, r=5 % EA, 10 años, anual | 1.628,8946267774414 | `1000 · 1,05^10` |
| V3 | P=1.000, r=5 % EA, 10 años, mensual | 1.628,8946267774414 | igual que V2: la tasa es efectiva, no nominal |
| V4 | A=100/mes al final, r=5 % EA, 10 años | 15.436,316130146592 (aportado 12.000) | `100 · ((1+i)^120 − 1)/i`, i de V1 |
| V5 | A=100/mes al inicio, r=5 % EA, 10 años | 15.499,205592824336 | `V4 · (1+i)`; comprobado además que la diferencia es `V4 · i` |
| V6 | A=200/mes al final, r=5 % EA, 20 años | 81.160,89706356068 (aportado 48.000) | `200 · ((1+i)^240 − 1)/i`; coincide con la cifra de contraste del carril editorial |
| V7 | P=1.000, A=100/mes, r=0 %, 10 años | 13.000 exacto, interés 0 en todas las filas | `1000 + 100·120` (rama i = 0, sin 0/0) |
| V8 | P=0, A=0, 10 años | 0 y filas a 0, sin NaN | caso degenerado |
| V9 | P=5.000, A=150/mes, r=6 % EA, 15 años | 55.019,57633686731 (aportado 32.000) | fórmula cerrada con i = `(1,06)^(1/12) − 1` |
| V10 | P=1.000, r=4 % EA, 3 años, trimestral | 1.124,864 | `1000 · (1 + (1,04)^(1/4) − 1)^12 = 1000 · 1,04^3` |
| V11 | P=1.000, A=100/año, r=4 %, 3 años | 1.437,024; filas 1.140 / 1.285,60 / 1.437,024 | tres pasos a mano: `·1,04 + 100` |
| V12 | A=300/mes, r=7 % EA, 30 años | 350.835,7809859803 (aportado 108.000) | 360 periodos con i = `(1,07)^(1/12) − 1`; plazo máximo menos un escalón |
| V13 | V6 con inflación 3 % a 20 años | valor real 44.936,82089210645; ganancia real −3.063,18 | `81160,89706356068 / 1,03^20` |
| V14 | 10 años y 6 meses al 5 % EA mensual | 126 periodos, capital > V4-equivalente | meses sueltos sumados al plazo |

Verificación en navegador (misma cifra que el motor, calculada aparte con Decimal):

- P=1.000 + 100/mes al 5 % EA 10 años → **17.065,21 €** (`1000·1,0040741…^120 + 15.436,3161`).
- P=1.000 + 100/mes al 7 % EA 10 años → **19.072,32 €**.
- El mismo caso a 20 años → **54.623,32 €**; con inflación del 3 % a 10 años el valor real es
  **14.191,60 €**.

## 6 · Tolerancias y redondeo

- El motor **no redondea**: devuelve coma flotante de doble precisión. Redondear dentro del bucle
  introduciría error acumulado y rompería la igualdad entre la última fila y el capital final.
- Las pruebas comparan dinero con tolerancia `max(1e-9, |esperado| · 1e-9)`. El error real de la
  fórmula cerrada es del orden de `1e-12`, así que la tolerancia solo absorbe el ruido de coma
  flotante, no un error de fórmula.
- El **redondeo monetario al céntimo** ocurre una sola vez, al presentar: `redondearCentimos`
  (medio hacia arriba) y `formatearEuros` (`Intl.NumberFormat('es-ES', …)`). Los importes mostrados
  y los de la tabla son redondeos del mismo número, no una segunda cuenta.
- Nota de formato: CLDR `es-ES` no agrupa millares de cuatro cifras (`1628,89 €`), sí de cinco en
  adelante (`81.160,90 €`). Las pruebas fijan ese comportamiento y normalizan el espacio duro que
  inserta `Intl` antes del símbolo.

## 7 · Errores de entrada

El motor nunca lanza por datos del formulario: devuelve `{ ok: false, errores }` con el campo y un
mensaje en castellano. La interfaz pinta el mensaje junto al campo, marca `aria-invalid="true"` y
anuncia el resumen en una región `role="status"`. Casos cubiertos por prueba: capital negativo o
fuera de rango, aportación negativa, tasa fuera de [−20, 30], años no enteros o fuera de rango,
meses fuera de 0–11, inflación fuera de [−5, 20], frecuencia desconocida, `NaN`/`Infinity`, plazo
cero y plazo que no completa un periodo de capitalización.

## 8 · Presentación y accesibilidad

- El resultado está en **texto** (importe, aportado, ganancia, tasa por periodo, valor real) y en
  una **tabla HTML** con `caption` y `th scope`; el SVG es un resumen de esas mismas filas, con
  `role="img"`, `<title>` y `<desc>`, y nunca el único sitio donde está el dato.
- Sin JavaScript la página sigue mostrando un ejemplo completo (calculado en el build con el mismo
  motor), la tabla y la metodología, con aviso explícito de ejemplo estático. Al editar se
  retiran la salida, el gráfico y las filas; Calcular ejecuta el motor sin recarga ni envío.
  Un error enfoca el primer campo inválido. La tabla tiene región nombrada y foco para scroll por teclado.
- Formulario con `label` para cada control, ayudas ligadas con `aria-describedby`, foco visible
  (`outline` de 3 px), objetivos táctiles de 44 px y teclado completo.

## 9 · Estado y publicación

La ficha `herramientas` está en `status: revision` y `estado_implementacion: beta`. Consecuencia
deliberada: la página **solo aparece en un build cuyo filtro de visibilidad incluya esa ficha**
(`npm run build:fixtures`), igual que el resto de plantillas en revisión; el build público no
publica borradores. Para publicarla hacen falta dos cambios editoriales, no de código:

1. `status: publicado` + `publicado: 2026-10-26` en `src/content/herramientas/herr-interes-compuesto.yaml`.
2. Repuntar `temas[0]` de `tema-fixture-demo` (prestado del build de fixtures) a `tema-ahorro`,
   el tema del carril editorial que la enlaza. Mientras ese tema no exista en la colección, el
   build falla por referencia, así que el cambio va junto con la importación de contenido.

No se ha marcado `publicado` porque el proyecto prohíbe publicar contenido sin revisión, y la
ficha tiene que apuntar a un tema que todavía no está ensamblado.

## 10 · Reproducir las pruebas

```bash
cd /home/mvf/4sotas/site
npm run test:calculadora     # 27 pruebas del motor y del gráfico
npm test                     # suite completa (86 pruebas)
npm run check                # astro check: 0 errores
npm run build                # build público
npm run build:fixtures       # build con las fichas en revisión
npm run verificar:plantillas # comprueba canónicas, JSON-LD y aislamiento de borradores
npm run validate             # validador canónico de contenido
```

## 11 · Archivos

| Archivo | Qué es |
|---|---|
| `src/lib/calculadora.ts` | Motor puro: conversión de tasa, validación, cálculo, tabla, formato |
| `src/lib/calculadora-svg.ts` | SVG de barras generado desde las filas de la tabla |
| `src/components/CalculadoraInteresCompuesto.astro` | Formulario accesible, resultados, tabla y script de recálculo |
| `src/pages/oros/herramientas/[slug].astro` | Ruta única de herramientas; monta la calculadora para su slug |
| `src/layouts/Herramienta.astro` | Metodología, fórmula, parámetros, supuestos y límites (slot `resultado`) |
| `src/content/herramientas/herr-interes-compuesto.yaml` | Ficha: versión del motor, fórmula, parámetros, límites |
| `tests/calculadora.ts` | 27 pruebas con los vectores de §5 |
