// Discover + fetch Ignacio Castaño's blog (ludicon.com/castano/blog)
// Phase 1: discovery only. Writes raw HTML into archive/raw/castano/.
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const ROOT = path.resolve(import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname.slice(1)));
const RAW = path.join(ROOT, 'raw', 'castano');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function get(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA, Accept: '*/*' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        const next = new URL(res.headers.location, url).href;
        resolve(get(next, redirects - 1));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () =>
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }),
      );
    });
    req.on('error', reject);
    req.setTimeout(60000, () => req.destroy(new Error('timeout ' + url)));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(RAW, { recursive: true });

  // 1. Try the WordPress REST API for a full post listing.
  const api = [];
  for (let page = 1; page <= 20; page++) {
    const url = `https://www.ludicon.com/castano/blog/wp-json/wp/v2/posts?per_page=100&page=${page}&_fields=id,date,link,title,slug,categories,tags`;
    let r;
    try {
      r = await get(url);
    } catch (e) {
      console.log('API ERR', e.message);
      break;
    }
    if (r.status !== 200) {
      console.log('API page', page, 'status', r.status);
      break;
    }
    let arr;
    try {
      arr = JSON.parse(r.body);
    } catch {
      console.log('API page', page, 'not JSON');
      break;
    }
    if (!Array.isArray(arr) || arr.length === 0) break;
    api.push(...arr);
    console.log('API page', page, '->', arr.length, 'total', api.length);
    if (arr.length < 100) break;
    await sleep(300);
  }

  if (api.length) {
    fs.writeFileSync(path.join(RAW, 'wp-posts.json'), JSON.stringify(api, null, 2));
    console.log('saved wp-posts.json', api.length);
  }

  // 2. Crawl the archive index pages to be safe.
  const indexPages = [];
  for (let p = 1; p <= 25; p++) {
    const url = p === 1 ? 'https://www.ludicon.com/castano/blog/' : `https://www.ludicon.com/castano/blog/page/${p}/`;
    let r;
    try {
      r = await get(url);
    } catch (e) {
      console.log('IDX ERR', url, e.message);
      break;
    }
    if (r.status !== 200) {
      console.log('IDX', url, 'status', r.status);
      break;
    }
    indexPages.push({ url, body: r.body });
    console.log('IDX', p, r.body.length);
    const links = [...r.body.matchAll(/href="(https:\/\/www\.ludicon\.com\/castano\/blog\/\d{4}\/\d{2}\/[^"#]+)"/g)].map(
      (m) => m[1],
    );
    console.log('   links on page:', new Set(links).size);
    if (!/page\/\d+\//.test(r.body) && p > 1) break;
    if (p > 1 && !r.body.includes('previous') && !r.body.includes('older')) break;
    await sleep(300);
  }

  fs.writeFileSync(
    path.join(RAW, 'index-pages.json'),
    JSON.stringify(
      indexPages.map((p) => ({ url: p.url, len: p.body.length })),
      null,
      2,
    ),
  );

  const all = new Map();
  for (const p of indexPages) {
    for (const m of p.body.matchAll(/href="(https:\/\/www\.ludicon\.com\/castano\/blog\/\d{4}\/\d{2}\/[^"#]+)"/g)) {
      const u = m[1].replace(/\/$/, '') + '/';
      all.set(u, true);
    }
  }
  fs.writeFileSync(path.join(RAW, 'post-urls.json'), JSON.stringify([...all.keys()].sort(), null, 2));
  console.log('TOTAL post urls', all.size);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
