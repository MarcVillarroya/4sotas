# Finanzas · contrato matemático de las calculadoras

Documento de referencia de `src/lib/finanzas/`. Fija las fórmulas, los supuestos y los
vectores de prueba **antes** de tocar la interfaz, para que el número publicado y el número
calculado no puedan divergir sin que falle un test.

Alcance de esta entrega: `prestamo`, `hipoteca` y `viabilidad-hipoteca`. Fuera de alcance,
por decisión de producto: Euríbor y tipos variables, nómina bruto/neto, scoring o
probabilidad de aprobación, tipos en vivo y datos personales.

## 1 · Reglas del motor

- Módulos puros: sin DOM, `window`, `fetch`, `localStorage`, cookies ni estado global.
- Los errores de los datos del formulario se devuelven como valor
  (`{ ok: false, errores: [{ campo, mensaje }] }`), nunca como excepción. Las excepciones
  quedan para errores de programación (por ejemplo, un plazo no entero al llamar a la
  cuota francesa).
- Se calcula con coma flotante y **se redondea solo al presentar**. La tabla se publica
  redondeada al céntimo y la última cuota ajusta el capital pendiente a cero.
- Toda entrada se valida antes de calcular: `NaN`, `Infinity`, negativos, plazos no
  enteros y campos vacíos devuelven error por campo, no resultados parciales.
- `parsearNumero` acepta coma decimal es-ES, punto decimal, separadores de millar,
  espacios, `%` y `€`; cualquier otra cosa es `NaN`.

## 2 · Sistema francés (cuota constante)

`src/lib/finanzas/amortizacion.ts`

```
i = TIN / 100 / 12
cuota = P · i / (1 − (1 + i)^−n)      si i > 0
cuota = P / n                          si i = 0
interés del mes   = capital pendiente · i
amortización mes  = cuota − interés del mes
pendiente        -= amortización del mes
total            = cuota · n
intereses        = total − P
```

- `P` = principal, `n` = meses, `i` = tipo mensual.
- El cuadro público es **anual**: se agrupan 12 cuotas y el último tramo parcial conserva su
  número real de cuotas.
- La última cuota se ajusta (`amortización = pendiente`) para que la tabla cierre en 0. El
  total sigue siendo `cuota · n`, así que la diferencia por redondeo es de céntimos, no de
  euros.

## 3 · Préstamo y TAE

`src/lib/finanzas/prestamo.ts`

```
comisión      = importe · comisionPct / 100
principalNeto = importe − comisión
```

La cuota se calcula sobre el **importe** (no sobre el neto). La TAE se resuelve desde el
flujo real de pagos, no se copia del TIN:

```
principalNeto = Σ cuota / (1 + r)^k ,  k = 1…n
TAE = (1 + r)^12 − 1
```

Se resuelve `r` por bisección en `[0, 1]` con 200 iteraciones y una tolerancia muy inferior
al céntimo. Sin comisión la TAE sigue siendo una tasa efectiva anual y es mayor que el TIN
nominal; **nunca se presenta el TIN como TAE**.

## 4 · Hipoteca fija

`src/lib/finanzas/hipoteca.ts`

```
importe = precio − entrada
LTV     = importe / precio
cuota   = sistema francés(importe, TIN, plazoAnios · 12)
```

La entrada debe ser estrictamente menor que el precio. No se modela Euríbor, tipo variable,
carencia, cuota extra ni amortización anticipada.

## 5 · Viabilidad de hipoteca

`src/lib/finanzas/viabilidad.ts`

```
gastos          = precio · gastosPct / 100
hipoteca        = precio − entrada
LTV             = hipoteca / precio
cuota           = sistema francés(hipoteca, TIN, plazoAnios · 12)
cuotaEstrés     = sistema francés(hipoteca, TIN + 2, plazoAnios · 12)
efectivo        = ahorro − entrada − gastos
DTI             = (cuota + otrasDeudas) / ingresos
DTI             = (cuotaEstrés + otrasDeudas) / ingresos   (estrés)
ingresosMínimos = (cuota + otrasDeudas) / 0,35
```

Umbrales del veredicto (práctica de mercado, **no** norma legal):

| veredicto   | LTV   | DTI   | DTI estrés | efectivo restante |
|-------------|-------|-------|------------|-------------------|
| Holgado     | ≤ 80 % | ≤ 35 % | ≤ 40 %    | ≥ 6 cuotas        |
| Justo       | ≤ 90 % | ≤ 40 % | ≤ 45 %    | ≥ 3 cuotas        |
| No encaja   | no cumple Holgado ni Justo, o efectivo < 0 | | | |

El veredicto es un **encaje aritmético orientativo**: no es una aprobación bancaria ni una
probabilidad. El 80 % de financiación y el 35–40 % de endeudamiento se declaran como
práctica de mercado citando las fuentes del tema de vivienda y banca.

## 6 · Vectores independientes

Calculados con Python `Decimal` (50 dígitos) fuera del motor y fijados en `tests/finanzas-*.ts`.

### Cuota francesa

| caso | entrada | cuota | total | intereses |
|---|---|---:|---:|---:|
| H1 | 200.000 €, 3 %, 360 meses | 843,21 € | 303.554,90 € | 103.554,90 € |
| H2 | 240.000 €, 3 %, 360 meses | 1.011,85 € | 364.265,89 € | 124.265,89 € |
| H3 | 250.000 €, 3,5 %, 360 meses | 1.122,61 € | 404.140,22 € | 154.140,22 € |
| P1 | 15.000 €, 7 %, 60 meses | 297,02 € | 17.821,08 € | 2.821,08 € |
| P2 | 12.000 €, 0 %, 12 meses | 1.000,00 € | 12.000,00 € | 0,00 € |

Tabla anual de P1 (referencia de los tests): año 1 intereses 967,75 € y pendiente
12.403,53 €; año 5 intereses 131,54 € y pendiente 0.

### TAE

| caso | TIN | comisión | TAE |
|---|---:|---:|---:|
| 15.000 €, 7 %, 60 meses | 7,00 % | 0 % | 7,2290 % |
| 15.000 €, 7 %, 60 meses | 7,00 % | 1 % | 7,6804 % |
| 200.000 €, 3 %, 360 meses | 3,00 % | 1 % | 3,1226 % |

### Viabilidad

| caso | datos | resultado |
|---|---|---|
| V1 | precio 300.000, ahorro 100.000, entrada 100.000, gastos 30.000, TIN 3 %, 30 años, ingresos 3.000 | hipoteca 200.000; LTV 66,67 %; cuota 843,21; gastos 30.000; efectivo **−30.000**; DTI 28,11 %; DTI estrés 35,79 %; ingresos mínimos 2.409,17; **No encaja** (liquidez) |
| V1b | igual que V1 con ahorro 140.000 | efectivo **10.000**; **Holgado** |
| V2 | precio 300.000, ahorro 60.000, entrada 60.000, gastos 30.000 | hipoteca 240.000; cuota 1.011,85; efectivo **−30.000**; **No encaja** |
| V3 | precio 300.000, entrada 60.000, ingresos 2.800, otras deudas 300 | cuota 1.011,85; DTI **46,85 %**; ingresos mínimos 3.748,14; **No encaja** |
| V4 | precio 300.000, ahorro 120.000, entrada 60.000, ingresos 3.000 | efectivo 30.000; DTI 33,73 %; estrés 42,90 %; **Justo** |

**Divergencia documentada con la tarjeta de trabajo (V1).** La tarjeta pedía, para V1,
«ahorro 100.000 → efectivo 10.000», pero con `efectivo = ahorro − entrada − gastos` el
resultado de esos datos es `100.000 − 100.000 − 30.000 = −30.000`. Las demás cifras del mismo
vector (hipoteca 200.000, LTV 66,7 %, cuota 843,21, DTI 28,11 %) sí cuadran. Se implementa la
aritmética coherente: V1 queda como caso **sin liquidez** y el escenario «Holgado» con
10.000 € de colchón se fija como **V1b** con 140.000 € de ahorro. No se ha tocado ningún
esquema ni se ha maquillado el resultado para que cuadre la cifra original.

## 7 · Presentación y accesibilidad

- Resultado principal en texto; la tabla HTML es la fuente de verdad del dato. El gráfico,
  si existe, nunca es el único sitio donde está la cifra.
- Sin JavaScript se ve un ejemplo calculado en build con el mismo motor, la fórmula, los
  supuestos, los límites y la tabla anual completa.
- Cada campo tiene `label`, unidad visible, `aria-describedby`, párrafo de error propio y
  `aria-invalid` cuando falla. Los errores se anuncian por `role="status"`/`aria-live`.
- Objetivos táctiles de 44 px, foco visible, cálculo con Enter y foco al primer campo
  inválido tras un error.
- Copy obligatorio presente en las tres páginas: «Esto no es una oferta ni una aprobación
  bancaria», «No incluye seguros, comisiones de mantenimiento ni vinculaciones» y, en
  viabilidad, «Encaje orientativo con tus datos; cada entidad decide» junto a
  «Los gastos de compra varían por comunidad y tipo de vivienda; el porcentaje es editable».

## 8 · Estado y gates

Estado de las fichas: `status: revision`, `estado_implementacion: beta`,
`sensibilidad: alta` y revisor factual declarado. No se marcan `publicado` ni `estable`
hasta la revisión factual.

Tests: `tests/finanzas-numero.ts`, `finanzas-amortizacion.ts`, `finanzas-prestamo.ts`,
`finanzas-hipoteca.ts` y `finanzas-viabilidad.ts`. El esquema de la colección exige
`tests: tests/<nombre>.ts` (sin `.test` en el nombre), así que se ejecutan desde
`npm test` añadiendo el glob `tests/finanzas-*.ts` al script; no se ha modificado el
esquema para saltarse la regla.

Gates comprobados: `npm run check` (0 errores), `npm test` (196 pass, 1 skip heredado),
`npm run build`, `npm run build:fixtures` y `npm run verificar:plantillas` (0 fallos).

`npm run validate` queda con 3 bloqueantes esperados: `B-REF-PRIVADA` porque
`tema-vivienda` y `tema-banca` (publicados) referencian herramientas en `revision`. El
validador protege contra fugas de borradores y no se ha relajado. El build público no
genera esas páginas ni esos enlaces; cuando las fichas pasen a `publicado` en la revisión
factual, los tres bloqueantes desaparecen sin tocar código.
