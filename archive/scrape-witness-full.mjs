// Parse full article HTML for all 100 official blog posts (replaces RSS excerpts).
// Uses cached raw/witness-pages/*.html. Usage: node scrape-witness-full.mjs
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const PAGES = 'archive/raw/witness-pages/';

// ---------------- entities ----------------
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
const collapse = (h) => decodeEntities(h.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();

// ---------------- html -> markdown ----------------
function htmlToMd(html) {
  let s = html;
  // social widgets / scripts that live inside entry-content
  s = s.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<div[^>]*class=['"][^'"]*(socials?|share|jp-relatedposts|wpcnt|sharedaddy)[^'"]*['"][\s\S]*?<\/div>/gi, '');
  s = s.replace(/<iframe[^>]*>/gi, (m) => {
    const src = (m.match(/src=["']([^"']+)["']/i) || [])[1] || '';
    return src ? `\n\n[嵌入媒体](${src})\n\n` : '';
  });
  s = s.replace(/<(video|audio)[^>]*>[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<hr\s*\/?>/gi, '\n\n---\n\n');

  // code blocks first (use placeholders so later rules cannot eat them)
  const blocks = [];
  s = s.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, c) => {
    let code = c.replace(/<code[^>]*>/gi, '').replace(/<\/code>/gi, '');
    code = decodeEntities(code.replace(/<[^>]+>/g, '')).replace(/^\n+|\s+$/g, '');
    const fence = code.includes('```') ? '````' : '```';
    const idx = blocks.push(code) - 1;
    return `\n\n\u0000CODE${idx}\u0000\n\n`;
  });

  // figures -> image + caption
  s = s.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, (_m, inner) => {
    const img = inner.match(/<img[^>]*>/i);
    const cap = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
    let out = '';
    if (img) {
      const src = (img[0].match(/src=["']([^"']+)["']/i) || [])[1] || '';
      const alt = (img[0].match(/alt=["']([^"']*)["']/i) || [])[1] || '';
      // prefer full-size link target if present
      const link = inner.match(/<a[^>]*href=["']([^"']+\.(?:png|jpe?g|gif|webp))["']/i);
      out += `![${alt}](${link ? link[1] : src})`;
    }
    if (cap) out += `\n*${collapse(cap[1])}*`;
    return `\n\n${out}\n\n`;
  });

  s = s.replace(/<img[^>]*>/gi, (m) => {
    const src = (m.match(/src=["']([^"']+)["']/i) || [])[1] || '';
    const alt = (m.match(/alt=["']([^"']*)["']/i) || [])[1] || '';
    return src ? `\n\n![${alt}](${src})\n\n` : '';
  });
  // unwrap images that were wrapped in a permalink anchor (leaves "[![...](...)](url)")
  s = s.replace(/\[\s*(!\[[^\]]*\]\([^)]+\))\s*\]\([^)]*\)/g, '$1');

  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, l, t) => `\n\n${'#'.repeat(+l + 1)} ${collapse(t)}\n\n`);
  s = s.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, t) => {
    const txt = collapse(t);
    return txt ? `[${txt}](${href})` : '';
  });
  s = s.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, t) => `\n- ${collapse(t)}`);
  s = s.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');
  s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, t) => `\n\n> ${collapse(t)}\n\n`);
  s = s.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, c) => `**${collapse(c)}**`);
  s = s.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, c) => `*${collapse(c)}*`);
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, c) => '`' + decodeEntities(c.replace(/<[^>]+>/g, '')) + '`');
  s = s.replace(/<\/(p|div|section|article|h[1-6]|tr)>/gi, '\n\n');
  s = s.replace(/<(p|div|section|article|tr)[^>]*>/gi, '\n\n');
  s = s.replace(/<\/?(table|tbody|thead|td|th)[^>]*>/gi, '\n');
  s = s.replace(/<[^>]+>/g, '');
  s = decodeEntities(s);
  s = s.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  s = s.replace(/\u0000CODE(\d+)\u0000/g, (_m, i) => '\n\n```\n' + blocks[+i] + '\n```\n\n');
  return s.replace(/\n{3,}/g, '\n\n').trim();
}

// ---------------- helpers ----------------
function sliceBetween(html, startRe, endRe) {
  const s = html.search(startRe);
  if (s < 0) return '';
  const rest = html.slice(s);
  const openEnd = rest.indexOf('>') + 1;
  const e = rest.slice(openEnd).search(endRe);
  return e < 0 ? rest.slice(openEnd) : rest.slice(openEnd, openEnd + e);
}

// ---------------- parse every page ----------------
const files = readdirSync(PAGES).filter((f) => f.endsWith('.html'));
const posts = [];
for (const f of files) {
  const html = readFileSync(PAGES + f, 'utf8');

  const titleM = html.match(/<h1[^>]*class=['"][^'"]*entry-title[^'"]*['"][^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleM ? collapse(titleM[1]) : f.replace(/\.html$/, '');

  const dateM = html.match(/<time[^>]*class=['"][^'"]*published[^'"]*['"][^>]*datetime=['"]([^'"]+)['"]/i);
  const date = dateM ? dateM[1] : '';

  const authorM =
    html.match(/<span[^>]*class=['"][^'"]*author[^'"]*['"][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
    html.match(/rel=['"]author['"][^>]*>([\s\S]*?)<\/a>/i);
  const author = authorM ? collapse(authorM[1]) : 'Unknown';

  const cats = [...html.matchAll(/<span[^>]*class=['"][^'"]*bl_categ[^'"]*['"][^>]*>([\s\S]*?)<\/span>\s*<\/div>/gi)]
    .flatMap((m) => [...m[1].matchAll(/rel=['"]tag['"][^>]*>([\s\S]*?)<\/a>/gi)].map((x) => collapse(x[1])))
    .filter(Boolean);
  const catsAlt = [...html.matchAll(/rel=['"]category tag['"][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => collapse(m[1]));

  const body = sliceBetween(html, /<div[^>]*class=['"][^'"]*entry-content[^'"]*['"][^>]*>/i, /<\/div>\s*<!--\s*\.entry-content/i);
  const md = htmlToMd(body);

  const urlM = html.match(/<link[^>]*rel=['"]canonical['"][^>]*href=['"]([^'"]+)['"]/i) ||
    html.match(/<a[^>]*rel=['"]bookmark['"][^>]*href=['"]([^'"]+)['"]/i);

  posts.push({
    title,
    url: urlM ? urlM[1] : '',
    author,
    date,
    categories: [...new Set([...cats, ...catsAlt])],
    md,
    file: f,
  });
}

posts.sort((a, b) => new Date(a.date) - new Date(b.date));
writeFileSync('archive/raw/witness-full.json', JSON.stringify(posts, null, 2));

const words = posts.reduce((s, p) => s + p.md.split(/\s+/).filter(Boolean).length, 0);
console.log(`parsed ${posts.length} posts | total words ${words} | avg ${Math.round(words / posts.length)}`);
console.log('\nshortest 10:');
for (const p of [...posts].sort((a, b) => a.md.length - b.md.length).slice(0, 10)) {
  console.log(`  ${String(p.md.length).padStart(6)} chars | ${p.date.slice(0, 10)} | ${p.author} | ${p.title}`);
}
console.log('\nlongest 5:');
for (const p of [...posts].sort((a, b) => b.md.length - a.md.length).slice(0, 5)) {
  console.log(`  ${String(p.md.length).padStart(6)} chars | ${p.date.slice(0, 10)} | ${p.author} | ${p.title}`);
}
const noBody = posts.filter((p) => p.md.length < 20);
console.log('\nposts with (almost) no body:', noBody.length);
for (const p of noBody) console.log('  -', p.title, '|', p.file);
