---
id: art-dca-interes-compuesto
status: publicado
creado: 2026-10-26
publicado: 2026-10-26
revisado_factual: 2026-10-26
sensibilidad: media
procedencia: original
autorias:
  redactor: aut-marc-villarroya
  revisor: aut-revision-factual-qa
fuentes:
  - fuente: src-s4-03
    dato: La rentabilidad pasada no garantiza la futura; el folleto y el DFI informan de riesgo y costes.
  - fuente: src-s4-01
    dato: La ganancia del reembolso se integra en la base del ahorro y soporta una retención del 19 % a cuenta.
  - fuente: src-ine-ipc-septiembre-2026
    dato: IPC general de septiembre de 2026 en el 4,9 % anual, con la subyacente en el 3,1 %.
seo:
  descripcion: "El interés compuesto con aportación mensual, tres escenarios de tasa y la corrección por inflación y por impuestos."
  noindex: false
actualizacion:
  politica: revision-anual
slug: dca-interes-compuesto
titulo: "Aportar cada mes o de golpe: la aritmética del largo plazo"
resumen: Qué hace de verdad la aportación periódica, cómo se calcula el interés compuesto cuando añades dinero cada mes y por qué el resultado cambia tanto con la tasa.
tipo: guia
nivel: basico
temas: [tema-inversion]
videos: [vid-u0AKp6bpdGo]
herramientas: [herr-interes-compuesto]
glosario: [glo-dca, glo-traspaso-fondos]
preguntas:
  - pregunta: ¿La aportación periódica elimina el riesgo de invertir?
    respuesta: No. Reparte el precio de entrada y reduce el riesgo de comprar todo en el peor día, pero no protege de una caída larga del mercado ni garantiza rentabilidad.
  - pregunta: ¿Por qué el resultado de aportar 200 euros al mes no es 200 por 12 por los años?
    respuesta: Porque cada aportación empieza a generar rendimiento en un momento distinto; el capital final suma la aportación más los intereses de cada una, no una multiplicación simple.
---

# Aportar cada mes o de golpe: la aritmética del largo plazo

Hay dos preguntas mezcladas en casi todas las conversaciones sobre invertir poco a poco. Una es
estratégica: ¿aporto todos los meses o meto el dinero de una vez? Otra es puramente matemática:
cuando añades dinero cada mes, ¿cómo se calcula lo que tendrás al final? La segunda tiene respuesta
exacta; la primera, no.

Y conviene tener la aritmética clara antes de discutir la estrategia, porque la mayoría de las
comparaciones que circulan están mal hechas: suman las aportaciones, aplican un porcentaje y ya.

## 1. La fórmula, sin adornos

Para un capital inicial sin aportaciones:

    Capital final = C0 · (1 + i)^n

Para aportaciones periódicas a **fin de periodo**:

    Capital final = A · [((1 + i)^n − 1) / i]

Dos condiciones que se incumplen a diario:

1. **`i` y `n` tienen que estar en la misma unidad.** Si aportas cada mes, `i` es el tipo mensual y
   `n` el número de meses. Si usas el 5 % anual con `n = 240` meses, el resultado es basura.
2. **La tasa tiene que ser una hipótesis tuya, no una promesa.** La rentabilidad pasada no garantiza
   la futura `[hecho]` (`src-s4-03`).

Si partes de una tasa **efectiva anual** del 5 % y aportas mensualmente, el tipo mensual equivalente
es (1,05)^(1/12) − 1 = **0,407412 %** `[cálculo]`. Ese detalle cambia el resultado en miles de euros
frente a dividir el 5 % entre 12.

## 2. Tres casos con números comprobados

Todos con la misma hipótesis `[cálculo]`: 5 % efectivo anual, aportación a fin de mes, sin comisiones
ni impuestos, cifras nominales.

**a) 200 € al mes durante 20 años.** Aportas 48.000 €. Capital final:
**81.160,90 €**. Ganancia: 33.160,90 €. Es decir, el tiempo añade un 69 % sobre lo aportado.

**b) 300 € al mes durante 30 años.** Aportas 108.000 €. Capital final: **244.612,77 €**. El salto de
20 a 30 años parece pequeño en tiempo y es enorme en resultado: 10 años más de aportación (36.000 €)
y de composición añaden más de 160.000 €.

**c) 1.000 € al mes durante 12 meses.** Capital final: **12.272,58 €**, frente a 12.600 € si
hubieras puesto los 12.000 € de golpe el primer día. En un solo año, aportar por fases deja menos
dinero porque el capital medio invertido es menor.

Ese último caso es la clave del debate: **en mercados que suben, aportar de golpe gana**; en
mercados que caen al principio, aportar por fases pierde menos. Cuál de los dos ocurre solo se sabe
después. No hay evidencia primaria institucional citada en esta base que cuantifique la ventaja de
una estrategia sobre la otra `[inferencia]`, así que aquí no se afirma superioridad.

## 3. Sensibilidad a la tasa: el mismo plan, tres finales

Con las mismas aportaciones de 200 € al mes durante 20 años `[cálculo]`:

| tasa anual hipotética | capital final | ganancia sobre 48.000 € aportados |
|---|---|---|
| 0 % | 48.000,00 € | 0 € |
| 3 % | 65.370,89 € | 17.370,89 € |
| 5 % | 81.160,90 € | 33.160,90 € |

Dos puntos de diferencia en la hipótesis cambian el resultado en unos 16.000 €. Por eso los
productos que prometen «un 7 % anual» son un problema: la promesa está en el sitio equivocado.

## 4. La regla del 72 y el interés compuesto sin aportaciones

Para estimar cuánto tarda un capital en duplicarse a una tasa dada, divide 72 entre la tasa `[cálculo]`:

- Al 5 %: 72 / 5 = **14,4 años**.
- Al 3 %: 72 / 3 = 24 años.
- Al 8 %: 9 años.

Y el ejemplo canónico: 1.000 € al 5 % durante 10 años = 1.000 × 1,05¹⁰ = **1.628,89 €**. Diez años
para un 63 % nominal. El mismo 1.000 € durante 20 años a la misma tasa = **2.653,30 €**: el segundo
decenio rinde más que el primero, porque trabaja sobre un capital mayor.

## 5. El impuesto y la inflación, que sí se comen el resultado

Las cifras anteriores son nominales y brutas. Dos correcciones que cambian la lectura:

**Fiscalidad.** La ganancia se integra en la base del ahorro y en el reembolso hay una retención del
19 % a cuenta `[hecho]` (`src-s4-01`). No es el tipo final: la escala del ahorro va del 19 % al 30 %.
Si tu ganancia es de 33.160,90 €, la retención a cuenta serían aproximadamente 6.300 € y el tipo
final depende de tu base.

**Inflación.** Con el IPC general en el 4,9 % anual en septiembre de 2026 `[hecho]` (`src-ine-ipc-septiembre-2026`),
los 81.160,90 € de dentro de 20 años no valen lo mismo que hoy. Si la inflación se mantuviera en ese
4,9 % durante dos décadas `[hipótesis]`, su poder de compra sería de unos **31.177 €**, no 81.160.
Y los 1.628,89 € de 1.000 € a 10 años al 5 % equivaldrían a unos 1.009 € de hoy.

Conclusión incómoda: con inflación alta, una rentabilidad nominal moderada puede ser real negativa.
Por eso se mira la rentabilidad **real** (descontando inflación) y no solo la cifra de la cuenta.

## 6. Dónde encaja el DCA y dónde no

La aportación periódica (DCA) tiene tres utilidades concretas y reales:

1. **Convierte el ahorro en hábito**: la orden automática elimina la decisión mensual, que es donde
   se pierde el plan.
2. **Evita el todo o nada**: si empiezas con una cantidad grande y el mercado cae un 20 % la semana
   siguiente, la tentación de abandonar es alta.
3. **Encaja con ingresos mensuales**: la mayoría de la gente no tiene un capital completo disponible;
   tiene flujo de caja.

Lo que el DCA **no** hace:

- No elimina el riesgo de mercado. Una caída larga sigue doliendo con aportaciones mensuales.
- No garantiza mejor resultado que la aportación única. Depende de la secuencia de precios.
- No convierte un mal producto en bueno: si el coste anual es del 2 %, aportar cada mes no lo arregla.

## 7. Cómo se usa la calculadora (y cómo no)

La [calculadora de interés compuesto](/oros/herramientas/interes-compuesto/) pide capital inicial,
aportación mensual, años y una tasa anual hipotética. Calcula en tu navegador y no envía datos a
ningún servidor.

Buen uso: comparar escenarios con la misma tasa y distinto plazo, o ver cuánto aporta el capital
inicial frente a la aportación mensual.

Mal uso: introducir un 10 % «porque es lo que quiero sacar» y creer el resultado. La calculadora
multiplica; no predice.

## 8. Errores que se ven todos los días

- Aplicar el tipo anual a periodos mensuales (el error más caro y más común).
- Sumar aportaciones y aplicar el porcentaje una sola vez: ignora que cada aportación compone desde
  su fecha.
- Comparar el resultado bruto con el neto de otro producto.
- Ignorar la inflación al hablar de 20 o 30 años.
- Suponer que una tasa del 2 % real es poco: durante 30 años es mucho.

## 9. Límites y supuestos

- Tasa constante durante todo el periodo: en la realidad no existe.
- Sin comisiones, sin impuestos y sin inflación en las cifras de los apartados 2, 3 y 4; se corrigen
  en el apartado 5.
- Aportación a fin de periodo; si se hace a principio, el resultado es ligeramente mayor.
- La hipótesis de inflación del 4,9 % mantenida 20 años es un escenario, no una previsión.
- No se afirma que una estrategia de aportación sea superior a la otra.
- No es asesoramiento financiero individualizado.

**Aviso**: contenido formativo sobre aritmética financiera. No sustituye el asesoramiento de un
profesional registrado.

## Siguiente paso

1. Calcula tu propio escenario con una tasa que puedas justificar con la
   [calculadora](/oros/herramientas/interes-compuesto/).
2. Lee [fondos indexados y ETF](/oros/guias/fondos-indexados-vs-etf/) si aún no has decidido el
   vehículo.
3. Comprueba que el dinero que vas a aportar no hace falta antes de cinco años.
