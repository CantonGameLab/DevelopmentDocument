// Inspect how much of the archived irradiance article is LaTeX-rendered formulas.
import fs from 'node:fs';

const md = fs.readFileSync('archive/witness-graphics/irradiance-caching-part-1.md', 'utf8');
const spans = [...md.matchAll(/!\[([^\]]*)\]\((https?:\/\/s0\.wp\.com\/latex\.php\?[^)]+)\)/g)];
console.log('latex images:', spans.length);
for (const [i, m] of spans.entries()) {
  const url = m[2];
  const q = new URLSearchParams(url.split('?')[1]);
  const latex = q.get('latex') || '';
  console.log(`${String(i + 1).padStart(3)}. alt=${JSON.stringify(m[1])}`);
  console.log(`     latex=${latex}`);
}

const otherImgs = [...md.matchAll(/!\[([^\]]*)\]\((?!https?:\/\/s0\.wp\.com\/latex\.php)([^)]+)\)/g)];
console.log('\nnon-latex images:', otherImgs.length);
const seen = new Map();
for (const m of otherImgs) {
  const f = m[2].split('/').pop();
  seen.set(f, (seen.get(f) || 0) + 1);
}
for (const [f, n] of seen) console.log(`   ${n}× ${f}`);
