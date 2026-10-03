import fs from 'node:fs';
const re = new RegExp(process.argv[2] || '.', 'i');
for (const f of ['witness-full.json', 'normalized.json', 'witness-graphics.json', 'castano-blog.json']) {
  const p = JSON.parse(fs.readFileSync('archive/raw/' + f, 'utf8'));
  const arr = Array.isArray(p) ? p : p.witness || [];
  const hits = arr.filter((x) => re.test(x.title || ''));
  console.log(`\n### ${f}: ${arr.length} entries, ${hits.length} hits`);
  for (const h of hits) {
    console.log(`   title="${h.title}" author=${h.author} date=${(h.date || '').slice(0, 10)} words=${(h.md || '').split(/\s+/).length} url=${h.url || h.link || ''}`);
    if (process.argv[3]) console.log('      first:', (h.md || '').slice(0, 200).replace(/\n/g, ' '));
  }
}
