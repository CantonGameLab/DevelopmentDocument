// Verify the `code` fields of the irradiance-caching / hemicube translations against the
// archived markdown, focusing on whether lines that were a single space in the source
// became empty lines. Usage: node archive/verify-code-verbatim.mjs <article-id>...
import fs from 'node:fs';
import path from 'node:path';
import { MANIFEST, ARTICLES } from '../paths.mjs';

const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const ids = process.argv.slice(2);
if (!ids.length) {
  console.log('用法: node archive/verify-code-verbatim.mjs <article-id> [...]');
  process.exit(1);
}

const norm = (s) => String(s).replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();

for (const id of ids) {
  const meta = m.articles.find((a) => a.id === id);
  if (!meta) {
    console.log(`? ${id} 不在 manifest 里`);
    continue;
  }
  const art = JSON.parse(fs.readFileSync(path.join(ARTICLES, id + ".json"), 'utf8'));
  const src = fs.readFileSync(meta.mdPath, 'utf8');
  const body = src.split('\n---\n').slice(1).join('\n---\n');

  // collect fenced code blocks from the source
  const srcFences = [];
  const lines = body.split('\n');
  for (let k = 0; k < lines.length; k++) {
    if (!lines[k].startsWith('```')) continue;
    const buf = [];
    k++;
    while (k < lines.length && !lines[k].startsWith('```')) buf.push(lines[k++]);
    srcFences.push(buf.join('\n'));
  }
  const artCodes = (art.blocks || []).filter((b) => b.type === 'code').map((b) => b.code);

  console.log(`\n=== ${id}`);
  console.log(`  源文围栏 ${srcFences.length} 个 | 译文 code 块 ${artCodes.length} 个`);
  const srcNorm = srcFences.map((c) => norm(c.replace(/^\n+/, '')));
  const artNorm = artCodes.map((c) => norm(c.replace(/^\n+/, '')));
  let hit = 0;
  for (const [i, a] of artNorm.entries()) {
    const j = srcNorm.indexOf(a);
    if (j >= 0) {
      hit++;
      continue;
    }
    // try a looser comparison: collapse runs of spaces
    const loose = (s) => s.replace(/[ \t]+/g, ' ');
    const j2 = srcNorm.findIndex((s) => loose(s) === loose(a));
    console.log(`  code[${i}] 严格不匹配${j2 >= 0 ? `（仅空白差异，对应源文围栏 ${j2}）` : '（源文里找不到）'}`);
    if (j2 < 0) {
      console.log('    译文首行: ' + JSON.stringify(a.split('\n')[0].slice(0, 90)));
      const diff = a.split('\n').findIndex((l, k) => l !== (srcNorm[0] || '').split('\n')[k]);
      console.log('    首个差异行号: ' + diff);
    } else {
      const A = a.split('\n');
      const B = srcNorm[j2].split('\n');
      for (let k = 0; k < Math.max(A.length, B.length); k++) {
        if (A[k] !== B[k]) console.log(`    第 ${k + 1} 行 译文=${JSON.stringify(A[k])} 源文=${JSON.stringify(B[k])}`);
      }
    }
  }
  console.log(`  ✅ 逐字命中 ${hit}/${artNorm.length}`);
}
