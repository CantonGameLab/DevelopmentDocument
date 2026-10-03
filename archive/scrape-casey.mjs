// Final extraction for Casey Muratori's The Witness series.
//
// Reverse-engineered site structure:
//   * prose lives as bare text nodes, terminated by an EMPTY div:  <div class='G'></div>
//   * code lines are SHORT divs with inline syntax-highlight spans and <wbr>:
//       <div class='Q'> <wbr><span class='P'>float</span><wbr> <wbr>x0 <wbr>= <wbr>x;</div>
//   * container divs wrap the code blocks (nested divs)
// Strategy: DOM pass marks every "displayed line" div by appending a newline marker,
// then a text pass handles inline markup. This keeps code lines AND prose lines.
//
// Usage: node scrape-casey.mjs   (uses cached raw/casey_XXXX.html)
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { parse } = require('node-html-parser');

const RAWDIR = 'archive/raw/';
const rd = (n) => readFileSync(RAWDIR + n, 'utf8');
const MARK = '\u0001'; // line-end marker

const IDS = ['0005','0006','0007','0008','0009','0010','0011','0012','0013','0014','0015','0016','0017','0018','0019','0020','0021','0022','0023'];

function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&rsquo;|&lsquo;/g, "'")
    .replace(/&rdquo;|&ldquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

// --- pass 1: DOM, append a line-end marker after every "displayed line" div ---
function markLines(bodyHtml) {
  const root = parse(bodyHtml, { comment: false });
  // a "displayed line" div = a div with no child divs
  const all = root.querySelectorAll('div');
  let marked = 0;
  for (const d of all) {
    if (d.querySelectorAll('div').length > 0) continue; // container, not a line
    d.insertAdjacentHTML('afterend', MARK);
    marked++;
  }
  return { html: root.toString(), marked };
}

function htmlToMd(html) {
  let s = html;
  s = s.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<iframe[^>]*>/gi, (m) => {
    const src = (m.match(/src=["']([^"']+)["']/i) || [])[1] || '';
    return src ? `\n\n[嵌入视频/媒体](${src.startsWith('http') ? src : 'https://caseymuratori.com/' + src.replace(/^\//, '')})\n\n` : '';
  });
  s = s.replace(/<video[^>]*>[\s\S]*?<\/video>/gi, '');
  s = s.replace(/<wbr\s*\/?>/gi, '');
  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, l, t) => `\n\n${'#'.repeat(+l + 1)} ${t.replace(/<[^>]+>/g, '').trim()}\n\n`);
  s = s.replace(/<img[^>]*>/gi, (m) => {
    const src = (m.match(/src=["']([^"']+)["']/i) || [])[1] || '';
    const alt = (m.match(/alt=["']([^"']*)["']/i) || [])[1] || '';
    const abs = src.startsWith('http') ? src : 'https://caseymuratori.com/' + src.replace(/^\//, '');
    return src ? `\n\n![${alt}](${abs})\n\n` : '';
  });
  s = s.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, t) => {
    const txt = t.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    const abs = href.startsWith('http') || href.startsWith('#') ? href : 'https://caseymuratori.com/' + href.replace(/^\//, '');
    return txt ? `[${txt}](${abs})` : '';
  });
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, c) => `**${c.replace(/<[^>]+>/g, '').trim()}**`);
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, c) => `*${c.replace(/<[^>]+>/g, '').trim()}*`);
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, c) => '`' + decodeEntities(c.replace(/<[^>]+>/g, '')) + '`');
  // empty sep divs also terminate a line (prose case)
  s = s.replace(/<div[^>]*>\s*(?:&nbsp;)?\s*<\/div>/gi, MARK);
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<\/?(div|p|span|table|tbody|tr|td|figure|figcaption|section|article)[^>]*>/gi, '');
  s = s.replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  // split on markers and newlines
  const lines = s
    .split(new RegExp('[' + MARK + '\\n]'))
    .map((l) => l.replace(/\u00a0/g, ' ').replace(/[ \t]+$/, ''));
  const out = [];
  for (const l of lines) {
    if (l.trim() === '' && (!out.length || out[out.length - 1].trim() === '')) continue;
    out.push(l);
  }
  return out.join('\n').trim();
}

const posts = [];
for (const id of IDS) {
  const html = rd(`casey_${id}.html`);
  const root = parse(html);
  const title = decodeEntities(root.querySelector("meta[property='og:title']")?.getAttribute('content') || `blog_${id}`);
  const summary = decodeEntities(root.querySelector("meta[property='og:description']")?.getAttribute('content') || '');

  const byline = html.indexOf('<table><tbody');
  const start = html.indexOf('</table>', byline) + 8;
  const rest = html.slice(start);
  const footM = rest.match(/<div style='flex-shrink: 0;'>/);
  const body = html.slice(start, footM ? start + footM.index : html.length);

  const head = html.slice(0, byline);
  const dm = head.match(/(\d{4}-\d{2}-\d{2})<\/a>\s*&mdash;\s*<a[^>]*>([^<]+)<\/a>/);
  const date = dm ? dm[1] : '';
  const category = dm ? decodeEntities(dm[2]).trim() : '';
  const bookmark = (head.match(/contents#Bookmark(\d+)/) || [])[1] || '';

  const { html: marked, marked: nMarked } = markLines(body);
  const md = htmlToMd(marked);
  const lines = md.split('\n').length;
  posts.push({ id, title, url: `https://caseymuratori.com/blog_${id}`, author: 'Casey Muratori', date, category, bookmark, summary, md });
  console.log(`casey_${id}  ${date}  marked=${String(nMarked).padStart(4)}  lines=${String(lines).padStart(4)}  ${md.length.toString().padStart(6)} chars  ${title}`);
}

writeFileSync(RAWDIR + 'casey-normalized.json', JSON.stringify(posts, null, 2));
const totalWords = posts.reduce((s, p) => s + p.md.split(/\s+/).filter(Boolean).length, 0);
console.log(`\nwrote casey-normalized.json — ${posts.length} posts, ${totalWords} words`);
