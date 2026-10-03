// Build the final markdown archive from normalized JSON.
// Usage: node build-archive.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';

const RAW = 'archive/raw/';
const read = (n) => JSON.parse(readFileSync(RAW + n, 'utf8'));

const CASEY = read('casey-normalized.json');
// full-text official posts when available, else the RSS excerpts
let WITNESS = read('witness-full.json');
if (!WITNESS.length) WITNESS = read('normalized.json').witness;
WITNESS = WITNESS.filter((p) => p.md && p.md.length > 0);

// ---------------- helpers ----------------
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[\u2018\u2019'"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

const isoDate = (d) => {
  if (!d) return '';
  const t = new Date(d);
  if (!isNaN(t)) return t.toISOString().slice(0, 10);
  return String(d).slice(0, 10);
};

const humanDate = (d) => {
  if (!d) return '';
  const t = new Date(d);
  if (isNaN(t)) return String(d);
  const p = (n) => String(n).padStart(2, '0');
  return `${t.getUTCFullYear()}-${p(t.getUTCMonth() + 1)}-${p(t.getUTCDate())} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())} UTC`;
};

const esc = (s) => s.replace(/\|/g, '\\|').replace(/\n+/g, ' ').trim();

const mk = (dir) => mkdirSync('archive/' + dir, { recursive: true });

// split casey posts into topic groups for the series index
const TOPICS = [
  { name: '碰撞 / 移动系统（Walk Monster 系列）', ids: ['0005', '0006', '0007'] },
  { name: '几何与命名约定', ids: ['0008', '0009', '0010', '0011', '0012'] },
  { name: '草地与植被系统', ids: ['0013', '0014'] },
  { name: '编辑器代码重构（Lister Panel 系列）', ids: ['0015', '0016', '0017', '0018', '0019', '0020', '0021', '0022', '0023'] },
];

// ---------------- 1. Casey series ----------------
rmSync('archive/casey-muratori', { recursive: true, force: true });
rmSync('archive/witness-official', { recursive: true, force: true });
mk('casey-muratori');
let idx = `# Casey Muratori — The Witness 系列（"Witness Wednesday"）

Casey Muratori 是 RAD Game Tools 前工程师、[Handmade Hero](https://handmadehero.org/) 作者。2012–2014 年他以外包/合作程序员的身份参与 *The Witness*，负责**编辑器工具、碰撞与移动系统、草地植被系统**等，并在自己博客上以 "Witness Wednesday"（周三连载）的形式逐篇记录工作过程与代码。

- 出处：<https://caseymuratori.com/contents>（文章编号 blog_0005 – blog_0023）
- 抓取时间：本归档生成时；每篇正文均为原文全文转换（代码块已还原，散文段落保留）
- 共 ${CASEY.length} 篇，跨度 ${CASEY[0].date} → ${CASEY[CASEY.length - 1].date}
- 官方博客（the-witness.net）也交叉发布了其中数篇，见 \`witness-official/\` 中以 "Casey" 署名或标题含 Casey 的条目

## 系列分组

`;

for (const g of TOPICS) {
  idx += `### ${g.name}\n\n`;
  idx += `| # | 日期 | 标题 | 本地文件 | 代码块 |\n|---|---|---|---|---|\n`;
  for (const id of g.ids) {
    const p = CASEY.find((x) => x.id === id);
    if (!p) continue;
    const file = `casey-muratori/${p.date}-${p.id}-${slugify(p.title)}.md`;
    idx += `| blog_${id} | ${p.date} | [${esc(p.title)}](${p.url}) | \`${file.split('/')[1]}\` | ${p.codeBlocks} |\n`;
    writeFileSync(
      'archive/' + file,
      `# ${p.title}\n\n` +
        `- **作者**：${p.author}\n` +
        `- **日期**：${p.date}\n` +
        `- **分组**：${p.category}\n` +
        `- **原文**：${p.url}\n` +
        `- **摘要（原文 meta）**：${p.summary || '—'}\n` +
        `- **系列**：Casey Muratori, *The Witness* 系列（Witness Wednesday）\n\n---\n\n` +
        p.md +
        '\n'
    );
  }
  idx += '\n';
}

// full chronological table
idx += `## 全部文章（按时间）\n\n| 日期 | 标题 | 原文 | 本地文件 |\n|---|---|---|---|\n`;
for (const p of CASEY) {
  const file = `casey-muratori/${p.date}-${p.id}-${slugify(p.title)}.md`;
  idx += `| ${p.date} | ${esc(p.title)} | [link](${p.url}) | \`${file.split('/')[1]}\` |\n`;
}
writeFileSync('archive/casey-muratori/README.md', idx);

// ---------------- 2. official blog ----------------
mk('witness-official');

const authors = {};
for (const p of WITNESS) (authors[p.author] ||= []).push(p);

const byYear = {};
for (const p of WITNESS) {
  const y = isoDate(p.date).slice(0, 4) || 'unknown';
  (byYear[y] ||= []).push(p);
}
mk('witness-official/by-year');
// assign each post its filename ONCE, so the index cannot drift from what is written
const fileNameOf = new Map();
for (const [y, list] of Object.entries(byYear)) {
  const sortedYear = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
  sortedYear.forEach((p, i) => {
    const n = String(i + 1).padStart(3, '0'); // ascending within the year
    fileNameOf.set(p, `${y}-${n}-${slugify(p.title)}.md`);
  });
}
for (const [y, list] of Object.entries(byYear)) {
  for (const p of list) {
    const name = fileNameOf.get(p);
    writeFileSync(
      'archive/witness-official/by-year/' + name,
      `# ${p.title}\n\n` +
        `- **作者**：${p.author}\n` +
        `- **日期**：${humanDate(p.date)}\n` +
        `- **分类**：${(p.categories || []).join(', ') || '—'}\n` +
        `- **原文**：${p.url}\n` +
        `- **来源**：the-witness.net 官方开发博客（文章页全文）\n\n---\n\n` +
        p.md +
        '\n'
    );
  }
}

let widx = `# The Witness 官方开发博客（the-witness.net/news）

Toby/Number None → Thekla, Inc. 的开发日志，2010–2022 年持续更新，共 ${WITNESS.length} 篇。
这是理解《The Witness》开发过程最一手、最完整的资料：早期是引擎技术文章，中期是美术与设计决策，后期是上市前后的复盘。

- 站点：<http://the-witness.net/news/>
- 抓取方式：站点 RSS 全文 feed（\`/news/feed/\`），正文为全文而非摘要
- 抓取篇数：${WITNESS.length}（覆盖 2012-12 至 2022-02；更早的 2010–2011 技术文章见下"分类"说明）
- 时间跨度：${isoDate(WITNESS[0].date)} → ${isoDate(WITNESS[WITNESS.length - 1].date)}

## 按作者统计

| 作者 | 篇数 |
|---|---|
${Object.entries(authors)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([a, l]) => `| ${esc(a)} | ${l.length} |`)
  .join('\n')}

## 按年份

| 年份 | 篇数 |
|---|---|
${Object.entries(byYear)
  .sort((a, b) => b[0].localeCompare(a[0]))
  .map(([y, l]) => `| ${y} | ${l.length} |`)
  .join('\n')}

## 全部文章（按时间倒序）

| 日期 | 作者 | 标题 | 分类 | 本地文件 |
|---|---|---|---|---|
`;
const sorted = [...WITNESS].sort((a, b) => new Date(b.date) - new Date(a.date));
for (const p of sorted) {
  const name = fileNameOf.get(p);
  widx += `| ${isoDate(p.date)} | ${esc(p.author)} | [${esc(p.title)}](${p.url}) | ${esc((p.categories || []).join(', '))} | \`${name}\` |\n`;
}

// author sections
widx += `\n## 作者归档\n\n`;
for (const [a, list] of Object.entries(authors).sort((x, y) => y[1].length - x[1].length)) {
  widx += `### ${a}（${list.length} 篇）\n\n`;
  for (const p of [...list].sort((x, y) => new Date(y.date) - new Date(x.date))) {
    widx += `- ${isoDate(p.date)} — ${p.title}\n`;
  }
  widx += '\n';
}
writeFileSync('archive/witness-official/README.md', widx);

// ---------------- 3. stats ----------------
const stats = {
  generatedAt: new Date().toISOString(),
  witness: {
    count: WITNESS.length,
    chars: WITNESS.reduce((s, p) => s + p.md.length, 0),
    range: [isoDate(WITNESS[0].date), isoDate(WITNESS[WITNESS.length - 1].date)],
    authors: Object.fromEntries(Object.entries(authors).map(([a, l]) => [a, l.length])),
  },
  casey: {
    count: CASEY.length,
    chars: CASEY.reduce((s, p) => s + p.md.length, 0),
    range: [CASEY[0].date, CASEY[CASEY.length - 1].date],
    codeBlocks: CASEY.reduce((s, p) => s + p.codeBlocks, 0),
  },
};
writeFileSync('archive/raw/stats.json', JSON.stringify(stats, null, 2));
console.log(JSON.stringify(stats, null, 2));
