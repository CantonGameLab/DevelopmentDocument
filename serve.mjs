// Standalone preview server for the reading UI — 只想读文档时跑这个。
//
// 不依赖任何编辑器或插件：起一个本地静态服务，把阅读器与 201 篇译文喂给浏览器。
//
// Usage:
//   node serve.mjs            # 默认从 5179 起，被占用时自动 +1 重试
//   node serve.mjs 5200       # 指定起始端口
//   然后打开它打印出来的那个地址
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join, normalize, resolve, sep, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const START_PORT = Number(process.argv[2] || 5179);

/**
 * 找到仓库根目录（也就是这个文件所在的目录）。
 *
 * 三级兜底，因为「当前工作目录」在真实使用里很不可靠：
 *   ① 显式给的环境变量
 *   ② 从 cwd 逐级往上找 `sites.json`（有人在仓库根跑，有人在子目录跑）
 *   ③ 本文件所在目录（最可靠的一条，`node serve.mjs` 时必定正确）
 * 之前踩过：宿主把 cwd 设成了 `C:\WINDOWS\System32`，于是按 cwd 拼出来的路径
 * 变成 `C:\WINDOWS\System32\...`，页面直接报「找不到目录」。
 */
function resolveRoot() {
  if (process.env.WITNESS_DOCS_ROOT && existsSync(join(process.env.WITNESS_DOCS_ROOT, 'sites.json'))) {
    return resolve(process.env.WITNESS_DOCS_ROOT);
  }
  let d = resolve(process.cwd());
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(d, 'sites.json')) && existsSync(join(d, 'data'))) return d;
    const up = dirname(d);
    if (up === d) break;
    d = up;
  }
  return dirname(fileURLToPath(import.meta.url));
}
const ROOT = resolveRoot();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

/**
 * 最近阅读位置，按客户端分槽。
 * 阅读器会在阅读时把自己的位置 POST 到 /readalong/ctx，这里存下来。
 * 纯本地用途：关掉服务即丢失，不落盘。
 */
const ctxByClient = new Map();

function loadSites() {
  try {
    return JSON.parse(readFileSync(join(ROOT, 'sites.json'), 'utf8'));
  } catch {
    return null;
  }
}

function siteOf(id) {
  const all = loadSites();
  if (!all) return null;
  const sid = id || all.defaultSite;
  const cfg = all.sites && all.sites[sid];
  if (!cfg) return null;
  // 数据目录：每个站点独占一个子目录，避免多套文档的文件名互相撞车。
  // 约定是 <dataDir 配置>/<siteId>/ —— 但如果配置里已经写了 siteId（`data/witness`），
  // 就不要再拼一次，否则会变成 data/witness/witness。
  const base = (cfg.dataDir || 'data').replace(/[/\\]+$/, '');
  const rel = base === sid || base.endsWith('/' + sid) ? base : `${base}/${sid}`;
  return {
    ...cfg,
    id: sid,
    dataDir: rel,
    archivePrefix: cfg.stripPrefix ? `/readalong/src/${sid}/` : '',
    // dataDir 与 stripPrefix 都相对**仓库根目录**（不是当前工作目录）
    _dataPath: resolve(ROOT, rel),
    _srcPath: cfg.stripPrefix ? resolve(ROOT, cfg.stripPrefix.replace(/[/\\]+$/, '')) : null,
  };
}

function inside(root, p) {
  const full = resolve(root, normalize(decodeURIComponent(p)).replace(/^[/\\]+/, ''));
  const rootWithSep = root.endsWith(sep) ? root : root + sep;
  return full === root || full.startsWith(rootWithSep) ? full : null;
}

const sendJson = (res, code, obj) => {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(obj));
};

async function sendFile(res, file) {
  try {
    if (!(await stat(file)).isFile()) return false;
    const buf = await readFile(file);
    res.writeHead(200, {
      'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(buf);
    return true;
  } catch {
    return false;
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  let p = url.pathname;

  /* ---- 站点配置 ---- */
  if (p === '/readalong/site.json') {
    const s = siteOf(url.searchParams.get('site'));
    if (!s) return sendJson(res, 404, { ok: false, error: 'site not found' });
    const { _dataPath, _srcPath, ...pub } = s;
    return sendJson(res, 200, { ...pub, base: '/readalong/' });
  }

  /* ---- 阅读状态中继（按客户端分槽）---- */
  if (p === '/readalong/ctx') {
    const key = req.headers['x-readalong-client'] || '__global__';
    if (req.method === 'POST') {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      try {
        ctxByClient.set(key, { ...JSON.parse(Buffer.concat(chunks).toString('utf8')), receivedAt: Date.now() });
        return sendJson(res, 200, { ok: true });
      } catch (e) {
        return sendJson(res, 400, { ok: false, error: String(e.message) });
      }
    }
    if (req.method === 'DELETE') {
      ctxByClient.delete(key);
      return sendJson(res, 200, { ok: true });
    }
    const ctx = req.headers['x-readalong-client']
      ? ctxByClient.get(key) || null
      : [...ctxByClient.values()].sort((a, b) => (b.receivedAt || 0) - (a.receivedAt || 0))[0] || null;
    return sendJson(res, 200, { ok: true, ctx });
  }

  /* ---- 站点数据：/readalong/data/<siteId>/... ---- */
  if (p.startsWith('/readalong/data/')) {
    const rest = p.slice('/readalong/data/'.length);
    const sid = rest.split('/')[0];
    const s = siteOf(sid);
    if (!s) return sendJson(res, 404, { ok: false, error: 'unknown site' });
    const f = inside(s._dataPath, rest.slice(sid.length) || '/manifest.json');
    if (f && (await sendFile(res, f))) return;
    res.writeHead(404);
    return res.end('not found');
  }

  /* ---- 站点源文：/readalong/src/<siteId>/... ---- */
  if (p.startsWith('/readalong/src/')) {
    const rest = p.slice('/readalong/src/'.length);
    const sid = rest.split('/')[0];
    const s = siteOf(sid);
    if (!s || !s._srcPath) return sendJson(res, 404, { ok: false, error: 'unknown site' });
    const f = inside(s._srcPath, rest.slice(sid.length));
    if (f && (await sendFile(res, f))) return;
    res.writeHead(404);
    return res.end('not found');
  }

  /* ---- 兼容旧链接 ---- */
  if (p.startsWith('/witness-archive/')) {
    const s = siteOf(null);
    if (s && s._srcPath) {
      const f = inside(s._srcPath, p.slice('/witness-archive/'.length));
      if (f && (await sendFile(res, f))) return;
    }
    res.writeHead(404);
    return res.end('not found');
  }

  /* ---- 站点清单（阅读器的静态回退要用）---- */
  if (p === '/readalong/sites.json') {
    const all = loadSites();
    if (!all) return sendJson(res, 404, { ok: false, error: 'sites.json not found' });
    return sendJson(res, 200, all);
  }

  /* ---- 阅读器静态 UI：/readalong/... ---- */
  if (p === '/readalong' || p === '/readalong/') p = '/readalong/index.html';
  if (p.endsWith('/')) p += 'index.html';
  // 注意：replace 之后已经没有前导斜杠，不要再 slice(1)
  const rel = p.replace(/^\/readalong\//, '');
  const file = inside(ROOT, rel);
  if (file && (await sendFile(res, file))) return;
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('not found: ' + p);
});

/** 端口被占用时自动往后试，避免「起不来」这种低级阻塞。 */
let port = START_PORT;
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE' && port < START_PORT + 20) {
    console.log(`端口 ${port} 被占用，试 ${port + 1} …`);
    port += 1;
    setTimeout(() => server.listen(port, '127.0.0.1'), 60);
    return;
  }
  console.error('启动失败：', e.message);
  process.exitCode = 1;
});

server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}/readalong/`;
  // 打开阅读器（ctrl+点击可复制这个地址）
  console.log('');
  console.log('  阅读器已就绪 →  ' + url);
  console.log('');
  console.log('  用法：在页面里点左边章节 → 看中英对照；');
  console.log('        右上角切「中文 / English / 中英对照」；快捷键 1 / 2 / 3。');
  console.log('        关闭这个窗口（或按 Ctrl+C）即停止服务。');
  console.log('');
});
