import fs from 'node:fs';
import { MANIFEST } from './paths.mjs';
const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const groups = {
  '光照三章': ['intro', 'precomputed', 'irradiance', 'lightmap-shipping'],
  'Castaño 纹理压缩章': ['castano-textures'],
  'Castaño 其他章': ['castano-graphics'],
  '其余章节': ['movement', 'renderer', 'nature', 'editor', 'art', 'process', 'snapshots'],
};
for (const [name, keys] of Object.entries(groups)) {
  const arts = m.articles.filter((a) => keys.includes(a.chapter));
  const pending = arts.filter((a) => a.status !== 'done');
  console.log(
    `${name.padEnd(22)} 共 ${String(arts.length).padStart(3)} 篇 / ${String(arts.reduce((s, a) => s + a.words, 0)).padStart(6)} 词   ` +
      `已译 ${String(arts.length - pending.length).padStart(3)}   待译 ${String(pending.length).padStart(3)} 篇 / ${String(pending.reduce((s, a) => s + a.words, 0)).padStart(6)} 词`,
  );
}
console.log('\n--- 待译明细（按词数降序）---');
for (const a of [...m.articles].filter((x) => x.status !== 'done').sort((x, y) => y.words - x.words)) {
  console.log(`  ${String(a.words).padStart(5)}w  ${a.chapter.padEnd(18)} ${a.date}  ${a.title.en}`);
}
