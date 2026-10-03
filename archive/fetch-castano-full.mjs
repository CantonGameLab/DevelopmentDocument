// Fetch full content for every post on ludicon.com/castano/blog via the WP REST API.
// Saves one HTML file per post into archive/raw/castano/html/.
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const RAW = path.join(HERE, 'raw', 'castano');
const OUT = path.join(RAW, 'html');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

function get(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': UA, Accept: '*/*' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects > 0) {
        res.resume();
        resolve(get(new URL(res.headers.location, url).href, redirects - 1));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () =>
        resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }),
      );
    });
    req.on('error', reject);
    req.setTimeout(90000, () => req.destroy(new Error('timeout ' + url)));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const posts = JSON.parse(fs.readFileSync(path.join(RAW, 'wp-posts.json'), 'utf8')).sort((a, b) =>
  a.date.localeCompare(b.date),
);
fs.mkdirSync(OUT, { recursive: true });

const meta = [];
let i = 0;
for (const p of posts) {
  i++;
  const url = `https://www.ludicon.com/castano/blog/wp-json/wp/v2/posts/${p.id}`;
  let r;
  try {
    r = await get(url);
  } catch (e) {
    console.log('ERR', p.id, p.slug, e.message);
    continue;
  }
  if (r.status !== 200) {
    console.log('STATUS', p.id, p.slug, r.status);
    continue;
  }
  const full = JSON.parse(r.body);
  const content = (full.content && full.content.rendered) || '';
  const title = (full.title && full.title.rendered) || p.slug;
  fs.writeFileSync(
    path.join(OUT, `${p.id}-${p.slug}.json`),
    JSON.stringify(
      {
        id: full.id,
        slug: full.slug,
        date: full.date,
        modified: full.modified,
        link: full.link,
        title,
        excerpt: (full.excerpt && full.excerpt.rendered) || '',
        content,
        categories: full.categories,
        tags: full.tags,
      },
      null,
      2,
    ),
  );
  meta.push({ id: full.id, slug: full.slug, date: full.date, link: full.link, title, bytes: content.length });
  console.log(`${i}/${posts.length}`, p.date.slice(0, 10), p.slug, content.length);
  await sleep(250);
}

fs.writeFileSync(path.join(RAW, 'post-meta.json'), JSON.stringify(meta, null, 2));
console.log('DONE', meta.length);
