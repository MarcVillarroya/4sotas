---
id: art-inflacion-poder-adquisitivo
status: publicado
universo: oros
creado: 2026-10-26
publicado: 2026-10-26
revisado_factual: 2026-10-26
sensibilidad: alta
procedencia: original
autorias:
  redactor: aut-marc-villarroya
  revisor: aut-revision-factual-qa
fuentes:
  - fuente: src-ine-ipc-septiembre-2026
    dato: IPC general 4,9 % anual, subyacente 3,1 %, mensual 0,3 %, IPCA 5,0 %
  - fuente: src-ine-ipc-adelantado-septiembre-2026
    dato: El avance del 30-sep-2026 ya señalaba el 4,9 % anual
  - fuente: src-bce-decision-tipos-sep-2026
    dato: Tipos BCE de referencia vigentes desde el 16-sep-2026
  - fuente: src-bce-tipos-oficiales
    dato: Serie oficial de tipos del BCE
  - fuente: src-bde-euribor-septiembre-2026
    dato: Euríbor a 12 meses 3,247 % en septiembre de 2026
  - fuente: src-bde-comparador-tipos-comisiones
    dato: No existe un tipo oficial de cuenta remunerada; el BdE publica comparador
  - fuente: src-bde-estadisticas-tipos-interes
    dato: Estadísticas oficiales de tipos de interés de depósitos y crédito
seo:
  titulo: "Inflación: cuánto dinero pierdes y cómo se calcula"
  descripcion: "Cómo se traduce el IPC del 4,9 % en euros: cálculo exacto de la pérdida de poder adquisitivo, tipo de interés real y qué no mide la inflación."
  noindex: false
actualizacion:
  politica: revision-semestral
  proxima_revision: 2027-01-20
destacado: true
slug: inflacion-poder-adquisitivo
titulo: "Inflación y poder adquisitivo: la cuenta que convierte la tasa en euros"
resumen: "El IPC de septiembre de 2026 marca un 4,9 % anual. Esta guía convierte esa tasa en euros perdidos, explica por qué se divide en vez de restar y calcula el tipo de interés real de lo que tienes parado."
tipo: explicador
nivel: basico
temas: [tema-inflacion]
videos: [vid-i5fe580iFqk]
glosario: [glo-ipc, glo-inflacion-subyacente]
preguntas:
  - pregunta: "¿Se resta el IPC al dinero para saber cuánto poder de compra pierde?"
    respuesta: "No, se divide. Con un IPC del 4,9 %, 1.000 euros equivalen a 1.000 / 1,049 = 953,29 euros de poder de compra, no a 951 euros. Restar la tasa es una aproximación que se aleja del resultado cuando la inflación es alta o se acumulan varios años."
  - pregunta: "¿Un depósito al 2,5 % me hace ganar con una inflación del 4,9 %?"
    respuesta: "En términos nominales sí, en términos de poder de compra no. El tipo real es (1,025 / 1,049) − 1 = −2,29 %, es decir, pierdes capacidad de compra frente a los precios. Además habría que restar la fiscalidad de los rendimientos."
---

# Inflación y poder adquisitivo: la cuenta que convierte la tasa en euros

**Tesis:** la inflación no se combina con tu dinero sumando o restando: se combina **dividiendo**, porque los índices se encadenan de forma multiplicativa. Con la tasa de septiembre de 2026, 1.000 € en efectivo valen 953,29 € de poder de compra dentro de un año. Cualquier otra cuenta es una aproximación y conviene decirlo.

## 1. Los datos, con fecha y ámbito

- **IPC general: 4,9 % anual** en septiembre de 2026, frente al 4,3 % de agosto (+0,6 puntos) [hecho] ([INE, nota de prensa](https://ine.es/dyngs/Prensa/IPC0926.htm)).
- **Inflación subyacente: 3,1 % anual** (+0,2 puntos), que excluye alimentos no elaborados y energía.
- **Variación mensual: +0,3 %**; **IPCA: 5,0 % anual**.
- El **indicador adelantado** del 30-sep-2026 ya apuntaba al 4,9 %, con influencia de combustibles y lubricantes [hecho].

Ámbito: **España**. El INE publica también índices por comunidad autónoma y por grupos de gasto; esta guía usa el índice general, que es una media ponderada de la cesta de consumo media, no de la tuya.

## 2. La operación correcta

Si la inflación anual es π, el poder de compra de una cantidad C es:

> C / (1 + π)

Con C = 1.000 € y π = 4,9 %:

> 1.000 / 1,049 = **953,29 €** → pérdida de **46,71 €**, es decir, **4,67 %** del valor inicial [cálculo]

La pérdida porcentual **no es el 4,9 %**: es 1 − 1/1,049 = 4,67 %. La diferencia parece pequeña, pero crece con la tasa y con el tiempo.

| cantidad | cálculo | poder de compra en un año | pérdida |
|---|---|---|---|
| 1.000 € | 1.000 / 1,049 | 953,29 € | 46,71 € |
| 10.000 € | 10.000 / 1,049 | 9.532,89 € | 467,11 € |

El segundo caso es el que desarrolla el vídeo [Tu dinero parado pierde valor](https://www.youtube.com/watch?v=i5fe580iFqk), y la cifra coincide.

## 3. Cuando la inflación se acumula

La pérdida no es lineal. Con la misma tasa durante varios años:

- **5 años:** 10.000 / 1,049⁵ = 10.000 / 1,270216 = **7.872,68 €** → **21,27 %** menos [cálculo].
- **3 años:** 10.000 / 1,049³ = **8.663,10 €** → pérdida de **1.336,90 €** [cálculo].

Repetir el 4,9 % durante cinco años es una **hipótesis**, no una previsión: el INE revisa la tasa cada mes y ningún organismo publica una senda de inflación garantizada. Se usa para entender la mecánica, no para planificar.

## 4. El tipo de interés real, que es lo que importa

Comparar una rentabilidad nominal con la inflación tiene una fórmula exacta:

> tipo real = (1 + tipo nominal) / (1 + inflación) − 1

Con los tipos de referencia vigentes desde el 16-sep-2026 [hecho] ([BCE](https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.mp260910~314e508016.en.html)):

| referencia | nominal | cálculo | tipo real |
|---|---|---|---|
| facilidad de depósito BCE | 2,50 % | 1,025 / 1,049 − 1 | **−2,29 %** |
| euríbor 12 meses (sept-2026) | 3,247 % | 1,03247 / 1,049 − 1 | **−1,58 %** |

Ambos son negativos frente al IPC del 4,9 %. Dos advertencias que evitan un mal uso de la tabla:

1. La facilidad de depósito del BCE **no es un producto para particulares**: es el tipo al que los bancos depositan en el banco central.
2. El euríbor es una **referencia hipotecaria**, no una rentabilidad que puedas cobrar. Solo es oficial tras su publicación en el BOE, como recuerda el propio Banco de España [hecho].

Y si lo que comparas es una **cuenta remunerada o un depósito**, no hay tipo oficial que citar: el BdE publica un comparador alimentado por las entidades, y cada TAE es una oferta comercial que cambia sin preaviso largo [hecho]. Por eso este sitio no publica TAE sueltas.

## 5. El caso del salario congelado

Supón un neto de 1.630 € al mes y un sueldo que no se revisa. Con un IPC del 4,9 %, ese neto equivale a:

> 1.630 / 1,049 = **1.553,86 €** de poder de compra [cálculo]

Es la forma correcta de decir "me han bajado el sueldo sin tocarlo". Que la inflación "suba los sueldos" es falso: los salarios dependen de convenios, empresa y negociación; el IPC solo mide precios [hecho, y la afirmación contraria es opinión].

## 6. Lo que la inflación no hace

- **No mide el precio de tus activos.** Que suba el IPC no implica que suban las acciones, los pisos de tu barrio ni tu fondo.
- **No es igual para todos los hogares.** Una familia que gasta más proporción en energía o alimentación vive una inflación distinta de la media.
- **No se puede "ganar" con efectivo.** Dejar el dinero quieto no es una posición neutral: es una posición con pérdida real conocida.
- **No convierte una TAE comercial en una recomendación.** El comparador es el sitio donde mirar; la decisión, tuya.

## 7. Límites de esta guía

- Usa el **índice general nacional**: no sustituye al índice de tu comunidad ni a la evolución de tus gastos reales.
- La tasa de septiembre de 2026 es un dato **mensual** sujeto a revisión y a la publicación de nuevas notas.
- No modela fiscalidad de los rendimientos: la escala del ahorro va del 19 % al 30 %, así que el tipo real después de impuestos es aún menor.
- No incluye comisiones de productos financieros, que empeoran el resultado.

## Siguiente paso

Si el problema es que el dinero quieto pierde, el siguiente paso no es buscar la rentabilidad más alta: es ordenar las prioridades en [ahorro y primeros 1.000 €](/oros/temas/ahorro/). Y si lo que te interesa es cuánto de tu nómina se va antes de llegarte, empieza por la [nómina](/oros/temas/nomina/).

## Fuentes

- INE. *IPC septiembre 2026*. Publicada el 15-oct-2026. https://ine.es/dyngs/Prensa/IPC0926.htm
- INE. *Indicador adelantado del IPC, septiembre 2026*. Publicado el 30-sep-2026. https://ine.es/dyngs/Prensa/adIPC0926.htm
- BCE. *Monetary policy decisions, 10 September 2026*. https://www.ecb.europa.eu/press/pr/date/2026/html/ecb.mp260910~314e508016.en.html
- BCE. *Key ECB interest rates*. https://www.ecb.europa.eu/stats/policy_and_exchange_rates/key_ecb_interest_rates/html/index.en.html
- Banco de España. *El euríbor se sitúa en el 3,247 % en septiembre*. Publicado el 1-oct-2026. https://www.bde.es/wbe/es/noticias-eventos/actualidad-banco-espana/notas-banco-espana/el-euribor-se-situa-en-el-3243-en-septiembre-1075-puntos-mas-que-hace-un-ano.html
- Banco de España. *Comparador de tipos de interés y comisiones*. Consultada el 26-oct-2026. https://clientebancario.bde.es/pcb/es/menu-horizontal/actualidadeducac/educacion-financiera/comparadores-y-simuladores/
- Banco de España. *Estadísticas de tipos de interés*. https://www.bde.es/webbe/es/estadisticas/temas/tipos-interes.html

> Contenido formativo sobre cómo se mide la inflación y su efecto en el poder de compra. No es una previsión de inflación ni asesoramiento financiero individualizado.
