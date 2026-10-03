# 《The Witness》技术文档归档 — 中文导读总纲

本目录是 **The Witness**（Jonathan Blow / Thekla, Inc.，2016）相关技术写作的**全文归档**，含 **200 个 markdown 文件**，全部为英文原文（译文在 `../data/witness/articles/`），代码块已还原为可读的 fenced code block。

抓取时间：2026-09-10 起，2026-10-03 扩至四个来源 · 数据来源：站点 RSS + 逐篇文章页全文抓取 + WordPress REST API（均为全文，非摘要）

---

## 四个来源

| 目录 | 来源 | 篇数 | 说明 |
|---|---|---|---|
| `witness-official/by-year/` | the-witness.net 官方开发博客 | 96 | RSS 全文 feed（窗口 2012-10 → 2022-02）+ 按月归档补抓 |
| `witness-graphics/` | the-witness.net 的图形/引擎技术帖 | 19 | **2010–2012，在 RSS 窗口之外**，靠分类/月份索引页补抓；含 hemicube、irradiance caching part 1 等核心长文 |
| `casey-muratori/` | Casey Muratori「Witness Wednesday」 | 19 | caseymuratori.com，blog_0005 – blog_0023 |
| `castano-blog/` | Ignacio Castaño 个人博客 | 66 | ludicon.com/castano/blog **全部文章**（2008–2026），WordPress REST API 全文 |

**为什么会有 `witness-graphics/`**：the-witness.net 的 RSS 全文 feed 只回溯到 2012-10，而《The Witness》光照系统最核心的几篇文章（hemicube 最终采集、辐照度缓存 part 1、光照贴图参数化、Precomputed Lighting）都发在 2010–2011。只信 feed 会静默漏掉整套 GI 系列——这是补抓的直接原因。

---

## 目录结构

```
archive/
├── README.md                      ← 本文件（总纲 + 阅读路线）
├── witness-official/              ← 官方开发博客全站 96 篇
│   ├── README.md                  ← 完整索引：按作者 / 按年份 / 按分类
│   └── by-year/                   ← 文章文件（YYYY-NNN-title.md）
├── witness-graphics/              ← 2010–2012 图形/引擎技术帖 19 篇
├── casey-muratori/                ← Casey Muratori 系列 19 篇
│   └── README.md                  ← 系列索引：按主题分组
├── castano-blog/                  ← Ignacio Castaño 个人博客 66 篇
├── raw/                           ← 原始数据（HTML / XML / API 响应 / 解析中间产物）
└── *.mjs / *.ps1                  ← 抓取与解析脚本（可重跑，文件已存在则跳过）
```

---

## 一、这些博客到底是什么

一共有**两条独立但相互交叉的线索**：

### 1. 官方开发博客 `the-witness.net/news`（96 篇，2012-10 → 2022-02）

Thekla 团队的官方 dev blog。这不是宣传稿，而是真正的工作日志：早期大量引擎技术文章，中期是美术与设计决策，后期是上市前后复盘。**作者不止 Blow 一个人**，这正是它的价值所在。

| 作者 | 篇数 | 时间跨度 | 是谁 / 写什么 |
|---|---|---|---|
| **Jonathan Blow** | 59 | 2012-10 → 2022-02 | 主设计师兼主程。引擎技术、设计决策、上市复盘 |
| **Orsi Spanyol** | 19 | 2013-06 → 2017-09 | 美术/制作，岛屿美术与进度记录 |
| **Luis Antonio** | 7 | 2014-03 → 2015-06 | 艺术总监（后做 *Twelve Minutes*）。「减法设计」、E3 冲刺日记 |
| **Casey Muratori** | 4 | 2012-12 → 2013-01 | 程序员（RAD Game Tools / Handmade Hero）。碰撞与编辑器 |
| **Ignacio Castaño** | 3 | 2012-11 → 2014-08 | 图形程序员。光照、辐照度缓存 |
| Andrew Lackey | 1 | 2013-02 | 音频 |
| Eric A. Anderson | 1 | 2013-09 | 程序生成相关内容 |
| Abner Coimbre | 1 | 2018-03 | 测试 Jai 编译器 |
| kenzie / admin | 2 | 2016 / 2018 | 公告类 |

（章节口径调整后，官方博客条目在 wiki 清单里是 96 条；`witness-official/by-year/` 下的文件与之对应。）

> **关于 2010–2012 的早期技术文章**：RSS feed 只回溯到 2012-10，所以那批文章**不在 `witness-official/` 里**。它们已经补抓完成，放在 **`witness-graphics/`**（19 篇），见下一节。

### 1b. 2010–2012 图形 / 引擎技术帖 `witness-graphics/`（19 篇）

这批是《The Witness》光照系统的**一手材料**，也是整份语料里最容易被漏掉的部分。获取方式：先爬 `category/engine-tech/` 的翻页归档、`author/castano/` 作者归档，再逐月拉 `2010/01/` … `2012/12/` 的月份归档，把收集到的 URL 求并集（脚本 `crawl-witness-index.ps1`），最后逐页抓全文（`fetch-witness-graphics.ps1`）。

包含：

- `graphics-tech-precomputed-lighting` / `graphics-tech-lighting-comparison`（Blow 定方向）
- `graphics-tech-texture-parameterization`（Castaño：光照贴图参数化）
- `hemicube-rendering-and-integration`（Castaño：最终采集）
- `irradiance-caching-part-1`（Castaño：辐照度梯度推导，**全文 37 条公式已从 LaTeX 图片还原为 `$…$`**）
- `graphics-tech-shadow-maps-part-1` / `part-2`、`lightmapping-update`、`multi-lightmaps`
- 以及 `kriging-is-cool`、`seamless-cube-map-filtering`、`computing-alpha-mipmaps`、`regarding-water`、`engine-tech-concurrent-world-editing` 等

**抓取上的两个坑**：
1. `the-witness.net` 的 HTTPS 握手是坏的（`packet length too long`），Node 与 PowerShell 走 HTTPS 全部失败——**必须走 `http://`**，所以脚本里 URL 统一是 http。
2. WordPress 的 LaTeX 插件把公式渲染成 `<img src="…/latex.php?latex=…">`，公式源码就在 URL 的 query 里。归档脚本会把它还原成 `$…$` 行内公式，否则译文里满屏都是 `![E(\mathbf{x})](https://s0.wp.com/latex.php…)` 这种噪音。

### 1c. Ignacio Castaño 个人博客 `castano-blog/`（66 篇，2008-08 → 2026-09）

`ludicon.com/castano/blog` 的**全部文章**（该站 WP REST API 报 `X-WP-Total: 66`）。抓取方式：`fetch-castano.mjs`（发现清单）→ `fetch-castano-full.mjs`（逐篇拉 `content.rendered` 全文）→ `build-castano-blog.mjs`（HTML → markdown）。

内容分两块：**与《The Witness》光照直接相关的 6 篇**（Lightmap Compression in The Witness、Lightmap optimizations for iOS、Irradiance Caching – Continued，以及 3 篇指向 the-witness.net 正文的公告贴），以及**纹理压缩 / 编码研究主线**（BC1、ASTC、Metal 有损格式、GPU 编解码工具、spark.js），另有少量曲面细分时代的旧文与个人生活贴。

**一个必须知道的坑**：他习惯在个人博客发一条几十字的「公告贴」，指向 the-witness.net 上的正文，**标题完全相同**。归档层保留两者（公告贴本身是有用的索引），清单层去重，只折叠「同站点 + 同作者 + 同日 + 同标题」——注意**同站点同题不同日期不能折叠**，官方博客有一串都叫 `Island Snapshot` 的独立贴，早期的去重键没带日期，一口气吃掉了其中 5 篇。

### 2. Casey Muratori 的 "Witness Wednesday" 系列（19 篇，2012-12 → 2014-07）

Casey Muratori 在自己博客上以**"Witness Wednesday"（每周三更新）**的形式，系统记录他在《The Witness》上做的工作。这是**整个资料集中技术密度最高**的部分——共 40 万字符、91 个代码块，最长一篇（`The Source Code`）单篇近 5.8 万字符，是他为游戏编辑器写的 Lister Panel 约 2000 行完整源码。

系列按主题分四个阶段：

| 阶段 | 文章 | 内容 |
|---|---|---|
| **碰撞/移动系统** | blog_0005–0007（2012-12） | Walk Monster：自动漫游整个岛屿来发现碰撞 bug 的工具；五秒卡顿的定位；悬崖问题 |
| **几何与命名约定** | blog_0008–0012（2013-01 / 2014-05） | "plane" 在这个项目里到底指什么；视觉上均匀的分布；噪点着色；"Nebraska 问题" |
| **草地/植被系统** | blog_0013–0014（2014-05） | 草地系统特性集合、插值教程视频 |
| **编辑器代码重构** | blog_0015–0023（2014-05 → 07） | 核心：Semantic Compression / Complexity and Granularity / Lister Panel 全套实现与 Q&A |

---

## 二、怎么读（推荐路线）

按你的目的挑一条：

**A. 想了解"一个 3A 规模独立游戏是怎么做出来的"（项目管理视角）**
1. `witness-official/by-year/` 里 2015-12-22 `Entering the Home Stretch`（上市前一个月）
2. 2015-11-19 `On Music, Sound Effects, Story`（为什么游戏几乎没有音乐）
3. 2014-09-10 `What we've been working on lately`（自研引擎切 DX11）
4. 2015-01-25 `Progress!`（"Puzzle Complete" 里程碑意味着什么，以及不意味着什么）

**B. 想学图形/引擎技术**
1. Ignacio Castaño 的 *Irradiance Caching* 系列（3 篇，含开源代码）
2. `scope(exit) in C++11`（用 C++11 实现 D 语言的 scope guard）
3. 2010 年的 Shadow Maps 省显存技巧（**不在本归档**，需另抓）

**C. 想学"怎么把代码写好"（最推荐 Casey 系列）**
1. `0015 Semantic Compression` — 压缩导向编程，痛批 OOP 建模
2. `0016 Complexity and Granularity` — 复杂度与粒度
3. `0017`–`0021` — 从单个枚举值开始，逐步长出一个完整的实体列表面板
4. `0022 The Source Code` — 完整源码
5. `0023 Lister Panel Q&A` — 答疑
> 这条线是 Casey 的"compression-oriented programming"方法论在真实商业项目上的完整案例，也是他后来 Handmade 系列思想的实战版。

**D. 想看美术/设计减法**
1. `witness-official/by-year/` 里 Luis Antonio 的《Road to E3 – Day 1…5》五日连载（2014-06）
2. 他的 `The Art of "The Witness" – GDC 2014` 那篇
3. 2015-06-03 `Polishing the Architecture`

**E. 就想看 Blow 骂人** → 搜 `Ill-Advised Rants` 分类那 4 篇。

**F. 想搞懂《The Witness》的光照系统怎么搭的** → 直接读 `../data/witness/articles/start-here-lighting.json`（编者导览，中英对照），它把散在这四个来源里的 20 多篇串成了一条顺序：为什么要预计算 → 光照贴图参数化 → hemicube 最终采集 → 辐照度缓存与梯度推导 → 压缩 / iOS / 阴影贴图。

---

## 三、Casey Muratori × Jonathan Blow 的合作

Casey Muratori 是 RAD Game Tools 前工程师、[Handmade Hero](https://handmadehero.org/) 作者。他在 2012–2014 年参与《The Witness》，具体职责与双方评价详见：

- **[`casey-muratori/README.md`](casey-muratori/README.md)** — 19 篇文章的完整索引与主题分组
- **[`blow-casey-collaboration.md`](blow-casey-collaboration.md)** — 合作背景专题：怎么开始的、他具体做了什么、两人如何互相评价（含原话引用与出处、可信度分级）
- 官方博客侧同样有 4 篇署名 Casey 的交叉发布文章（`Mapping the Island's Walkable Surfaces`、`Finding and Fixing a Five Second Stall`、`A Cliffside Cliffhanger`、`How do you say "plane" in The Witness?`），以及 Blow 转发他博客的两条短公告
- 他 2018 年的后续演讲/文章 *Killing the Walk Monster*（<https://caseymuratori.com/blog_0032>）是对 2012 年那条线索的回顾
- 合作背景专题整理见 [`blow-casey-collaboration.md`](blow-casey-collaboration.md)

---

## 四、数据可信度与已知限制

| 项目 | 状态 |
|---|---|
| 官方博客正文 | ✅ 逐篇文章页全文抓取，非 RSS 摘要 |
| 官方博客覆盖 | ✅ 96 篇（RSS 窗口 2012-10 起）+ `witness-graphics/` 19 篇补上 2010–2012 的早期技术帖；两处合起来覆盖 the-witness.net 的引擎/图形内容 |
| 2010–2012 技术帖正文 | ✅ 文章页全文；**公式已从 WordPress LaTeX 图片还原为 `$…$`**（irradiance caching part 1 一篇 37 条） |
| Castaño 博客正文 | ✅ WordPress REST API 的 `content.rendered` 全文；与站内 `/articles/` 独立长文页逐篇比对过词数 |
| Casey 系列正文 | ✅ 原文页全文（61.9k 词），行结构按站点标记用 DOM + 文本两路重建 |
| Casey 代码块 | ⚠️ 站点源码**没有** `<pre>`/`<code>`，代码行是短 `<div>` + 语法高亮 `<span>` + `<wbr>`，因此代码块边界只能靠启发式判定（行特征 + `/* */` 区间 + 相邻块合并）。共识别 214 个代码块，绝大多数为整段纯净代码；个别极短片段（如单独一行 `struct Foo;`）可能留在正文里 |
| 官方博客代码块 | ✅ 站点用标准 `<pre>`，完整还原 |
| 图片 | ✅ 保留原站绝对 URL（未下载到本地）；少数图片在原站已丢失，只剩 `[missing image]` 标记 |
| 日期/作者/分类 | ✅ 取自文章页的 `<time datetime>`、`rel="author"`、`rel="tag"`，非 RSS 字段 |
| 正文语言 | 英文原文；**译文在 `../data/witness/articles/`（201 篇全译）** |

### 重跑抓取

```powershell
# 依赖（仅 Casey 系列的 DOM 解析需要）
npm install node-html-parser --no-save

# —— 官方博客（RSS 窗口 2012-10 起）——
node archive/fetch-witness-pages.mjs   # 下载文章页 HTML（有缓存，可重跑）
node archive/scrape-witness-full.mjs   # 解析为 raw/witness-full.json

# —— 2010–2012 图形/引擎技术帖（RSS 窗口之外）——
powershell -ExecutionPolicy Bypass -File archive/crawl-witness-index.ps1   # 爬索引页收集 URL
powershell -ExecutionPolicy Bypass -File archive/fetch-witness-graphics.ps1 # 抓文章页（已存在则跳过）
node archive/build-witness-graphics.mjs  # → raw/witness-graphics.json + witness-graphics/*.md（含 LaTeX 还原）

# —— Ignacio Castaño 个人博客（全部 66 篇）——
node archive/fetch-castano.mjs         # 发现清单 → raw/castano/wp-posts.json
node archive/fetch-castano-full.mjs    # 逐篇拉 REST API 全文 → raw/castano/html/
node archive/fetch-castano-articles.mjs # 另拉站内 /articles/ 独立长文页做比对
node archive/build-castano-blog.mjs    # → raw/castano-blog.json + castano-blog/*.md

# —— Casey 系列 ——
node archive/scrape-casey.mjs          # 用 raw/ 缓存解析为 raw/casey-normalized.json
node archive/wrap-casey.mjs            # 为 Casey 文章包裹代码块（必须在上一步之后跑）

# —— 汇总 ——
node archive/build-archive.mjs         # 生成 Casey 与官方博客的 markdown
node archive/validate.mjs              # 校验：文件数 / 索引链接 / 代码栅栏配对 / 残留 HTML
node archive/verify-code-verbatim.mjs <article-id>   # 译文 code 字段 vs 源文围栏逐字比对
node archive/stats.mjs                 # 输出统计
```

> 抓取脚本都是**可重入**的：文件已存在就跳过（`.ps1` 系列），或按 id 命名后覆盖（`fetch-*-full.mjs`）。中途失败重跑不会重复下载。

脚本职责：

| 脚本 | 作用 |
|---|---|
| `fetch-witness-pages.mjs` | 从 RSS 取文章 URL，逐篇下载文章页 HTML 到 `raw/witness-pages/` |
| `scrape-witness-full.mjs` | 解析文章页 → 标题/作者/ISO 日期/分类 + 正文 markdown；`<pre>` 正常还原为代码块 |
| `crawl-witness-index.ps1` | 爬分类/作者/**月份**归档页，收集 RSS 窗口之外的帖子 URL（输出 `raw/witness-post-index.json`） |
| `fetch-witness-graphics.ps1` | 抓那批帖子的文章页（走 http，已存在则跳过） |
| `build-witness-graphics.mjs` | 文章页 → markdown，含 `recoverLatex()`（WordPress LaTeX 图片 → `$…$`）与归档 markdown 落盘 |
| `fetch-castano.mjs` | 通过 WP REST API 发现 ludicon 博客的全部文章 |
| `fetch-castano-full.mjs` | 逐篇拉 `content.rendered` 全文到 `raw/castano/html/` |
| `fetch-castano-articles.mjs` | 另拉站内 `/articles/` 独立长文页，与 API 版本比对词数/公式/子标题 |
| `build-castano-blog.mjs` | HTML → markdown；处理 `[caption]` 短代码、被包进 `<a>` 的 caption、嵌套链接残留 |
| `scrape-casey.mjs` | Casey 站点正文重建：先按 `byline → footer` 切出正文块，再做 DOM 行标记 + 文本级转换 |
| `wrap-casey.mjs` | Casey 文章的代码块识别（站点源码无 `<pre>`，靠行特征 + 注释区间 + 相邻块合并） |
| `build-archive.mjs` | 生成 `witness-official/` 与 `casey-muratori/` 下全部 markdown 及索引 |
| `verify-code-verbatim.mjs` | 把译文的 `code` 字段与源文围栏逐字比对（含空白差异诊断） |
| `audit-castano.mjs` | Castaño 归档自检：标题残留 HTML、围栏配对、嵌套链接、正文过短 |
| `probe-*.mjs` / `inspect-*.mjs` / `peek.mjs` | 排查用的一次性探针（发现清单结构、HTML 选择器、公式分布等） |

