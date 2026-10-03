import { readFileSync, readdirSync } from 'node:fs';

const W = JSON.parse(readFileSync('archive/raw/witness-full.json', 'utf8'));
const C = JSON.parse(readFileSync('archive/raw/casey-normalized.json', 'utf8'));

const stats = {
  witnessFiles: readdirSync('archive/witness-official/by-year').length,
  caseyFiles: readdirSync('archive/casey-muratori').length,
};

// per-author stats
const byAuthor = {};
for (const p of W) {
  const a = (byAuthor[p.author] ||= { posts: 0, chars: 0, first: p.date, last: p.date, titles: [] });
  a.posts++;
  a.chars += p.md.length;
  if (p.date < a.first) a.first = p.date;
  if (p.date > a.last) a.last = p.date;
  a.titles.push(p.title);
}
console.log('=== official blog authors ===');
for (const [a, s] of Object.entries(byAuthor).sort((x, y) => y[1].posts - x[1].posts)) {
  console.log(
    `${a.padEnd(20)} ${String(s.posts).padStart(3)} posts  ${String(Math.round(s.chars / 1000)).padStart(4)}k chars  ${s.first.slice(0, 10)} → ${s.last.slice(0, 10)}`
  );
}

// per-year
const byYear = {};
for (const p of W) {
  const y = p.date.slice(0, 4);
  byYear[y] = (byYear[y] || 0) + 1;
}
console.log('\n=== posts per year ===');
console.log(Object.entries(byYear).sort().map(([y, n]) => `${y}:${n}`).join('  '));

// categories
const byCat = {};
for (const p of W) for (const c of p.categories) byCat[c] = (byCat[c] || 0) + 1;
console.log('\n=== categories ===');
console.log(Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c}=${n}`).join(', '));

// casey per-topic chars
console.log('\n=== casey series ===');
for (const p of C) console.log(`${p.id} ${p.date} ${String(p.md.length).padStart(6)} chars code=${String(p.codeBlocks).padStart(3)} ${p.title}`);

// the-witness.net cross-posted casey articles
const cross = W.filter((p) => /casey/i.test(p.author) || /casey/i.test(p.title));
console.log('\n=== Casey items on the official blog ===');
for (const p of cross) console.log(`${p.date.slice(0, 10)} | author=${p.author} | ${p.title} | ${p.md.length} chars`);

console.log('\n=== totals ===');
console.log('official posts:', W.length, '| words', W.reduce((s, p) => s + p.md.split(/\s+/).filter(Boolean).length, 0));
console.log('casey posts:', C.length, '| words', C.reduce((s, p) => s + p.md.split(/\s+/).filter(Boolean).length, 0));
console.log('files:', JSON.stringify(stats));
