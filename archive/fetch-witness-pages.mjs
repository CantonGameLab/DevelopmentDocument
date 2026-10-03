// Fetch FULL article HTML for every post listed in the official blog RSS feed.
// Usage: node fetch-witness-pages.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';

const DIR = 'archive/raw/witness-pages/';
mkdirSync(DIR, { recursive: true });

const unesc = (s) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&#8217;/g, '\u2019')
    .replace(/&#8216;/g, '\u2018')
    .replace(/&#8220;/g, '\u201c')
    .replace(/&#8221;/g, '\u201d')
    .replace(/&#8230;/g, '\u2026')
    .replace(/&#8211;/g, '\u2013')
    .replace(/&#8212;/g, '\u2014')
    .replace(/&amp;/g, '&');

const xml = readFileSync('archive/raw/feed-all.xml', 'utf8');
const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
const links = items
  .map((it) => {
    const m = it.match(/<link>([\s\S]*?)<\/link>/);
    return m ? unesc(m[1]).trim() : '';
  })
  .filter(Boolean);

console.log('links from feed:', links.length);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) research-archiver/1.0';
const slug = (u) => u.replace(/\/$/, '').split('/').pop().replace(/[^a-z0-9-]/gi, '_').slice(0, 80);

let fetched = 0;
let cached = 0;
let failed = [];
for (const url of links) {
  const file = DIR + slug(url) + '.html';
  if (existsSync(file) && readFileSync(file, 'utf8').length > 2000) {
    cached++;
    continue;
  }
  let ok = false;
  for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const html = await r.text();
      writeFileSync(file, html);
      ok = true;
      fetched++;
      process.stdout.write(`  [${fetched}] ${html.length} bytes  ${slug(url)}\n`);
    } catch (e) {
      if (attempt === 3) failed.push(url + ' -> ' + e.message);
      else await new Promise((res) => setTimeout(res, 700 * attempt));
    }
  }
  await new Promise((res) => setTimeout(res, 220));
}

console.log(`\nfetched ${fetched}, cached ${cached}, failed ${failed.length}`);
if (failed.length) console.log(failed.join('\n'));
