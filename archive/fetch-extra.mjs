// Fetch two pre-2012 posts not covered by the RSS window, to verify early Casey mentions.
import { writeFileSync } from 'node:fs';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) research-archiver/1.0';
const targets = [
  ['2010-11-experiments-in-texturing', 'http://the-witness.net/news/2010/11/experiments-in-texturing/'],
  ['2012-02-playtest-island-update', 'http://the-witness.net/news/2012/02/playtest-island-update/'],
];
for (const [name, url] of targets) {
  try {
    const r = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' });
    const html = await r.text();
    writeFileSync(`archive/raw/witness-pages/${name}.html`, html);
    const text = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const hits = [];
    const re = /Casey/gi;
    let m;
    while ((m = re.exec(text))) hits.push(text.slice(Math.max(0, m.index - 260), m.index + 260).trim());
    console.log(`=== ${name} | ${html.length} bytes | Casey mentions: ${hits.length} ===`);
    for (const h of hits.slice(0, 3)) console.log('  …' + h + '…\n');
  } catch (e) {
    console.log(`ERR ${name}: ${e.message}`);
  }
}
