import test from 'node:test';
import assert from 'node:assert/strict';
import { LIMITE_DESCRIPCION, LIMITE_TITULO, metaDescripcion, recortar, tituloDocumento } from '../src/lib/seo.ts';

const MUY_LARGO =
  'Una guía extensa sobre cómo leer la nómina española de principio a fin con retenciones, bases y cotizaciones explicadas';

test('el título nunca supera el límite aunque el texto de origen sea largo', () => {
  const t = tituloDocumento(MUY_LARGO, undefined, 'Sota de Oros');
  assert.ok(t.length <= LIMITE_TITULO, `longitud ${t.length} > ${LIMITE_TITULO}`);
});

test('el título corto conserva el sufijo de marca', () => {
  assert.equal(tituloDocumento('Inflación', undefined, 'Sota de Oros'), 'Inflación · Sota de Oros');
});

test('seo.titulo tiene prioridad sobre el título del H1', () => {
  assert.equal(tituloDocumento('H1 largo', 'Título SEO', ''), 'Título SEO');
});

test('recortar no parte palabras y añade elipsis', () => {
  const r = recortar('uno dos tres cuatro cinco seis siete ocho nueve diez once doce', 20);
  assert.ok(r.length <= 20);
  assert.ok(r.endsWith('…'));
  assert.ok(!r.includes('  '));
  assert.ok(!/\s…$/.test(r), 'el espacio antes de la elipsis se elimina');
});

test('recortar deja intacto el texto que ya cabe', () => {
  assert.equal(recortar('texto corto', 40), 'texto corto');
});

test('la meta descripción se limita a 160 caracteres', () => {
  const d = metaDescripcion(MUY_LARGO.repeat(2));
  assert.ok(d.length <= LIMITE_DESCRIPCION, `longitud ${d.length}`);
});
