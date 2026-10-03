// Stress test: run several validate-article.mjs --all processes concurrently and confirm
// the shared manifest.json is never left unparsable (atomic write + read retry).
// Usage: node test-concurrent.mjs
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MANIFEST, DATA } from './paths.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const N = 6;
const runs = [];
for (let i = 0; i < N; i++) {
  runs.push(
    new Promise((resolve) => {
      // 用绝对路径，跑的时候不必先 cd 到仓库根
      // stdio 继承，所以不受沙箱对管道 stdio 的限制
      const p = spawn(process.execPath, [join(HERE, 'validate-article.mjs'), '--all'], { stdio: 'ignore' });
      p.on('close', (code) => resolve({ i, code }));
    })
  );
}

// 同时在写入过程中不断尝试解析 manifest
const parseFails = [];
const watcher = setInterval(() => {
  try {
    JSON.parse(readFileSync(MANIFEST, 'utf8'));
  } catch (e) {
    parseFails.push(e.message);
  }
}, 5);

const results = await Promise.all(runs);
clearInterval(watcher);

const artifacts = readdirSync(DATA).filter((f) => f.includes('.tmp'));
let finalOk = false;
let info = '';
try {
  const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
  // 不再把篇数写死（写死过一次 115，语料扩到 201 篇后这个断言就变成假失败）。
  // 真正要验的是：条目都在、id 不重复、status 合法、结构没被写坏。
  const ids = m.articles.map((a) => a.id);
  const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
  const badStatus = m.articles.filter((a) => !['done', 'pending'].includes(a.status));
  const inChapter = new Set(m.chapters.flatMap((c) => c.articles));
  const orphans = ids.filter((id) => !inChapter.has(id));
  finalOk =
    m.articles.length === ids.length && !dup.length && !badStatus.length && !orphans.length && m.articles.length > 0;
  info =
    `articles=${m.articles.length} done=${m.articles.filter((a) => a.status === 'done').length}` +
    ` chapters=${m.chapters.length} dup=${dup.length} badStatus=${badStatus.length} orphans=${orphans.length}`;
  if (!finalOk) info += `\n   重复 id: ${dup.slice(0, 5).join(', ')} | 孤儿: ${orphans.slice(0, 5).join(', ')}`;
} catch (e) {
  info = 'PARSE FAILED: ' + e.message;
}

console.log(`并发启动 ${N} 个校验进程`);
console.log(`退出码: ${results.map((r) => r.i + ':' + r.code).join('  ')}`);
console.log(`写入期间读取失败次数: ${parseFails.length}${parseFails.length ? ' — ' + parseFails[0] : ''}`);
console.log(`残留 .tmp 文件: ${artifacts.length ? artifacts.join(', ') : '无'}`);
console.log(`最终 manifest: ${finalOk ? '✅ ' : '❌ '}${info}`);

const bad = results.some((r) => r.code !== 0) || parseFails.length > 0 || !finalOk || artifacts.length > 0;
console.log(bad ? '\n❌ 并发安全测试未通过' : '\n✅ 并发安全：无损坏、无残留、全部退出码 0');
process.exitCode = bad ? 1 : 0;
