---
id: art-fixture-demo
status: borrador
creado: 2026-10-26
sensibilidad: media
autorias:
  redactor: aut-marc-villarroya
fuentes:
  - fuente: src-fixture-demo
    dato: Ficha de prueba del modelo; no respalda ninguna cifra.
actualizacion:
  politica: revision-anual
slug: guia-fixture-demo
titulo: Guía de prueba con tablas, fuentes y fechas derivadas
resumen: Fixture que ejercita la plantilla de guía con respuesta inicial, cuerpo en Markdown, tabla de fuentes y enlaces tipados a vídeo, glosario y herramienta.
tipo: guia
nivel: basico
temas:
  - tema-fixture-demo
videos:
  - vid-M9EhU06FlUA
herramientas:
  - herr-fixture-metodologia
glosario:
  - glo-fixture-demo
  - glo-fixture-demo-dos
serie: ser-fixture-demo
orden_en_serie: 1
preguntas:
  - pregunta: ¿Qué comprueba esta página de prueba?
    respuesta: Que la plantilla de guía deriva títulos, fechas, autoría, fuentes y enlaces desde las colecciones sin escribir metadatos a mano.
  - pregunta: ¿Se publica este contenido?
    respuesta: No. La entrada está en estado borrador y el build público no genera su ruta; solo el build de fixtures la renderiza.
---

Fixture del banco de pruebas. El cuerpo existe para comprobar que el Markdown se
renderiza dentro de la plantilla, que las tablas no rompen el ancho de la página y que
el índice lateral se deriva de los encabezados reales del documento.

## Qué prueba esta sección

Un párrafo normal con una lista:

- Enlace tipado a un término de glosario en la ficha lateral.
- Fuente de ejemplo en la tabla de fuentes, sin cifras asociadas.

## Tabla de ejemplo

| Columna | Valor de prueba |
| --- | --- |
| Estado | borrador |
| Visible en build público | no |

## Límites

Texto de fixture: no es asesoramiento ni contenido editorial publicable.
