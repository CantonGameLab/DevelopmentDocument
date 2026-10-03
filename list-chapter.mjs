import fs from 'node:fs';
import { MANIFEST } from './paths.mjs';
const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const want = process.argv.slice(2);
for (const key of want) {
  const c = m.chapters.find((x) => x.key === key);
  if (!c) {
    console.log('no chapter', key);
    continue;
  }
  console.log(`\n### ${key} — ${c.zh} (${c.articles.length})`);
  for (const id of c.articles) {
    const a = m.articles.find((x) => x.id === id);
    console.log(`  ${String(a.words).padStart(5)}w ${a.date} ${(a.author || '').padEnd(16)} ${a.title.en}  [${a.status}]`);
  }
}
