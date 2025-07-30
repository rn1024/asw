export function load(str) {
  const obj = {};
  let curr = null;
  str.split(/\r?\n/).forEach(l => {
    if (!l.trim()) return;
    if (!l.startsWith(' ')) {
      const [k] = l.split(':');
      curr = k.trim();
      obj[curr] = {};
    } else if (curr) {
      const m = l.trim().match(/^([^:]+):\s*(.*)$/);
      if (m) obj[curr][m[1]] = m[2];
    }
  });
  return obj;
}

export function dump(obj, opts = {}) {
  const indent = ' '.repeat(opts.indent || 2);
  let out = '';
  for (const [k, v] of Object.entries(obj)) {
    out += `${k}:\n`;
    for (const [k2, v2] of Object.entries(v)) out += `${indent}${k2}: ${v2}\n`;
  }
  return out;
}
export default { load, dump };
