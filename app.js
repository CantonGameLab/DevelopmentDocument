/* =========================================================
   The Witness 开发博客 · 中英对照学习文档
   版式 B「对照同步」—— 逐段左右对齐

   引擎与内容分离：
     · 本文件是通用阅读器引擎，不认识任何具体文档。
     · 站点定义由本地服务提供：/readalong/site.json（或多站点用 ?site=<id>）。
     · 契约见 EXTENDING.md「如何接入一套新文档」。
   ========================================================= */
(() => {
  const $ = (id) => document.getElementById(id);
  const state = {
    lang: 'bi',
    site: null,
    manifest: null,
    article: null, // 当前文章数据
    openChapters: new Set(),
    read: new Set(),
  };

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /**
   * 行内公式：`$…$` 交给本地 KaTeX 排版。
   *
   * 顺序很讲究——必须**先**把 `$…$` 抠出来换成占位符，再跑其余的行内规则。
   * 否则公式里的 `**`、`_`、`[` 会被当成强调/下标/链接语法吃掉。
   * KaTeX 没加载成功（比如 vendor 目录被删）就原样显示 `$…$`，不报错、不吞内容。
   */
  const hasKatex = () => typeof window !== 'undefined' && window.katex && typeof window.katex.renderToString === 'function';
  function renderMath(tex) {
    if (!hasKatex()) return null;
    try {
      return window.katex.renderToString(tex, { throwOnError: false, displayMode: false, output: 'html' });
    } catch {
      return null;
    }
  }

  const inline = (s) => {
    const math = [];
    // `\$` 是转义的字面美元号，不能当公式定界符
    const masked = String(s).replace(/(^|[^\\])\$([^$\n]+?)\$/g, (m, pre, tex) => {
      const html = renderMath(tex);
      if (html === null) return m;
      math.push(html);
      return `${pre}\u0000MATH${math.length - 1}\u0000`;
    });
    let out = esc(masked)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
    // KaTeX 的 HTML 是我们自己生成的、可信的，直接注入；esc() 已经把占位符原样留下，
    // 所以尖括号没有被破坏。
    if (math.length) out = out.replace(/\u0000MATH(\d+)\u0000/g, (_m, i) => math[+i] || '');
    return out;
  };

  /** 站点文案：按当前语言取，缺就回退到 zh，再缺回退到 key 本身。 */
  const T = (group, key) => {
    const s = state.site || {};
    const g = (s[group] && (s[group][state.lang === 'en' ? 'en' : 'zh'])) || {};
    const gz = (s[group] && s[group].zh) || {};
    return g[key] || gz[key] || key;
  };
  /** 站点纯量字段（title / intro / askPrefix 这类 {zh,en} 对象）。 */
  const TV = (field) => {
    const v = state.site && state.site[field];
    if (!v) return '';
    if (typeof v === 'string') return v;
    return v[state.lang === 'en' ? 'en' : 'zh'] || v.zh || v.en || '';
  };

  const storeKey = (n) => `wiki.${(state.site && state.site.id) || 'default'}.${n}`;
  const save = () => {
    try {
      localStorage.setItem(storeKey('lang'), state.lang);
      localStorage.setItem(storeKey('open'), JSON.stringify([...state.openChapters]));
      localStorage.setItem(storeKey('read'), JSON.stringify([...state.read]));
    } catch {}
  };

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(t.__h);
    t.__h = setTimeout(() => (t.hidden = true), 1900);
  }

  /* ---------------- 阅读位置状态 ---------------- */
  // 两条通道：
  //   1) POST 到同源的 /readalong/ctx —— 本地服务把它存下来（多窗口按客户端 id 分槽）
  //   2) localStorage.<site>.readingCtx —— 刷新后仍能记住读到哪
  function publishContext(extra = {}) {
    const a = state.article;
    // 首页不发布上下文。面板里的阅读器可能停在首页，而用户在别处正读着某篇——
    // 此时发一个 article:null 会把中继里的真实阅读位置擦掉，整条链路随即失效。
    if (!a) return;
    const chap = state.manifest.chapters.find((c) => c.key === a.chapter);
    const sel = String(window.getSelection() || '').trim();
    const ctx = {
      at: Date.now(),
      site: state.site.id,
      base: state.site.base,
      article: {
        id: a.id,
        titleZh: a.title.zh || '',
        titleEn: a.title.en,
        author: a.author,
        date: a.date,
        chapter: (chap && (chap.zh || chap.en)) || '',
        url: a.url,
        translated: a.status === 'done',
        sourceMd: a.mdPath || null,
      },
      lang: state.lang,
      heading: currentHeading(),
      selection: sel ? sel.slice(0, 1200) : '',
      ...extra,
    };
    window.__WIKI_CTX__ = ctx;
    try { localStorage.setItem(storeKey('readingCtx'), JSON.stringify(ctx)); } catch {}
    // 上报给本地服务（按客户端 id 分槽，多窗口互不覆盖）；服务没起就忽略。
    try {
      fetch('/readalong/ctx', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-readalong-client': clientId() },
        body: JSON.stringify(ctx),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }

  /** 本浏览器实例的稳定标识，用于让中继按窗口分槽（全站共享，不分站点）。 */
  function clientId() {
    try {
      let id = localStorage.getItem('wiki.clientId');
      if (!id) {
        id = 'c' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        localStorage.setItem('wiki.clientId', id);
      }
      return id;
    } catch {
      return 'anon';
    }
  }

  // 当前视口顶部所在的小标题
  function currentHeading() {
    const hs = [...document.querySelectorAll('.prose h2')];
    let cur = '';
    for (const h of hs) {
      if (h.getBoundingClientRect().top <= 140) cur = h.innerText.replace(/\n/g, ' / ').replace(/#$/, '').trim();
      else break;
    }
    return cur || (hs[0] ? hs[0].innerText.replace(/\n/g, ' / ').replace(/#$/, '').trim() : '');
  }

  let _ctxTimer = null;
  const schedulePublish = (extra) => {
    clearTimeout(_ctxTimer);
    _ctxTimer = setTimeout(() => publishContext(extra), 120);
  };


  function pairHTML(b) {
    const en = b.en ? `<div class="en" lang="en">${inline(b.en)}</div>` : '';
    const zh = b.zh ? `<div class="zh" lang="zh-CN">${inline(b.zh)}</div>` : '';
    if (!en) return `<div class="pair"><div class="zh" lang="zh-CN">${inline(b.zh)}</div></div>`;
    if (!zh) return `<div class="pair"><div class="en" lang="en">${inline(b.en)}</div></div>`;
    return `<div class="pair">${en}${zh}</div>`;
  }

  const BLOCK = {
    h2: (b) =>
      `<h2 id="${b.id}">${esc(b.zh || b.en)}${b.en && b.zh ? `<span class="en">${esc(b.en)}</span>` : ''}<a class="anchor" href="#${b.id}">#</a></h2>`,
    p: (b) => pairHTML(b),
    list: (b) => `<ul class="bi">${b.items.map((it) => `<li>${pairHTML(it)}</li>`).join('')}</ul>`,
    quote: (b) =>
      `<blockquote class="quote">${pairHTML(b)}${
        b.noteZh || b.noteEn ? `<div class="quote-note">${esc(b.noteZh || b.noteEn)}</div>` : ''
      }</blockquote>`,
    callout: (b) =>
      `<aside class="callout ${b.kind === 'warning' ? 'is-warning' : 'is-insight'}">${pairHTML(b)}</aside>`,
    code: (b) =>
      `<figure class="code"><figcaption><span class="code-cap">${
        b.captionZh || b.captionEn || ''
      }${b.captionEn && b.captionZh ? `<span class="en">${esc(b.captionEn)}</span>` : ''}</span>${
        b.lang ? `<span class="code-lang">${esc(b.lang)}</span>` : ''
      }</figcaption><pre><code>${esc(b.code)}</code></pre></figure>`,
  };

  /* ---------------- markdown fallback (英文原文) ---------------- */
  function mdToBlocks(md) {
    const lines = md.split('\n');
    const out = [];
    let i = 0;
    // 跳过归档文件头部的元信息
    const startIdx = lines.findIndex((l) => l.trim() === '---');
    if (startIdx >= 0) i = startIdx + 1;
    let para = [];
    const flushPara = () => {
      const t = para.join(' ').trim();
      para = [];
      if (t) out.push({ type: 'p', en: t });
    };
    while (i < lines.length) {
      const l = lines[i];
      if (l.startsWith('```')) {
        flushPara();
        const lang = l.slice(3).trim();
        const buf = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
        i++;
        out.push({ type: 'code', lang, code: buf.join('\n') });
        continue;
      }
      if (/^#{1,6}\s/.test(l)) {
        flushPara();
        const lvl = l.match(/^#+/)[0].length;
        const text = l.replace(/^#+\s*/, '');
        if (lvl >= 2) out.push({ type: 'h2', id: 'h' + out.length, en: text });
        else out.push({ type: 'h2', id: 'h' + out.length, en: text });
        i++;
        continue;
      }
      if (/^!\[/.test(l.trim())) {
        flushPara();
        out.push({ type: 'p', en: l.trim() });
        i++;
        continue;
      }
      if (l.trim() === '') {
        flushPara();
        i++;
        continue;
      }
      para.push(l.trim());
      i++;
    }
    flushPara();
    return out;
  }

  /* ---------------- render: sidebar ---------------- */
  function renderSide() {
    const m = state.manifest;
    const doneCount = m.articles.filter((a) => a.status === 'done').length;
    const pct = Math.round((doneCount / m.articles.length) * 100);
    let h = `<div class="side-hero">
      <h1>${esc(TV('title'))}</h1>
      <p>${m.corpus.articles} ${esc(T('labels', 'articles'))} · ${(m.corpus.words / 1000).toFixed(0)}k ${esc(T('labels', 'words'))}</p>
      <div class="side-prog"><span style="width:${pct}%"></span></div>
      <div class="side-prog-label">${esc(T('labels', 'translated'))} ${doneCount} / ${m.articles.length}</div>
    </div>`;
    for (const c of m.chapters) {
      const arts = m.articles.filter((a) => a.chapter === c.key);
      if (!arts.length) continue;
      const open = state.openChapters.has(c.key);
      h += `<div class="chap ${open ? 'open' : ''}" data-chap="${c.key}">
        <button class="chap-head"><span class="caret">▶</span>${esc(c.zh || c.en)}<span class="n">${arts.length}</span></button>
        <div class="chap-desc">${esc(c.desc || '')}</div>
        <ul>${arts
          .map((a) => {
            const active = state.article && state.article.id === a.id;
            return `<li><button class="art ${active ? 'active' : ''} ${state.read.has(a.id) ? 'read' : ''}" data-art="${a.id}">
              <span class="dot"></span>
              <span class="${a.status === 'done' ? '' : 'art-pending'}">${esc(a.title.zh || a.title.en)}</span>
              <span class="w">${a.words}</span>
            </button></li>`;
          })
          .join('')}</ul>
      </div>`;
    }
    $('side').innerHTML = h;
  }

  /* ---------------- render: home ---------------- */
  function renderHome() {
    const m = state.manifest;
    const done = m.articles.filter((a) => a.status === 'done').length;
    const core = m.articles.filter((a) => a.words >= 1000).length;
    const h = `<div class="home">
      <h1>${esc(TV('title'))}</h1>
      <p class="home-lede">${esc(TV('intro'))}</p>
      <div class="stats">
        <div class="stat"><b>${m.corpus.articles}</b><span>${esc(T('labels', 'articles'))}</span></div>
        <div class="stat"><b>${(m.corpus.words / 1000).toFixed(1)}k</b><span>${esc(T('labels', 'words'))}</span></div>
        <div class="stat"><b>${m.chapters.filter((c) => c.articles.length).length}</b><span>${esc(
     T('labels', 'chapters')
   )}</span></div>
        <div class="stat"><b>${done}</b><span>${esc(T('labels', 'translated'))}</span></div>
        <div class="stat"><b>${core}</b><span>${esc(T('labels', 'core'))}</span></div>
      </div>
      <div class="home-cards">
        ${m.chapters
          .filter((c) => c.articles.length)
          .map((c) => {
            const arts = m.articles.filter((a) => a.chapter === c.key);
            const w = arts.reduce((s, a) => s + a.words, 0);
            return `<button class="home-card" data-chap-go="${c.key}">
              <h3>${esc(c.zh)}</h3>
              <p>${esc(c.desc)}</p>
              <span class="cnt">${arts.length} 篇 · ${w.toLocaleString()} 词</span>
            </button>`;
          })
          .join('')}
      </div>
    </div>`;
    $('main').innerHTML = h;
    document.body.className = 'lang-' + state.lang + '-only';
    publishContext();
  }
  /* ---------------- render: article ---------------- */
  function renderArticle() {
    const a = state.article;
    const m = state.manifest;
    const chap = m.chapters.find((c) => c.key === a.chapter);
    const title =
      state.lang === 'en'
        ? esc(a.title.en)
        : `<span class="zh">${esc(a.title.zh || a.title.en)}</span>${
            a.title.zh && state.lang === 'bi' ? `<span class="h1-en">${esc(a.title.en)}</span>` : ''
          }`;

    let h = `<div class="crumbs"><a href="#/">首页</a> · ${esc(chap ? chap.zh : '')}</div>
      <h1 class="doc-title">${title}</h1>
      <div class="meta">
        <span class="chip">${esc(a.author)}</span>
        <span class="chip">${esc(a.date)}</span>
        <span class="chip">${a.words} 词</span>
        <a class="chip chip-link" href="${a.url}" target="_blank" rel="noreferrer">原文</a>
        ${a.crossPostedAs.length ? `<span class="chip" title="官方博客也发布过此文">官方博客交叉发布</span>` : ''}
      </div>`;

    if (a.status !== 'done' || !a.blocks) {
      h += `<div class="pending-note">
        <strong>本篇尚未翻译。</strong>下面是归档的英文原文（已自动排版）。
        翻译按章节分批推进，可以在左侧看到每篇的进度标记。
      </div>`;
    }

    const blocks = a.blocks || mdToBlocks(a.sourceMd || '');
    h += `<div class="prose" id="prose">${blocks.map((b) => (BLOCK[b.type] || BLOCK.p)(b)).join('\n')}</div>`;

    h += `<div class="doc-foot">
      <span>读完这篇了？</span>
      <button id="btn-mark">标记为已读</button>
      <button id="btn-ctx2">复制本篇上下文</button>
      <button id="btn-top">回到顶部</button>
    </div>`;

    $('main').innerHTML = h;
    document.body.className = 'lang-' + state.lang + '-only';

    $('btn-mark').onclick = () => {
      state.read.add(a.id);
      save();
      renderSide();
      toast('已标记为已读');
    };
    $('btn-ctx2').onclick = () => copyContext(null);
    $('btn-top').onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0 });
    // 上报当前阅读位置
    setTimeout(() => publishContext(), 150);
  }

  /* ---------------- data loading ---------------- */
  // 内容会不断新增译文，所以所有数据请求都绕过 HTTP 缓存
  const jget = (url) => fetch(url, { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null));
  const tget = (url) => fetch(url, { cache: 'no-store' }).then((r) => (r.ok ? r.text() : ''));

  async function loadManifest() {
    state.manifest = await jget(`${state.site.dataDir}/manifest.json`);
  }

  async function loadArticle(id) {
    const meta = state.manifest.articles.find((a) => a.id === id);
    if (!meta) return null;
    const data = { ...meta, blocks: null, sourceMd: '' };
    // 已翻译内容
    const j = await jget(`${state.site.dataDir}/articles/${id}.json`);
    if (j && Array.isArray(j.blocks) && j.blocks.length) {
      data.blocks = j.blocks;
      data.title = { ...meta.title, ...(j.title || {}) };
      data.subtitle = j.subtitle || null;
      data.status = 'done';
      return data;
    }
    // 回退：显示源文（未翻译的篇目）。
    // 优先走服务托管的源文路由（site.archivePrefix）；否则回退到工作区相对路径。
    if (meta.mdPath) {
      const raw = meta.mdPath;
      const rel = state.site.stripPrefix && raw.startsWith(state.site.stripPrefix)
        ? raw.slice(state.site.stripPrefix.length)
        : raw;
      const viaArchive = state.site.archivePrefix ? await tget(state.site.archivePrefix + rel) : '';
      data.sourceMd = viaArchive || (await tget('../' + raw));
    }
    return data;
  }

  /* ---------------- context copy（给 agent 提问用） ---------------- */
  function copyContext(explicitText) {
    const a = state.article;
    const sel = explicitText || String(window.getSelection() || '').trim();
    const m = state.manifest;
    const chap = m.chapters.find((c) => c.key === a.chapter);
    const lines = [
      TV('askPrefix') || '我在读这份文档，想就下面这段向你提问。',
      '',
      `- 文章：${a.title.zh || a.title.en}（${a.title.en}）`,
      `- 作者：${a.author} · ${a.date}`,
      `- 章节：${chap ? chap.zh : ''}`,
      `- 原文：${a.url}`,
      '',
    ];
    if (sel) lines.push('我选中的段落：', '> ' + sel.replace(/\n+/g, ' '), '');
    lines.push('我的问题是：');
    const text = lines.join('\n');
    navigator.clipboard?.writeText(text).then(
      () => toast(sel ? '已复制：选段 + 上下文' : '已复制：文章上下文'),
      () => toast('复制失败，请手动选择文字')
    );
  }

  /* ---------------- routing ---------------- */
  async function route() {
    const id = (location.hash || '').replace(/^#\/?/, '');
    if (!id) {
      state.article = null;
      renderHome();
      renderSide();
      return;
    }
    const data = await loadArticle(id);
    if (!data) {
      location.hash = '';
      return;
    }
    state.article = data;
    // 自动展开所在章节
    state.openChapters.add(data.chapter);
    save();
    renderArticle();
    renderSide();
  }

  /* ---------------- modal / help ---------------- */
  // 用原生 <dialog>.showModal()：进入 top layer，被伴读面板的 iframe 嵌住时也不会被遮住。
  const modalEl = () => $('modal');
  function openModal(html) {
    $('modal-body').innerHTML = html;
    const d = modalEl();
    if (typeof d.showModal === 'function') {
      if (!d.open) d.showModal();
    } else {
      d.setAttribute('open', '');
    }
  }
  function closeModal() {
    const d = modalEl();
    if (typeof d.close === 'function' && d.open) d.close();
    d.removeAttribute('open');
  }
  $('modal-x').onclick = closeModal;
  // 点遮罩空白处关闭（dialog 自身占满，点它即点背景）
  modalEl().addEventListener('click', (e) => {
    if (e.target === modalEl()) closeModal();
  });
  // 原生 Esc 已能关闭 dialog，这里只做兜底
  modalEl().addEventListener('cancel', () => closeModal());
  $('btn-help').onclick = () =>
    openModal(`<h3>快捷键</h3>
      <ul>
        <li><kbd>1</kbd> / <kbd>2</kbd> / <kbd>3</kbd> — 中文 / English / 中英对照</li>
        <li><kbd>j</kbd> / <kbd>k</kbd> — 下一篇 / 上一篇</li>
        <li><kbd>c</kbd> — 复制当前阅读上下文（选中文字后按 <kbd>c</kbd> 会带上选段）</li>
        <li><kbd>t</kbd> — 展开 / 收起侧栏目录</li>
        <li><kbd>Esc</kbd> — 关闭弹窗</li>
      </ul>
      <p>选中任意段落，按 <kbd>c</kbd>，就能得到一段带出处的上下文，直接粘给我提问。</p>`);

  /* ---------------- events ---------------- */
  $('seg-lang').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    state.lang = b.dataset.lang;
    save();
    for (const x of $('seg-lang').children) x.classList.toggle('on', x.dataset.lang === state.lang);
    if (state.article) renderArticle();
    else renderHome();
  });

  $('side').addEventListener('click', (e) => {
    const art = e.target.closest('[data-art]');
    if (art) {
      location.hash = '/' + art.dataset.art;
      if (window.innerWidth <= 860) document.body.classList.remove('toc-open');
      return;
    }
    const head = e.target.closest('.chap-head');
    if (head) {
      const key = head.parentElement.dataset.chap;
      if (state.openChapters.has(key)) state.openChapters.delete(key);
      else state.openChapters.add(key);
      save();
      renderSide();
    }
  });

  $('main').addEventListener('click', (e) => {
    const card = e.target.closest('[data-chap-go]');
    if (card) {
      state.openChapters.add(card.dataset.chapGo);
      save();
      renderSide();
      const first = state.manifest.articles.find((a) => a.chapter === card.dataset.chapGo);
      if (first) location.hash = '/' + first.id;
    }
  });

  $('btn-toc').onclick = () => document.body.classList.toggle('toc-open');
  $('btn-context').onclick = () => (state.article ? copyContext(null) : toast('请先打开一篇文章'));

  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const order = () => {
      const m = state.manifest;
      const list = [];
      for (const c of m.chapters) for (const id of c.articles) list.push(m.articles.find((a) => a.id === id));
      return list.filter(Boolean);
    };
    const go = (d) => {
      if (!state.article) return;
      const list = order();
      const i = list.findIndex((a) => a.id === state.article.id);
      const n = list[i + d];
      if (n) location.hash = '/' + n.id;
    };
    if (e.key === '1' || e.key === '2' || e.key === '3') {
      state.lang = ['zh', 'en', 'bi'][+e.key - 1];
      save();
      for (const x of $('seg-lang').children) x.classList.toggle('on', x.dataset.lang === state.lang);
      state.article ? renderArticle() : renderHome();
    } else if (e.key === 'j') go(1);
    else if (e.key === 'k') go(-1);
    else if (e.key === 'c') state.article && copyContext(null);
    else if (e.key === 't') document.body.classList.toggle('toc-open');
    else if (e.key === 'Escape') {
      closeModal();
      document.body.classList.remove('toc-open');
    }
  });

  window.addEventListener('hashchange', route);

  // 阅读位置跟踪（只注册一次，避免每次渲染累积监听器）
  document.addEventListener('scroll', () => { if (state.article) schedulePublish(); }, { passive: true });
  document.addEventListener('selectionchange', () => { if (state.article) schedulePublish(); });

  /* ---------------- 站点配置 ---------------- */
  /**
   * 站点定义由主机半边的 /readalong/site.json 提供（多站点时可用
   * /readalong/site.json?site=<id> 指定）。独立预览时回退到 sites.json 的 defaultSite。
   */
  async function loadSite() {
    const q = new URLSearchParams(location.search).get('site');
    const qs = q ? `?site=${encodeURIComponent(q)}` : '';
    // 首选主机提供的解析结果（多站点 + 环境变量覆盖）；404 时回退到静态 sites.json。
    let cfg = await jget('site.json' + qs);
    if (!cfg || !cfg.id) cfg = await jget('sites.json' + qs);
    if (!cfg || !cfg.id) cfg = await jget('sites.json');
    if (!cfg || !cfg.id) {
      document.getElementById('main').innerHTML =
        '<div class="pending-note"><strong>找不到站点配置。</strong><br>' +
        '主机半边应提供 <code>/readalong/site.json</code>；独立预览时请确认 <code>sites.json</code> 存在。</div>';
      throw new Error('no site config');
    }
    // 归一化：补齐默认字段
    cfg.archivePrefix = cfg.archivePrefix || '';
    cfg.dataDir = cfg.dataDir || 'data';
    cfg.defaultLang = cfg.defaultLang || 'bi';
    cfg.base = location.pathname.replace(/\/[^/]*$/, '/'); // 本页所在目录，用于跳转与 iframe 深链
    state.site = cfg;
    const saved = (() => { try { return localStorage.getItem(storeKey('lang')); } catch { return null; } })();
    state.lang = saved || cfg.defaultLang;
    try { state.openChapters = new Set(JSON.parse(localStorage.getItem(storeKey('open')) || '[]')); } catch {}
    try { state.read = new Set(JSON.parse(localStorage.getItem(storeKey('read')) || '[]')); } catch {}
    if (cfg.title) document.title = cfg.title.zh || cfg.title.en || document.title;
    if (cfg.accent) document.documentElement.style.setProperty('--accent', cfg.accent);
    // 顶栏品牌与「学习路径」入口由站点配置决定
    const brand = document.getElementById('brand');
    if (brand) {
      const kicker = cfg.kicker || cfg.label || '伴读';
      const sub = state.lang === 'en' ? cfg.labelEn || '' : cfg.label || '';
      brand.innerHTML = `${esc(kicker)} <span class="brand-sub">${esc(sub)}</span>`;
    }
    const learn = document.getElementById('btn-learn');
    if (learn) {
      if (cfg.learnPath) learn.setAttribute('href', cfg.learnPath);
      else learn.style.display = 'none';
    }
    return cfg;
  }

  /* ---------------- boot ---------------- */
  (async () => {
    await loadSite();
    await loadManifest();
    for (const x of $('seg-lang').children) x.classList.toggle('on', x.dataset.lang === state.lang);
    if (!state.openChapters.size) {
      // 默认展开第一个有内容的章节
      const first = state.manifest.chapters.find((c) => c.articles.length);
      if (first) state.openChapters.add(first.key);
    }
    await route();
  })();
})();
