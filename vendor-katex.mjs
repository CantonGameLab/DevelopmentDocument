// Vendor KaTeX locally so the reader can typeset `$…$` formulas without a network.
// Usage: node <脚本名>
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const VERSION = '0.16.11';
const BASE = `https://cdn.jsdelivr.net/npm/katex@${VERSION}/dist/`;
const OUT = path.resolve('vendor/katex');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

function get(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        resolve(get(new URL(res.headers.location, url).href, redirects - 1));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, buf: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.setTimeout(60000, () => req.destroy(new Error('timeout ' + url)));
  });
}

// katex.min.css 引用了这些字体；先把 CSS 拉下来，再从里面解析出真正需要的文件清单，
// 避免手写一个会随版本失效的字体列表。
const css = await get(BASE + 'katex.min.css');
if (css.status !== 200) throw new Error('katex.min.css ' + css.status);
const cssText = css.buf.toString('utf8');

const wanted = new Set(['katex.min.css', 'katex.min.js']);
for (const m of cssText.matchAll(/url\(([^)]+)\)/g)) {
  const raw = m[1].replace(/^["']|["']$/g, '').trim();
  if (!raw || /^data:/.test(raw) || /^https?:/.test(raw)) continue;
  wanted.add(raw.replace(/^\.\//, ''));
}

fs.mkdirSync(OUT, { recursive: true });
let ok = 0;
for (const rel of [...wanted].sort()) {
  const dest = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const fromCache = fs.existsSync(dest) && fs.statSync(dest).size > 0;
  if (!fromCache) {
    const r = await get(BASE + rel);
    if (r.status !== 200) {
      console.log(`  ✗ ${rel} -> ${r.status}`);
      continue;
    }
    fs.writeFileSync(dest, r.buf);
  }
  ok++;
  console.log(`  ${fromCache ? '·' : '✓'} ${rel.padEnd(46)} ${String(fs.statSync(dest).size).padStart(8)} bytes`);
}
console.log(`\nKaTeX ${VERSION} → ${path.relative(process.cwd(), OUT)}  （${ok}/${wanted.size} 个文件）`);
