import fs from 'node:fs';
const p = JSON.parse(fs.readFileSync('archive/raw/castano-blog.json', 'utf8'));
const slug = process.argv[2];
const a = p.find((x) => x.slug === slug);
console.log('WORDS', a.words, 'CHARS', a.chars, '|', a.title, a.date);
console.log(a.md.slice(0, +(process.argv[3] || 3000)));
const fences = a.md.split('\n').filter((l) => l.startsWith('```'));
console.log('\nfence lines:', fences.length, JSON.stringify(fences.slice(0, 12)));
