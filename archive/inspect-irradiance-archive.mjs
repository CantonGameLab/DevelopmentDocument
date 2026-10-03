import fs from 'node:fs';
const md = fs.readFileSync('archive/witness-graphics/irradiance-caching-part-1.md', 'utf8');
const body = md.split('\n---\n').slice(1).join('\n---\n');
const lines = body.split('\n');
console.log('total lines', lines.length, 'chars', body.length);
console.log('\n--- headings ---');
for (const l of lines) if (/^#{2,4}\s/.test(l)) console.log('  ', l);
console.log('\n--- code fences ---');
let inF = false;
let n = 0;
let buf = [];
for (const l of lines) {
  if (l.startsWith('```')) {
    if (!inF) {
      inF = true;
      buf = [];
    } else {
      inF = false;
      n++;
      console.log(`  [fence ${n}] ${buf.length} lines`);
      for (const b of buf.slice(0, 14)) console.log('      ' + b);
      if (buf.length > 14) console.log(`      … +${buf.length - 14} 行`);
    }
    continue;
  }
  if (inF) buf.push(l);
}
if (inF) console.log('  ⚠ 未闭合的围栏');
console.log('\n--- paragraphs (first 60 chars each) ---');
const paras = body.split(/\n{2,}/).filter((p) => p.trim() && !p.startsWith('```'));
console.log('count', paras.length);
for (const p of paras) console.log('  · ' + p.replace(/\n/g, ' ').slice(0, 100));
