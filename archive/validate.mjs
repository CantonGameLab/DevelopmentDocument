// Validate the generated archive: file counts, index link targets, content sanity.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';

const root = 'archive/';
const problems = [];

const byYearDir = root + 'witness-official/by-year';
const caseyDir = root + 'casey-muratori';
const byYear = readdirSync(byYearDir).filter((f) => f.endsWith('.md'));
const casey = readdirSync(caseyDir).filter((f) => f.endsWith('.md'));

const W = JSON.parse(readFileSync(root + 'raw/witness-full.json', 'utf8')).filter((p) => p.md && p.md.length);
const C = JSON.parse(readFileSync(root + 'raw/casey-normalized.json', 'utf8'));

console.log('posts in data:  witness', W.length, '| casey', C.length);
console.log('files on disk:  witness', byYear.length, '| casey', casey.length, '(casey incl. README.md)');
if (byYear.length !== W.length) problems.push(`by-year file count ${byYear.length} != ${W.length} posts`);
if (casey.length !== C.length + 1) problems.push(`casey file count ${casey.length} != ${C.length + 1}`);

// ---- index link targets ----
// witness index lists bare filenames that live in witness-official/by-year/
// casey index lists "casey-muratori/<name>.md"
const checkIndex = (rel, searchDirs) => {
  const md = readFileSync(root + rel, 'utf8');
  const refs = [...new Set([...md.matchAll(/`([^`]+\.md)`/g)].map((m) => m[1]))];
  let missing = 0;
  for (const r of refs) {
    const cands = searchDirs.map((d) => (d.endsWith('/') ? d + r.replace(/^.*\//, '') : d + r));
    if (!cands.some((c) => existsSync(c))) {
      problems.push(`${rel} -> missing: ${r}`);
      missing++;
    }
  }
  return { refs: refs.length, missing };
};
const i1 = checkIndex('witness-official/README.md', [byYearDir + '/']);
const i2 = checkIndex('casey-muratori/README.md', [root, caseyDir + '/']);
console.log(`index refs: witness ${i1.refs} (missing ${i1.missing}) | casey ${i2.refs} (missing ${i2.missing})`);

// ---- content sanity ----
const scan = (dir) => {
  let empty = 0, oddFences = 0, htmlLeft = 0, total = 0, minChars = Infinity, minFile = '';
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.md'))) {
    const t = readFileSync(dir + '/' + f, 'utf8');
    if (f === 'README.md') continue;
    total++;
    const body = t.includes('\n---\n') ? t.split('\n---\n').slice(1).join('\n---\n') : t;
    if (body.trim().length < 30) empty++;
    if ((body.split('```').length - 1) % 2 !== 0) oddFences++;
    if (/<(p|div|span|img|em|strong)[\s>]/i.test(body)) htmlLeft++;
    if (body.length < minChars) { minChars = body.length; minFile = f; }
  }
  return { total, empty, oddFences, htmlLeft, smallest: `${minFile} (${minChars})` };
};
const s1 = scan(byYearDir);
const s2 = scan(caseyDir);
console.log('witness files:', JSON.stringify(s1, null, 0));
console.log('casey files:  ', JSON.stringify(s2, null, 0));
if (s1.oddFences || s2.oddFences) problems.push('unbalanced code fences found');
if (s1.htmlLeft || s2.htmlLeft) problems.push('leftover HTML markup found');

const sizeOf = (dir) =>
  readdirSync(dir).filter((f) => f.endsWith('.md')).reduce((s, f) => s + statSync(dir + '/' + f).size, 0);
console.log(`total markdown: ${Math.round((sizeOf(byYearDir) + sizeOf(caseyDir)) / 1024)} KB across ${byYear.length + casey.length} files`);

console.log('\n' + (problems.length ? 'PROBLEMS:\n' + problems.join('\n') : '✅ all checks passed'));
