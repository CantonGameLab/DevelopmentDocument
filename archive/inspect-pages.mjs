// Inspect saved the-witness.net HTML pages: title / author / date / body selector.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'node-html-parser';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const DIR = path.join(HERE, 'raw', 'witness-pages');

const files = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(DIR);
for (const f of files.slice(0, 8)) {
  const html = fs.readFileSync(path.join(DIR, f), 'utf8');
  const root = parse(html, { comment: false });
  const h1 = root.querySelector('h1') || root.querySelector('.entry-title');
  const author = root.querySelector('.author') || root.querySelector('[rel=author]') || root.querySelector('.entry-meta a');
  const time = root.querySelector('time') || root.querySelector('.entry-date');
  const art = root.querySelector('article') || root.querySelector('.entry-content') || root.querySelector('#content');
  console.log('=====', f);
  console.log('  h1:', h1 && h1.text.trim().slice(0, 90));
  console.log('  author:', author && author.text.trim().slice(0, 60), '|', author && author.getAttribute('href'));
  console.log('  time:', time && (time.getAttribute('datetime') || time.text.trim().slice(0, 60)));
  console.log('  article?', !!root.querySelector('article'), 'ids:', root.querySelectorAll('[id]').slice(0, 14).map((e) => e.getAttribute('id')).join(','));
  console.log('  body chars:', art ? art.text.length : 0);
  console.log('  meta:', root.querySelectorAll('.entry-meta, .post-meta, .meta').slice(0, 3).map((e) => e.text.replace(/\s+/g, ' ').trim().slice(0, 200)).join(' || '));
}
