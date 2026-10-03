// Probe the-witness.net author archive + 2010 date archives for engine-tech posts.
import https from 'node:https';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

function get(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA, Accept: 'text/html' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        resolve(get(new URL(res.headers.location, url).href, redirects - 1));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.setTimeout(45000, () => req.destroy(new Error('timeout')));
  });
}

const urls = [];
for (const base of [
  'https://the-witness.net/news/author/castano/',
  'https://the-witness.net/news/2010/03/',
  'https://the-witness.net/news/category/engine-tech/',
]) {
  for (let p = 1; p <= 6; p++) {
    urls.push(p === 1 ? base : base.replace(/\/($)/, '/') + `page/${p}/`);
  }
}

const seen = new Map();
for (const u of urls) {
  let r;
  try {
    r = await get(u);
  } catch (e) {
    console.log('ERR', u, e.message);
    continue;
  }
  if (r.status !== 200) {
    console.log('---', u, r.status);
    continue;
  }
  const posts = [
    ...r.body.matchAll(/href="(https?:\/\/(?:www\.)?the-witness\.net\/news\/\d{4}\/\d{2}\/[a-z0-9\-]+)\/?"/gi),
  ].map((m) => m[1]);
  console.log('---', u, r.status, 'posts:', new Set(posts).size);
  for (const p of posts) seen.set(p, (seen.get(p) || 0) + 1);
}

console.log('\n==== ALL DISCOVERED POST URLS ====');
for (const u of [...seen.keys()].sort()) console.log(u);
