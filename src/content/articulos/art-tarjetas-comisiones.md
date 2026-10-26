---
id: art-tarjetas-comisiones
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
  - fuente: src-s5-03
    dato: Definiciones oficiales de débito, crédito, revolving y prepago.
  - fuente: src-s5-01
    dato: Modalidades de pago aplazado, riesgo de que la cuota no cubra los intereses y equivalencia 1,5 % mensual = 18 % nominal anual.
  - fuente: src-s5-02
    dato: Pago total a fin de mes frente a revolving, con el capital devuelto disponible otra vez.
  - fuente: src-s5-04
    dato: Las comisiones de emisión y mantenimiento son libres, con información previa y aceptación.
  - fuente: src-s5-05
    dato: Lista de servicios más representativos de una cuenta de pago y comparador de comisiones del BdE.
  - fuente: src-s5-06
    dato: Definición legal de TAE en el artículo 4 de la Ley 5/2019.
  - fuente: src-bde-comparador-tipos-comisiones
    dato: Simuladores oficiales, incluido el cálculo de fecha de fin de una revolving.
  - fuente: src-bde-comparador-tipos-comisiones
    dato: Comparador del BdE de tipos y comisiones, alimentado por las entidades.
  - fuente: src-bde-consulta-endeudamiento-40
    dato: Referencia de que la deuda total no debería superar el 40 % de los ingresos netos mensuales.
seo:
  descripcion: "Débito, crédito y revolving: cuándo sale el dinero, cuánto cuesta aplazar y por qué el 1,5 % mensual es un 18 % nominal."
  noindex: false
actualizacion:
  politica: cuando-cambie-normativa
slug: tarjetas-y-comisiones
titulo: "Débito, crédito y revolving: cómo se paga de verdad una tarjeta"
resumen: La diferencia entre una tarjeta y otra no es el plástico, sino cuándo sale el dinero y cuánto cuesta que no esté. Con la aritmética del pago aplazado hecha.
tipo: guia
nivel: basico
temas: [tema-banca]
videos: [vid-vefjjmzDHyY]
glosario: [glo-tae, glo-tin]
preguntas:
  - pregunta: ¿Pagar el total de la tarjeta a fin de mes tiene intereses?
    respuesta: Normalmente no. El coste aparece cuando se aplaza el pago en cuotas, que es donde se aplican intereses y, en su caso, comisiones.
  - pregunta: ¿Cuánto es un 1,5 % mensual en tasa anual?
    respuesta: Un 18 % nominal anual según la conversión que usa el Banco de España; la TAE es superior, un 19,56 % con capitalización mensual y sin comisiones.
---

# Débito, crédito y revolving: cómo se paga de verdad una tarjeta

Una tarjeta es un instrumento de pago con una condición contractual detrás. La pregunta que ordena
todo lo demás es sencilla: **¿de quién es el dinero que estás gastando?** Si es tuyo, hablamos de
débito o prepago. Si es del banco, hablamos de crédito, y ahí empieza a correr un reloj.

## 1. Los cuatro tipos, en una tabla

| tipo | cuándo sale el dinero | de dónde sale | coste habitual |
|---|---|---|---|
| **Débito** | al confirmar la compra | saldo de tu cuenta | «similar al efectivo»: la tarjeta suele ser gratuita, aunque puede tener comisión `[hecho]` |
| **Crédito** | a fin de mes, o aplazado | línea de crédito de la entidad | 0 si pagas el total; intereses si aplazas |
| **Revolving** | en cuotas mensuales | línea que se reutiliza al amortizar | intereses altos y persistentes |
| **Prepago** | al cargar el saldo | saldo precargado | comisión de emisión o recarga, según contrato |

Definiciones del Banco de España `[hecho]` (`src-s5-03`). La distinción operativa que importa: en
débito, si no hay saldo, no hay compra; en crédito, sí hay compra, y la entidad te presta el dinero
hasta que lo devuelvas.

## 2. El pago aplazado: donde se pierde el dinero

En una tarjeta de crédito puedes pagar:

- **el total a fin de mes**, normalmente sin intereses;
- **una cuota**, un porcentaje del saldo o un importe fijo `[hecho]` (`src-s5-01`, `src-s5-02`).

La cuota es el problema. El propio Banco de España lo advierte: *«si el uso de la tarjeta supera un
determinado importe, la cuota puede no alcanzar los intereses generados y la deuda podría aumentar
en vez de reducirse»*.

Ejemplo cerrado `[cálculo]`, con la fórmula de amortización francesa:

- Deuda: **3.000 €**.
- Tipo: **1,5 % mensual** sobre saldo pendiente.
- Pago: **60 € al mes**.

Primer mes: 45,00 € de intereses y 15,00 € de amortización. Resultado: **94 meses** (7 años y 10
meses) para llegar a cero y **2.586,71 €** de intereses pagados, un 86 % del capital inicial. No es
un ejemplo extremo: es aritmética con un tipo que el propio Banco de España usa como referencia
habitual de las revolving.

Y si la cuota baja por debajo de los intereses (por ejemplo, porque el mínimo es un porcentaje del
saldo y el saldo crece), el saldo **sube** aunque pagues todos los meses. Es la trampa estructural del
producto, no un caso raro.

## 3. Del tipo mensual al anual: 18 % nominal, 19,56 % TAE

El BdE convierte así `[hecho]` (`src-s5-01`): 1,5 % **mensual** = 18 % **nominal anual** (1,5 × 12).

La TAE es otra cosa: incluye la capitalización y los costes aparejados. Con capitalización mensual y
**sin comisiones** `[cálculo]`:

    TAE = (1 + 0,015)^12 − 1 = 19,56 %

Con comisiones, seguro o cuota de mantenimiento, la TAE real es mayor. Y la TAE es la cifra legal de
comparación: «coste total del préstamo para el prestatario, expresado como porcentaje anual del
importe total del préstamo concedido, más los costes aparejados» (art. 4 de la Ley 5/2019)
`[hecho]` (`src-s5-06`).

Por eso comparar «1,5 % al mes» con «19 % TAE» sin convertir es comparar dos idiomas distintos.

## 4. Comisiones: libres, pero informadas

Las comisiones de emisión y mantenimiento de tarjeta **no tienen un tope legal general**: son
libres, y la entidad debe informar antes y obtener tu aceptación (expresa o tácita según el
contrato) `[hecho]` (`src-s5-04`). Traducido: no existe un «precio justo» al que agarrarse; existe
la información precontractual y tu decisión.

Dónde mirar antes de firmar:

1. **Cuota anual** de la tarjeta y si depende de domiciliar la nómina.
2. **Comisión por retirada de efectivo** en cajero (suele ser distinta en España y en el extranjero).
3. **Comisión por cambio de divisa** si viajas.
4. **Interés de demora** y comisión por reclamación de posiciones deudoras.
5. **Condiciones de la promoción**: qué pasa el mes 13.

El Banco de España publica la lista de servicios más representativos de una cuenta de pago y un
comparador de comisiones `[hecho]` (`src-s5-05`), además de un comparador de tipos y comisiones
`[hecho]` (`src-bde-comparador-tipos-comisiones`). Es la fuente correcta para comparar; la publicidad de la entidad no lo es.

## 5. Cashback: cuéntalo después de los costes

El cashback devuelve un porcentaje de lo que gastas. Es una condición comercial por contrato, no un
producto regulado con estadística pública de rentabilidad, así que aquí no se publica ninguna cifra
de oferta.

La cuenta que puedes hacer tú `[cálculo]`, con números de ejemplo:

- Devolución del 1 % sobre 6.000 € de gasto anual: **60 €**.
- Comisión de la tarjeta: 36 € al año.
- Saldo neto: **24 €** al año.

Si esa misma tarjeta te lleva a aplazar pagos al 1,5 % mensual, la devolución se esfuma rápido:
aplazar 2.800 € un solo mes cuesta 42 € de intereses `[cálculo]`, casi el cashback de dos años. El
orden correcto es: primero comisiones e intereses, después la devolución.

## 6. Cuánta deuda es demasiada

La referencia del Banco de España es que el total de deudas no debería sobrepasar el **40 % de los
ingresos netos mensuales** `[hecho]` (`src-bde-consulta-endeudamiento-40`; frase literal comprobada el 26-oct-2026).

Con 1.500 € netos, el 40 % son **600 €** de cuota total `[cálculo]`. Si ya pagas 350 € de hipoteca,
el margen teórico para el resto es de 250 €. Es una referencia de prudencia, no un requisito legal ni
un criterio de concesión: cada entidad aplica el suyo.

Una tarjeta revolving entra en ese cómputo con la cuota, no con el saldo. Eso es lo que la hace
peligrosa a la hora de pedir otra financiación: la cuota parece pequeña porque el plazo es eterno.

## 7. Cómo salir de una revolving

Tres pasos concretos, sin dramatismo:

1. **Sitúa la deuda real**: saldo, tipo mensual, cuota y número de cuotas restantes. El BdE tiene un
   simulador que calcula la fecha de fin de una revolving `[hecho]` (`src-bde-comparador-tipos-comisiones`); úsalo para saber
   cuánto queda de verdad.
2. **Compara el coste de esa deuda con cualquier alternativa**: un préstamo personal con TAE menor
   puede reducir intereses, siempre que no se alargue el plazo sin calcular el total.
3. **No añadas compras nuevas a la misma línea** mientras amortizas: en revolving, el capital
   devuelto vuelve a estar disponible `[hecho]` (`src-s5-02`), así que la línea te invita a
   reutilizarla.

Y una comprobación de primero de bachillerato que casi nadie hace: suma todo lo que te queda por
pagar (cuotas × meses) y réstale el saldo actual. Ese es el precio de haber aplazado.

## 8. Errores frecuentes

- Creer que la cuota mínima es un plan de pago: puede no cubrir ni los intereses.
- Confundir TIN con TAE.
- Firmar la tarjeta del banco «porque es la de la nómina» sin mirar la cuota anual.
- Usar la revolving como cuenta de gastos corrientes.
- Ignorar el coste de retirada de efectivo: en tarjetas de crédito suele ser inmediato y con
  intereses desde el primer día según contrato.

## 9. Límites y supuestos

- No se publican TAE concretas de ofertas: cambian por entidad y campaña, y aquí no se ha verificado
  ninguna contra oferta publicada.
- El ejemplo de revolving supone tipo fijo del 1,5 % mensual y cuota constante; los contratos reales
  pueden tener comisiones añadidas y modificar el tipo con preaviso.
- El cálculo de cashback usa cifras de escenario, no una oferta real.
- La referencia del 40 % es del Banco de España y su formulación literal se comprobó en la fuente
  el 26-oct-2026.
- No es asesoramiento financiero individualizado.

**Aviso**: contenido formativo sobre productos y costes bancarios. No sustituye el asesoramiento de
un profesional registrado.

## Siguiente paso

- [Banca y crédito](/oros/temas/banca-y-credito/): cuentas, depósitos y comisiones en conjunto.
- [Comprar vivienda: de los 200.000 € al dinero que sale de tu cuenta](/oros/guias/comprar-piso-coste-real/)
  si tu siguiente crédito es hipotecario.
