import fs from 'node:fs';
import { MANIFEST, ARTICLES } from './paths.mjs';
const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const ids = new Set(m.articles.map((a) => a.id));
const files = fs.readdirSync(ARTICLES).filter((f) => f.endsWith('.json'));
const orphans = files.filter((f) => !ids.has(f.replace(/\.json$/, '')));
console.log('manifest', ids.size, '| 译文文件', files.length, '| 孤儿文件', orphans.length);
for (const f of orphans) {
  const j = JSON.parse(fs.readFileSync(join(ARTICLES, f), 'utf8'));
  console.log(`  ${f}  (id=${j.id}) ${j.title ? j.title.en || j.title.zh : ''}`);
}
const missing = [...ids].filter((id) => !files.includes(id + '.json'));
console.log('manifest 有、译文缺:', missing.length, missing.slice(0, 12).join(', '));
