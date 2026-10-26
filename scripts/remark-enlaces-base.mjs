/**
 * Remark plugin: prefija con la base del despliegue los enlaces e imágenes internos
 * escritos en el cuerpo Markdown (`/oros/guias/x/`, `/assets/...`).
 *
 * Por qué: el cuerpo se renderiza tal cual, así que un enlace raíz escrito a mano en el
 * Markdown se rompe en GitHub Pages (`/4sotas/...`). Prefijar aquí mantiene una sola base
 * (astro.config) y hace que el mismo contenido funcione en dominio raíz (base '') y en
 * subcarpeta ('/4sotas'). No toca enlaces externos, anclas, `mailto:` ni `tel:`.
 */
const esInterno = (url) =>
  typeof url === 'string' &&
  url.startsWith('/') &&
  !url.startsWith('//') &&
  !url.startsWith('/*');

const recorrer = (nodo, fn) => {
  if (!nodo || typeof nodo !== 'object') return;
  fn(nodo);
  if (Array.isArray(nodo.children)) for (const hijo of nodo.children) recorrer(hijo, fn);
};

export default function enlacesConBase(options = {}) {
  const base = String(options.base ?? '').replace(/\/$/, '');
  return (tree) => {
    if (!base) return;
    recorrer(tree, (nodo) => {
      if (nodo.type === 'link' && esInterno(nodo.url)) nodo.url = `${base}${nodo.url}`;
      if (nodo.type === 'image' && esInterno(nodo.url)) nodo.url = `${base}${nodo.url}`;
    });
  };
}
