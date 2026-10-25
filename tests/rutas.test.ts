import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE, conBase, url, canonica, ORIGEN_POR_DEFECTO } from '../src/lib/rutas.ts';

test('con base de proyecto GitHub Pages, toda ruta interna la incluye', () => {
  const base = '/4sotas';
  assert.equal(conBase(base, '/'), '/4sotas/');
  assert.equal(conBase(base, '/oros/'), '/4sotas/oros/');
  assert.equal(conBase(base, 'oros/'), '/4sotas/oros/');
  assert.equal(conBase(base, '/assets/mark.svg'), '/4sotas/assets/mark.svg');
});

test('con dominio raíz la base queda vacía', () => {
  const base = '';
  assert.equal(conBase(base, '/'), '/');
  assert.equal(conBase(base, '/oros/'), '/oros/');
});

test('BASE del build se normaliza sin barra final', () => {
  assert.ok(!BASE.endsWith('/'), `BASE no debe acabar en barra: "${BASE}"`);
  assert.ok(BASE === '' || BASE.startsWith('/'), 'BASE debe ser cadena vacía o empezar por /');
});

test('url() nunca devuelve una ruta sin base', () => {
  assert.ok(url('/oros/').startsWith(BASE), 'la ruta debe empezar por la base del build');
});

test('la canónica es absoluta y respeta el pathname', () => {
  assert.equal(
    canonica('/4sotas/oros/', new URL('https://marcvillarroya.github.io')),
    'https://marcvillarroya.github.io/4sotas/oros/',
  );
  assert.equal(canonica('/x/', undefined), `${ORIGEN_POR_DEFECTO}/x/`);
});
