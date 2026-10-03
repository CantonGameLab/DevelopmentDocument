// Convert the full ludicon.com/castano/blog HTML (WP REST API payloads) into archive markdown.
// Output: archive/castano-blog/<date>-<slug>.md  +  raw/castano-blog.json
// Usage: node archive/build-castano-blog.mjs
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const SRC = path.join(HERE, 'raw', 'castano', 'html');
const OUT = path.join(HERE, 'castano-blog');

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

/** 标题里的残留标签（`<strong>Crossing the Ludicon</strong>`）要剥掉，但保留原文大小写。 */
const cleanTitle = (h) => collapse(h).replace(/\s+/g, ' ').trim();

/**
 * 归档残留：WordPress 把 `<a href="X">text</a>` 里的 text 本身也写成 markdown 链接时，
 * 会得到 `[text]([url](url))`。这里把它折回 `[text](url)`。
 */
function fixNestedLinks(md) {
  let n = 0;
  const out = md.replace(/\[([^\]\n]+)\]\(\[[^\]\n]*\]\((https?:\/\/[^)\s]+)\)\)/g, (_m, text, url) => {
    n++;
    return `[${text}](${url})`;
  });
  return { md: out, n };
}

// WordPress code blocks are <pre class="brush: cpp; ..."> with raw text and entities.
function htmlToMd(html) {
  let s = html;
  s = s.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<div[^>]*class=['"][^'"]*(socials?|share|jp-relatedposts|wpcnt|sharedaddy|wp-caption-text)[^'"]*['"][\s\S]*?<\/div>/gi, '');
  s = s.replace(/<iframe[^>]*>/gi, (m) => {
    const src = (m.match(/src=["']([^"']+)["']/i) || [])[1] || '';
    return src ? `\n\n[嵌入媒体](${src})\n\n` : '';
  });
  s = s.replace(/<(video|audio)[^>]*>[\s\S]*?<\/\1>/gi, '');
  s = s.replace(/<br\s*\/?>/gi, '\n');
  s = s.replace(/<hr\s*\/?>/gi, '\n\n---\n\n');

  const blocks = [];
  const langOf = (attrs) => {
    const m = /brush:\s*([a-z0-9+#]+)/i.exec(attrs || '');
    return m ? m[1].toLowerCase() : '';
  };
  s = s.replace(/<pre([^>]*)>([\s\S]*?)<\/pre>/gi, (_m, attrs, c) => {
    let code = c.replace(/<code[^>]*>/gi, '').replace(/<\/code>/gi, '');
    code = decodeEntities(code.replace(/<[^>]+>/g, '')).replace(/^\n+|\s+$/g, '');
    const lang = langOf(attrs);
    const idx = blocks.push({ code, lang }) - 1;
    return `\n\n\u0000CODE${idx}\u0000\n\n`;
  });

  // WordPress sometimes wraps a [caption] shortcode in a permalink anchor; unwrap first so the
  // generic <a> rule later cannot produce "[caption ...]([caption ...])" garbage.
  s = s.replace(/<a\b[^>]*>\s*(\[caption[\s\S]*?\[\/caption\])\s*<\/a>/gi, '$1');

  // wp-caption boxes: [caption id=..]<img..> text[/caption]
  s = s.replace(
    /\[caption[^\]]*\]([\s\S]*?)\[\/caption\]/gi,
    (_m, inner) => {
      const img = inner.match(/<img[^>]*>/i);
      const text = collapse(inner.replace(/<img[^>]*>/i, ''));
      let out = '';
      if (img) {
        const src = (img[0].match(/src=["']([^"']+)["']/i) || [])[1] || '';
        out += `![图](${src})`;
        if (text) out += `\n*${text}*`;
      } else out = text;
      return `\n\n${out}\n\n`;
    },
  );

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
  s = s.replace(/\u0000CODE(\d+)\u0000/g, (_m, i) => '\n\n```' + (blocks[+i].lang || '') + '\n' + blocks[+i].code + '\n```\n\n');
  return s.replace(/\n{3,}/g, '\n\n').trim();
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.json'));
const posts = [];
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8'));
  const { md, n: nestedLinks } = fixNestedLinks(htmlToMd(j.content));
  const title = cleanTitle(j.title);
  // 个人博客上有几篇是「公告贴」，正文其实发在 the-witness.net，标题与那边完全相同；
  // 这里用 slug 标记出来，清单层据此把它们和官方正文区分开。
  const crossPost = /^https?:\/\/the-witness\.net/i.test(md.replace(/\s+/g, ' '));
  posts.push({
    id: j.id,
    slug: j.slug,
    date: j.date.slice(0, 10),
    title,
    url: j.link,
    modified: (j.modified || '').slice(0, 10),
    md,
    words: md.split(/\s+/).filter(Boolean).length,
    chars: md.length,
    crossPost,
    file: `${j.date.slice(0, 10)}-${j.slug}.md`,
  });
}
posts.sort((a, b) => a.date.localeCompare(b.date));

for (const p of posts) {
  fs.writeFileSync(
    path.join(OUT, p.file),
    `# ${p.title}\n\n` +
      `- **作者**：Ignacio Castaño\n` +
      `- **日期**：${p.date}${p.modified && p.modified !== p.date ? `（更新于 ${p.modified}）` : ''}\n` +
      `- **原文**：${p.url}\n` +
      `- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）\n\n---\n\n` +
      p.md +
      '\n',
  );
}
fs.writeFileSync(path.join(HERE, 'raw', 'castano-blog.json'), JSON.stringify(posts, null, 2));

console.log(`converted ${posts.length} posts -> ${path.relative(process.cwd(), OUT)}`);
const heavy = posts.filter((p) => p.words > 3000);
console.log('\nheavy posts (>3000 words):');
for (const p of heavy.sort((a, b) => b.words - a.words)) console.log(`  ${String(p.words).padStart(6)}w ${p.date} ${p.title}`);
console.log(`\ntotal words ${posts.reduce((s, p) => s + p.words, 0).toLocaleString()}`);
