// Fetch Castaño's standalone /articles/ pages (they carry the full sub-headings and formulas)
// and compare their body text against the the-witness.net mirror we already archived.
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const RAW = path.join(HERE, 'raw', 'castano', 'articles');
fs.mkdirSync(RAW, { recursive: true });
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

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
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.setTimeout(60000, () => req.destroy(new Error('timeout ' + url)));
  });
}

const SLUGS = ['irradiance-caching-part-1', 'lightmap-parameterization', 'hemicube-rendering-and-integration'];

function bodyOf(html) {
  // entry-content div, up to the comment form
  const s = html.search(/<div[^>]*class=['"][^'"]*entry-content[^'"]*['"]/i);
  if (s < 0) return '';
  const rest = html.slice(s);
  const endCandidates = [
    rest.search(/<div[^>]*id=['"]comments['"]/i),
    rest.search(/<div[^>]*class=['"][^'"]*comment-respond[^'"]*['"]/i),
    rest.search(/<\/article>/i),
  ].filter((x) => x > 0);
  const e = endCandidates.length ? Math.min(...endCandidates) : rest.length;
  return rest.slice(0, e);
}

const report = [];
for (const slug of SLUGS) {
  const url = `https://www.ludicon.com/castano/blog/articles/${slug}/`;
  let r;
  try {
    r = await get(url);
  } catch (e) {
    console.log('ERR', slug, e.message);
    continue;
  }
  if (r.status !== 200) {
    console.log('status', r.status, slug);
    continue;
  }
  fs.writeFileSync(path.join(RAW, slug + '.html'), r.body);
  const body = bodyOf(r.body);
  const text = body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const counts = {
    sub: (body.match(/<sub>/gi) || []).length,
    sup: (body.match(/<sup>/gi) || []).length,
    math: (body.match(/\[latex\]|mathjax|<math/gi) || []).length,
    img: (body.match(/<img/gi) || []).length,
    pre: (body.match(/<pre/gi) || []).length,
    h3: (body.match(/<h3/gi) || []).length,
    em: (body.match(/<(em|i)[ >]/gi) || []).length,
  };
  report.push({ slug, url, chars: body.length, words: text.split(/\s+/).length, ...counts });

  // Compare with the archived witness mirror
  const mirrorPath = path.join(HERE, 'raw', 'witness-pages', slug + '.html');
  let mirrorWords = 0;
  if (fs.existsSync(mirrorPath)) {
    const mh = fs.readFileSync(mirrorPath, 'utf8');
    const s = mh.search(/<div[^>]*class=['"][^'"]*entry-content[^'"]*['"]/i);
    if (s >= 0) {
      const mb = mh.slice(s).split(/<\/div>\s*<!--\s*\.entry-content/i)[0];
      mirrorWords = mb
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(/\s+/).length;
    }
  }
  report[report.length - 1].mirrorWords = mirrorWords;
}

console.log('\nslug                                      ownWords  mirrorWords  sub  sup  math  img  pre  h3');
for (const x of report) {
  console.log(
    `${x.slug.padEnd(40)} ${String(x.words).padStart(7)}  ${String(x.mirrorWords).padStart(10)}  ${String(x.sub).padStart(3)}  ${String(x.sup).padStart(3)}  ${String(x.math).padStart(4)}  ${String(x.img).padStart(3)}  ${String(x.pre).padStart(3)}  ${String(x.h3).padStart(2)}`,
  );
}
