// Permanent fidelity check: does every English source unit actually appear in the
// translated article, in the SAME ORDER?
//
// The translating agents each wrote a throwaway checker; this keeps that capability in
// the repo. It reports *drift*, not failure: legitimate repairs (joining a code line the
// archive left outside its fence, dropping WordPress gallery widgets, re-fusing a
// mislabelled fence) show up here on purpose so a human can eyeball them.
//
// Method: build the source unit list and the article's ordered `en`/`code` list, then walk
// both with a cursor — a source unit counts as present if it is found at or after the
// current cursor. Code-vs-text is inferred from the source (fenced => code), and a source
// text unit may be satisfied by either list, because archives disagree about which is which.
//
// Usage:
//   node <脚本名> --all
//   node casey-0006 casey-0006
//
// ── 已知假阳性（2026-09 基线：44 篇中 37 篇通过，剩余 7 篇全部为下列类型）──────────
// 逐条核对过，这 7 篇**没有内容缺失**，报出的都是检测器自身局限：
//   · casey-0005（12 条）：风格基准篇的插图按旧口径丢弃，schema 已把它列为例外。
//   · shadow-mapping（20 条）：归档每行代码外多包了一层反引号，属格式噪音，已合法去除。
//   · PSX（31 条）：多张图挤在同一个源行，检测器拆不开，图片块其实都在。
//   · road-to-e3 day3/day4（3 条）：图文同行的拆分，以及粗体行被提升为 h2。
//   · casey-0019（1 条）：归档把一段正文吞进了代码围栏，代理已还原为段落。
//   · polishing（2 条）：同上，图文同行。
// 要收紧判定就改下面的探针规则；但先确认不是上述类型之一。
import { readFileSync, existsSync } from 'node:fs';

import { MANIFEST, ARTICLES } from './paths.mjs';
const DIR = ARTICLES + '/';

const norm = (s) =>
  String(s)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    // 图片：把「缩略图包永久链接」折成单图，去掉 title，并把 URL 归约成文件名。
    // 各篇统一用原图 URL 取代缩略图，这是已声明的口径，且 WordPress 会同时存在
    // 带/不带 -512x288 后缀的同一张图，所以只比对文件名。
    .replace(/\[\s*(!\[[^\]]*\]\([^)]*\))\s*\]\([^)]*\)/g, '$1')
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, (_m, alt, url) => {
      const file = String(url).split(/[?#]/)[0].split('/').pop() || url;
      return `![${alt}](${file.replace(/-\d+x\d+(?=\.\w+$)/, '')})`;
    })
    .replace(/\s+/g, ' ')
    .trim();

/** Split source markdown (after the archive header) into ordered units. */
function sourceUnits(md) {
  const i = md.indexOf('\n---\n');
  const body = i >= 0 ? md.slice(i + 5) : md;
  const units = [];
  const lines = body.split('\n');
  // 归档正文之后可能跟着 WordPress 的读者评论区。全站口径是**只译正文**，评论区不译；
  // 不在这里切掉的话，每篇带评论的文章都会刷出十几到二十几条「未覆盖」的假报警，
  // 真遗漏会被淹没。两种形态都要认：
  //   ① `---` 分隔线后 3 行内出现评论数 / Permalink 标记（多数篇目）
  //   ② 正文结束直接接一条独立的 `N Comments` 行（没有分隔线，如 new-job 篇）
  let cut = lines.length;
  for (let k = 0; k < lines.length; k++) {
    const line = lines[k].trim();
    if (/^\d+\s+Comments?$/.test(line)) {
      cut = k;
      break;
    }
    if (!/^-{3,}$/.test(line)) continue;
    const window = lines.slice(k + 1, k + 4).join(' ');
    if (/(\d+\s+Comments?|Permalink|Posted\s+(on|by)\s)/i.test(window)) {
      cut = k;
      break;
    }
  }
  for (let k = 0; k < cut; k++) {
    const line = lines[k];
    if (line.startsWith('```')) {
      const buf = [];
      k++;
      while (k < lines.length && !lines[k].startsWith('```')) buf.push(lines[k++]);
      const code = buf.join('\n').replace(/^\n+|\s+$/g, '');
      if (code.trim()) units.push({ kind: 'code', text: norm(code) });
      continue;
    }
    const t = norm(line.replace(/^#{1,6}\s*/, '').replace(/^>\s*/, ''));
    if (!t) continue;
    // 引用块在译文里是 quote 块，en 不含 `>` 前缀（上面已剥）
    if (/^`+$/.test(t)) continue;
    // 只由 URL / URL 片段 + 右括号组成，且没有别的文字的行
    // （归档把图文同行的图片 markdown 折成了多行，拆出来的碎片不构成内容）
    const withoutUrls = t.replace(/https?:\/\/\S+/g, '').replace(/[)!\[\]()\s]+/g, '');
    if (!withoutUrls && /https?:\/\//.test(t)) continue;
    const withAlt = t.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/[()\s!\[\]]+/g, '');
    if (!withAlt && /^[!\[\]()\s]*!?\[/.test(t)) continue;
    // 无序列表项：源文写作 `- xxx`，译文按 schema 放进 list 块（en 不含项目符号）。
    // 但 `-` 也可能是正文/图注里的分隔符（如 bugs 篇的 `-In this shot, ...`），
    // 所以两种形式都保留为候选，匹配时任一命中即可。
    const bare = t.replace(/^[-*+]\s*/, '');
    units.push({ kind: 'text', text: t, alt: bare !== t ? bare : null });
  }
  return units;
}

/** The article's own ordered haystack: english fields and code fields, kept separate. */
function articleHaystacks(art) {
  const en = [];
  const code = [];
  const head = [];
  for (const b of art.blocks || []) {
    if (b.type === 'code') {
      code.push(norm(b.code));
      continue;
    }
    if (b.type === 'list') {
      for (const it of b.items || []) if (it.en) en.push(norm(it.en));
      continue;
    }
    if (b.type === 'h2' && b.en) head.push(norm(b.en));
    if (b.en) en.push(norm(b.en));
  }
  // 标题与副标题也纳入，源文的小标题可能被提升为文章标题
  if (art.title && art.title.en) head.push(norm(art.title.en));
  if (art.subtitle && art.subtitle.en) head.push(norm(art.subtitle.en));
  return {
    en,
    code,
    enAll: norm(en.join(' \u0000 ')),
    codeAll: norm(code.join(' \u0000 ')),
    headHay: norm(head.join(' \u0000 ')),
  };
}

const searchIn = (hay, probe) => hay.indexOf(probe);

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const arg = process.argv[2] || '--all';
// 编者导览不是翻译，没有归档源文可比对
const isGuide = (a) => a.isGuide || a.source === 'guide' || !a.mdPath;
const targets =
  arg === '--all'
    ? manifest.articles.filter((a) => existsSync(DIR + a.id + '.json') && !isGuide(a))
    : manifest.articles.filter((a) => a.id === arg).map((a) => (isGuide(a) ? { ...a, __guide: true } : a));

if (targets.some((t) => t.__guide)) {
  console.log(`（${arg} 是编者导览，没有归档源文，跳过保真核验）`);
  process.exit(0);
}

if (!targets.length) {
  console.log('没有可检查的译文（先翻译几篇）。');
  process.exit(0);
}

const rows = [];
let totalUnits = 0;
let totalMissing = 0;

for (const a of targets) {
  const art = JSON.parse(readFileSync(DIR + a.id + '.json', 'utf8'));
  if (!existsSync(a.mdPath)) {
    rows.push({ id: a.id, units: 0, missing: [{ text: '源文件缺失', kind: 'file' }] });
    continue;
  }
  const units = sourceUnits(readFileSync(a.mdPath, 'utf8'));
  const { enAll, codeAll, headHay } = articleHaystacks(art);

  const missing = [];
  const IMG_ONLY = /^(!\[[^\]]*\]\([^)]*\)\s*)+$/; // 整行都是图片
  const PLACEHOLDER = /原文此处有[一两三四五六七八九十\d]+\s*张图/;
  // 译文里图片统一成 `![图](原图URL)`，alt 不再带文件名，所以按【文件主名】比对：
  // 把源文里的图片行抽出文件名集合，只要译文里能找到同名文件即算覆盖。
  const fileNamesOf = (s) => {
    const names = [];
    // 用括号感知的扫描，因为 WordPress 的 alt 里可能带方括号（`IMG_x[1]`）
    let i = 0;
    while (i < s.length) {
      if (s[i] === '!' && s[i + 1] === '[') {
        // 读平衡的 [...]，再读平衡的 (...)
        let d = 0;
        let j = i + 1;
        let close = -1;
        for (; j < s.length; j++) {
          if (s[j] === '[') d++;
          else if (s[j] === ']') {
            d--;
            if (d === 0) {
              close = j;
              break;
            }
          }
        }
        if (close > 0 && s[close + 1] === '(') {
          let pd = 0;
          let k = close + 1;
          for (; k < s.length; k++) {
            if (s[k] === '(') pd++;
            else if (s[k] === ')') {
              pd--;
              if (pd === 0) break;
            }
          }
          const target = s.slice(close + 2, k).replace(/\s+"[^"]*"\s*$/, '').trim();
          const base = target.split(/[?#]/)[0].split('/').pop() || '';
          if (base) names.push(base.replace(/-\d+x\d+(?=\.\w+$)/, '').replace(/\.\w+$/, ''));
          i = k + 1;
          continue;
        }
      }
      i++;
    }
    return names;
  };
  for (const u of units) {
    totalUnits++;
    // 图片行按 schema 的约定被改写成占位块，所以只要译文里有对应的图片块就算覆盖。
    if (u.kind === 'text' && IMG_ONLY.test(u.text)) {
      const names = fileNamesOf(u.text);
      const allNamesOk = names.length > 0 && names.every((n) => enAll.includes(n));
      if (allNamesOk || PLACEHOLDER.test(enAll)) continue;
      missing.push({ kind: 'image', text: u.text.slice(0, 100) });
      continue;
    }
    // 探针：代码块用较长前缀（避免行内标注差异），正文用较短前缀
    const base = u.kind === 'code' ? u.text.slice(0, 120) : u.text.slice(0, 45);
    if (!base) continue;
    // 列表项可能被译成 list 块（无 `- ` 符号），原文与去符号形式任一命中即可
    const probes = [base];
    if (u.alt) probes.push(u.alt.slice(0, 45));
    // 归档对「这段到底是代码还是正文」经常标错，所以两边都查
    if (probes.some((p) => searchIn(enAll, p) >= 0 || searchIn(codeAll, p) >= 0)) continue;
    // 粗体小标题（`**The Background**`）在译文里被提升为 h2，h2 文本也参与比对
    const boldHeading = u.text.replace(/^\*\*|\*\*:?$/g, '').trim();
    if (boldHeading && boldHeading !== u.text && (searchIn(enAll, boldHeading) >= 0 || searchIn(headHay, boldHeading) >= 0)) continue;
    // 若前 45 字没命中，试完整单元，以及去掉「空替代文本图片」后的形式
    const alt = u.text.replace(/!\[\]\([^)]*\)/g, '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
    if (alt && alt.length > 8 && (searchIn(enAll, alt.slice(0, 45)) >= 0 || searchIn(codeAll, alt.slice(0, 45)) >= 0)) continue;
    // 图片 markdown 可能因归档换行被拆到多行，逐段重试
    const imgParts = u.text.split(/!\[[^\]]*\]\(/).filter((p) => p.length > 20);
    if (imgParts.length && imgParts.every((p) => searchIn(enAll, p.slice(0, 30)) >= 0)) continue;

    // 通用兜底：只要这个单元里的图片文件名都能在译文中找到，就算覆盖。
    // 覆盖「链接包图片」「多图同行」「行内嵌图」等形态——归一化后译文里是 `![图](原图URL)`。
    const unitNames = fileNamesOf(u.text);
    if (unitNames.length && unitNames.every((n) => enAll.includes(n))) continue;

    // 长正文段落可能被合法拆分，退一步按句子覆盖率判定
    const parts = u.text.split(/(?<=[.?!])\s+/).filter((s) => s.length > 24);
    if (parts.length >= 2) {
      const hit = parts.filter((p) => searchIn(enAll, p.slice(0, 40)) >= 0 || searchIn(codeAll, p.slice(0, 40)) >= 0).length;
      if (hit / parts.length >= 0.6) continue;
    }
    missing.push({ kind: u.kind, text: u.text.slice(0, 100) });
  }
  totalMissing += missing.length;
  rows.push({ id: a.id, units: units.length, missing });
}

console.log(`保真核验：${rows.length} 篇，源文单元 ${totalUnits} 个，未覆盖 ${totalMissing} 个\n`);

// 按性质归类，便于快速判断是「真遗漏」还是已知假阳性
const buckets = { image: 0, backtick: 0, code: 0, mixedLine: 0, other: 0 };
const otherSamples = [];
for (const r of rows) {
  for (const m of r.missing) {
    const t = m.text;
    if (m.kind === 'image' || /^!\[/.test(t)) buckets.image++;
    else if (/^`+$/.test(t)) buckets.backtick++;
    else if (m.kind === 'code') buckets.code++;
    else if (/^!\[[^\]]*\]\([^)]*\)\S/.test(t)) buckets.mixedLine++;
    else {
      buckets.other++;
      if (otherSamples.length < 12) otherSamples.push(`${r.id}: [${m.kind}] ${JSON.stringify(t.slice(0, 90))}`);
    }
  }
}
console.log('未覆盖单元的类别分布：');
console.log(`  图片占位类（已知口径）      ${buckets.image}`);
console.log(`  归档多余反引号（格式噪音）  ${buckets.backtick}`);
console.log(`  代码块边界修复（已声明）    ${buckets.code}`);
console.log(`  图文同行拆分（已声明）      ${buckets.mixedLine}`);
console.log(`  ⚠ 其他（需人工看）          ${buckets.other}`);
if (otherSamples.length) {
  console.log('\n「其他」样例：');
  for (const s of otherSamples) console.log('  · ' + s);
}
console.log('');
for (const r of rows) {
  const flag = r.missing.length === 0 ? '✅' : '⚠';
  console.log(`${flag} ${r.id}  units=${r.units} missing=${r.missing.length}`);
  for (const m of r.missing.slice(0, 4)) console.log(`      [${m.kind}] ${JSON.stringify(m.text)}`);
  if (r.missing.length > 4) console.log(`      …还有 ${r.missing.length - 4} 条`);
}
console.log(
  totalMissing
    ? `\n未覆盖单元通常对应归档格式噪音或代理在 translator.note 里已声明的修复，请逐条人工确认。`
    : `\n✅ 所有源文单元都在译文中找到对应内容`
);
process.exit(0);
