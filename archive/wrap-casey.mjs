// Wrap code runs in fenced blocks for Casey's articles.
// Lines are already one-per-line; blank lines inside a source listing must stay INSIDE
// the block, so this buffers trailing blanks and only commits them when the run ends.
// Usage: node wrap-casey.mjs   (rewrites raw/casey-normalized.json in place)
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'archive/raw/casey-normalized.json';
const posts = JSON.parse(readFileSync(FILE, 'utf8'));

const EN_STOP =
  /\b(the|this|that|these|those|you|your|we|our|they|their|it|its|is|are|was|were|be|been|being|and|or|but|because|when|which|there|not|have|has|had|will|would|can|could|should|just|about|from|with|than|then|also|very|much|more|most|some|any|all|into|after|before|only|other|such|each|over|under|between|without|another)\b/gi;

function isCode(t) {
  if (t === '') return false;
  if (/^#{1,6} /.test(t) || /^\s*[-*+] /.test(t) || /^!\[/.test(t) || /^> /.test(t) || /^---$/.test(t)) return false;
  if (/[;{}]\s*$/.test(t)) return true;
  if ((t.match(/[;{}]/g) || []).length >= 2) return true;
  if (/^\s*#\s*(include|define|if|ifdef|ifndef|endif|pragma|undef)\b/.test(t)) return true;
  if (/\/\/|\/\*|\*\/|\bNOTE\(|\bTODO\(/.test(t)) return true;
  if (/->\s*\w|::\w/.test(t)) return true;
  if (/^\s*(if|else|for|while|switch|case|default|do|return)\b/.test(t) && /[(){};=]/.test(t)) return true;
  if (/^\s+\S/.test(t) && /[;{}()\[\]=<>]/.test(t)) return true; // indented code
  if (/^[A-Z_][A-Z0-9_]{3,}\s*[,;)]?$/.test(t)) return true; // ALL_CAPS enum/constant value
  if (/^\[\s*REDACTED\s*\]$/i.test(t)) return true;
  if (/^[A-Za-z_][\w:<>*&,\[\]\s]*\([^)]*\)\s*;?$/.test(t) && t.trim().split(/\s+/).length <= 6) return true; // call/decl
  if (/^[\w:<>*&\s]+\s\*?&?\w+\s*=\s*\S/.test(t) && /[;()]/.test(t)) return true; // assignment/init
  return false;
}

function isProse(t) {
  if (t === '' || /[{};]/.test(t)) return false;
  const words = t.trim().split(/\s+/).length;
  const stops = (t.match(EN_STOP) || []).length;
  if (words >= 8 && stops >= 2) return true;
  if (
    /^[A-Z"'(]/.test(t.trim()) &&
    /[a-z]{2,}\s+[a-z]{2,}/.test(t) &&
    /[.?!:,]\s*$/.test(t.trim()) &&
    !/[=<>\[\]]/.test(t)
  )
    return true;
  return false;
}

let totalBlocks = 0;
for (const p of posts) {
  const lines = p.md.split('\n');

  // Pre-compute which lines sit inside a /* ... */ block comment: those always belong
  // to the enclosing code block, however English they read.
  const inCommentMask = new Array(lines.length).fill(false);
  {
    let open = false;
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (open) {
        inCommentMask[i] = true;
        if (/\*\//.test(l)) open = false;
      } else if (/\/\*/.test(l) && !/\*\//.test(l)) {
        inCommentMask[i] = true;
        open = true;
      }
    }
  }

  const out = [];
  let run = [];
  let pendingBlank = false;
  let emittedBlank = false;
  let inComment = false;
  let blocks = 0;

  const emitBlank = () => {
    if (!emittedBlank && out.length) {
      out.push('');
      emittedBlank = true;
    }
  };

  const commitRun = () => {
    if (!run.length) {
      if (pendingBlank) {
        emitBlank();
        pendingBlank = false;
      }
      return;
    }
    out.push('```cpp', ...run, '```');
    emittedBlank = false;
    blocks++;
    run = [];
    pendingBlank = false;
    emitBlank();
  };

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    const t = line.trim();
    const wasInComment = inCommentMask[li];

    if (t === '') {
      if (run.length) pendingBlank = true;
      else emitBlank();
      continue;
    }

    // Lines inside a /* */ comment belong to the enclosing code block, but an
    // English paragraph that merely follows code must NOT be absorbed.
    let code = false;
    if (wasInComment) {
      code = !(isProse(t) && t.split(/\s+/).length > 12);
    } else if (isCode(t)) {
      code = run.length === 0 ? !isProse(t) : true;
    }

    if (code) {
      if (pendingBlank) {
        run.push('');
        pendingBlank = false;
      }
      run.push(line);
      continue;
    }

    // prose line ends the run
    commitRun();
    out.push(t);
    emittedBlank = false;
    emitBlank();
  }
  commitRun();

  let text = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();

  // Merge adjacent code blocks separated by a short line when the result is
  // unambiguously code (unclosed comment, or an ALL_CAPS enumerant). This stitches
  // back multi-line comments and enum bodies that the line classifier split apart.
  const mergeRe = /```cpp\n([\s\S]*?)\n```\n+([^\n]{0,90})\n+```cpp\n([\s\S]*?)\n```/g;
  let merged = 0;
  let prev;
  do {
    prev = text;
    text = text.replace(mergeRe, (m, blockA, gap, blockB) => {
      const g = gap.trim();
      const isCaps = /^[A-Z_][A-Z0-9_]{3,}\s*[,;)]?$/.test(g);
      const isMarker = /^[A-Za-z_][\w.]*\.(h|cpp|c|hpp):$/.test(g);
      const aOpen = (blockA.match(/\/\*/g) || []).length > (blockA.match(/\*\//g) || []).length;
      const aCaps = /^[A-Z_][A-Z0-9_]{3,}\s*[,;)]?\s*$/.test(blockA.trim().split('\n').pop().trim());
      if (aOpen || isCaps || isMarker || aCaps) {
        merged++;
        return '```cpp\n' + blockA + '\n' + gap + '\n' + blockB + '\n```';
      }
      return m;
    });
  } while (text !== prev);
  if (merged) console.log(`   (merged ${merged} split blocks in casey_${p.id})`);
  blocks = (text.match(/```cpp/g) || []).length;
  p.md = text;
  p.codeBlocks = blocks;
  totalBlocks += blocks;
  console.log(`casey_${p.id}  blocks=${String(blocks).padStart(3)}  ${p.md.length.toString().padStart(6)} chars  ${p.title}`);
}

writeFileSync(FILE, JSON.stringify(posts, null, 2));
console.log(`\nwrote ${FILE} — ${totalBlocks} code blocks`);
