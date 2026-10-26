/**
 * Presentación visible de la calculadora.
 *
 * Los valores esperados NO se copian de la salida del motor: para el caso por defecto se
 * deducen fuera del código con `Decimal` a 40 dígitos (misma fórmula cerrada que
 * `docs/CALCULADORA.md` §5) y se comparan contra el texto que pinta la página. Para los
 * vectores ya fijados (V6 y V13) se reutilizan sus cifras publicadas.
 *
 * Si alguien cambia el redondeo, el formato es-ES o las palabras de una métrica, esto
 * falla antes de que la página publique una cifra distinta de la documentada.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { calcularInteresCompuesto, filasAnuales, formatearEuros, type EntradaCalculo } from '../src/lib/calculadora.ts';
import {
  DESTINOS_APRENDER,
  IDS_METRICAS,
  SUPUESTOS_CLAVE,
  TEXTO_RETIRADO,
  filasVisibles,
  metricasVisibles,
  nombrePeriodo,
  resumenEntrada,
  textoAnuncio,
  textoError,
  textoPlazo,
} from '../src/lib/calculadora-presentacion.ts';

/** Ejemplo por defecto de la página (vector V5 de la ficha). */
const DEFECTO: EntradaCalculo = {
  capitalInicial: 1000,
  aportacionPeriodica: 100,
  anios: 10,
  meses: 0,
  rentabilidadAnual: 5,
  frecuencia: 'mensual',
  momentoAportacion: 'fin',
  inflacionAnual: null,
};

const calcular = (entrada: EntradaCalculo) => {
  const respuesta = calcularInteresCompuesto(entrada);
  assert.equal(respuesta.ok, true, `se esperaba cálculo válido: ${JSON.stringify(entrada)}`);
  if (!respuesta.ok) throw new Error('inaccesible');
  return respuesta.resultado;
};

/** Intl inserta espacio duro antes del símbolo; se normaliza para comparar texto. */
const texto = (s: string): string => s.replace(/[\u00A0\u202F]/g, ' ');

/* ─────────────── cifras visibles frente a los vectores del motor ─────────────── */

test('las cuatro métricas salen en orden y con las cifras del caso por defecto', () => {
  // Decimal: 1000·1,0040741237836483^120 + 100·((1+i)^120 − 1)/i = 17065,210756924033
  const r = calcular(DEFECTO);
  const metricas = metricasVisibles(r);

  assert.deepEqual(
    metricas.map((m) => m.id),
    [...IDS_METRICAS],
    'los ids son el contrato con la plantilla y su script',
  );
  assert.equal(texto(metricas[0].valor), '13.000,00 €', 'capital aportado');
  assert.equal(texto(metricas[1].valor), '4065,21 €', 'interés generado');
  assert.equal(metricas[2].valor, '0,4074 %', 'tasa por periodo');
  assert.equal(metricas[3].valor, 'Sin inflación', 'sin inflación no se inventa valor real');
  assert.equal(texto(formatearEuros(r.capitalFinal)), '17.065,21 €', 'capital final');
});

test('V6 y V13 conservan su cifra al pasar por el formato de la página', () => {
  const sinInflacion = calcular({ ...DEFECTO, capitalInicial: 0, aportacionPeriodica: 200, anios: 20 });
  const metricas = metricasVisibles(sinInflacion);
  assert.equal(texto(formatearEuros(sinInflacion.capitalFinal)), '81.160,90 €');
  assert.equal(texto(metricas[0].valor), '48.000,00 €', 'aportado de V6');
  assert.equal(texto(metricas[1].valor), '33.160,90 €', 'ganancia de V6');

  const conInflacion = calcular({ ...DEFECTO, capitalInicial: 0, aportacionPeriodica: 200, anios: 20, inflacionAnual: 3 });
  assert.equal(texto(metricasVisibles(conInflacion)[3].valor), '44.936,82 €', 'valor real de V13');
});

test('cada métrica explica su unidad en una línea', () => {
  for (const metrica of metricasVisibles(calcular(DEFECTO))) {
    assert.ok(metrica.etiqueta.length > 0, `${metrica.id} sin etiqueta`);
    assert.ok(metrica.ayuda.length > 20, `${metrica.id} sin ayuda legible`);
  }
});

/* ─────────────── resumen en lenguaje de usuario ─────────────── */

test('el resumen describe el caso con palabras, no con jerga de motor', () => {
  const r = calcular(DEFECTO);
  assert.equal(
    resumenEntrada(DEFECTO, r),
    '1000 € de partida más 100 € cada mes, durante 10 años, con una rentabilidad del 5,00 % anual.',
  );
  assert.equal(
    resumenEntrada({ ...DEFECTO, capitalInicial: 0, aportacionPeriodica: 200, anios: 20 }, calcular({ ...DEFECTO, capitalInicial: 0, aportacionPeriodica: 200, anios: 20 })),
    '200 € cada mes, durante 20 años, con una rentabilidad del 5,00 % anual.',
  );
  assert.equal(
    resumenEntrada({ ...DEFECTO, aportacionPeriodica: 0, frecuencia: 'anual' }, r),
    '1000 € de partida, durante 10 años, con una rentabilidad del 5,00 % anual.',
  );
});

test('plazo y periodo se escriben en singular o plural según el dato', () => {
  assert.equal(textoPlazo(1, 0), '1 año');
  assert.equal(textoPlazo(0, 1), '1 mes');
  assert.equal(textoPlazo(10, 6), '10 años y 6 meses');
  assert.equal(nombrePeriodo('mensual'), 'mes');
  assert.equal(nombrePeriodo('trimestral'), 'trimestre');
  assert.equal(nombrePeriodo('semestral'), 'semestre');
  assert.equal(nombrePeriodo('anual'), 'año');
});

/* ─────────────── estados vacío y erróneo ─────────────── */

test('el aviso de error dice qué falla sin hablar de campos ni de vectores', () => {
  const respuesta = calcularInteresCompuesto({ ...DEFECTO, anios: 0, meses: 0 });
  assert.equal(respuesta.ok, false);
  if (respuesta.ok) throw new Error('inaccesible');
  const aviso = textoError(respuesta.errores);
  assert.match(aviso, /^No se puede calcular todavía: /);
  assert.match(aviso, /al menos un periodo/);
  assert.ok(!/vector|campo|build/i.test(aviso), 'sin jerga de proceso');

  const dos = textoError([...respuesta.errores, { campo: 'capitalInicial', mensaje: 'El capital inicial debe estar entre 0 y 1.000.000 €.' }]);
  assert.match(dos, /1 dato más que revisar/);
  assert.match(TEXTO_RETIRADO, /Pulsa Calcular/);
});

test('el anuncio accesible incluye las tres cifras del resultado', () => {
  const anuncio = texto(textoAnuncio(calcular(DEFECTO)));
  assert.match(anuncio, /^Resultado actualizado\./);
  assert.match(anuncio, /17\.065,21 €/);
  assert.match(anuncio, /13\.000,00 €/);
  assert.match(anuncio, /4065,21 €/);
});

/* ─────────────── tabla y supuestos ─────────────── */

test('las filas visibles formatean lo mismo que la tabla del build', () => {
  const filas = filasVisibles(filasAnuales(calcular(DEFECTO).tabla));
  assert.equal(filas.length, 10);
  assert.deepEqual(
    filas.map((f) => f.anio),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  // Decimal: 1000·1,0040741237836483^48 + 100·((1+i)^48 − 1)/i = 6505,140572475548
  assert.equal(texto(filas[3].capital), '6505,14 €');
  assert.equal(texto(filas[3].aportado), '5800,00 €');
  assert.equal(texto(filas[3].interes), '705,14 €');
  assert.equal(texto(filas[9].capital), '17.065,21 €');
});

test('los supuestos se explican para una persona y cubren rentabilidad, comisiones e inflación', () => {
  const texto_ = SUPUESTOS_CLAVE.map((s) => `${s.titulo} ${s.texto}`).join(' ').toLowerCase();
  for (const tema of ['rentabilidad', 'comisiones', 'inflación', 'intereses']) {
    assert.ok(texto_.includes(tema), `falta el supuesto sobre ${tema}`);
  }
  assert.ok(!/vector v\d+|docs\/|fixture/i.test(texto_), 'sin referencias internas');
});

/* ─────────────── enlaces educativos ─────────────── */

test('los enlaces educativos apuntan a rutas reales y no se repiten', () => {
  const hrefs = DESTINOS_APRENDER.map((d) => d.href);
  assert.equal(new Set(hrefs).size, hrefs.length, 'sin destinos duplicados');
  for (const href of hrefs) {
    assert.match(href, /^\/oros\/(guias|videos|glosario)\/[a-z0-9-]+\/$/);
  }
  assert.ok(DESTINOS_APRENDER.some((d) => d.href === '/oros/guias/dca-interes-compuesto/'), 'falta la guía de interés compuesto');
  assert.ok(DESTINOS_APRENDER.some((d) => d.tipo === 'Vídeo'), 'falta el vídeo relacionado');
  assert.ok(DESTINOS_APRENDER.some((d) => d.href === '/oros/glosario/tae/'), 'falta el término TAE');
});

/* ─────────────── la página construida dice lo mismo ─────────────── */

test('el HTML construido publica las mismas cifras y el aria-live del resultado', (t) => {
  const rutaHtml = 'dist/oros/herramientas/interes-compuesto/index.html';
  if (!existsSync(rutaHtml)) {
    t.skip('sin dist/: ejecuta `npm run build` antes de esta prueba');
    return;
  }
  const html = texto(readFileSync(rutaHtml, 'utf8'));

  assert.match(html, /17\.065,21 €/, 'capital final visible');
  assert.match(html, /13\.000,00 €/, 'capital aportado visible');
  assert.match(html, /4065,21 €/, 'interés generado visible');
  assert.match(html, /id="estado-calculo"[^>]*role="status"|role="status"[^>]*id="estado-calculo"/, 'aria-live del resultado');
  assert.match(html, /aria-live="polite"/);
  for (const id of IDS_METRICAS) assert.match(html, new RegExp(`id="${id}"`), `falta la métrica ${id}`);
  assert.match(html, /id="tabla-evolucion"/);
  // La base depende del build: '' en dominio propio, '/4sotas' en GitHub Pages.
  assert.match(html, /href="(?:\/4sotas)?\/oros\/guias\/dca-interes-compuesto\/"/, 'enlace a la guía desde el resultado');
  assert.match(html, /href="(?:\/4sotas)?\/oros\/glosario\/tae\/"/, 'enlace al glosario desde el resultado');
  assert.ok(!/vector V\d+|en cada build/i.test(html), 'el HTML público no habla de vectores ni de builds');
});
