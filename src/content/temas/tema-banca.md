---
id: tema-banca
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
  - fuente: src-s5-01
    dato: Modalidades de pago de la tarjeta y equivalencia 1,5 % mensual = 18 % nominal anual; una cuota que no cubre intereses hace crecer la deuda.
  - fuente: src-s5-02
    dato: Pago total a fin de mes frente a pago aplazado; en revolving el capital devuelto vuelve a estar disponible.
  - fuente: src-s5-03
    dato: Definiciones oficiales de débito, crédito, revolving y prepago.
  - fuente: src-s5-04
    dato: Las comisiones de emisión y mantenimiento de tarjeta son libres, con información previa y aceptación.
  - fuente: src-s5-05
    dato: El BdE publica la lista de servicios más representativos de una cuenta de pago y un comparador de comisiones.
  - fuente: src-s5-06
    dato: Artículo 4 de la Ley 5/2019, que define la TAE como coste total del préstamo en porcentaje anual.
  - fuente: src-bde-comparador-tipos-comisiones
    dato: Simuladores oficiales, incluido el de fecha de fin de una revolving y el de TAE de préstamo y depósito.
  - fuente: src-bde-comparador-tipos-comisiones
    dato: Comparador del BdE de tipos de interés y comisiones, alimentado por las entidades.
  - fuente: src-bde-consulta-endeudamiento-40
    dato: Referencia de que el total de deudas no debería superar el 40 % de los ingresos netos mensuales.
seo:
  descripcion: "Tarjetas, cuentas y comisiones: cuánto cuesta de verdad el dinero del banco y cómo se compara un 1,5 % mensual con una TAE."
  noindex: false
actualizacion:
  politica: cuando-cambie-normativa
slug: banca-y-credito
titulo: Banca y crédito
descripcion_corta: Cuentas, tarjetas, depósitos y comisiones explicados con las condiciones que realmente se firman.
cluster: banca
orden: 5
pilar: art-tarjetas-comisiones
temas_relacionados: [tema-inversion, tema-vivienda]
videos_destacados: [vid-vefjjmzDHyY]
---

# Banca y crédito

Un banco no es una caja de ahorros con sombrero: es una empresa que gana dinero con la diferencia
entre lo que paga por tu dinero y lo que cobra por prestarlo, más las comisiones. Entender esa frase
resuelve la mitad de las dudas sobre cuentas, tarjetas y depósitos.

## 1. La cuenta: el producto que casi nadie compara

La cuenta corriente o de pago es la puerta de entrada a todo lo demás, y es donde se acumulan
comisiones pequeñas que nadie revisa. El Banco de España publica la **lista de servicios más
representativos** de una cuenta de pago y un **comparador de comisiones** alimentado por las
entidades `[hecho]` (`src-s5-05`). Eso es la fuente correcta para comparar, no un blog de ofertas.

Qué conviene tener identificado por escrito en tu contrato:

- Comisión de mantenimiento y su periodicidad (mensual, trimestral, anual).
- Requisitos de exención: domiciliar nómina o pensión, recibos, número de operaciones, uso de
  tarjeta. **Las condiciones de exención cambian**: una cuenta «sin comisiones» lo es mientras se
  cumplan los requisitos vigentes, no para siempre.
- Comisión por transferencia, por ingreso en efectivo, por retirada en cajero ajeno.
- Comisión por descubierto y el tipo de interés de demora asociado.

Ninguna de esas comisiones tiene un tope legal general: son **libres**, con obligación de
información previa y aceptación (expresa o tácita según el contrato) `[hecho]` (`src-s5-04`). El
Banco de España no fija comisiones, solo las publica y las compara.

## 2. Tarjetas: cuatro tipos y cuatro economías distintas

| tipo | cuándo se paga | de dónde sale el dinero | coste habitual |
|---|---|---|---|
| **Débito** | al momento de la compra | tu saldo | «similar al efectivo»; la tarjeta suele ser gratuita, aunque puede tener comisión `[hecho]` |
| **Crédito** | a fin de mes o aplazado | línea de crédito de la entidad | 0 si pagas el total a fin de mes; intereses si aplazas |
| **Revolving** | en cuotas | línea que se reutiliza al amortizar | intereses altos y persistentes |
| **Prepago** | al cargar saldo | saldo precargado | comisión de emisión o recarga, según contrato |

Las definiciones son las del Banco de España `[hecho]` (`src-s5-03`). La diferencia importante no
está en el plástico, sino en **qué pasa cuando el dinero no está**: en débito no hay crédito; en
crédito sí, y se paga.

### El pago aplazado y la trampa aritmética

En una tarjeta de crédito puedes pagar el total a fin de mes (normalmente sin intereses) o en
cuotas, un porcentaje o un importe fijo `[hecho]` (`src-s5-01`, `src-s5-02`). El propio Banco de
España advierte del riesgo concreto: *«si el uso de la tarjeta supera un determinado importe, la
cuota puede no alcanzar los intereses generados y la deuda podría aumentar en vez de reducirse»*.

Ejemplo calculado `[cálculo]`: 3.000 € al 1,5 % mensual pagando 60 € al mes. Los primeros 45 € se
van en intereses y solo 15 € amortizan. Resultado: **94 meses** (7 años y 10 meses) para saldar y
**2.586,71 €** de intereses, casi el 86 % del capital inicial. Y si en algún momento la cuota baja
del importe de los intereses, el saldo crece.

Conversión de tipos del propio BdE `[hecho]`: un 1,5 % **mensual** equivale a un 18 % **nominal
anual** (1,5 × 12). La TAE es más alta: con capitalización mensual y sin comisiones, el 1,5 % mensual
da un **19,56 %** efectivo anual `[cálculo]`. Con comisiones, más.

## 3. Cashback: mecánica, no rentabilidad

El cashback devuelve un porcentaje de lo que gastas. No hay fuente oficial que lo regule como
producto ni estadística pública de su rentabilidad: es una **condición comercial por contrato**, que
la entidad puede cambiar `[hecho]` por ausencia de norma (ver `research/GAPS.md`).

La cuenta que sí puedes hacer tú `[cálculo]`, con cifras de ejemplo y no de oferta: 1 % de devolución
sobre 6.000 € de gasto anual son 60 €; si la tarjeta cuesta 36 € al año en comisión, el saldo neto
es 24 €. Si además el cashback te empuja a gastar más o a aplazar pagos con intereses, el saldo se
da la vuelta. Regla práctica: el cashback se compara **después** de comisiones e intereses, nunca
antes.

## 4. Depósitos y cuentas remuneradas: qué preguntar

- **¿Qué TAE y durante cuánto tiempo?** Las promociones suelen tener un periodo inicial y luego
  bajan a un tipo residual.
- **¿Hay límite de saldo remunerado?** Muchas remuneran solo hasta cierto importe.
- **¿Qué requisitos?** Domiciliación, nómina, contratación de otros productos.
- **¿Puedo sacar el dinero cuando quiera?** Un depósito a plazo penaliza la cancelación anticipada.

No existe un «tipo oficial de cuenta remunerada»: cualquier TAE concreta es comercial y debe citarse
con entidad y fecha `[hecho]` (`src-bde-comparador-tipos-comisiones`). Por eso esta página no publica ninguna.

Sobre la garantía de depósitos: existe un fondo de garantía que cubre depósitos hasta un límite
legal. El importe concreto **no está verificado** en esta base (`research/GAPS.md` §B), así que aquí
no se cita cifra: se comprueba en la web oficial del Fondo de Garantía de Depósitos antes de citarlo.

## 5. TIN no es TAE (y por qué te lo preguntan en el banco)

- **TIN**: tipo nominal. No incluye comisiones ni otros costes.
- **TAE**: «coste total del préstamo para el prestatario, expresado como porcentaje anual del importe
  total del préstamo concedido, más los costes aparejados» (artículo 4 de la Ley 5/2019)
  `[hecho]` (`src-s5-06`).

Dos préstamos con el mismo TIN pueden tener TAE distintas si uno cobra comisión de apertura o
incluye un seguro obligatorio. Comparar TIN es comparar la mitad del precio. El Banco de España
tiene simuladores oficiales de TAE de préstamo y depósito, y de fecha de fin de una revolving
`[hecho]` (`src-bde-comparador-tipos-comisiones`): úsalos antes de firmar.

## 6. Endeudamiento: el 40 % como referencia, no como ley

La referencia habitual del Banco de España es que el total de deudas no debería sobrepasar el **40 %
de los ingresos netos mensuales** `[hecho]` (`src-bde-consulta-endeudamiento-40`, frase literal comprobada el 26-oct-2026;
literal). Es una referencia de prudencia, no un requisito legal ni un límite de concesión: cada
entidad aplica sus propios criterios y algunos productos quedan fuera de ese cálculo según cómo se
computen.

Con 1.500 € netos al mes, el 40 % son 600 € de cuota total `[cálculo]`. Si ya pagas 350 € de
hipoteca, quedan 250 € de margen teórico para cualquier otra deuda. Es un termómetro, no un permiso.

## 7. Cómo se compara un producto bancario en cinco minutos

1. Coge la **TAE**, no el TIN, y comprueba el plazo al que corresponde.
2. Suma todas las comisiones anuales (mantenimiento, tarjeta, custodia, corretaje).
3. Lee los requisitos de exención y qué pasa si dejas de cumplirlos.
4. Comprueba qué ocurre si cancelas antes o si te retrasas un mes.
5. Contrasta en el comparador del Banco de España, no en la publicidad de la entidad.

## 8. Límites de esta página

- No es asesoramiento financiero individualizado.
- No se publican TAE concretas de cuentas, depósitos ni tarjetas: cambian por entidad y campaña y no
  se han verificado contra oferta publicada.
- El importe del Fondo de Garantía de Depósitos queda sin cifra hasta verificación.
- Las condiciones descritas son las del contrato: la referencia normativa no sustituye la lectura de
  tu póliza.

**Aviso**: contenido formativo sobre mecanismos y costes. No sustituye el asesoramiento de un
profesional registrado.

## Siguiente paso

- [Débito, crédito y revolving: cómo se paga de verdad una tarjeta](/oros/guias/tarjetas-y-comisiones/)
- [Vivienda e hipoteca](/oros/temas/vivienda-y-hipoteca/), si el crédito que te interesa es
  hipotecario.
