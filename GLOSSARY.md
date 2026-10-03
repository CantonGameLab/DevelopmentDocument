# 翻译风格指南与术语表

本文件是这套《The Witness》技术文档中译的**唯一术语与风格基准**。所有翻译（人工或 agent 批量）必须遵守，以保证全部文章读起来像同一个人写的。

语料现在有四个来源，语气基准略有差别，但术语表统一：

| 来源 | 内容 | 语气 |
|---|---|---|
| `casey-muratori/` | Casey 的 Witness Wednesday 系列 | 口语、直率、爱吐槽 |
| `witness-official/` | the-witness.net 官方开发博客（RSS 全文，2012-10 起） | 混合：Jon 的随笔 + Ignacio 的技术长文 |
| `witness-graphics/` | the-witness.net 2010–2012 图形/引擎技术帖 | 学术味更重，公式与算法描述多 |
| `castano-blog/` | Ignacio 个人博客 ludicon.com/castano/blog 全部 66 篇 | 技术写作，常有论文引用与实验结果 |

**技术长文（Ignacio 的 GI 三部曲、光照贴图压缩等）的额外要求**：

- 术语按下面的表统一，**第一次出现**时给出英文原词，如「辐照度缓存（irradiance caching）」；
- 论文名、算法名、格式名（BC1/ASTC/ETC/LSCM…）一律保留英文；
- 公式与变量名（`E`、`n`、`ρ`、`ω`）原样保留，不要翻译成中文符号；
- 数学推导要译得能读懂，但**不要**自行补推导步骤——原文没有的不要加。

---

## 一、目标读者与语气

- **读者**：懂编程、想了解一个真实商业游戏项目怎么做出来的中文读者。可以是学生、独立开发者、或同行工程师。
- **语气**：**技术博客的平实语气**，不是论文、不是营销文案。原文里 Casey 和 Blow 都是直率、口语化、偶尔刻薄的工程师腔，**要保留这种个性**，不要翻译成四平八稳的教科书腔。
- 原文的自嘲、吐槽、括号插话都要保留。Casey 说 "Unfortunately, this is a lie." 就该译成「可惜，这是假的。」而不是「此说法并不准确。」

## 二、硬性规则

| 规则 | 说明 |
|---|---|
| **逐段对应** | 译文以**段落**为单位与英文对齐（见 `schema.md` 的 blocks 结构）。一段英文 → 一段中文，不要合并或拆分段落。 |
| **不增不删** | 不加原文没有的解释、总结、评价。需要补充背景时，写进 `noteZh` 字段，不要混入译文正文。 |
| **代码原样** | `code` 字段一律保留英文原文，**不翻译、不加中文注释**。代码里的注释也保持英文。 |
| **专有名词** | 人名、游戏名、公司名、产品名保留英文（见下）。 |
| **数字与单位** | 保持原文（`25%`、`5 seconds` → 「5 秒」）。 |
| **标题** | 每个 `h2` 都要给中英两版。小标题短、准，不要凑成完整句子。 |
| **不写译者注序号** | 不要在译文里插 `（译者注：…）`，需要说明就放 `noteZh`。 |

## 三、中英标点与排版

- 中文用全角标点：，。、；：「」——？！
- 引号用 **「」** 表中文引述，**“”** 表嵌套或原文引用；英文原文里的引号在中文译文里统一转成「」。
- 中英混排时，**中英文之间加一个空格**（如「用 DirectX 11 重写了渲染后端」）。
- 破折号用 **——**（两个全角破折号）。
- 数字与中文之间不加空格（「5 秒」→ 其实是「5 秒」，数字与量词间不加）。
- 不要用 markdown 的 `**` 去强调原文没强调的东西。

## 四、术语表（强制统一）

### 核心概念

| 英文 | 中文 | 说明 |
|---|---|---|
| compression-oriented programming | 压缩导向编程 | Casey 自造的方法论名词，首次出现时保留英文原词 |
| semantic compression | 语义压缩 | 文章标题用《语义压缩》 |
| granularity | 粒度 | |
| indirection | 间接层 / 间接引用 | 按语境选，不要一律译「间接」 |
| boilerplate | 样板代码 | |
| plumbing | 管道代码 / 接线 | Casey 用来指「纯机械的代码」，译「管道代码」 |
| refactoring | 重构 | |
| codebase | 代码库 | |
| player movement code | 玩家移动代码 | 不要译「玩家运动代码」 |
| walkable surface | 可行走表面 | |
| collision volume | 碰撞体 | |
| manifold | 流形 | |
| flood fill | 洪泛填充 | |
| Rapidly Exploring Random Tree (RRT) | 快速扩展随机树（RRT） | 首次出现给全称 + 缩写 |
| reachability | 可达性 | |
| input path | 输入路径 | |
| synthetic input | 合成输入 | |
| emulation | 模拟 | |
| frame | 帧 | `frame rate` → 帧率 |
| stall | 卡顿 / 停顿 | 五秒卡顿 |
| hitch | 卡顿 | |
| shader | 着色器 | |
| irradiance caching | 辐照度缓存 | |
| irradiance | 辐照度 | |
| radiance | 辐射亮度 | 不要和 irradiance 混 |
| radiosity | 辐射度 | |
| final gathering | 最终采集 | |
| global illumination (GI) | 全局光照 | |
| precomputed lighting | 预计算光照 | |
| lightmap | 光照贴图 | |
| lightmap parameterization | 光照贴图参数化 | |
| chart | 图块 | 参数化算法里的 chart，不译「图表」 |
| atlas / packing | 图集 / 排布 | packing → 排布（算法语境） |
| seam | 接缝 | |
| texel | 纹素 | |
| hemicube | 半立方体 | |
| irradiance gradient | 辐照度梯度 | |
| irradiance record | 辐照度记录 | |
| octree | 八叉树 | |
| split sphere model | 分裂球模型 | |
| radial basis function | 径向基函数 | |
| neighbor clamping | 邻域钳制 | |
| geometry / mesh | 几何体 / 网格 | |
| chart topology | 图块拓扑 | |
| disk topology | 圆盘拓扑 | |
| parameterization | 参数化 | |
| distortion | 畸变 | |
| conformal | 保角 | |
| least squares conformal maps (LSCM) | 最小二乘保角映射（LSCM） | |
| subdivision surface | 细分曲面 | |
| tessellation | 曲面细分 | |
| displacement map | 位移贴图 | |
| normal map | 法线贴图 | |
| mipmap | mipmap | 不译 |
| DXT / BC1 / BC7 / ETC / ASTC | 保留英文 | 纹理压缩格式名 |
| texture compression | 纹理压缩 | |
| block compression | 块压缩 | |
| quantization | 量化 | |
| tone mapping | 色调映射 | |
| color grading | 色彩分级 | |
| gamma / linear space | 伽马 / 线性空间 | |
| ambient occlusion | 环境光遮蔽 | |
| shadow map | 阴影贴图 | |
| cascade | 级联 | 阴影级联 |
| light leak | 漏光 | |
| texture memory | 纹理内存 / 显存 | 按语境 |
| precomputation | 预计算 | |
| undo | 撤销 | |
| manipulator | 操纵器 | 编辑器里的拖动控件 |
| panel | 面板 | |
| entity | 实体 | |
| layer | 图层 | |
| editor | 编辑器 | 指游戏内置编辑器时用「编辑器」 |
| playtest | 试玩测试 | |
| milestone | 里程碑 | |

### 项目专有

| 英文 | 处理方式 |
|---|---|
| The Witness / Braid | 正文里统一写作 **《The Witness》**、**《Braid》**（不保留斜体 `*The Witness*`）。这是全站基准译法；原文的斜体在中文里由书名号承担 |
| Thekla, Inc. | 保留英文 |
| Jonathan Blow / Jon | 保留英文（`Jon` 不改成 Jonathan） |
| Casey Muratori | 保留英文 |
| Ignacio Castaño / Ignacio | 保留英文（`Ignacio` 不改成 Ignacio Castaño） |
| Luis Antonio / Orsi Spanyol | 保留英文 |
| ludicon.com / castano/blog | 保留英文 URL |
| the-witness.net | 保留英文 |
| Jai | 保留英文 |
| Handmade Hero | 保留英文 |
| CASEYTOWN / CaseyTown | 保留原文写法 |
| walk_monster.cpp / Lister Panel / Entity Panel | 保留英文（Panel 不译，因为它是 UI 里控件的专名） |
| Movement Panel | 保留英文 |
| Quake / Maya / 3DS Max / DirectX 11 / HLSL | 保留英文 |
| Walk Monster | 作为工具名保留英文；正文叙述里可写「Walk Monster（行走怪物）」，之后一律用 Walk Monster |
| Witness Wednesday | 保留英文，首次出现加注「每周三连载」 |
| Compile-time / run-time | 编译期 / 运行期 |

## 五、常见句式处理

| 英文 | 不要译成 | 应该译成 |
|---|---|---|
| It's worth noting that… | 值得注意的是…… | 可以直接省略这个引导，直说内容 |
| As anyone who works on these types of projects knows… | 任何从事这类项目的人都知道…… | 「做过这类项目的人都清楚……」 |
| This is exactly how programming should go. | 这正是编程应该进行的方式。 | 「编程就该是这样。」 |
| I'm not a big fan of X. | 我不是 X 的忠实拥护者。 | 「我不太喜欢 X。」 |
| the last thing you ever want | 你最不想的事情 | 「你最不希望发生的事」 |
| rock solid | 坚如磐石 | （保留） |
| unobtrusive | 不引人注意 | |
| Bingo. | 宾果。 | 「就是它了。」 |
| real quick | 很快地 | 「顺手」「快速」 |
| frowny face | 苦脸 | 「一脸苦相」 |

## 六、`noteZh`（补充说明）的使用

只在**确实会卡住中文读者**的地方加，例如：
- 一个英文双关或文化梗
- 需要背景才能理解的行业内部信息（如「CaseyToyn 是他自己的测试关卡」）
- 术语在中文圈有通行译法但和本文不同

**不要**用来复述段落大意，也不要把自己的评论写进去。

## 七、质量自检清单

翻译完一篇后逐条过：

1. 每个英文段落都有对应中文段，段落数一致？
2. 代码块是否原样保留、未被翻译？
3. 术语是否与上表一致（尤其是「玩家移动代码」「可行走表面」「压缩导向编程」）？
4. 有没有漏掉括号里的插话、自嘲、破折号后的补充？
5. 中文读起来是否像中文，而不是英文语序的直译？
6. 小标题是否给了中英两版？
7. 中英文之间是否有空格、中文是否用全角标点？
