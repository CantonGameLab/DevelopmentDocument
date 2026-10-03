// 路径约定：所有脚本都以**本文件所在目录**为仓库根，而不是 `process.cwd()`。
//
// 为什么：`process.cwd()` 在真实使用里很不可靠（被别的程序拉起、被调度器改过、
// 从子目录执行……），而这个仓库是给人下载下来双击或随手 `node xxx.mjs` 跑的。
// 用 `import.meta.url` 推导出来的根目录永远正确。
//
// 站点数据放在 `data/<siteId>/`：每套文档独占一个子目录，多套文档并存时文件名不会互撞。
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

/** 仓库根目录（= 本文件所在目录）。 */
export const ROOT = dirname(fileURLToPath(import.meta.url));

/** 默认站点 id。`data/` 下有多个站点目录时，用 `WITNESS_SITE` 环境变量切换。 */
export const SITE = process.env.WITNESS_SITE || 'witness';

/** 站点数据目录（相对仓库根，用于打印）。 */
export const DATA_REL = `data/${SITE}`;

/** 站点数据目录的绝对路径。 */
export const DATA = join(ROOT, 'data', SITE);

/** 译文目录。 */
export const ARTICLES = join(DATA, 'articles');

/** 清单文件。 */
export const MANIFEST = join(DATA, 'manifest.json');

/** 归档目录（英文原文）。 */
export const ARCHIVE = join(ROOT, 'archive');

/** 按仓库根解析一个相对路径。 */
export const fromRoot = (...parts) => resolve(ROOT, ...parts);

/** 读 JSON（路径相对仓库根或绝对）。 */
export function readJson(relOrAbs) {
  return JSON.parse(readFileSync(resolve(ROOT, relOrAbs), 'utf8'));
}

/** 站点数据的可选性自检，失败时给人话错误。 */
export function assertSiteData() {
  if (existsSync(MANIFEST)) return;
  let have = '(没有 data/ 目录)';
  try {
    have = readdirSync(join(ROOT, 'data')).join(', ') || '(空)';
  } catch {}
  throw new Error(
    `找不到站点数据：${MANIFEST}\n` +
      `  · 期望布局：data/<siteId>/{manifest.json,articles/}\n` +
      `  · 当前站点 id：${SITE}（可用环境变量 WITNESS_SITE 切换）\n` +
      `  · data/ 下现有：${have}`,
  );
}
