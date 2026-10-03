// Build the translation manifest for the learning wiki.
// - deduplicates the 4 official-blog cross-posts of Casey's articles
// - tags short "stub" posts (image/video-only dev-log entries)
// - assigns every article to a learning-path chapter
//
// 三个归档来源：
//   1. raw/casey-normalized.json   Casey Muratori 的 Witness Wednesday 系列（19 篇）
//   2. raw/witness-full.json       the-witness.net 官方博客 RSS 全文（2012-10 起，100 篇）
//   3. raw/witness-graphics.json   the-witness.net 2010–2012 图形/引擎技术帖（19 篇，RSS 窗口之外）
//   4. raw/castano-blog.json       Ignacio Castaño 个人博客 ludicon.com/castano/blog 全部 66 篇
// Usage: node <脚本名>
import { writeFileSync, mkdirSync, readdirSync, existsSync, renameSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { MANIFEST, DATA, ARCHIVE } from './paths.mjs';

const W = JSON.parse(readFileSync('archive/raw/witness-full.json', 'utf8')).filter((p) => p.md && p.md.length);
const C = JSON.parse(readFileSync('archive/raw/casey-normalized.json', 'utf8'));
const G = existsSync('archive/raw/witness-graphics.json')
  ? JSON.parse(readFileSync('archive/raw/witness-graphics.json', 'utf8'))
  : [];
const CB = existsSync('archive/raw/castano-blog.json')
  ? JSON.parse(readFileSync('archive/raw/castano-blog.json', 'utf8'))
  : [];

const wordsOf = (s) => s.split(/\s+/).filter(Boolean).length;
const proseOnly = (s) =>
  s
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[\u2018\u2019'"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);

// official posts that are re-posts of Casey's own articles (matched by title + content)
const CROSSPOST = {
  'Mapping the Island’s Walkable Surfaces': 'casey-0005',
  'Finding and Fixing a Five Second Stall': 'casey-0006',
  'A Cliffside Cliffhanger': 'casey-0007',
  'How do you say “plane” in The Witness?': 'casey-0008',
};

const caseyFiles = readdirSync('archive/casey-muratori');
const officialFiles = readdirSync('archive/witness-official/by-year');

/**
 * 官方条目 -> 归档文件，用【正文内容指纹】匹配，不数序号。
 * 归档文件编号顺序与 RSS 拉取顺序并不一致，靠计数对齐极易整段错位（已踩过两次），
 * 所以这里直接拿正文前若干字符做指纹：归档文件的正文就是同一段 markdown。
 */
const norm = (s) =>
  s
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/[#*_`>|]/g, '')
    .trim();
const sigOf = (s) => norm(s).slice(0, 80);

const fileSig = new Map();
for (const f of officialFiles) {
  const md = readFileSync(`archive/witness-official/by-year/${f}`, 'utf8');
  const body = md.includes('\n---\n') ? md.split('\n---\n').slice(1).join('\n---\n') : md;
  fileSig.set(sigOf(body), f);
}
const officialFileFor = new Map();
const unmatchedOfficial = [];
for (const p of W) {
  if (CROSSPOST[p.title]) continue;
  const hit = fileSig.get(sigOf(p.md));
  if (hit) officialFileFor.set(p, hit);
  else unmatchedOfficial.push(p);
}
if (unmatchedOfficial.length) {
  // 兜底：型号索引（YYYY-NNN），仅用于指纹匹配失败的文章，并在报告里点名
  const byYearSeq = new Map();
  for (const f of officialFiles) {
    const m = f.match(/^(\d{4})-(\d{3})-/);
    if (m) byYearSeq.set(`${m[1]}-${m[2]}`, f);
  }
  const seq = {};
  for (const p of [...unmatchedOfficial].sort((a, b) => new Date(a.date) - new Date(b.date))) {
    const y = p.date.slice(0, 4);
    seq[y] = (seq[y] || 0) + 1;
    const f = byYearSeq.get(`${y}-${String(seq[y]).padStart(3, '0')}`) || null;
    officialFileFor.set(p, f);
    console.warn(`    · ${p.date.slice(0, 10)}  ${p.title}  ->  ${f || '(无)'}`);
  }
}

const entries = [];

for (const p of C) {
  const num = p.id;
  const file = caseyFiles.find((f) => f.includes(`-${num}-`));
  entries.push({
    id: `casey-${num}`,
    source: 'casey',
    series: 'Witness Wednesday',
    title: { en: p.title, zh: '' },
    date: p.date,
    author: p.author,
    url: p.url,
    words: wordsOf(proseOnly(p.md)),
    mdPath: file ? `archive/casey-muratori/${file}` : null,
    crossPostedAs: [],
  });
}

for (const p of W) {
  const dupId = CROSSPOST[p.title];
  if (dupId) {
    const target = entries.find((e) => e.id === dupId);
    if (target) target.crossPostedAs.push({ title: p.title, url: p.url, date: p.date.slice(0, 10) });
    continue;
  }
  // 归档文件名由上面的「按日期降序」映射给出；标题重复度高（多篇都叫 "Island Snapshot"），
  // 不能按标题匹配。
  const file = officialFileFor.get(p);
  entries.push({
    id: `official-${p.date.slice(0, 10)}-${slug(p.title)}`,
    source: 'official',
    series: 'Thekla dev blog',
    title: { en: p.title, zh: '' },
    date: p.date.slice(0, 10),
    author: p.author,
    url: p.url,
    words: wordsOf(proseOnly(p.md)),
    mdPath: file ? `archive/witness-official/by-year/${file}` : null,
    crossPostedAs: [],
  });
}

// --- 2010–2012 graphics/engine-tech posts (outside the RSS window) ---
for (const p of G) {
  const key = p.key;
  if (!key) continue;
  entries.push({
    id: `light-${key}`,
    source: 'official-2010s',
    series: 'The Witness graphics tech',
    title: { en: p.title, zh: '' },
    date: (p.date || '').slice(0, 10),
    author: p.author,
    url: p.url,
    words: wordsOf(proseOnly(p.md)),
    mdPath: `archive/witness-graphics/${key}.md`,
    crossPostedAs: [],
  });
}

// --- Ignacio Castaño's own blog (ludicon.com/castano/blog), all 66 posts ---
for (const p of CB) {
  entries.push({
    id: `castano-${p.date}-${p.slug}`,
    source: 'castano',
    series: 'ludicon.com/castano/blog',
    title: { en: p.title, zh: '' },
    date: p.date,
    author: 'Ignacio Castaño',
    url: p.url,
    words: p.words,
    mdPath: `archive/castano-blog/${p.file}`,
    crossPostedAs: [],
  });
}

// --- 去重：同一作者、同一标题、同一篇的两份副本 ---
// Ignacio 习惯在个人博客发一条几十字的「公告贴」，指向 the-witness.net 上的正文。
// 只把「个人博客 ↔ 官方博客」这一对折叠起来；官方站内部、Casey 系列内部不碰——
// 官方站自己就有同题不同文的两篇（Blow 的公告 vs Ignacio 的正文）。
const normTitle = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[\u2018\u2019'"]/g, '')
    .replace(/\b(part|pt)\s*1\b/g, '1')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const SITE_OF = (e) =>
  e.source === 'castano'
    ? 'castano'
    : e.source === 'casey'
      ? 'casey'
      : 'witness'; // official + official-2010s 同属 the-witness.net
const byTitleAuthor = new Map();
for (const e of entries) {
  // 只有「同站点、同作者、同日期、同标题」才算同一篇的两份副本。
  //  - 跨站点同题不算：Ignacio 的公告贴和 the-witness.net 上的正文标题一模一样，
  //    但内容体量差两个数量级，两者都要留（公告贴本身就是一条索引）。
  //  - **同站点同题不同日期也不算**：官方博客有一串都叫 "Island Snapshot" 的独立贴
  //    （2012-12 / 2013-01 / 2013-03 / 2013-04 / 2013-05…），它们是不同月份的不同内容。
  //    早期的去重键没带日期，一口气吃掉了其中 5 篇，靠 `audit-orphans.mjs` 才发现。
  const k = `${SITE_OF(e)}::${e.author}::${e.date}::${normTitle(e.title.en)}`;
  const prev = byTitleAuthor.get(k);
  if (!prev) {
    byTitleAuthor.set(k, e);
    continue;
  }
  const [keep, drop] = prev.words >= e.words ? [prev, e] : [e, prev];
  keep.crossPostedAs.push({ id: drop.id, title: drop.title.en, url: drop.url, date: drop.date, source: drop.source });
  byTitleAuthor.set(k, keep);
}
const dropped = new Set(entries.flatMap((e) => e.crossPostedAs.map((x) => x.id)));
for (let i = entries.length - 1; i >= 0; i--) if (dropped.has(entries[i].id)) entries.splice(i, 1);

// --- 编者导览（不是翻译，没有归档源文；直接挂在 intro 章节下）---
// 它是读光照系统的入口：把散在四个来源、跨越十二年的二十多篇技术帖串成一条阅读顺序。
// 因为没有 mdPath，verify-paths / fidelity-check 需要跳过它（两处都已按 id 白名单处理）。
const GUIDE_ID = 'start-here-lighting';
if (existsSync(`${DATA}/articles/${GUIDE_ID}.json`)) {
  let guideTitle = { en: 'Start here: how The Witness lighting works', zh: '先读这篇：《The Witness》的光照系统是怎么搭起来的' };
  try {
    const g = JSON.parse(readFileSync(`${DATA}/articles/${GUIDE_ID}.json`, 'utf8'));
    if (g.title) guideTitle = { en: g.title.en || guideTitle.en, zh: g.title.zh || guideTitle.zh };
  } catch {}
  entries.push({
    id: GUIDE_ID,
    source: 'guide',
    series: '编者导览',
    title: guideTitle,
    date: '2026-10-03',
    author: '编者',
    url: '',
    words: 0,
    mdPath: null,
    isGuide: true,
    crossPostedAs: [],
  });
}

// --- chapters (learning path) ---
const CHAPTERS = [
  { key: 'intro', zh: '开始：这些人是谁', en: 'Start here', desc: '先搞清楚谁做了《The Witness》的哪一部分，以及这批文章该怎么读。' },
  { key: 'precomputed', zh: '一 · 光照系统：为什么是预计算', en: 'Lighting 1: why precomputed', desc: '《The Witness》全部光照都是离线烘焙的——Jon 定下这个方向的原因，以及光照贴图方案的取舍。' },
  { key: 'irradiance', zh: '二 · 光照系统：辐照度缓存', en: 'Lighting 2: irradiance caching', desc: 'Ignacio 的 GI 三部曲：光照贴图参数化 → hemicube 最终采集 → 辐照度缓存与梯度估算。' },
  { key: 'lightmap-shipping', zh: '三 · 光照系统：压缩、平台与阴影', en: 'Lighting 3: compression, platforms, shadows', desc: '把光照贴图压到能上 iOS、用阴影贴图补直接光，以及 Blow 的三篇阴影贴图笔记。' },
  { key: 'movement', zh: '四 · 玩家移动与碰撞', en: 'Movement & collision', desc: '沉浸感的成败系于「不被注意到」——Casey 的 Walk Monster 系列。' },
  { key: 'renderer', zh: '五 · 渲染管线与显存', en: 'Renderer & memory', desc: '着色器改写、立方体贴图、色彩分级、水体、纹理实验——画面之外的工程量。' },
  { key: 'nature', zh: '六 · 草地与植被', en: 'Grass & vegetation', desc: '散布、分布均匀性、噪点着色——让荒野看起来不像程序生成的。' },
  { key: 'editor', zh: '七 · 编辑器与代码手艺', en: 'Editor & code craft', desc: '压缩导向编程，以及一个真实商业代码库里的重构全记录。' },
  { key: 'art', zh: '八 · 美术与设计减法', en: 'Art & subtraction', desc: '艺术总监怎么把一座岛「减」到只剩必要的东西。' },
  { key: 'process', zh: '九 · 上市与复盘', en: 'Ship & reflect', desc: '里程碑、音乐取舍、销售与发售后修补。' },
  { key: 'castano-textures', zh: '十 · Castaño：纹理压缩与编码', en: 'Castaño: texture compression', desc: '他离开 Thekla 之后的主线研究：BC1/ASTC/ETC 编码、GPU 编解码工具、spark.js。' },
  { key: 'castano-graphics', zh: '十一 · Castaño：曲面、采样与其他', en: 'Castaño: surfaces, sampling & misc', desc: '细分曲面、水密采样、伽罗瓦域与 GPU 解码、kriging 插值等非光照主题。' },
  { key: 'snapshots', zh: '附录 · 开发日志快照', en: 'Appendix: dev-log snapshots', desc: '当年以截图/视频为主的短贴，按时间保留，作为气氛与时间线材料。' },
];

// 章节改写表：某些文章的主题和标题规则不一致，这里写死，避免 RULES 越写越玄学。
// 键是 id，值是 chapter key。id 会随来源变化，所以两种前缀都列上。
const CHAPTER_OVERRIDE = {
  // 2010 技术帖里属于「阴影 / 压缩 / 平台」而不是核心 GI 的
  'light-2010-03-03-graphics-tech-shadow-maps-part-1': 'lightmap-shipping',
  'light-2010-04-21-graphics-tech-shadow-maps-part-2-save-25-texture-memory-and-possibly-much-more': 'lightmap-shipping',
  'light-2010-09-09-computing-alpha-mipmaps': 'lightmap-shipping',
  // kriging 是插值方法，不是光照
  'light-2010-05-24-kriging-is-cool': 'renderer',
  // 2010 帖子里偏美术 / 色彩实验的
  'light-2010-11-05-experiments-in-texturing': 'renderer',
  'light-2011-05-18-more-island-color-experiments-shadow-update': 'renderer',
  'light-2012-08-24-regarding-water': 'renderer',
  // 本就在 graphics 里、但主题更偏渲染管线
  'official-2014-08-29-hlslparser': 'renderer',
  'official-2022-02-10-a-shader-trick': 'renderer',
  'casey-0010': 'renderer',
  'casey-0009': 'renderer',
  // Blow 那篇「怎么编程」是方法论长文，归到编辑器与代码手艺
  'official-2014-05-28-witness-wednesday-on-how-to-program': 'editor',
  // 光照章节：把 GI 三部曲的「前提」和「续篇」摆正
  'light-graphics-tech-texture-parameterization': 'precomputed',
  'light-hemicube-rendering-and-integration': 'irradiance',
  'light-irradiance-caching-part-1': 'irradiance',
  'castano-2010-09-29-hemicube-rendering-and-integration': 'irradiance',
  'castano-2011-07-14-irradiance-caching-part-1': 'irradiance',
  'official-2014-07-10-irradiance-caching-continued': 'irradiance',
  'castano-2014-07-10-irradiance-caching-continued': 'irradiance',
  'light-a-pleasant-lightmapping-update': 'lightmap-shipping',
  'castano-2016-09-30-lightmap-compression-in-the-witness': 'lightmap-shipping',
  'castano-2017-10-05-lightmap-optimizations-ios': 'lightmap-shipping',
};

const RULES = [
  [/walk monster|walkable surfaces|five.?second stall|cliffside|say.*plane/i, 'movement'],
  [/grass|color of noise|pleasing distributions|concentric|interpolation/i, 'nature'],
  // 顺序即优先级：先认「压缩 / 平台 / 阴影」这类落地话题，再认核心 GI 术语
  [/lightmap compression|lightmap optimizations?|shadow map|multi.?lightmap|save 25% texture memory/i, 'lightmap-shipping'],
  [/lightmap parameterization|hemicube|precomputed lighting|lighting comparison|irradiance caching|lightmapping update/i, 'precomputed'],
  [/irradiance|lightmap|lighting/i, 'irradiance'],
  [/hlslparser|shader|scope\(exit\)|cube map|color grading|water|texturing|kriging|mipmap/i, 'renderer'],
  [/semantic compression|complexity and granularity|single enumerant|type filtering|special filters|lister panel|source code|how to program|nebraska/i, 'editor'],
  [/art of|road to e3|architecture|sculpture|long overdue tree|polishing the architecture/i, 'art'],
  [/music|sound|home stretch|sales|fakts|price|pre-order|voices|ps4|ios|xbox|bug|jai compiler/i, 'process'],
  [/marsh|island|trailer|poster|screenshot|demo day|coverage|wallpaper|shipwreck|rocks|map crazy|playtest|beta|tree|close-up|whats this|vr|controller|oculus|award|grant|jobs|printable|reddit|anniversary|limbo|thekla|getting things done|working on the witness|partition|depth jam/i, 'snapshots'],
];
// Ignacio 个人博客的章节划分：光照相关的落到光照章，剩下的按「纹理压缩 / 其他图形」二分。
const CASTANO_LIGHT = /lightmap|irradiance|hemicube|lighting/i;
const CASTANO_TEXTURE =
  /compression|codec|texture|mipmap|astc|bc1|etc|dxt|nvtt|uvatlas|color|image|sponza|gltf|spark|webgpu|metal|format/i;
const castanoChapterOf = (e) => {
  const s = e.title.en;
  if (CASTANO_LIGHT.test(s)) return 'irradiance';
  if (CASTANO_TEXTURE.test(s)) return 'castano-textures';
  return 'castano-graphics';
};

const chapterOf = (e) => {
  if (CHAPTER_OVERRIDE[e.id]) return CHAPTER_OVERRIDE[e.id];
  if (e.source === 'castano') return castanoChapterOf(e);
  for (const [re, key] of RULES) if (re.test(e.title.en)) return key;
  return e.words < 200 ? 'snapshots' : 'process';
};

for (const e of entries) {
  e.chapter = e.isGuide ? 'intro' : chapterOf(e);
  e.isStub = e.words < 150 && !e.isGuide;
  e.status = existsSync(`${DATA}/articles/${e.id}.json`) ? 'done' : 'pending';
  if (!e.mdPath && !e.isGuide) console.warn('  ! unresolved archive path for', e.id, '|', e.title.en);
}

// 保留已有的中文标题（重跑清单时不要把翻译成果覆盖掉）
if (existsSync(MANIFEST)) {
  try {
    const prev = JSON.parse(readFileSync(MANIFEST, 'utf8'));
    const prevById = new Map(prev.articles.map((a) => [a.id, a]));
    for (const e of entries) {
      const p = prevById.get(e.id);
      if (p && p.title && p.title.zh) e.title.zh = p.title.zh;
      if (p && p.subtitleZh) e.subtitleZh = p.subtitleZh;
    }
  } catch {}
}

entries.sort((a, b) => (a.date < b.date ? -1 : 1));

const manifest = {
  generatedAt: new Date().toISOString(),
  corpus: {
    articles: entries.length,
    words: entries.reduce((s, e) => s + e.words, 0),
    stubs: entries.filter((e) => e.isStub).length,
    coreArticles: entries.filter((e) => e.words >= 1000).length,
    dedupedCrossPosts: Object.keys(CROSSPOST).length,
  },
  chapters: CHAPTERS.map((c) => ({ ...c, articles: entries.filter((e) => e.chapter === c.key).map((e) => e.id) })),
  articles: entries,
};

mkdirSync(DATA, { recursive: true });
// 原子写入：并发跑校验器/生成器时，避免读到半个文件
writeFileSync(MANIFEST + '.tmp', JSON.stringify(manifest, null, 2));
renameSync(MANIFEST + '.tmp', MANIFEST);

console.log(`manifest: ${entries.length} 篇 / ${manifest.corpus.words.toLocaleString()} 词（stub ${manifest.corpus.stubs} 篇，核心长文 ${manifest.corpus.coreArticles} 篇）`);
console.log(`已去重官方交叉发布 ${Object.keys(CROSSPOST).length} 篇\n`);
for (const c of manifest.chapters) {
  const arts = entries.filter((e) => e.chapter === c.key);
  console.log(`  ${c.zh.padEnd(22)} ${String(arts.length).padStart(3)} 篇  ${String(arts.reduce((s, e) => s + e.words, 0)).padStart(6)} 词`);
}
const core = entries.filter((e) => e.words >= 1000).sort((a, b) => b.words - a.words);
console.log(`\n核心长文合计: ${core.reduce((s, e) => s + e.words, 0).toLocaleString()} 词`);
