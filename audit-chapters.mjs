import fs from 'node:fs';
import { MANIFEST } from './paths.mjs';
const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const byId = new Map(m.articles.map((a) => [a.id, a]));
console.log('articles', m.articles.length);
const dup = m.articles.map((a) => a.id).filter((v, i, arr) => arr.indexOf(v) !== i);
console.log('duplicate ids:', dup);

const inChapter = new Set(m.chapters.flatMap((c) => c.articles));
console.log('in a chapter:', inChapter.size);
const orphan = m.articles.filter((a) => !inChapter.has(a.id));
console.log('NOT in any chapter:', orphan.length);
for (const a of orphan) console.log('   ', a.id, '|', a.title.en, '| chapter=', a.chapter);

console.log('\nchapter key list:', m.chapters.map((c) => c.key).join(', '));
const badKey = m.articles.filter((a) => !m.chapters.some((c) => c.key === a.chapter));
console.log('articles with unknown chapter key:', badKey.length);
for (const a of badKey) console.log('   ', a.id, a.chapter);

console.log('\nmissing mdPath:', m.articles.filter((a) => !a.mdPath).length);
for (const a of m.articles.filter((x) => !x.mdPath)) console.log('   ', a.id, a.title.en);

console.log('\ndone/pending:', m.articles.filter((a) => a.status === 'done').length, '/', m.articles.filter((a) => a.status === 'pending').length);
