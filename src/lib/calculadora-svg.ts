/**
 * Gráfico de evolución en SVG generado a partir de las filas de la tabla.
 *
 * Por qué SVG y no una librería: el requisito prohíbe dependencias de gráficos pesadas y
 * el gráfico es decorativo-informativo, no la fuente de verdad (la tabla HTML lo es y se
 * genera con los mismos datos). Un SVG de barras se escribe en ~40 líneas, pesa unos pocos
 * KB y no añade ni un byte de JavaScript de terceros.
 *
 * El markup usa las variables CSS del sistema de diseño (`var(--gold)`), que el navegador
 * resuelve porque el SVG se inserta en línea dentro del documento.
 */

import type { FilaPeriodo } from './calculadora.ts';

const escapar = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const miles = (n: number): string => n.toLocaleString('es-ES', { maximumFractionDigits: 0 });

/**
 * Barras agrupadas por fila: aportado (gris, lo que salió del bolsillo) y capital
 * (oro, lo que hay si la hipótesis de rentabilidad se cumple).
 */
export const svgEvolucion = (filas: FilaPeriodo[], opciones: { ancho?: number; alto?: number } = {}): string => {
  if (filas.length === 0) return '';
  const ancho = opciones.ancho ?? 640;
  const alto = opciones.alto ?? 300;
  const margen = { arriba: 28, derecha: 10, abajo: 40, izquierda: 10 };
  const areaAncho = Math.max(1, ancho - margen.izquierda - margen.derecha);
  const areaAlto = Math.max(1, alto - margen.arriba - margen.abajo);
  const maximo = Math.max(...filas.map((f) => f.capital), 1);
  const paso = areaAncho / filas.length;
  const hueco = Math.min(4, paso * 0.15);
  const anchoBarra = Math.max(1.5, Math.min(14, (paso - hueco * 3) / 2));
  const base = margen.arriba + areaAlto;

  const barras = filas
    .map((fila, i) => {
      const x = margen.izquierda + i * paso + (paso - (anchoBarra * 2 + hueco)) / 2;
      const altoCapital = Math.max(1, (fila.capital / maximo) * areaAlto);
      const altoAportado = Math.max(fila.aportadoAcumulado > 0 ? 1 : 0, (fila.aportadoAcumulado / maximo) * areaAlto);
      return (
        `<g><rect x="${x.toFixed(1)}" y="${(base - altoAportado).toFixed(1)}" width="${anchoBarra.toFixed(1)}" height="${altoAportado.toFixed(1)}" fill="var(--ink)" opacity="0.22"></rect>` +
        `<rect x="${(x + anchoBarra + hueco).toFixed(1)}" y="${(base - altoCapital).toFixed(1)}" width="${anchoBarra.toFixed(1)}" height="${altoCapital.toFixed(1)}" fill="var(--gold-ink)"></rect></g>`
      );
    })
    .join('');

  const primera = filas[0];
  const ultima = filas[filas.length - 1];
  const etiquetaIzquierda = `Año ${primera.anio}`;
  const etiquetaDerecha = ultima.anio === primera.anio ? '' : `Año ${ultima.anio}`;
  const etiquetaMaximo = `${miles(maximo)} €`;

  return (
    `<svg viewBox="0 0 ${ancho} ${alto}" role="img" aria-labelledby="grafico-titulo" style="width:100%;height:auto">` +
    `<title id="grafico-titulo">Evolución del capital frente a lo aportado</title>` +
    `<desc>Barras por año. La barra clara es el dinero aportado y la barra dorada el capital acumulado. El valor final es ${escapar(
      miles(ultima.capital),
    )} euros frente a ${escapar(miles(ultima.aportadoAcumulado))} euros aportados. Los datos exactos están en la tabla siguiente.</desc>` +
    `<line x1="${margen.izquierda}" y1="${base}" x2="${ancho - margen.derecha}" y2="${base}" stroke="var(--line)" stroke-width="1"></line>` +
    barras +
    `<text x="${margen.izquierda}" y="${(base + 18).toFixed(1)}" font-size="14" fill="var(--ink)">${escapar(etiquetaIzquierda)}</text>` +
    (etiquetaDerecha
      ? `<text x="${ancho - margen.derecha}" y="${(base + 18).toFixed(1)}" font-size="14" fill="var(--ink)" text-anchor="end">${escapar(
          etiquetaDerecha,
        )}</text>`
      : '') +
    `<text x="${ancho - margen.derecha}" y="${(margen.arriba - 10).toFixed(1)}" font-size="14" fill="var(--ink)" text-anchor="end">${escapar(
      etiquetaMaximo,
    )}</text>` +
    `</svg>`
  );
};
