// Convert the newly fetched the-witness.net graphics/engine-tech pages into archive markdown,
// and merge them into archive/raw/witness-graphics.json.
// Usage: node archive/build-witness-graphics.mjs
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const ROOT = path.dirname(HERE);
const PAGES = path.join(HERE, 'raw', 'witness-pages');

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

/**
 * WordPress 把 LaTeX 公式渲染成 `<img src="…/latex.php?latex=…">`，公式源码就在 URL 里。
 * 归档时还原成 `$…$`，否则译文里满屏都是 `![E(\mathbf{x})](https://s0.wp.com/latex.php…)` 这样的噪音，
 * 读者和译者都没法用。
 */
function recoverLatex(md) {
  let n = 0;
  const out = md.replace(/!\[([^\]]*)\]\((https?:\/\/s0\.wp\.com\/latex\.php\?[^)]+)\)/g, (_m, alt, url) => {
    let src = '';
    try {
      src = new URLSearchParams(url.split('?')[1]).get('latex') || '';
    } catch {
      src = '';
    }
    if (!src) src = String(alt).replace(/\\([_^])/g, '$1');
    src = src.replace(/\\\\(?=[a-zA-Z{])/g, '\\').replace(/\s+/g, ' ').trim();
    n++;
    return '$' + src + '$';
  });
  return { md: out, n, formulas: n };
}

// ---------------- html -> markdown (same dialect as scrape-witness-full.mjs) ----------------
function htmlToMd(html) {
  let s = html;
  s = s.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<div[^>]*class=['"][^'"]*(socials?|share|jp-relatedposts|wpcnt|sharedaddy)[^'"]*['"][\s\S]*?<\/div>/gi, '');
  s = s.replace(/<iframe[^>]*>/gi, (m) => {
    const src = (m.match(/src=["']([^"']+)["']/i) || [])[1] || '';
    return src ? `\n\n[嵌入媒体](${src})\n\n` : '';
  });
  s = s.replace(/<(video|audio)[^>]*>[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<hr\s*\/?>/gi, '\n\n---\n\n');

  const blocks = [];
  s = s.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, c) => {
    let code = c.replace(/<code[^>]*>/gi, '').replace(/<\/code>/gi, '');
    code = decodeEntities(code.replace(/<[^>]+>/g, '')).replace(/^\n+|\s+$/g, '');
    const idx = blocks.push(code) - 1;
    return `\n\n\u0000CODE${idx}\u0000\n\n`;
  });

  s = s.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, (_m, inner) => {
    const img = inner.match(/<img[^>]*>/i);
    const cap = inner.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
    let out = '';
    if (img) {
      const src = (img[0].match(/src=["']([^"']+)["']/i) || [])[1] || '';
      const alt = (img[0].match(/alt=["']([^"']*)["']/i) || [])[1] || '';
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
  s = s.replace(/\[\s*(!\[[^\]]*\]\([^)]+\))\s*\]\([^)]*\)/g, '$1');

  s = s.replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, l, t) => `\n\n${'#'.repeat(Math.min(+l + 1, 6))} ${collapse(t)}\n\n`);
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

function sliceBetween(html, startRe, endRe) {
  const s = html.search(startRe);
  if (s < 0) return '';
  const rest = html.slice(s);
  const openEnd = rest.indexOf('>') + 1;
  const e = rest.slice(openEnd).search(endRe);
  return e < 0 ? rest.slice(openEnd) : rest.slice(openEnd, openEnd + e);
}

// ---------------- which pages to add ----------------
// 这两个 key 早先从 SKIP 名单里去掉过，理由错了：the-witness.net 的 RSS 全文 feed
// 只覆盖 2012-10 之后，2010/2011 的 hemicube 与 irradiance-caching-part-1 正文
// **不在** feed 里，必须从文章页抓。Castaño 个人博客上同题的那两篇是他自己的
// 「公告贴」（42 词 / 129 词），指向的正是这两个页面，两边都要留。
const ADD = [
  'graphics-tech-precomputed-lighting',
  'graphics-tech-lighting-comparison',
  'graphics-tech-texture-parameterization',
  'graphics-tech-multi-lightmaps',
  'computing-alpha-mipmaps',
  'hemicube-rendering-and-integration',
  'irradiance-caching-part-1',
  'a-pleasant-lightmapping-update',
  'seamless-cube-map-filtering',
  'fun-with-in-engine-color-grading',
  'kriging-is-cool',
  'experiments-in-texturing',
  'graphics-tech-shadow-maps-part-1',
  'graphics-tech-shadow-maps-part-2-save-25-texture-memory-and-possibly-much-more',
  'regarding-water',
  'more-island-color-experiments-shadow-update',
  'engine-tech-concurrent-world-editing',
];

// pages that are relevant but not engine-tech (kept out of the lighting chapter)
const ADD_EXTRA = ['the-depth-jam', 'island-paint-over'];

const posts = [];
for (const name of [...ADD, ...ADD_EXTRA]) {
  const file = path.join(PAGES, name + '.html');
  if (!fs.existsSync(file)) {
    console.log('MISSING', name);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');

  const titleM = html.match(/<h1[^>]*class=['"][^'"]*entry-title[^'"]*['"][^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleM ? collapse(titleM[1]) : name;

  const dateM = html.match(/<time[^>]*class=['"][^'"]*published[^'"]*['"][^>]*datetime=['"]([^"']+)['"]/i);
  const date = dateM ? dateM[1] : '';

  const authorM =
    html.match(/<span[^>]*class=['"][^'"]*author[^'"]*['"][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
    html.match(/rel=['"]author['"][^>]*>([\s\S]*?)<\/a>/i);
  const author = authorM ? collapse(authorM[1]) : 'Unknown';

  const catsAlt = [...html.matchAll(/rel=['"]category tag['"][^>]*>([\s\S]*?)<\/a>/gi)].map((m) => collapse(m[1]));

  const body = sliceBetween(html, /<div[^>]*class=['"][^'"]*entry-content[^'"]*['"][^>]*>/i, /<\/div>\s*<!--\s*\.entry-content/i);
  const { md, n: formulaCount } = recoverLatex(htmlToMd(body));

  posts.push({
    title,
    url: `http://the-witness.net/news/${name.replace(/^(\d{4})-(\d{2})-/, '$1/$2/')}/`,
    author,
    date,
    categories: [...new Set(catsAlt)],
    md,
    formulas: formulaCount,
    file: name + '.html',
    key: name,
  });
}

posts.sort((a, b) => new Date(a.date) - new Date(b.date));
fs.writeFileSync(path.join(HERE, 'raw', 'witness-graphics.json'), JSON.stringify(posts, null, 2));

// archive markdown (one file per post, keyed by the same `key` the manifest uses)
const OUT = path.join(HERE, 'witness-graphics');
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
for (const p of posts) {
  const rel = p.url.replace(/^https?:\/\/the-witness\.net\/news\/\d{4}\/\d{2}\//, '').replace(/\/$/, '');
  fs.writeFileSync(
    path.join(OUT, p.key + '.md'),
    `# ${p.title}\n\n` +
      `- **作者**：${p.author}\n` +
      `- **日期**：${(p.date || '').slice(0, 10)}\n` +
      `- **分类**：${(p.categories || []).join(', ') || '—'}\n` +
      `- **原文**：http://the-witness.net/news/${rel}/\n` +
      `- **来源**：the-witness.net 官方开发博客（文章页全文，2010–2012 技术帖，RSS 窗口之外）\n` +
      (p.formulas ? `- **公式**：原文用 WordPress 的 LaTeX 服务渲染成图片，本归档已从图片 URL 还原成 \`$…$\` 行内公式（${p.formulas} 条）\n` : '') +
      `\n---\n\n` +
      p.md +
      '\n',
  );
}

console.log(`converted ${posts.length} pages`);
for (const p of posts) {
  const w = p.md.split(/\s+/).filter(Boolean).length;
  console.log(
    `  ${String(w).padStart(5)}w ${String(p.md.length).padStart(6)}c  ${(p.date || '').slice(0, 10)}  ${p.author.padEnd(18)} ${p.title}`,
  );
}
