import fs from 'node:fs';
const p = JSON.parse(fs.readFileSync('archive/raw/castano-blog.json', 'utf8'));
console.log('posts', p.length);
let bad = 0;
for (const x of p) {
  const issues = [];
  if (/<[a-z/][^>]*>/i.test(x.title)) issues.push('title 含 HTML 标签');
  if (/^\s|\s$/.test(x.title)) issues.push('title 首尾空白');
  const fences = (x.md.match(/^```/gm) || []).length;
  if (fences % 2) issues.push(`围栏不成对（${fences}）`);
  if (x.words < 20) issues.push(`正文极短（${x.words} 词）`);
  if (/\]\(\[/.test(x.md)) issues.push('嵌套链接残留');
  if (issues.length) {
    bad++;
    console.log(`\n⚠ ${x.date} ${x.slug}`);
    console.log(`   title=${JSON.stringify(x.title)}`);
    for (const i of issues) console.log('   - ' + i);
  }
}
console.log(`\n有问题的 ${bad} / ${p.length}`);
console.log('\n--- 所有标题 ---');
for (const x of p) console.log(`  ${x.date}  ${JSON.stringify(x.title)}`);
