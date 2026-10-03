// Query the Wayback Machine CDX API for the-witness.net graphics-tech posts (2010-2013).
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

function get(url, redirects = 6) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA, Accept: '*/*' } }, (res) => {
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
    req.setTimeout(90000, () => req.destroy(new Error('timeout ' + url)));
  });
}

const queries = [
  'the-witness.net/news/2010/*',
  'the-witness.net/news/2011/*',
  'the-witness.net/news/2012/02/*',
  'the-witness.net/news/category/*',
];

const all = new Map();
for (const q of queries) {
  const url =
    'https://web.archive.org/cdx/search/cdx?url=' +
    encodeURIComponent(q) +
    '&output=json&fl=original,timestamp,statuscode&collapse=urlkey&limit=4000&filter=statuscode:200';
  let r;
  try {
    r = await get(url);
  } catch (e) {
    console.log('CDX ERR', q, e.message);
    continue;
  }
  if (r.status !== 200) {
    console.log('CDX status', r.status, q, r.body.slice(0, 200));
    continue;
  }
  let rows;
  try {
    rows = JSON.parse(r.body);
  } catch {
    console.log('CDX not json', q, r.body.slice(0, 200));
    continue;
  }
  console.log('CDX', q, '->', rows.length - 1, 'rows');
  for (const [orig, ts, st] of rows.slice(1)) {
    if (!all.has(orig)) all.set(orig, ts);
  }
}

console.log('\n=== posts (unique paths) ===');
const posts = [...all.entries()]
  .filter(([u]) => /\/news\/\d{4}\/\d{2}\/[a-z0-9\-]+\/?$/i.test(u) || /\/news\/\d{4}\/\d{2}\/[a-z0-9\-]+$/i.test(u))
  .sort((a, b) => a[0].localeCompare(b[0]));
for (const [u, ts] of posts) console.log(ts, u);

fs.writeFileSync(
  path.join(HERE, 'raw', 'wayback-witness-index.json'),
  JSON.stringify(Object.fromEntries(posts), null, 2),
);
console.log('\ntotal posts', posts.length);
