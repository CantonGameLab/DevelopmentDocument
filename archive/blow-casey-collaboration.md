# Casey Muratori × Jonathan Blow：在《The Witness》上的合作

> 事实来源分三类，正文中逐条标注：
> - **【归档】**：本目录 `witness-official/` 的一手文章（已下载全文，可直接查证）
> - **【原文】**：Casey 博客 blog_0005–0023/0032 等一手原文（已抓取，见 `casey-muratori/`）
> - **【外部】**：归档之外、由网络研究核实过的资料（Wayback / Wikipedia / 播客等），并注明可信度

---

## 一句话结论

Casey Muratori 不是 Thekla 的员工，而是 Blow 请来的**"额外程序员"（extra programmer）**：他重写了**玩家移动/碰撞系统**、扩展了**世界编辑器**、并做了草地植被系统。前后跨度远超一般的"客串"——**2010 年** Blow 就找他请教 3D 建模与贴图，**2012 年**一起 playtest，**2012 年感恩节**正式动手写代码，**2015–2016 发售后**他仍在处理移动系统的 bug。游戏发售时他以 **"Additional contributions in programming by"** 被署名。

---

## 时间线（含早期关系）

| 时间 | 事件 | 来源 |
|---|---|---|
| **2010-11-05** | Blow 在《Experiments in Texturing》中写道："something like a year and a half ago, when I was starting to get serious about making The Witness, **I was talking to Casey Muratori about 3D modeling and texturing**"——并转述 Casey 关于"作品集被贴图毁掉"的洞见。此时是**咨询建议，不是写代码** | 【归档外的原始页已下载】`raw/witness-pages/2010-11-experiments-in-texturing.html` |
| **2012-02-24 / 02-26** | Blow 说周末要和 "Jeff and Casey of *Jeff and Casey Time*" playtest；随后更新："**Casey played through all the same playtest material … in 3 hours**"（对比另一人 6 小时） | `raw/witness-pages/2012-02-playtest-island-update.html` |
| **2012-10-14** | Blow 在《WM_TOUCH is totally bananas.》中直接引用 Casey 2008 年关于 Windows 输入的一篇笔记（链接指 mollyrocket 论坛，正文写作"Casey wrote about this in 2008"） | 【归档】`witness-official/by-year/2012-001-wm-touch-is-totally-bananas.md` |
| **2012 年感恩节** | **实际编码参与的起点**：两人坐下来过一遍"值得额外程序员处理"的代码清单，选定玩家移动代码 | 【原文】[blog_0005](https://caseymuratori.com/blog_0005) |
| 2012-12-12 | 《Mapping the Island's Walkable Surfaces》——官方博客上 Casey 署名的第一篇 | 【归档】 |
| 2012-12-17/18 | 《Finding and Fixing a Five Second Stall》（Casey 博客索引记 12-17，官方博客记 12-18） | 【归档】【原文】 |
| 2012-12-24 | 《A Cliffside Cliffhanger》 | 【归档】 |
| 2013-01-20 | 《How do you say "plane" in The Witness?》——**他在官方博客的最后一篇署名文章（共 4 篇）** | 【归档】 |
| 2014-04-16 | Blow 转发 "Working on The Witness, Part 5/6" | 【外部】 |
| 2014-05-02 → 07-23 | "Witness Wednesday" 每周连载：草地系统 → 编辑器 UI 压缩 → Lister Panel 全套（blog_0009–0023） | 【原文】 |
| 2014-05-23 / 05-28 | Blow 在官方博客转发 Interpolation 与"如何编程"两篇，并**首次给出系列名**："another **Witness Wednesday** post" | 【归档】 |
| **2015-08-05** | Thekla 成员 Orsi Spanyol 的《Bugs!》**明确使用并致谢他的工具**："Things like this were really difficult to find, **until Casey added some tools to visualize the collision**" | 【归档】`witness-official/by-year/2015-007-bugs.md` |
| 2016-01-26 | 游戏发售 | 【外部】 |
| **2016-02-15** | Casey 上传《The Witness - Boat Glitch Debugging》视频，自述担心移动代码的 bug——**发售后仍在维护** | 【外部】YouTube |
| 2018 | BIC Fest 演讲 + 文章《Killing the Walk Monster》，回顾移动系统 | 【原文】[blog_0032](https://caseymuratori.com/blog_0032) |
| 2021-03 | CoRecursive 播客 #062，他亲自回顾这段经历 | 【外部】转录 |

---

## 他具体做了什么

### 1. 玩家移动与碰撞系统（核心工作）

**【原文】blog_0005 / blog_0032**。为什么选这件事，Casey 讲得很清楚：移动系统一旦出问题，"沉浸感立刻破碎"，而且玩家可能被困住只能读旧存档——所以它对**玩家体验**的影响最大，而不是技术债最重。

- 写了 `walk_monster.cpp`（名字来自 Quake 早期报错"walkmonster in wall at…"）：**合成鼠标/键盘事件驱动一个自动漫游者**，走完整的真实输入路径去撞碰撞 bug。
- 路径搜索上先试了 Rapidly Exploring Random Tree，发现不适合二维流形，于是**改用自创的低维洪泛填充**；产出可行走面覆盖图，随即暴露出真实 bug（不该能走的斜坡、孤立的碰撞体）。
- 核心洞见：不能只考虑"距离"，还要考虑**方向性（directionality）**——能下坡不等于能上坡。
- 2018 年演讲称最终成果是 "real-time, precomputation-free, provably robust player movement"。

### 2. 世界编辑器（第二块主要工作）

- **相机与操纵器**：为美术加入 **Maya / 3DS Max 兼容的相机控制**（团队在 Maya 里建模），以及带三轴+平面手柄、undo、遮挡处理的平移操纵器。【原文】blog_0007
- **Lister Panel 重写**：原来只是 layer 列表，重写成支持类型过滤、特殊过滤器、层级显示、多选的通用实体列表面板，并公开了约 2000 行完整源码和 Q&A。【原文】blog_0017–0023
- **UI 系统改造**：在 Blow 的 GUI 代码库上新增 `Panel_Layout`、`bool_button()`，改造材质设置的存储方式。他特别说明这个 GUI 的来历：**【原文】blog_0023** — *"Jon wrote the GUI for the Witness editor. It is a very old GUI codebase written before Braid that Jon has used on a number of projects."*

### 3. Windows 平台问题

**【原文】blog_0006**：定位启动时约 5 秒卡死（期间无法 ALT-TAB 回调试器），根因是 `SetWindowsHookEx(WH_KEYBOARD_LL)` 与 `LowLevelHooksTimeout`，最终用未文档化的 `RIDEV_NOHOTKEYS` 解决。

### 4. 草地 / 植被系统

**【原文】blog_0009–0014**：植被散布、分布均匀性、噪点着色、交错同心求交。有意思的是他在自己的测试关卡 **CaseyTown** 里先做，成熟了才进正式岛屿。

### 5. Linux 初步移植

**【原文】blog_0008**：只有一句 "I did have some initial Linux porting work"，范围未说明。

### 6. 引擎几何约定排错

**【原文】blog_0008**：花了一整篇讲"The Witness 里 'plane' 这个词到底指什么"——因为团队成员对这个词的心智模型不同，导致了一个难以复现的 bug。

---

## 协作方式：一份"进入别人代码库"的样本

这是这批文章最有价值的副产物。Casey 反复强调他**刻意迁就 Blow 的约定**：

> "Typically, I use InterCaps for variable names and lowercase_with_underscores for types, but since I am in the Witness codebase, I try to adhere to its general conventions where possible…" — 【原文】[blog_0015](https://caseymuratori.com/blog_0015)

> "That is also why you see that unusual `Foreach` construct: it is how Jon writes his for loops. … I figure, since Jon et al has to maintain this code, using constructs familiar to him makes it a little easier, and that's always a good thing." — 【原文】[blog_0018](https://caseymuratori.com/blog_0018)

> "Working in someone else's codebase is much like moving to a foreign country that happens to use the same alphabet as you do, but not the same language." — 【原文】[blog_0007](https://caseymuratori.com/blog_0007)

他对 Blow 代码的评价**罕见地正面**——注意这不是客套，因为他同一批文章里正在痛批 OOP 和糟糕抽象：

> "The first thing I noticed here was that Jon, the original programmer, did a really nice job setting me up for success with what I was about to do. A lot of times, you open up some code for something simple like this, and you find that it is just a massive tangle of unnecessary structure and indirection. Here, instead, we find an extremely straightforward series of things happening… **This is exactly how programming should go.**" — 【原文】blog_0015

他批评的是**抽象层次**，不是人：

> "Before I started making Jon's UI system support more compression, it was extremely granular." — blog_0016
> "In the case of The Witness codebase, it actually has very few fundamental algorithm utilities, and so there isn't a notion of a 'set'." — blog_0020

### 双向反馈循环（有具体细节）

- Blow 给任务清单 → Casey 排优先级（blog_0005）
- Casey 做完功能后**默认开关设成 off** 交给 Blow 验证："I checked in the feature on a toggle switch that defaulted to 'off', and asked Jon to check it out when he got a chance."（blog_0007）
- Blow 回报问题："sometimes 'moving along the Z axis wasn't working'"（blog_0007）
- Casey 反过来从**报告的措辞**推断 bug 性质："the thing that didn't sit right with me … was that when Jon originally reported the problem to me, he didn't mention anything about it happening more on the outskirts of the island … **Jon's a very experienced programmer, so if something like that were happening, he would probably notice and include that in the report**"（blog_0008）
- 文章写完后给 Blow 过目，Blow 的原话被直接引用进文章：*"If you are thinking of the plane as a geometric object, of course the normal is unit length, what else would it be??"*（blog_0008）

---

## 命名与署名

**"Witness Wednesday" 这个名字**：Casey 自己用过（【原文】blog_0014："speaking of **Witness Wednesdays**, now that I've finished the series on grass…"），Blow 在官方博客转发时也这么叫（【归档】2014-05-28："another **Witness Wednesday** post"）。

**游戏内的署名**：MobyGames 记录 *The Witness (2016, Windows)* 中 Casey 的角色为 **"Additional contributions in programming by"**。【外部】原站被 Cloudflare 拦截，改用 Wayback 存档核实。

> ⚠️ 注意口径差异：英文 Wikipedia 的《The Witness》条目**信息框**程序员栏只列 Blow、Ignacio Castaño、Salvador Bel Murciano、Andrew Smith，未列 Casey——这与 MobyGames 的"额外贡献"署名并不矛盾（信息框通常只列核心成员），但说明不同来源口径不同。

---

## 方法论上的意义

2014 年 5–7 月的 15 篇连载，实质是 Casey **"compression-oriented programming" 的公开教学**，而"compression-oriented programming"这个术语就出自这里：

> "So what does **compression-oriented programming** look like, and why is it efficient?" / "make your code usable before you try to make it reusable" — 【原文】blog_0015

> "To start things off, I am going to detail a straightforward set of code transformations that I did on The Witness's editor code. … Nothing that I'm going to cover has any fancy algorithms or math or anything, it's all just pure plumbing." — blog_0015

特别之处在于：他不是拿玩具例子讲道理，而是拿一个**真实商业项目、而且是别人写的核心代码**做案例，还附上完整源码（blog_0022，约 2000 行）与公开 Q&A（blog_0023）。这是这批文章在游戏程序圈被反复引用的原因。

---

## 明确不成立的传闻（避免以讹传讹）

| 说法 | 核查结果 |
|---|---|
| 他参与过 Blow 的 **Jai** 语言 | ❌ **无任何证据**。可证实的只有**反向影响**：Casey 说自己是因为看 Blow 在 Twitch 上讲 Jai，才萌生做 Handmade Hero 直播的念头。官方博客《Testing the Jai Compiler》(2018-03-14) 作者是 Abner Coimbre，不是 Casey |
| 他参与了 Blow 的 2026 年新作 *Order of the Sinking Star* | ❌ 相关报道（署名争议等）**未提及 Casey**，无任何来源 |
| Braid 周年纪念版播客（2024）里他谈了《The Witness》 | ❌ 四集访谈（04-26、05-03、05-17、06-07）主题是 ***Braid*** 的开发史，节目简介完全未提《The Witness》 |
| 他是 Thekla 的员工 / 受薪 / 全职 / 外包 | ❓ **完全无据**。Casey 自述是朋友间"help out"，Blow 称其为 "extra programmer"，但雇佣性质没有任何来源，请勿推断 |
| 他在 2014-07 之后就不再参与 | ❌ 不成立。2015-08 官方博客确认团队在用他的碰撞可视化工具；2016-02（发售后）他仍在调试移动代码 bug |
| 他何时完全离开项目 | ❓ 无明确记载。Wikipedia 写"约 2012 至 2016"，依据薄弱 |

---

## 参考链接

- [Casey 博客目录](https://caseymuratori.com/contents) — 全部 Witness 文章索引（blog_0005–0023、blog_0032）
- [Walk Monster（2012-12-12）](https://caseymuratori.com/blog_0005) — 参与起点与合作缘起的第一手陈述
- [Killing the Walk Monster（2018）](https://caseymuratori.com/blog_0032) — BIC Fest 2018 演讲，移动系统总览
- [Semantic Compression（2014-05-28）](https://caseymuratori.com/blog_0015) — 对 Blow 代码的评价 + "compression-oriented programming" 术语出处
- [Lister Panel Q&A（2014-07-23）](https://caseymuratori.com/blog_0023) — 编辑器 GUI 的来历与代码风格融合
- [Witness Wednesday on How to Program（2014-05-28）](http://the-witness.net/news/2014/05/witness-wednesday-on-how-to-program/) — Blow 的评价：*"Casey's advice here is right on"*（【归档】）
- [Bugs!（2015-08-05）](http://the-witness.net/news/2015/08/bugs/) — 团队确认其碰撞可视化工具已投入使用（【归档】）
- [Experiments in Texturing（2010-11-05）](http://the-witness.net/news/2010/11/experiments-in-texturing/) — 最早的 Casey 提及：3D 建模/贴图咨询
- [Playtest Island Update（2012-02）](http://the-witness.net/news/2012/02/playtest-island-update/) — 一起 playtest
- [MobyGames 署名（Wayback 存档）](https://web.archive.org/web/20241218114840/https://www.mobygames.com/person/58691/casey-muratori/) — "Additional contributions in programming by"
- [CoRecursive #062 转录（Wayback）](https://web.archive.org/web/20241130182505/https://corecursive.com/062-game-programming/) — Casey 自述 "Witness Wednesdays" 与碰撞工作
- [Wikipedia: Casey Muratori](https://en.wikipedia.org/wiki/Casey_Muratori) / [The Witness](https://en.wikipedia.org/wiki/The_Witness_(2016_video_game)) — 二手概述
