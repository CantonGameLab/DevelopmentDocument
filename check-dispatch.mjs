// Check the final translation dispatch covers every pending article exactly once.
import { readFileSync } from 'node:fs';
import { MANIFEST } from './paths.mjs';

const m = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const pending = m.articles.filter((a) => a.status !== 'done').map((a) => a.id);

// ids handed to the six dispatched batches
const BATCH = {
  A: ['official-2012-12-30-what-i-did-on-my-christmas-vacation', 'official-2015-11-19-on-music-sound-effects-story', 'official-2012-10-14-wm-touch-is-totally-bananas', 'casey-0022'],
  B: [
    'official-2018-03-14-testing-the-jai-compiler', 'official-2016-02-02-fun-sales-fakts',
    'official-2013-02-22-a-clarification-about-our-ps4-exclusivity', 'official-2015-08-05-bugs',
    'official-2015-12-22-entering-the-home-stretch',
    'official-2016-09-08-were-doing-a-ps4-pro-patch-here-are-the-technical-details',
    'official-2013-11-19-a-trip-to-new-york-and-some-huge-artwork',
    'official-2016-01-11-whose-voices-are-in-the-witness',
    'official-2013-01-15-thoughts-about-app-store-curation',
    'official-2013-02-19-the-witness-audio-1000-subtle-layers',
  ],
  C: [
    'official-2014-09-10-what-weve-been-working-on-lately', 'official-2016-01-19-price-and-pre-orders',
    'official-2016-11-02-ps4-pro-patch-update', 'official-2017-06-09-macos-system-requirements',
    'official-2017-05-01-help-us-get-the-witness-on-ios', 'official-2017-09-25-the-witness-is-finally-on-ios',
    'official-2016-09-19-the-witness-is-out-on-the-xbox-one', 'official-2016-01-22-pre-order-widget-test',
    'official-2016-11-18-the-ps4-patch-is-out', 'official-2016-05-10-jobs', 'official-2014-01-30-last-minute-area',
    'official-2015-09-05-workin-on-a-new-trailer', 'official-2014-02-20-marsh-update',
    'official-2013-03-13-ipad-video-update-1', 'official-2013-10-16-pictures-from-a-demo-day-at-sony',
    'official-2014-05-29-island-snapshot-what-year-is-this-edition',
    'official-2016-02-09-ill-be-having-a-reddit-ama-on-friday-the-12th-of-february',
    'official-2013-10-24-recent-coverage-of-the-witness', 'official-2017-01-28-anniversary',
    'official-2015-07-10-witness-in-limbo',
  ],
  D: [
    'official-2013-02-01-if-you-like-first-person-puzzle-games', 'official-2015-03-25-island-snapshot',
    'official-2014-04-16-working-on-the-witness-parts-5-and-6', 'official-2012-11-15-post-shrink-screenshots',
    'official-2014-05-23-caseys-witness-wednesday-on-interpolation',
    'official-2013-12-18-its-been-a-while-since-we-did-an-island-snapshot',
    'official-2014-05-03-witness-friday-post-on-caseys-blog', 'official-2015-09-17-new-trailer-and-interviews',
    'official-2016-01-25-the-game-is-doing-great-on-steam',
    'official-2013-02-01-interview-about-the-witness-and-related-design-topics',
    'official-2014-02-04-hey-look-oculus-support-plus-steam-controller-support',
    'official-2016-01-26-the-witness-is-now-up-on-psn-in-the-americas-and-europe',
    'official-2013-02-20-first-official-trailer-for-the-witness',
    'official-2012-11-17-you-know-the-game-is-coming-along', 'official-2014-09-24-close-up',
    'official-2014-02-04-hey-look-steam-controller-support', 'official-2014-04-25-whats-this',
    'official-2013-01-03-island-snapshot', 'official-2015-12-23-since-making-the-previous-blog-post',
    'official-2016-02-13-the-witness-long-screenshot-3', 'official-2013-11-29-what-could-it-mean',
    'official-2016-02-29-printable-panels', 'official-2012-10-23-island-snapshot-two-for-one',
    'official-2013-06-19-island-snapshot',
  ],
  E: [
    'official-2012-11-06-we-are-going-map-crazy', 'official-2012-12-02-collecting-playtest-data',
    'official-2013-01-16-island-partition', 'official-2013-05-07-poster-ideas',
    'official-2013-06-15-heres-that-poster', 'official-2013-07-04-wallpapers',
    'official-2013-08-05-more-screenshots', 'official-2013-09-04-on-the-rocks',
    'official-2013-09-12-the-shipwreck', 'official-2014-01-24-what-that-vr-post-was-about',
    'official-2014-12-10-playstation-experience', 'official-2015-01-25-progress',
    'official-2015-02-20-thekla', 'official-2012-11-29-very-limited-very-closed-beta',
  ],
  F: [
    'official-2014-06-02-road-to-e3-day-1', 'official-2014-06-03-road-to-e3-day-2',
    'official-2014-06-04-road-to-e3-day-3', 'official-2014-06-05-road-to-e3-day-4',
    'official-2014-06-06-road-to-e3-day-5', 'official-2015-05-05-sculpture',
    'official-2015-06-03-polishing-the-architecture', 'official-2014-03-24-the-art-of-the-witness-gdc-2014',
    'official-2015-10-13-architecture-in-video-games', 'official-2013-06-07-a-long-overdue-tree-update',
    'official-2014-08-29-hlslparser', 'official-2022-02-10-a-shader-trick',
    'official-2016-02-29-printable-panels',
  ],
};

const dispatched = new Map();
for (const [b, ids] of Object.entries(BATCH)) {
  for (const id of ids) {
    if (!dispatched.has(id)) dispatched.set(id, []);
    dispatched.get(id).push(b);
  }
}

const pendingSet = new Set(pending);
const notDispatched = pending.filter((id) => !dispatched.has(id));
const dupes = [...dispatched.entries()].filter(([, bs]) => bs.length > 1);
const alreadyDone = [...dispatched.keys()].filter((id) => !pendingSet.has(id));

console.log(`待翻译 ${pending.length} 篇 | 已派发 ${dispatched.size} 个不同 id`);
console.log(`  batch 内重复派发: ${dupes.length ? dupes.map(([id, b]) => id + ' → ' + b.join(',')).join('; ') : '无'}`);
console.log(`  派发但已完成（应无害，代理会跳过）: ${alreadyDone.length ? alreadyDone.join(', ') : '无'}`);
if (notDispatched.length) {
  console.log(`\n❌ 未覆盖 ${notDispatched.length} 篇：`);
  for (const id of notDispatched) {
    const a = m.articles.find((x) => x.id === id);
    console.log(`   ${id}  [${a.words}w] ${a.title.en}`);
  }
} else {
  console.log('\n✅ 每一篇待翻译文章都恰好被某个批次覆盖');
}
