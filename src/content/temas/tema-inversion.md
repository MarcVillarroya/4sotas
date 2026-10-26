---
id: tema-inversion
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
  - fuente: src-s4-01
    dato: Traspaso entre fondos sin tributar ni retención; conservación de valor y fecha de adquisición; el diferimiento no aplica a ETF.
  - fuente: src-s4-02
    dato: Plazos máximos de traspaso, 5 días hábiles en la misma gestora y hasta 8 entre gestoras.
  - fuente: src-s4-03
    dato: Folleto, comisiones y principios de la inversión colectiva.
seo:
  descripcion: "Interés compuesto, aportación periódica, fondos y ETF con las cuentas a la vista y sin promesas de rentabilidad."
  noindex: false
actualizacion:
  politica: revision-anual
slug: inversion-desde-cero
titulo: Inversión desde cero
descripcion_corta: Instrumentos, costes y fiscalidad para entender qué haces cuando pones dinero a trabajar, sin promesas de rentabilidad.
cluster: inversion
orden: 4
pilar: art-fondos-vs-etf
temas_relacionados: [tema-banca, tema-vivienda, tema-burbujas]
videos_destacados: [vid-u0AKp6bpdGo]
herramientas: [herr-interes-compuesto]
---

# Inversión desde cero

Invertir es cambiar dinero disponible hoy por una expectativa de dinero futuro. Nada más y nada
menos. Todo lo demás —productos, plataformas, comisiones, impuestos— son detalles de cómo se hace
ese intercambio y de cuánto se queda por el camino. Esta página es el mapa del clúster: qué
decisiones hay que tomar, en qué orden y con qué coste.

## 1. Antes de invertir: el orden que no conviene saltarse

Tres preguntas previas, todas aburridas y todas decisivas:

1. **¿Tienes deuda cara?** Si el coste de esa deuda supera la rentabilidad esperada después de
   impuestos, amortizar es matemáticamente mejor que invertir `[cálculo]`. El resultado depende de
   la TAE concreta, del plazo y de tu liquidez; no es una recomendación general.
2. **¿Tienes colchón?** Un fondo de emergencia evita vender la inversión en el peor momento. No hay
   cifra oficial de meses; «3-6 meses» es convención editorial, no dato de organismo `[opinión]`.
3. **¿Para cuándo es el dinero?** Dinero que necesitas en dos años no debería estar en un
   instrumento cuyo valor oscila. El horizonte manda más que el producto.

## 2. Riesgo y rentabilidad: la relación que no se puede saltar

La rentabilidad pasada no garantiza la futura y el folleto junto con el documento de datos
fundamentales (DFI) informan de riesgo, costes y escenario `[hecho]` (`src-s4-03`). La lectura útil
es la inversa de la que suele hacerse: **más rentabilidad esperada significa más probabilidad de
pérdida temporal**, no «más calidad». Un producto que promete rentabilidad alta y estable está
prometiendo algo que el mercado no ofrece: o hay riesgo escondido, o hay un plazo de bloqueo, o no
es lo que parece.

Riesgo, en la práctica, son cuatro cosas medibles:

- **Volatilidad**: cuánto oscila el valor. Se nota en la primera caída.
- **Riesgo de concentración**: depender de pocas posiciones o de un solo país o sector.
- **Riesgo de liquidez**: cuánto tardas en recuperar tu dinero y a qué precio.
- **Riesgo de contraparte**: quién custodia el dinero y qué pasa si esa entidad falla.

## 3. Los tres vehículos que se comparan siempre

| vehículo | qué compras | coste típico | fiscalidad al cambiar de producto |
|---|---|---|---|
| Fondo de inversión (español o UCITS registrado en CNMV) | participaciones de un patrimonio gestionado | comisión de gestión y depósito según folleto | **traspaso sin tributar**, conserva valor y fecha de adquisición `[hecho]` |
| ETF (fondo cotizado) | participaciones que se compran y venden en bolsa | comisión de gestión baja más coste de compraventa y custodia | **no hay diferimiento**: vender es un hecho fiscal `[hecho]` |
| Depósito o cuenta remunerada | un préstamo que tú haces a la entidad | normalmente ninguno explícito; el coste es la disponibilidad | devengo de intereses, tributa como rendimiento del capital |

La diferencia clave no es «cuál renta más», sino **cuándo pasa por caja Hacienda**. En un fondo,
mover dinero de un fondo a otro no genera peaje fiscal; en un ETF, cada venta realiza ganancia o
pérdida. La retención a cuenta en el reembolso es del 19 % sobre la ganancia (porcentaje de 2025,
que la propia CNMV advierte que puede variar) y después la ganancia se integra en la base del
ahorro, con tipos del 19 % al 30 % `[hecho]` (`src-s4-01`, `src-boe-ley-35-2006-lirpf`).

Ejemplo cerrado `[cálculo]`: 10.000 € que valen 15.000 €. Si vendes el ETF, tributas el 19 % de
5.000 € = 950 €, y te quedan 14.050 € líquidos. Si en un fondo haces traspaso, no tributas nada
ese año y los 5.000 € siguen trabajando; la factura llega cuando reembolses de verdad. Ojo: el
diferimiento es un aplazamiento, no una exención.

## 4. Interés compuesto: la única «magia» que hay aquí

La fórmula es la de siempre `[cálculo]`:

    Capital final = C0 · (1 + i)^n
    Con aportaciones: CF = A · [((1 + i)^n − 1) / i]

Aviso imprescindible: `i` y `n` tienen que estar en la misma unidad. Si la aportación es mensual, el
tipo tiene que ser mensual.

- 1.000 € al 5 % anual efectivo durante 10 años: 1.000 × 1,05¹⁰ = **1.628,89 €**.
- Regla del 72: 72 / 5 = **14,4 años** para duplicar a ese 5 % (aproximación).
- 200 € al mes durante 20 años al 5 % efectivo anual (tipo mensual equivalente 0,407412 %):
  **81.160,90 €**, de los cuales 48.000 € son aportación y 33.160,90 € ganancia.
- 10.000 € al 5 % durante 20 años sin aportar nada más: **26.532,98 €**.

Puedes probar tus propias cifras en la [calculadora de interés compuesto](/oros/herramientas/interes-compuesto/),
que calcula en tu navegador y no envía datos.

Lo que estos números **no** dicen: que vayas a obtener un 5 %. La tasa es una hipótesis, no una
previsión. Y son cifras nominales: con inflación del 4,9 % anual (IPC de septiembre de 2026, INE),
1.000 € de hoy compran lo que 953,29 € dentro de un año `[cálculo]`; por eso conviene mirar siempre
rentabilidad **real** (descontando inflación), no solo nominal.

## 5. Aportación periódica (DCA): qué hace y qué no hace

Aportar una cantidad fija cada mes reduce el riesgo de comprar todo en el peor día, porque reparte
el precio de entrada. Lo que **no** hace es eliminar el riesgo de mercado: si el activo cae un 40 %
y tarda diez años en recuperar, aportar cada mes no te salva de esa década.

No existe en esta base una evidencia primaria institucional que cuantifique la ventaja del DCA
frente a la aportación única `[inferencia]`. La diferencia real entre ambas estrategias depende de
la secuencia concreta de precios, que solo se conoce después. La guía
[aportación periódica e interés compuesto](/oros/guias/dca-interes-compuesto/) desarrolla la
aritmética con casos comprobados.

## 6. Diversificación sin liturgia

Diversificar es repartir para que un solo fallo no decida tu resultado. No hay un número oficial de
fondos ni de posiciones a partir del cual «estés diversificado»: un solo fondo global ya contiene
miles de empresas, y cinco fondos del mismo índice no diversifican nada, solo duplican comisiones.
El clásico «4 de cada 10 € del S&P 500 van a 10 posiciones» es exactamente el recordatorio de que la
capitalización concentra.

## 7. Costes: lo único que controlas

Las comisiones de los fondos están en el folleto y no son negociables por el inversor minorista; las
de compraventa de ETF y las de custodia, tampoco. Un 1 % anual de coste sobre 100.000 € son
1.000 € al año, todos los años, con independencia de que el mercado suba o baje `[cálculo]`. Antes
de mirar rentabilidades, mira el cuadro de costes.

## 8. Errores que cuestan dinero de verdad

- Confundir retención a cuenta (19 %) con el tipo final del impuesto.
- Invertir dinero que hace falta a corto plazo.
- Concentrar la inversión en la empresa en la que trabajas (sueldo y patrimonio en el mismo sitio).
- Cambiar de estrategia después de cada caída.
- Creer que un producto «garantizado» es gratis: la garantía se paga con menor rentabilidad.

## 9. Límites de esta página

- No es asesoramiento financiero individualizado ni recomendación de compra.
- No se citan rentabilidades esperadas como si fueran datos.
- No se publican TAE de cuentas remuneradas ni depósitos: cambian por entidad y campaña, y aquí no
  se ha verificado ninguna (`research/GAPS.md`).
- La fiscalidad descrita es estatal; las comisiones y clases de cada fondo dependen de su folleto.

**Aviso**: contenido formativo sobre mecanismos y costes. No sustituye el asesoramiento de un
profesional registrado que conozca tu situación.

## Siguiente paso

1. Lee [fondos indexados y ETF: qué cambia de verdad](/oros/guias/fondos-indexados-vs-etf/).
2. Comprueba tu horizonte y tu colchón antes de invertir un euro.
3. Simula el escenario con la [calculadora](/oros/herramientas/interes-compuesto/) usando una tasa
   que puedas justificar.
