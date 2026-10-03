# 光照系统翻译任务简报（v1）

## 你要做什么

把这批英文技术文章翻译成**中英逐段对照**的 JSON，写进 `data/witness/articles/<id>.json`。

## 动手前必读（按顺序）

1. `wiki/GLOSSARY.md` —— 术语表与风格基准，**强制**。这批是技术长文，特别注意「技术长文的额外要求」那一节。
2. `schema.md` —— 文章 JSON 契约（blocks 结构、图片写法、硬性要求）。
3. 一篇已完成的风格基准：`data/witness/articles/casey-0005.json`（Casey 的口语风）。
   技术长文的参考：`data/witness/articles/official-2013-09-23-shadow-mapping-summary-part-1.json`。

## 你那批文章的源文

源文 markdown 在 `archive/` 下，路径见下表。**只翻译 `---` 之后的内容**（`---` 之前是归档元数据，不要读进去当正文）。

源文里的插图行形如 `![alt](http://…png)` 或 `[![alt](缩略图)](原图)`，按 `schema.md` 的「图片的写法」归一化成
`{ "type": "p", "en": "![图](原图URL)", "zh": "（原文此处有一张图）" }`。

## 收尾必做

1. 自检 JSON：`node -e "JSON.parse(require('fs').readFileSync('data/articles/<id>.json','utf8'))"`
2. 跑校验器并**报告原始输出**：
   ```
   node <id> <id>
   ```
   必须 0 error。warning 要逐条说明是否合理。
3. 跑保真核验并**报告原始输出**：
   ```
   node <id> <id>
   ```
   报出的「未覆盖单元」如果属于已知类型（图片占位、归档多余反引号、图文同行拆分、代码围栏修复），在 `translator.note` 里逐条声明；如果是真遗漏就补上。
4. **不要**改 `data/witness/manifest.json`（状态由 `build-manifest.mjs` 统一同步）。
5. 返回一段简短报告：文章 id、段落数、校验结果、任何异常。

## 硬性要求（再强调三遍）

- **逐段对齐**：一段英文 ↔ 一段中文，不合并、不拆分。
- **不增不删**：不加原文没有的解释。需要背景就写进 `noteZh`。
- **代码原样**：`code` 字段逐字保留英文，注释也不译。
- **公式原样**：变量名、符号、公式保持原样。
- **术语统一**：按 `GLOSSARY.md`，尤其是 irradiance / radiance / irradiance caching / lightmap / chart / hemicube / final gathering。
- 中文用全角标点，中英文之间加空格，引号用「」。
