// Verify app.js's inline() renders `$…$` through KaTeX and does not eat markdown
// that sits inside a formula. Runs app.js in a JSDOM-free stub: we only need the
// `inline` closure, so we re-create the same function text and exercise it directly.
//
// Usage: node <脚本名>
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync('app.js', 'utf8');

// 1. pull the inline() definition out of app.js verbatim so the test cannot drift
const start = app.indexOf('const hasKatex = ()');
const end = app.indexOf('  /** 站点文案', start);
if (start < 0 || end < 0) {
  console.error('❌ 没能在 app.js 里定位 inline() 区块');
  process.exit(1);
}
const block = app.slice(start, end);

// 2. minimal host: esc() + a fake katex that echoes its input, so we can assert on structure
const sandbox = {
  window: {
    katex: {
      renderToString: (tex, opts) =>
        `<span class="katex" data-tex="${tex.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" data-display="${!!opts.displayMode}"></span>`,
    },
  },
};
vm.createContext(sandbox);
vm.runInContext(
  `
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  ${block}
  globalThis.__inline = inline;
`,
  sandbox,
);

const inline = sandbox.__inline;

const cases = [
  // [input, must-include, must-not-include]
  ['$E(\\mathbf{x}) \\simeq \\sum_{i=0}^N A_i L_i \\cos\\theta_i$', 'data-tex="E(\\mathbf{x}) \\simeq \\sum_{i=0}^N A_i L_i \\cos\\theta_i"', '&lt;'],
  ['a $x^2$ b', 'data-tex="x^2"', null],
  // 公式里的星号不能被当成强调
  ['$a * b * c$', 'data-tex="a * b * c"', '<em>'],
  // 公式里的下划线不能被当成 markdown
  ['$A_i L_i$', 'data-tex="A_i L_i"', null],
  // 公式里的方括号不能被当成链接
  ['$A[0] + B[1]$', 'data-tex="A[0] + B[1]"', '<a href'],
  // 公式外的 markdown 照常工作
  ['**bold** and `code` and [x](http://e.com)', '<strong>bold</strong>', null],
  ['**bold** and `code` and [x](http://e.com)', '<code>code</code>', null],
  ['**bold** and `code` and [x](http://e.com)', '<a href="http://e.com"', null],
  // 转义的美元号不是公式定界符
  ['costs \\$5 and \\$6', 'costs \\$5 and \\$6', 'data-tex'],
];

let pass = 0;
let fail = 0;
for (const [input, must, mustNot] of cases) {
  const out = inline(input);
  const okMust = out.includes(must);
  const okNot = mustNot ? !out.includes(mustNot) : true;
  if (okMust && okNot) {
    pass++;
    console.log(`✅ ${JSON.stringify(input).slice(0, 56)}`);
  } else {
    fail++;
    console.log(`❌ ${JSON.stringify(input)}`);
    if (!okMust) console.log(`   缺少: ${must}`);
    if (!okNot) console.log(`   不该出现: ${mustNot}`);
    console.log(`   实际: ${out}`);
  }
}

// 3. KaTeX 不可用时要优雅降级：原样显示 `$…$`，不吞内容
const sandbox2 = { window: {} };
vm.createContext(sandbox2);
vm.runInContext(
  `
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  ${block}
  globalThis.__inline = inline;
`,
  sandbox2,
);
const degraded = sandbox2.__inline('公式 $E = mc^2$ 保留');
if (degraded.includes('$E = mc^2$')) {
  pass++;
  console.log('✅ KaTeX 缺失时降级为原文 $…$');
} else {
  fail++;
  console.log('❌ KaTeX 缺失时降级失败: ' + degraded);
}

console.log(`\n${pass} 通过 / ${fail} 失败`);
process.exit(fail ? 1 : 0);
