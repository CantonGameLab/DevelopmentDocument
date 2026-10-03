# 文章数据格式（schema）

每篇翻译成果是一个 JSON 文件：`data/witness/articles/<article-id>.json`。
`article-id` 取自 `data/witness/manifest.json` 里的 `id` 字段（如 `casey-0005`、`official-2015-012-entering-the-home-stretch`）。

## 顶层

```json
{
  "id": "casey-0005",
  "title": { "zh": "行走怪物", "en": "Walk Monster" },
  "subtitle": {
    "zh": "把整座岛的可行走表面测绘出来，作为「让玩家移动代码坚不可摧」的第一步。",
    "en": "Mapping the island's walkable surfaces as a step toward bulletproofing the player movement code."
  },
  "translator": { "note": "本篇为风格基准样例" },
  "blocks": [ ... ]
}
```

- `title.zh` / `subtitle.zh` 是**译者补的**（原文没有副标题时，可以用原文首段的核心句概括成一句，或留空字符串）。
- 除 `blocks` 外都可选，但 `title.zh` 强烈建议给。

## blocks 数组

数组顺序 = 文章顺序。**逐段对应原文**，一段英文一个 block，不要合并段落。

### `h2` — 小标题

```json
{ "type": "h2", "id": "walkmonster", "zh": "名字来自 Quake 的报错", "en": "Walkmonster in Wall" }
```
- `id` 用英文小写连字符，供页内跳转用；同一篇内唯一。
- `zh` 是译文标题（短、准），`en` 是原文标题。

### `p` — 段落（最常用）

```json
{ "type": "p", "en": "原文整段…", "zh": "译文整段…" }
```
- 行内保留下 markdown：`` `代码` ``、`**粗体**`、`*斜体*`、`[文字](url)`。
- 原文里的链接**原样保留在 en 字段**；译文里如果提到同样的链接，也用 `[文字](同 url)`。
- 数字、括号插话、破折号后的补充都要译出来。

### `list` — 列表

```json
{ "type": "list", "items": [
    { "en": "First item", "zh": "第一项" },
    { "en": "Second item", "zh": "第二项" }
] }
```

### `quote` — 引用块

```json
{
  "type": "quote",
  "en": "So this past Thanksgiving, Jon and I sat down…",
  "zh": "所以去年感恩节，Jon 和我坐下来……",
  "noteZh": "这句话就是整段合作的起点。"
}
```
- `noteZh` 可选，只在需要点出这段话的重要性时加一句。**不要复述大意**。

### `callout` — 提示框（译者判断某段是关键结论/陷阱时用）

```json
{
  "type": "callout",
  "kind": "insight",
  "en": "But this is testing the data, not the actual code.",
  "zh": "但这是在测数据，不是在测代码。"
}
```
- `kind`: `insight`（◆ 要点）或 `warning`（⚠ 陷阱）。
- **谨慎使用**：一篇里最多 2–3 个。它会把该段从正文里拎出来高亮，用多了就不值钱了。

### `code` — 代码块

```json
{
  "type": "code",
  "lang": "cpp",
  "captionZh": "合成输入驱动器的核心语义",
  "captionEn": "The synthetic-input driver, in essence",
  "code": "void DriveTowardPoint(v3 TargetP)\n{\n    ...\n}"
}
```
- **`code` 字段必须是原文代码，逐字不改**，注释也保持英文。
- 原文里如果没有 caption，可以不写 captionZh/En。

## 硬性要求

1. **段落数对齐**：`en` 与 `zh` 必须逐段对应，不能一段英文配两段中文。
2. **不增不删**：不加原文没有的内容；需要补充背景就写进 `noteZh`。
3. **代码原样**、术语统一（见 `../GLOSSARY.md`）。
4. **JSON 必须合法**：双引号、转义正确，UTF-8 无 BOM。写完用 `node -e "JSON.parse(require('fs').readFileSync('文件','utf8'))"` 自检。
5. 翻译完成后，把 `data/witness/manifest.json` 里该文章的 `status` 从 `"pending"` 改成 `"done"`。

### 图片的写法（全站统一）

归档 markdown 里的插图一律**归一化**成下面这一种形式（`<脚本名>` 可批量执行）：

```json
{ "type": "p", "en": "![图](https://…/full-size.png)", "zh": "（原文此处有一张图）" }
```

归一化规则：

- `[![alt](缩略图)](原图)` → 只留原图，丢掉外层链接与缩略图（`![图](原图)`）。
- `![alt](url "title")` → 丢掉 title 属性。
- 任何 `alt` 都压平成 `图`（WordPress 的 `IMG_x[1]` 这类带方括号的文件名也一并处理）。
- 全站共 288 处图片标记，统一后**零嵌套、零非「图」alt**。
- 一行 N 张图 → 一个 `p` 块，`zh` 写「（原文此处有 N 张图）」；中文数字与阿拉伯数字均可（现存两种都有）。
- 文字与截图混在同一源行 → 仍是一个 `p` 块，图片标记按源顺序内联。
- **例外**：`casey-0005.json`（风格基准）写于本约定之前，插图行被整行丢弃，不视为标准。

## 校验

```powershell
node casey-0005 casey-0005
```
检查：JSON 合法性、段落对齐、必填字段、术语抽查、以及 `manifest.json` 里的 status 是否已更新。
