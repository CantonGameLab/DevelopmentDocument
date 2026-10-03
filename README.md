# 《The Witness》技术文档 · 中英对照学习手册

> 四份英文技术写作的全文归档 + 逐段中英对照译文，共 **201 篇 / 173,005 词**，全部译完。
> 前三个章节是一条**光照系统专线**：从「为什么全部光照都预计算」，到光照贴图参数化、hemicube 最终采集、辐照度缓存与梯度推导，再到压缩、iOS 移植与阴影贴图。

**没有依赖、不需要联网、不需要 `npm install`。**

---

## 怎么读

**Windows**：双击 `打开文档阅读器.cmd`。

**任何平台**：

```bash
node serve.mjs
```

它会打印一个地址（默认 <http://127.0.0.1:5179/readalong/>，端口被占用会自动往后试），用浏览器打开即可。关掉终端就停止服务。

| 操作 | 说明 |
|---|---|
| 左侧栏 | 13 个章节，点章节展开 → 点标题打开文章 |
| 右上角 | 切 **中文 / English / 中英对照** |
| 快捷键 | `1` `2` `3` 切语言 · `j` `k` 下/上一篇 · `?` 帮助 · `Esc` 关弹窗 |

> 阅读器是纯静态的，`vendor/katex/` 随库自带（公式排版不走 CDN）。`serve.mjs` 会自己找到所在目录，在哪里敲命令都行。
> 想直接用静态服务器托管也可以（`python -m http.server` 之类）——但要注意路由前缀是 `/readalong/`。

---

## 想搞懂《The Witness》的光照系统

**首页第一篇就是导览**《先读这篇：〈The Witness〉的光照系统是怎么搭起来的》，它把散在四个来源、跨越十二年的二十多篇串成了一条线：

```
一 · 光照系统：为什么是预计算          3 篇
 ├─ Graphics Tech: Precomputed Lighting      Jon 定方向：目标硬件做不了实时 GI
 ├─ Graphics Tech: Lighting Comparison       几种方案横向比
 └─ Lightmap Parameterization                Castaño：网格切图块 → 参数化 → 排布进图集

二 · 光照系统：辐照度缓存              6 篇
 ├─ Hemicube Rendering and Integration       最终采集：半立方体渲染与积分
 ├─ Irradiance Caching – Part 1              核心：梯度推导扩展到 hemicube 采样分布
 ├─ Irradiance Caching – Continued           收尾：用梯度的二阶差控制记录密度
 └─（三篇 Castaño 自己博客上的公告贴，指向上面几篇正文）

三 · 光照系统：压缩、平台与阴影        7 篇
 ├─ Graphics Tech: Shadow Maps (part 1 / 2)  直接光走阴影贴图 + 省 25% 显存
 ├─ Graphics Tech: Multi-lightmaps
 ├─ Shadow Mapping Summary – Part 1          多年后复盘实际出货的做法
 ├─ Lightmap Compression in The Witness      RGBM、颜色分布、编码器评价方法
 └─ Lightmap optimizations for iOS           移植 iOS：格式选择与解码开销
```

一句话概括：**《The Witness》全岛光照都是离线烘的**——几何切图块做参数化、半立方体做最终采集、辐照度缓存把昂贵的积分降到只在需要的地方算、梯度估算让插值好到能出货、RGBM 把它压到能进显存并跑到 iOS。运行时只做采样。

---

## 内容规模

| | |
|---|---|
| 文章 | **201 篇全译**（含编者导览 1 篇） |
| 英文原文 | 173,005 词 |
| 中文 | 375,835 字 |
| 对照块 | 4,960（段落 4,151 / 小标题 349 / 列表 88 / 引用 14 / 提示框 53） |
| 代码块 | 305（4,794 行，一律保留英文原文） |
| 配图位 | 588 |
| 行内公式 | 40 条（KaTeX 本地排版） |

## 语料来源

| 来源 | 内容 | 篇数 |
|---|---|---|
| Thekla 官方开发博客 | [the-witness.net](http://the-witness.net/news/) 2012–2022，RSS 全文 | 96 |
| 同上，2010–2012 技术帖 | 图形 / 引擎技术帖，**在 RSS 窗口之外**，靠索引页 + 月份归档补抓 | 19 |
| Casey Muratori | [caseymuratori.com](https://caseymuratori.com/contents) 的「Witness Wednesday」系列 | 19 |
| Ignacio Castaño | [ludicon.com/castano/blog](https://www.ludicon.com/castano/blog/) **全部文章**，2008–2026 | 66 |
| 编者导览 | 本仓库作者写的阅读顺序说明 | 1 |

### 13 个章节

| 章节 | 篇数 | 内容 |
|---|---|---|
| 开始：这些人是谁 | 1 | 导览：谁做了哪一部分，光照该按什么顺序读 |
| 一 · 光照系统：为什么是预计算 | 3 | Blow 定方向 + Castaño 的光照贴图参数化 |
| 二 · 光照系统：辐照度缓存 | 6 | GI 三部曲：hemicube、梯度推导、记录分布 |
| 三 · 光照系统：压缩、平台与阴影 | 7 | 阴影贴图、多光照贴图、RGBM、iOS |
| 四 · 玩家移动与碰撞 | 4 | Walk Monster 系列 |
| 五 · 渲染管线与显存 | 11 | HLSLParser、立方体贴图、色彩分级、水体、kriging |
| 六 · 草地与植被 | 4 | 散布、分布均匀性、噪点着色 |
| 七 · 编辑器与代码手艺 | 10 | 压缩导向编程 + 真实代码库重构全记录 |
| 八 · 美术与设计减法 | 10 | 艺术总监怎么把一座岛「减」到只剩必要的 |
| 九 · 上市与复盘 | 25 | 里程碑、音乐取舍、销售与售后 |
| 十 · Castaño：纹理压缩与编码 | 24 | BC1/ASTC/ETC、GPU 编解码工具、spark.js |
| 十一 · Castaño：曲面、采样与其他 | 37 | 细分曲面、水密采样等非光照主题 |
| 附录 · 开发日志快照 | 59 | 以截图/视频为主的短贴 |

---

## 目录结构

```
.
├── 打开文档阅读器.cmd                 双击即开（Windows）
├── index.html / style.css / app.js   阅读器本体
├── serve.mjs                         本地静态服务（读文档只需要这一个）
├── paths.mjs                         路径约定：脚本一律以本目录为仓库根
├── data/witness/
│   ├── manifest.json                 全站清单：201 篇 + 13 章 + 状态
│   └── articles/<id>.json            201 篇译文（中英逐段对照）
├── vendor/katex/                     本地自带的公式排版库
├── archive/                          英文原文归档 + 抓取脚本（见下）
├── README.md                         本文件
├── GLOSSARY.md                       术语表与翻译风格规则（强制）
├── schema.md                         文章 JSON 格式（含图片口径）
├── TRANSLATION-BRIEF.md              派发翻译批次时给 agent 的任务简报
├── EXTENDING.md                      怎么用这套框架接一套新文档
├── DSH-PLUGIN-NOTES.md               （历史）当初的伴读插件笔记，插件已删
├── LICENSE / .gitignore / .gitattributes
└── 质检脚本
    ├── validate-article.mjs          闸门①：schema / 段落配对 / 术语 / 标点
    ├── verify-paths.mjs              闸门②：归档路径 vs 文件内嵌日期
    ├── fidelity-check.mjs            闸门③：源文单元是否都有对应内容
    ├── test-concurrent.mjs           闸门④：并发写入安全
    ├── test-inline-math.mjs          行内公式渲染（10 条断言）
    ├── build-manifest.mjs            从四份归档重建清单
    ├── corpus-stats.mjs              语料统计（可 --by-chapter）
    ├── normalize-image-forms.mjs     图片标记归一化
    ├── audit-chapters.mjs / audit-orphans.mjs / audit-math.mjs
    ├── vendor-katex.mjs              重新下载 KaTeX 到 vendor/
    └── pending-report.mjs / list-chapter.mjs / check-dispatch.mjs
```

> **路径是 cwd 无关的**：所有脚本通过 `paths.mjs` 从自身位置推导仓库根，在哪个目录敲 `node` 都一样（试过从 `archive/` 子目录跑，正常）。站点数据固定放在 `data/<siteId>/`，将来加第二套文档时用 `WITNESS_SITE=<id> node …` 切换。

```
archive/
├── witness-official/by-year/   96 篇官方博客 markdown
├── witness-graphics/           19 篇 2010–2012 技术帖 markdown
├── casey-muratori/             19 篇 Casey 系列 markdown
├── castano-blog/               66 篇 Castaño 博客 markdown
├── raw/                        抓取缓存：原始 HTML / API 响应 / 中间 JSON
└── *.mjs / *.ps1               抓取与解析脚本（可重跑，已存在则跳过）
```

---

## 质量闸门（四条，均可复跑）

```bash
node validate-article.mjs --all   # ✅ 201 篇零错误零警告
node verify-paths.mjs             # ✅ 200/200 路径匹配（跳过 1 篇编者导览）
node fidelity-check.mjs --all     # 5,862 个源文单元，8 个未覆盖（全部已解释）
node test-concurrent.mjs          # ✅ 6 进程并发，无损坏、无残留、id 无重复
node test-inline-math.mjs         # ✅ 10/10 行内公式断言
```

`fidelity-check` 报出的 8 个未覆盖单元全部有据可查：3 条是 PSX 篇的 WordPress 图集控件（页面部件非正文）、2 条是归档代码围栏的边界修复、2 条是空加粗行 `****`（无内容）、1 条是 `[missing picture]` 标记（图片在原站就已丢失）。

这套闸门有实际战果：抓出过一处真实遗漏（PS4 Pro 那篇漏了一整段引导语）、全库级的归档映射错位（22 条）、一轮静默丢失（`Metal Lossy Compression Format` 里被归档压平成单行的 11 个块，靠原始 HTML 全量 diff 补回），以及一次**跨站去重键漏了日期、吃掉 5 篇同题文章**（`Island Snapshot` 系列）。

**校验器的假阳性也要治**：`$…$` 行内公式里的半角逗号、区间记法 `[0, 16]`、刻意保留英文的引用块——这三类都曾刷出成片假警告，现在都在判定里剥掉或放行了。规则要留白名单，但白名单本身也要写清楚为什么。

---

## 翻译流水线

```
archive/ 英文原文
   ↓  GLOSSARY.md（术语与风格）+ schema.md（格式）+ TRANSLATION-BRIEF.md（任务简报）
   ↓  分批并行翻译（每批 3–13 篇，一批一个 agent）
   ↓  每批自检：validate-article + fidelity-check
data/witness/articles/<id>.json
   ↓  build-manifest.mjs 汇总
data/witness/manifest.json → 阅读器（serve.mjs）
```

硬约束：一段英文对一段中文（不合并、不拆分）；代码逐字保留英文、注释也不译；公式与变量名原样；术语按 `GLOSSARY.md` 统一；不加原文没有的内容（需要背景就写进 `noteZh`）。

**运维纪律**（都写进脚本注释了，以后拿这套框架做别的文档也用得上）：

1. **派发批次必须从 manifest 现算待译列表**，不要复用旧快照——曾因此派出两个空跑批次；`check-dispatch.mjs` 就是为此写的，它还抓到过一次 11 篇的漏派。
2. **多进程会同时写 `manifest.json`**（每个校验器跑 `--all` 都会同步状态）。写入必须原子（临时文件 + 改名），且临时文件名要带 pid——共用同一个 `.tmp` 名字会互相踩。见 `test-concurrent.mjs`。
3. **校验器的规则要留白名单**：半角标点检查会误伤 `1,119`、`[-1,1]`、`acquire_*(owner, name)` 这类合法写法。每加一条规则，先想清楚它的假阳性长什么样。
4. **归档层的瑕疵不要回改译文**：源文围栏错乱、多余反引号这类问题，让译者在 `translator.note` 里声明，比回头改数据便宜。
5. **并发派发之前先划清文件边界**：这次有两个 agent 撞到同一批文章、互相覆盖过，其中一次落盘的是非法 JSON。批次之间必须是**不相交的 id 集合**，而且动手写之前先确认目标文件不属于别人。

---

## 抓取上的三个坑（都踩过，脚本里已修）

1. **RSS 全文 feed 的窗口是有限的，而且是静默的。** the-witness.net 的 feed 只回溯到 2012-10，而光照系统最核心的几篇（hemicube、irradiance caching part 1）发在 2010–2011。只信 feed 会整段漏掉。补法：爬分类归档 + 作者归档 + **月份归档**，把 URL 求并集再和 feed 做差集。
2. **站点的 HTTPS 可能坏着，HTTP 却是好的。** the-witness.net 的 TLS 握手报 `packet length too long`，Node 的 `https` 与 PowerShell 的 `Invoke-WebRequest` 走 HTTPS 全失败——走 `http://` 反而正常。
3. **WordPress 把 LaTeX 公式渲染成图片**，公式源码就藏在图片 URL 的 query 里。归档脚本会把它还原成 `$…$` 行内公式（irradiance caching part 1 一篇就 37 条），否则译文里满屏都是 `![E(\mathbf{x})](https://s0.wp.com/latex.php…)` 这种噪音。

---

## 怎么用这套框架接一套新文档

见 [`EXTENDING.md`](EXTENDING.md)。引擎（`index.html` / `app.js` / `style.css`）不认识任何具体内容，只读 `sites.json` 与 `data/<siteId>/*`；加一套新文档 = 在 `sites.json` 里加一个站点定义 + 按契约生成数据，**不需要改引擎代码**。

---

## 版权与来源

这里收录的**英文原文版权属于原作者**——Jonathan Blow / Thekla, Inc.（the-witness.net）、Casey Muratori（caseymuratori.com）、Ignacio Castaño（ludicon.com）。这是一个**个人学习用途的非官方整理**，不代表上述任何一方，也没有得到他们的授权或背书。

- 英文原文均**注明出处链接**，归档时未做删改（图片保留原站 URL，没有转存）；
- 译文、章节划分、导览、工具脚本是本仓库作者自己写的；
- 如果原作者或权利人要求移除某部分内容，删掉对应文件即可，不影响其它部分；
- 引用、转载、二次使用请**回到原文站点**并遵守其条款。

## 已知限制

- **图片是占位不是图床**：译文里是 `![图](原站URL)`，指向原始站点的图片，没有下载到本地，断网时看不到图。少数图片（约 20 处，集中在 Castaño 早期文章）在原站就已丢失，归档里只剩 `[missing image]` 标记。
- **公式由本地 KaTeX 排版**：`vendor/katex/` 随库分发。若该目录被删，公式退化成显示 LaTeX 源码，不会丢内容。
- **Castaño 博客里有约 10 篇个人生活贴**（骑行、露营、做饭等）也一并收录在第 11 章——保留是因为「全部 66 篇」比「挑技术贴」更容易核对完整性。
- **读者评论区不译**：有几篇源文正文后带着 WordPress 评论区，全站口径是只译正文，`fidelity-check` 会自动在那里截断。
- **归档的代码围栏在极少数篇目有瑕疵**（Casey 系列站点没有 `<pre>`，代码边界靠启发式判定）；译文里已按原文网页核对重组，并在各篇 `translator.note` 声明。
