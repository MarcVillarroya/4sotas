/** El shell ya aporta H1: conserva el texto Markdown, pero anida sus encabezados. */
export default function jerarquiaEditorial() {
  return (tree) => {
    const headings = [];
    const walk = (node) => {
      if (node.type === 'heading') headings.push(node);
      for (const child of node.children ?? []) walk(child);
    };
    walk(tree);
    if (headings.some(node => node.depth === 1)) {
      for (const node of headings) node.depth = Math.min(6, node.depth + 1);
    }
  };
}
