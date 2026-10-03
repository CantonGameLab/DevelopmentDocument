// Verify manifest.mdPath against the date embedded in each archive file.
// This is the check that catches any off-by-one in the manifest's file mapping.
// Usage: node <脚本名>
import { readFileSync, existsSync } from 'node:fs';
import { MANIFEST } from './paths.mjs';

const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const dateOf = (file) => {
  const head = readFileSync(file, 'utf8').slice(0, 600);
  const mm = head.match(/(\d{4}-\d{2}-\d{2})/);
  return mm ? mm[1] : null;
};

let checked = 0;
let bad = 0;
let skippedGuides = 0;
const problems = [];
for (const a of m.articles) {
  // 编者导览不是翻译成果，没有归档源文，不需要路径核验
  if (a.isGuide || a.source === 'guide') {
    skippedGuides++;
    continue;
  }
  if (!a.mdPath) {
    problems.push(`${a.id}: mdPath 为空`);
    bad++;
    continue;
  }
  if (!existsSync(a.mdPath)) {
    problems.push(`${a.id}: 文件不存在 ${a.mdPath}`);
    bad++;
    continue;
  }
  const fileDate = dateOf(a.mdPath);
  const want = a.date.slice(0, 10);
  checked++;
  // 归档文件内嵌日期应等于（或极接近）条目日期；差 1 天以内算通过（时区/页头差异）
  if (fileDate && fileDate !== want) {
    const d = Math.abs(new Date(fileDate) - new Date(want)) / 86400000;
    if (d > 1) {
      problems.push(`${a.id}\n      manifest 日期 ${want}\n      文件内日期   ${fileDate}  (${a.mdPath.split('/').pop()})\n      标题        ${a.title.en}`);
      bad++;
    }
  }
}

console.log(`校验 ${checked} 条 mdPath（按文件内嵌日期比对）${skippedGuides ? `，跳过 ${skippedGuides} 篇编者导览` : ''}`);
if (problems.length) {
  console.log(`\n❌ ${bad} 条不匹配：\n`);
  for (const p of problems) console.log('  - ' + p);
} else {
  console.log('✅ 全部匹配');
}
process.exit(bad ? 1 : 0);
