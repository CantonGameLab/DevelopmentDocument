# 如何接入一套新文档（框架使用说明）

这套东西分两层：**引擎**（不认识任何具体内容）和**站点**（一套文档的全部配置与数据）。加一套新文档 = 加一个站点定义 + 按契约生成数据，**不需要改引擎代码**。

---

## 一、目录约定

```
你选定的数据根/                 ← 可以是 data，也可以是别的仓库
  sites.json                   ← 站点清单（引擎读它决定加载什么）
  data/
    <siteId>/
      manifest.json            ← 文章清单：章节 + 文章 + 状态
      articles/<id>.json       ← 每篇译文（中英对照块）
```

引擎文件（`index.html` / `app.js` / `style.css`）与站点数据是分离的：引擎只通过 HTTP 读 `site.json`、`data/<siteId>/*`，不假设任何路径。

---

## 二、站点定义

在 `sites.json` 里加一项：

```jsonc
{
  "defaultSite": "witness",
  "sites": {
    "mydocs": {
      "label": "我的文档",                    // 中文名，也用作顶栏品牌
      "labelEn": "My Docs",
      "langs": ["zh", "en"],                  // 界面支持的语言（目前 zh/en 必填）
      "defaultLang": "bi",                    // bi = 中英对照 / zh / en

      "dataDir": "data/mydocs",                      // 相对**本站点根目录**（不是工作区）
      "stripPrefix": "my-corpus/",            // 源文路径里要去掉的前缀（可选）
      "archivePrefix": "/readalong/src/mydocs/", // 服务托管的源文路由（可选）

      "showProgress": true,                   // 是否显示「已翻译 N/M」进度条
      "accent": "#2f6f8f",                    // 主题强调色

      "title":   { "zh": "我的文档学习手册", "en": "My Docs study guide" },
      "intro":   { "zh": "首页导语……", "en": "Landing copy…" },
      "askPrefix": { "zh": "我在读……想就下面这段提问。", "en": "I'm reading…" },

      "labels": {                             // 界面文案，可只给中文
        "zh": { "articles": "篇文章", "words": "英文词数", "chapters": "主题章节",
                "translated": "已翻译", "core": "核心长文", "read": "标记为已读",
                "copyCtx": "复制本篇上下文", "backHome": "首页", "sourceLink": "原文" },
        "en": { "articles": "articles", "words": "English words", "chapters": "chapters",
                "translated": "translated", "core": "long reads", "read": "Mark as read",
                "copyCtx": "Copy this article's context", "backHome": "Home", "sourceLink": "Source" }
      }
    }
  }
}
```

访问方式：默认站点直接开 `/readalong/`；指定站点加 `?site=mydocs`。

---

## 三、数据契约

### manifest.json

```jsonc
{
  "generatedAt": "…",
  "corpus": { "articles": 115, "words": 80533, "stubs": 56, "coreArticles": 22 },
  "chapters": [
    { "key": "movement", "zh": "一 · 玩家移动与碰撞", "en": "Movement & collision",
      "desc": "章节说明", "articles": ["casey-0005", "casey-0006"] }
  ],
  "articles": [
    { "id": "casey-0005",
      "source": "casey",                       // 自由标签，用于统计/筛选
      "title": { "en": "Walk Monster", "zh": "行走怪物" },
      "date": "2012-12-12", "author": "Casey Muratori", "url": "https://…",
      "words": 4088,
      "chapter": "movement",
      "mdPath": "archive/casey-muratori/2012-12-12-0005-walk-monster.md",
      "status": "done" }                       // done = 有译文；其余回退显示 mdPath 源文
  ]
}
```

### articles/<id>.json

见 `schema.md`。核心是 `blocks` 数组，逐段中英配对：

```jsonc
{
  "id": "casey-0005",
  "title": { "zh": "行走怪物", "en": "Walk Monster" },
  "subtitle": { "zh": "…", "en": "…" },
  "blocks": [
    { "type": "h2",      "id": "walkmonster", "zh": "…", "en": "…" },
    { "type": "p",       "en": "原文整段", "zh": "译文整段" },
    { "type": "list",    "items": [{ "en": "…", "zh": "…" }] },
    { "type": "quote",   "en": "…", "zh": "…", "noteZh": "补充说明" },
    { "type": "callout", "kind": "insight|warning", "en": "…", "zh": "…" },
    { "type": "code",    "lang": "cpp", "captionZh": "…", "captionEn": "…", "code": "原样英文代码" }
  ]
}
```

**引擎对内容的全部假设就这些**。它不认识「The Witness」「Casey」，也不知道什么是博客。

---

## 四、加一套新文档的完整流程

### 1. 准备源文
把原始文档抓成 markdown，放在某个目录（例如 `my-corpus/`）。**不需要**先做任何格式化——归档层的瑕疵可以在翻译时声明。

### 2. 生成清单
复制一份 `<脚本名>` 改写，产出：
- `data/<siteId>/manifest.json`（章节划分 + `mdPath` + `status`）

章节划分是这套东西的灵魂：**不要按时间流水账**，按学习路径重组（前提 → 核心机制 → 应用 → 复盘）。`build-manifest.mjs` 里的 `RULES` 就是干这个的。

### 3. 建立术语表
复制 `GLOSSARY.md`，改术语表和目标读者。这一步不能省——**多批次并行翻译时，术语表是唯一的一致性来源**。

### 4. 分批翻译
按章节分批（每批 4–10 篇或 3000–6000 词），每批一个独立 agent，指令里必须包含：
- 先读 `GLOSSARY.md`、`schema.md`，以及**一篇已完成的样例**作为风格基准
- 逐段对齐、代码原样、不加原文没有的内容
- 收尾必须跑校验器并报告结果

### 5. 过闸门
```powershell
node <脚本名> --all   # schema / 配对 / 术语 / 标点
node <脚本名>             # 清单路径 vs 归档文件实际内容
node <脚本名> --all     # 源文单元是否都有对应
```
保真核验会报「漂移」——**它报的不一定是错**（图片占位、格式噪音、已声明的修复都是正常漂移）。关键是每一条都能说出理由。

### 6. 在 sites.json 里注册
加一个站点条目，指向新的 `dataDir`。之后 `/readalong/?site=<id>` 就能读。

---

## 五、扩展点

| 想做什么 | 改哪里 |
|---|---|
| 支持第三种语言 | `blocks` 里加 `ja` 字段；引擎的 `state.lang` 与 `BLOCK` 渲染器各加一处分支 |
| 换版式（如改成上下堆叠） | 只改 `style.css` 的 `.pair` 规则；DOM 结构不用动 |
| 加「术语高亮」「生词本」 | `app.js` 的 `BLOCK.p` 里对 `zh` 做后处理；数据层不用变 |
| 加新的块类型（如表格、图注） | `BLOCK` 表加一个渲染器 + `schema.md` 记一条 |
| 让 agent 能主动读原文 | 源文已由服务托管在 `/readalong/src/<site>/…`，把路径告诉 agent 即可 |
| 支持 PDF / EPUB 源 | 在第 1 步的抓取脚本里加转换，后续流程完全一样 |

---

## 六、运维注意（踩过的坑）

1. **派发翻译批次必须从 manifest 现算待译列表**，不要复用旧快照——我因此派出过两个空跑批次；`check-dispatch.mjs` 就是为此写的，它还抓到过一次 11 篇的漏派。
2. **多个进程会同时写 manifest.json**（每个校验器跑 `--all` 都会同步状态）。写入必须是原子的（临时文件 + 改名），并且**临时文件名要带 pid**——共用同一个 `.tmp` 名字会互相踩。见 `test-concurrent.mjs`。
3. **校验器的规则要留白名单**：半角标点检查会误伤 `1,119`、`[-1,1]`、`acquire_*(owner, name)` 这类合法写法。每加一条规则，先想清楚它的假阳性长什么样。
4. **归档层的瑕疵不要回改译文**：源文围栏错乱、多余反引号这类问题，让译者在 `translator.note` 里声明，比回头改数据便宜。

---

## 七、从一个来源扩到四个来源（实战记录）

这套框架原本只吃两个来源（Casey 系列 + 官方博客 RSS）。后来加了 the-witness.net 的 2010–2012 技术帖和 Ignacio Castaño 的个人博客，变成四个来源 196 篇。**引擎一行没改**，改的全是归档层与清单层。下面是这轮扩来源踩到的坑，按「下次还会遇到」的顺序排：

### 1. RSS 全文 feed 的窗口是有限的，而且是静默的

the-witness.net 的 `/news/feed/` 只回溯到 2012-10。也就是说**这堆文章里最核心的几篇**（hemicube 最终采集、irradiance caching part 1）压根不在 feed 里，而 feed 本身不会告诉你它漏了什么。

**做法**：不要只信 feed。用**索引页**兜底——分类归档（`/news/category/engine-tech/page/N/`）、作者归档（`/news/author/castano/`）、**月份归档**（`/news/2010/03/`）。月份归档是覆盖率的保险丝：把目标时间段的每个月都拉一遍，收集到的 URL 求并集，再和 feed 里的做差集。这一步在 `crawl-witness-index.ps1` 里。

### 2. 站点的 HTTPS 可能坏着，HTTP 却是好的

`the-witness.net` 的 TLS 握手报 `packet length too long`，Node 的 `https` 和 PowerShell 的 `Invoke-WebRequest` 走 HTTPS 全部失败——但走 `http://` 完全正常。

**做法**：抓取脚本把协议当参数，失败就降到 HTTP。同时在报告里写清楚用了哪个协议，否则以后复跑的人会以为是脚本坏了。

### 3. 同一个人会把同一篇文章发两遍，标题一模一样

Ignacio 的习惯是：正文发在 the-witness.net，然后在自己博客上发一条 42 词的公告贴，**标题完全相同**。GUID 不同、URL 不同、日期可能相同。

**做法**：清单层做去重，但**键要带站点**，而且只折叠「个人博客 ↔ 官方博客」这一对。因为官方站自己也有同题不同文的两篇（Blow 的 39 词公告 vs Ignacio 的 680 词正文），一刀切会误杀。去重时保留正文最长的那份，其余记进 `crossPostedAs` 字段，信息不丢。

### 4. 公式可能是图片，但源码藏在 URL 里

WordPress 的 LaTeX 插件把公式渲染成 `<img src="…/latex.php?latex=E%28%5Cmathbf%7Bx%7D%29…">`。归档一层不管它的话，译文里会满屏都是 `![E(\mathbf{x})](https://s0.wp.com/latex.php…)`——**译者没法翻，读者没法读**。

**做法**：从图片 URL 的 query 参数里把 LaTeX 源码解出来，还原成 `$…$` 行内公式（`build-witness-graphics.mjs` 的 `recoverLatex()`）。一篇里就还原了 37 条。解码时注意 alt 属性里的 `\\` 转义和 URL 参数里的原始串不一致，两个都归一化一遍。

**阅读器那边**：`vendor/katex/` 是本地自带的 KaTeX（不走 CDN，断网也能读）。`app.js` 的 `inline()` 必须**先把 `$…$` 抠出来换成占位符**，再跑其余的行内规则——否则公式里的 `**`、`_`、`[` 会被当成强调、下标、链接语法吃掉。`<脚本名>` 就是钉这个的（10 条断言）。

### 5. WordPress 的 `[caption]` 短代码会被包进 `<a>` 里

于是通用的 `<a>` 转 markdown 规则会产出 `[caption …]([caption …])` 这种垃圾。

**做法**：在跑通用规则**之前**先把 `<a>` 包着的 `[caption]` 剥出来单独处理。顺序错了就白干——这类转换器的规则顺序比规则本身重要。

### 6. 章节划分表要允许「写死」

`RULES` 是正则表，靠标题猜章节。来源一多就会互相干扰：`Lightmap optimizations for iOS` 既匹配 `lightmap`（光照）又匹配 `ios`（平台），谁赢取决于表的顺序，而顺序一改就会静默挪动别的文章。

**做法**：`CHAPTER_OVERRIDE` 写死 id → chapter 的映射，正则表只负责兜底。**改完全量跑一次 `audit-chapters.mjs`**（查重复 id / 孤儿文章 / 未知章节键），它能立刻告诉你有没有文章掉出所有章节。

### 7. 非翻译的「导览篇」怎么塞进这套结构

光照系统那 20 多篇散在三个来源、跨越十二年，按发表顺序读是灾难。于是加了一篇**编者导览**（`start-here-lighting`），它没有归档源文。

**做法**：给它 `source: 'guide'` 和 `isGuide: true`，挂进 `intro` 章节，然后在两个闸门里按这个标记跳过（`verify-paths.mjs` 跳过路径核验、`fidelity-check.mjs` 跳过保真核验）——**没有源文就没法核验，硬跑只会产出一堆假错误**。`build-manifest.mjs` 里也要放过它的空 `mdPath` 警告。

### 8. 抓取脚本要能复跑，不许重复下载

所有抓取脚本都是「文件已存在就跳过」（`fetch-witness-graphics.ps1`）或「按 id 命名后覆盖」（`fetch-castano-full.mjs`）。中途失败重跑时，前者省时间，后者保证内容是最新的。**别写成一个既不确定又不可重入的脚本**——这类抓取一定会中途失败一两次。
