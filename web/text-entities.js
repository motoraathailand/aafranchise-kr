// Display-time defense for older cached catalog records. Safe with the existing esc(). Ampersand entities of arbitrary brands remain untouched.
const N = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', middot: '·', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', ndash: '–', mdash: '—', hellip: '…', copy: '©', reg: '®', trade: '™' };
export function decodeEntities(value) {
 if (typeof value !== 'string') return value;
 for (let i = 0; i < 3; i++) {
  const out = value.replace(/&(?:#(\d+)|#x([\da-f]+)|([a-z][\da-z]+));/gi, (all, a, b, n) => {
   if (a != null || b != null) { const cp = Number.parseInt(a ?? b, a != null ? 10 : 16); if (!Number.isSafeInteger(cp) || cp === 0 || cp > 0x10ffff || cp >= 0xd800 && cp <= 0xdfff) return all; return String.fromCodePoint(cp); }
   return N[n.toLowerCase()] ?? all;
  });
  if (out === value) break; value = out;
 }
 return value;
}
export function decodeCatalog(value) {
 if (typeof value === 'string') return decodeEntities(value);
 if (Array.isArray(value)) return value.map(decodeCatalog);
 if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decodeCatalog(v)]));
 return value;
}
