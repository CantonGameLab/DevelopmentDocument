// Final image-markdown normaliser with bracket-aware parsing.
// Handles alt text containing brackets (WordPress uploads like `IMG_20140204_181225[1]`)
// and links that wrap more than one image.
//
// Usage: node <脚本名> [--dry]
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { ARTICLES } from './paths.mjs';

const DIR = ARTICLES + '/';
const dry = process.argv.includes('--dry');

/** Read a balanced `[...]` group starting at `i` (which points at `[`). */
function readBracket(s, i) {
  if (s[i] !== '[') return null;
  let depth = 0;
  for (let k = i; k < s.length; k++) {
    if (s[k] === '[') depth++;
    else if (s[k] === ']') {
      depth--;
      if (depth === 0) return { end: k + 1 };
    }
  }
  return null;
}
/** Read a balanced `(...)` group starting at `i`. */
function readParen(s, i) {
  if (s[i] !== '(') return null;
  let depth = 0;
  for (let k = i; k < s.length; k++) {
    if (s[k] === '(') depth++;
    else if (s[k] === ')') {
      depth--;
      if (depth === 0) return { end: k + 1 };
    }
  }
  return null;
}

/** Strip a `"title"` suffix inside a markdown link target. */
const stripTitle = (url) => url.replace(/\s+"[^"]*"\s*$/, '').trim();

/** Unwrap `[ <images> ]( target )` into bare images, and normalise alt text. */
function unwrap(s) {
  let out = '';
  let i = 0;
  while (i < s.length) {
    if (s[i] === '[') {
      const br = readBracket(s, i);
      if (br && s[br.end] === '(') {
        // 可能是「链接包图片」或「图片本身」；先看括号里是不是图片
        const inner = s.slice(i + 1, br.end - 1);
        const pr = readParen(s, br.end);
        if (pr && /!\[/.test(inner)) {
          // 链接包图片 -> 展开内部图片（丢弃外层链接与 target）
          out += unwrap(inner);
          i = pr.end;
          continue;
        }
      }
    }
    out += s[i];
    i++;
  }
  // 统一 alt：把非「图」的 alt 压平（含方括号的 WordPress 文件名也一并处理）
  out = out.replace(/!\[([^\]]*(?:\][^\]]*)*?)\]\(((?:[^()]|\([^)]*\))*)\)/g, (_m, _alt, target) => {
    return `![图](${stripTitle(target)})`;
  });
  return out;
}

let files = 0;
for (const f of readdirSync(DIR).filter((x) => x.endsWith('.json'))) {
  const p = DIR + f;
  const before = readFileSync(p, 'utf8');
  const after = unwrap(before);
  if (after !== before) {
    files++;
    if (!dry) writeFileSync(p, after);
  }
}

console.log(`${dry ? '[dry-run] ' : ''}修改 ${files} 个文件`);
const count = (re) =>
  readdirSync(DIR)
    .filter((x) => x.endsWith('.json'))
    .reduce((s, f) => s + (readFileSync(DIR + f, 'utf8').match(re) || []).length, 0);
const nested = count(/\[\s*!\[/g);
const bare = count(/!\[(?!图\])/g);
console.log(`  ![图](url): ${count(/!\[图\]\(/g)}`);
console.log(`  嵌套形式: ${nested}${nested ? '  ← 仍有残留' : ''}`);
console.log(`  非「图」alt: ${bare}${bare ? '  ← 仍有残留' : ''}`);
