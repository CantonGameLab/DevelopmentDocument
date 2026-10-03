// Check: does any translated article's `en`/`code` text still contain bulk inline LaTeX
// (i.e. `$…$` inside a sentence) that the reader now typesets? Reports per-article counts
// so we can spot articles where formulas were left as image markdown instead.
import fs from 'node:fs';
import path from 'node:path';
import { ARTICLES } from './paths.mjs';

const DIR = ARTICLES;
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));
const rows = [];
let withMath = 0;
let leftoverLatexImg = [];
for (const f of files) {
  const a = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  let math = 0;
  const walk = (o) => {
    if (typeof o === 'string') {
      math += (o.match(/(^|[^\\])\$[^$\n]+?\$/g) || []).length;
      if (/s0\.wp\.com\/latex\.php/.test(o)) leftoverLatexImg.push(f);
      return;
    }
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') Object.values(o).forEach(walk);
  };
  walk(a.blocks || []);
  if (math) {
    withMath++;
    rows.push([f, math]);
  }
}
rows.sort((x, y) => y[1] - x[1]);
console.log(`译文总数 ${files.length}，含行内公式的 ${withMath} 篇`);
for (const [f, n] of rows) console.log(`  ${String(n).padStart(4)} 条公式  ${f}`);
const uniq = [...new Set(leftoverLatexImg)];
if (uniq.length) {
  console.log(`\n⚠ 仍有 WordPress LaTeX 图片链接残留的译篇（${uniq.length}）：`);
  for (const f of uniq) console.log('   ' + f);
} else {
  console.log('\n✅ 没有 WordPress LaTeX 图片链接残留在译文里');
}
