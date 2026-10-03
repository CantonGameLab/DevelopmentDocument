import { readFileSync, existsSync, readdirSync } from 'node:fs';
const doc = readFileSync('archive/blow-casey-collaboration.md', 'utf8');
const refs = [...new Set([...doc.matchAll(/`([^`]+\.(?:md|html))`/g)].map((m) => m[1]))];
console.log('local file references in the collaboration doc:');
let bad = 0;
for (const r of refs) {
  const cands = [
    'archive/' + r,
    'archive/witness-official/by-year/' + r,
    'archive/raw/witness-pages/' + r,
  ];
  const ok = cands.find((c) => existsSync(c));
  console.log(`  ${ok ? '✅' : '❌'} ${r}${ok ? '' : ''}`);
  if (!ok) bad++;
}
// verify the two by-year files quoted in the doc actually contain the quotes
// raw .html files must be flattened before matching prose quotes
const flatten = (t) =>
  t
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#8217;|&rsquo;/g, "'")
    .replace(/&#8220;|&ldquo;/g, '"')
    .replace(/&#8221;|&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ');

const checks = [
  ['archive/witness-official/by-year/2015-007-bugs.md', /until Casey added some tools to visualize the collision/i],
  ['archive/witness-official/by-year/2012-001-wm-touch-is-totally-bananas.md', /Casey wrote about this in 2008/i],
  ['archive/raw/witness-pages/2010-11-experiments-in-texturing.html', /I was talking to Casey Muratori about 3D modeling and texturing/i],
  ['archive/raw/witness-pages/2012-02-playtest-island-update.html', /Casey played through all the same playtest material/i],
];
console.log('\nquote verification:');
for (const [f, re] of checks) {
  if (!existsSync(f)) { console.log(`  ❌ missing file ${f}`); bad++; continue; }
  const raw = readFileSync(f, 'utf8');
  const t = f.endsWith('.html') ? flatten(raw) : raw;
  const ok = re.test(t);
  console.log(`  ${ok ? '✅' : '❌'} ${f.split('/').pop()}`);
  if (!ok) bad++;
}
console.log(`\n${bad ? bad + ' PROBLEM(S)' : '✅ all references and quotes verified'}`);
