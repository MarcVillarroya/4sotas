import test from 'node:test';
import assert from 'node:assert/strict';
import jerarquiaEditorial from '../scripts/remark-jerarquia.mjs';

test('Markdown con H1 se anida bajo la cabecera sin cambiar texto ni IDs', () => {
  const tree = { children: [1, 2, 3, 6].map(depth => ({ type: 'heading', depth, data: { id: `h${depth}` }, children: [{ type: 'text', value: 'Título' }] })) };
  jerarquiaEditorial()(tree);
  assert.deepEqual(tree.children.map(n => n.depth), [2, 3, 4, 6]);
  assert.equal(tree.children[0].children[0].value, 'Título');
  assert.equal(tree.children[0].data.id, 'h1');
});
test('Markdown sin H1 conserva su jerarquía', () => {
  const tree = { children: [{ type: 'heading', depth: 2 }] };
  jerarquiaEditorial()(tree);
  assert.equal(tree.children[0].depth, 2);
});
