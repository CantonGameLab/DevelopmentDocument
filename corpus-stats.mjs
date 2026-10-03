// Corpus statistics over the translated articles: blocks by type, code blocks, headings,
// callouts, image placeholders, words. Used for the README numbers and for spot-checking
// that a batch did not silently drop content.
// Usage: node <脚本名> [--by-chapter]
import fs from 'node:fs';
import path from 'node:path';
import { MANIFEST, ARTICLES } from './paths.mjs';

const DIR = ARTICLES;
const byChapter = process.argv.includes('--by-chapter');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const byId = new Map(manifest.articles.map((a) => [a.id, a]));

const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));
const rows = [];
const totals = {
  articles: 0,
  enWords: 0,
  zhChars: 0,
  blocks: 0,
  p: 0,
  h2: 0,
  list: 0,
  listItems: 0,
  quote: 0,
  callout: 0,
  code: 0,
  codeLines: 0,
  images: 0,
  imagePlaceholders: 0,
  mathInline: 0,
};

for (const f of files) {
  const a = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  const id = a.id || f.replace(/\.json$/, '');
  const meta = byId.get(id);
  const s = { id, chapter: meta ? meta.chapter : '?', words: 0, blocks: 0, code: 0, images: 0, callouts: 0, lists: 0, quotes: 0, h2: 0 };

  const countStr = (v, isEn) => {
    if (typeof v !== 'string') return;
    if (isEn) {
      const words = v.split(/\s+/).filter(Boolean).length;
      s.words += words;
      totals.enWords += words;
      totals.images += (v.match(/!\[[^\]]*\]\([^)]*\)/g) || []).length;
      s.images += (v.match(/!\[[^\]]*\]\([^)]*\)/g) || []).length;
      totals.mathInline += (v.match(/(^|[^\\])\$[^$\n]+?\$/g) || []).length;
    } else {
      totals.zhChars += v.length;
      totals.imagePlaceholders += (v.match(/原文此处有[一两三四五六七八九十\d]+\s*张图/g) || []).length;
    }
  };

  for (const b of a.blocks || []) {
    totals.blocks++;
    s.blocks++;
    const t = b.type || 'p';
    if (t === 'code') {
      totals.code++;
      s.code++;
      totals.codeLines += String(b.code || '').split('\n').length;
      countStr(b.captionEn, true);
    } else if (t === 'list') {
      totals.list++;
      s.lists++;
      for (const it of b.items || []) {
        totals.listItems++;
        countStr(it.en, true);
        countStr(it.zh, false);
      }
    } else if (t === 'quote') {
      totals.quote++;
      s.quotes++;
      countStr(b.en, true);
      countStr(b.zh, false);
      countStr(b.noteZh, false);
    } else if (t === 'callout') {
      totals.callout++;
      s.callouts++;
      countStr(b.en, true);
      countStr(b.zh, false);
    } else {
      if (t === 'h2') {
        totals.h2++;
        s.h2++;
      } else totals.p++;
      countStr(b.en, true);
      countStr(b.zh, false);
    }
  }
  if (a.title) countStr(a.title.en, true);
  if (a.subtitle) countStr(a.subtitle.en, true);
  totals.articles++;
  rows.push(s);
}

const n = (x) => x.toLocaleString('en-US');
console.log('=== 语料统计 ===');
console.log(`译文篇数              ${n(totals.articles)}`);
console.log(`英文原文词数          ${n(totals.enWords)}`);
console.log(`中文字数              ${n(totals.zhChars)}`);
console.log(`对照块总数            ${n(totals.blocks)}`);
console.log(`  段落 p              ${n(totals.p)}`);
console.log(`  小标题 h2           ${n(totals.h2)}`);
console.log(`  列表 list           ${n(totals.list)}（${n(totals.listItems)} 项）`);
console.log(`  引用 quote          ${n(totals.quote)}`);
console.log(`  提示框 callout      ${n(totals.callout)}`);
console.log(`  代码 code           ${n(totals.code)}（${n(totals.codeLines)} 行）`);
console.log(`配图位（en 里的图片） ${n(totals.images)}`);
console.log(`配图占位（zh 里的）   ${n(totals.imagePlaceholders)}`);
console.log(`行内公式 $…$          ${n(totals.mathInline)}`);

if (byChapter) {
  const groups = new Map();
  for (const r of rows) {
    const g = groups.get(r.chapter) || { a: 0, w: 0, b: 0, c: 0, i: 0, ca: 0 };
    g.a++;
    g.w += r.words;
    g.b += r.blocks;
    g.c += r.code;
    g.i += r.images;
    g.ca += r.callouts;
    groups.set(r.chapter, g);
  }
  console.log('\n=== 按章节 ===');
  const order = manifest.chapters.map((c) => c.key);
  console.log('章节'.padEnd(24) + '篇'.padStart(5) + '词'.padStart(9) + '块'.padStart(7) + '代码'.padStart(6) + '图'.padStart(6) + '提示'.padStart(6));
  for (const k of order) {
    const g = groups.get(k);
    if (!g) continue;
    const c = manifest.chapters.find((x) => x.key === k);
    console.log(`${k.padEnd(24)}${String(g.a).padStart(5)}${n(g.w).padStart(9)}${String(g.b).padStart(7)}${String(g.c).padStart(6)}${String(g.i).padStart(6)}${String(g.ca).padStart(6)}  ${c ? c.zh : ''}`);
  }
}
