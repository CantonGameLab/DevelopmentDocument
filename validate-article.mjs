// Validate one translated article (or all of them) against schema.md.
// Usage: node <脚本名> [article-id | --all]
import { readFileSync, writeFileSync, readdirSync, existsSync, renameSync, rmSync } from 'node:fs';

import { MANIFEST, ARTICLES } from './paths.mjs';
const DIR = ARTICLES + '/';


const TERM_CHECKS = [
  [/player movement code/i, /玩家移动代码/, '「player movement code」应译作「玩家移动代码」'],
  [/walkable surface/i, /可行走表面/, '「walkable surface」应译作「可行走表面」'],
  [/compression-oriented/i, /压缩导向编程/, '「compression-oriented programming」应译作「压缩导向编程」'],
  [/collision volume/i, /碰撞体/, '「collision volume」应译作「碰撞体」'],
  [/flood fill/i, /洪泛填充/, '「flood fill」应译作「洪泛填充」'],
  [/shader/i, /着色器/, '「shader」应译作「着色器」'],
  [/manifold/i, /流形/, '「manifold」应译作「流形」'],
];

/**
 * 中文里出现半角标点？比朴素正则聪明一点，避免把以下合法写法误报出来：
 *  · 数字千位分隔与本地区间记法：`1,119`、`[-1,1]`、`{0, 0}`
 *  · URL 与行内代码里的标点（本函数只用于 zh 字段，但代码标记也会出现）
 *  · 数学/技术记号：`(a, b, c, d)`、`f(x, y)`
 *  · `$…$` 行内公式里的标点：LaTeX 用的本来就是半角逗号、括号与空格
 *    （`(\mathbf{d}_{yi}, -\mathbf{d}_{xi}, 0)`）。**公式必须整段剥掉再查**，
 *    否则每一篇带公式的数学长文都会刷出一片假警告。
 */
function hasHalfWidthPunctuation(s) {
  // 去掉行内代码、URL、行内公式，以及「」内被当作文本引用的代码记号（如「==」和「!=」、release(owner, resource)）
  const stripped = s
    .replace(/`[^`]*`/g, '')
    .replace(/\$[^$\n]*\$/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/「[^」]*」/g, '')
    .replace(/“[^”]*”/g, '');
  for (let i = 0; i < stripped.length; i++) {
    const ch = stripped[i];
    if (!',;?!'.includes(ch)) continue;
    const prev = stripped[i - 1] || '';
    const next = stripped[i + 1] || '';
    // 逗号/分号夹在数字、括号或字母标识符之间 => 千位分隔、区间、参数列表。
    // 允许逗号后带一个空格：源文常写 `[0, 16]`（区间记法），那不是中文标点问题。
    if (ch === ',' || ch === ';') {
      const numish = (c) => /[0-9)}\]a-zA-Z]/.test(c);
      if (numish(prev) && numish(next)) continue;
      const after = /^[ \t]*([0-9(\[{a-zA-Z])/.exec(stripped.slice(i + 1));
      if (numish(prev) && after && numish(after[1])) continue;
    }
    // `!=` 之类的运算符
    if (ch === '!' && prev === '=') continue;
    // 紧跟拉丁字母/数字的问号，通常是代码标识符的一部分（如 `_clear_?`）
    if (ch === '?' && /[a-zA-Z0-9_]/.test(prev)) continue;
    return true;
  }
  return false;
}

function validate(id) {
  const file = DIR + id + '.json';
  const problems = [];
  const warns = [];
  if (!existsSync(file)) return { id, problems: ['文件不存在: ' + file], warns, stats: null };

  let j;
  const raw = readFileSync(file, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) problems.push('文件含 BOM');
  try {
    j = JSON.parse(raw);
  } catch (e) {
    return { id, problems: ['JSON 非法: ' + e.message], warns, stats: null };
  }

  if (!j.id) problems.push('缺少 id 字段');
  else if (j.id !== id) problems.push(`id 不匹配: 文件里是 ${j.id}，文件名是 ${id}`);
  if (!j.title || !j.title.zh) problems.push('缺少 title.zh');
  if (!Array.isArray(j.blocks) || !j.blocks.length) problems.push('blocks 为空或不是数组');

  const blocks = j.blocks || [];
  let zhCount = 0;
  let enCount = 0;
  const ids = new Set();

  blocks.forEach((b, i) => {
    const at = `blocks[${i}] (${b.type})`;
    if (!b.type) problems.push(`${at}: 缺少 type`);
    if (!['h2', 'p', 'list', 'quote', 'callout', 'code'].includes(b.type)) problems.push(`${at}: 未知 type`);
    if (b.type === 'list') {
      if (!Array.isArray(b.items) || !b.items.length) problems.push(`${at}: items 为空`);
      else
        b.items.forEach((it, k) => {
          if (!it.en) problems.push(`${at}.items[${k}]: 缺少 en`);
          if (!it.zh) problems.push(`${at}.items[${k}]: 缺少 zh`);
        });
      return;
    }
    if (b.type === 'code') {
      if (!b.code) problems.push(`${at}: 缺少 code`);
      // 代码里不应出现中文（注释也应保持英文）
      if (/[\u4e00-\u9fff]/.test(b.code || '')) warns.push(`${at}: code 里出现中文，按规范代码应保持英文原文`);
      return;
    }
    if (!b.en) problems.push(`${at}: 缺少 en`);
    if (!b.zh) problems.push(`${at}: 缺少 zh`);
    if (b.en) enCount++;
    if (b.zh) zhCount++;
    if (b.type === 'h2') {
      if (!b.id) problems.push(`${at}: h2 缺少 id`);
      else if (ids.has(b.id)) problems.push(`${at}: h2 id 重复 (${b.id})`);
      else ids.add(b.id);
    }
    if (b.type === 'callout' && !['insight', 'warning'].includes(b.kind))
      warns.push(`${at}: callout.kind 建议为 insight 或 warning`);
    // 全角/半角与空格抽查。
    // 注意：`quote` 块的 zh 有时是**刻意整段保留英文**的引用（源文引用的是含编译器开关、
    // 代码片段的英文原文，按「代码原样、注释也不译」的口径处理，`noteZh` 里声明原因）。
    // 那种段落里出现半角标点是刻意的，不是漏改。所以只在 zh 里真的含中文时才做这两项检查。
    const zhLooksChinese = b.zh && /[\u4e00-\u9fff]/.test(b.zh);
    if (zhLooksChinese && /[a-zA-Z0-9][\u4e00-\u9fff]|[\u4e00-\u9fff][a-zA-Z0-9]/.test(b.zh))
      warns.push(`${at}: 中英文之间可能缺少空格`);
    if (zhLooksChinese && hasHalfWidthPunctuation(b.zh)) warns.push(`${at}: 中文里出现半角标点`);
  });

  // 术语抽查：取全文
  const allEn = blocks.map((b) => b.en || '').join(' ');
  const allZh = blocks.map((b) => b.zh || '').join(' ');
  for (const [reEn, reZh, msg] of TERM_CHECKS) {
    if (reEn.test(allEn) && !reZh.test(allZh)) warns.push('术语: ' + msg);
  }

  const callouts = blocks.filter((b) => b.type === 'callout').length;
  if (callouts > 4) warns.push(`callout 共 ${callouts} 个，建议一篇不超过 3–4 个`);

  const codeBlocks = blocks.filter((b) => b.type === 'code').length;
  return {
    id,
    problems,
    warns,
    stats: { blocks: blocks.length, paragraphs: enCount, h2: ids.size, code: codeBlocks, callouts },
  };
}

function updateManifest(ids) {
  // 并发保护：多个批次可能同时跑校验器。写入用「临时文件 + 改名」保证原子性；
  // 读取失败时重试一次，避免恰好读到另一个进程写到一半的内容。
  let m = null;
  for (let attempt = 0; attempt < 3 && !m; attempt++) {
    try {
      m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
    } catch (e) {
      if (attempt === 2) throw new Error(`manifest.json 无法解析（可能被并发写入破坏）：${e.message}`);
    }
  }
  let changed = 0;
  for (const a of m.articles) {
    const has = existsSync(DIR + a.id + '.json');
    const want = has ? 'done' : 'pending';
    if (a.status !== want) {
      a.status = want;
      changed++;
    }
  }
  // 把译文的 title.zh / subtitle.zh 回填到 manifest
  for (const a of m.articles) {
    if (!existsSync(DIR + a.id + '.json')) continue;
    try {
      const j = JSON.parse(readFileSync(DIR + a.id + '.json', 'utf8'));
      if (j.title && j.title.zh) a.title.zh = j.title.zh;
      if (j.subtitle && j.subtitle.zh) a.subtitleZh = j.subtitle.zh;
    } catch {}
  }
  // 原子写入。临时文件名必须带 pid：多个批次会并发跑校验器，共用同一个 `.tmp`
  // 名字会因为「一个进程改名后另一个再改」而失败（Windows 上表现为 EPERM）。
  const tmp = `${MANIFEST}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(m, null, 2));
  try {
    renameSync(tmp, MANIFEST);
  } catch (e) {
    // 极端并发下改名可能瞬时失败；数据已在 tmp 里，放弃这次同步不影响校验结果
    try {
      rmSync(tmp, { force: true });
    } catch {}
    console.warn(`  ! manifest 同步跳过（并发写入竞争）：${e.code || e.message}`);
  }
  return { changed, done: m.articles.filter((a) => a.status === 'done').length, total: m.articles.length };
}

const arg = process.argv[2] || '--all';
const ids =
  arg === '--all'
    ? readdirSync(DIR)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''))
    : [arg];

let bad = 0;
for (const id of ids) {
  const r = validate(id);
  const s = r.stats;
  console.log(`\n=== ${id} ===`);
  if (s) console.log(`  blocks ${s.blocks} | 段落对 ${s.paragraphs} | 小标题 ${s.h2} | 代码 ${s.code} | 提示框 ${s.callouts}`);
  for (const p of r.problems) console.log('  ❌ ' + p);
  for (const w of r.warns.slice(0, 12)) console.log('  ⚠ ' + w);
  if (r.warns.length > 12) console.log(`  ⚠ …还有 ${r.warns.length - 12} 条警告`);
  if (!r.problems.length && !r.warns.length) console.log('  ✅ 通过');
  if (r.problems.length) bad++;
}

const mm = updateManifest(ids);
console.log(`\nmanifest 已更新：已完成 ${mm.done} / ${mm.total} 篇`);
console.log(bad ? `\n${bad} 篇有错误` : '\n✅ 全部通过');
process.exit(bad ? 1 : 0);
