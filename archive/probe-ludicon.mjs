// Probe ludicon.com/castano/blog for extra static pages outside the WordPress post list.
import https from 'node:https';

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
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8'), url }));
    });
    req.on('error', (e) => reject(e));
    req.setTimeout(45000, () => req.destroy(new Error('timeout ' + url)));
  });
}

const targets = process.argv.slice(2);
for (const t of targets) {
  let r;
  try {
    r = await get(t);
  } catch (e) {
    console.log('ERR', t, e.message);
    continue;
  }
  console.log(`\n===== ${t} -> ${r.status} (${r.body.length} bytes)`);
  if (r.status !== 200) continue;
  const title = (r.body.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1];
  console.log('title:', title && title.trim());
  const links = [
    ...new Set(
      [...r.body.matchAll(/href="([^"]+)"/g)]
        .map((m) => m[1])
        .filter((h) => !/\.(css|js|png|jpe?g|gif|svg|ico|xml|woff2?|ttf)(\?|$)/i.test(h))
        .filter((h) => !/wp-(content|includes|json|login|admin)|feed|comment|xmlrpc|\?/i.test(h)),
    ),
  ];
  const internal = links.filter((h) => /ludicon\.com/.test(h) || h.startsWith('/'));
  console.log('internal links:');
  for (const l of internal) console.log('   ', l);
  const h = [...r.body.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => m[2].replace(/<[^>]+>/g, '').trim());
  console.log('headings:', h.slice(0, 25).join(' | '));
}
