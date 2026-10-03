# DSH 伴读插件开发笔记

> **状态**：这份笔记对应的插件（`dsh-readalong`）**已删除**——DSH 更新后客户端插件体系失效，不再需要它。
> 保留笔记是因为其中的**问题模式**与插件是否失效无关：只要还在 DSH Web 上做客户端插件，
> `process.cwd()` 不可用、`inject` 不声明就抛异常、浮层 `pointer-events` 遮罩、iframe 内弹窗要用
> `<dialog>` 这些坑仍然成立。要重新捡起来，按下面的契约重建一个包即可。
>
> 阅读器本身**不再依赖插件**：`serve.mjs` 是纯静态服务，与 DSH 无关。

这份文件记录 **DSH Web 客户端插件**的集成契约，以及这次开发中实际踩到的每一个坑。下次做类似插件（任何「在 GUI 里附加一块界面 + 把上下文送进对话」的功能）可以直接照抄。

（原参考实现 `dsh-readalong` 已删除；下面的代码片段可独立重建。）

---

## 一、插件包的最小结构

一个客户端插件是**双半边**的 npm 包：host 半边（Node）+ browser 半边。

```
my-plugin/
├── package.json
└── lib/
    ├── index.js     ← host 半边：必须导出 apply（哪怕空）
    └── client.js    ← browser 半边：手写的 __ModuleLoader__ bundle
```

### package.json

```json
{
  "name": "dsh-my-plugin",
  "type": "module",
  "main": "lib/index.js",
  "exports": {
    ".": "./lib/index.js",
    "./client": "./lib/client.js",
    "./package.json": "./package.json"
  },
  "dsh": { "client": { "platform": "web", "inject": [] } }
}
```

要点：
- **`dsh.client.platform` 必填**。写成别的值包会被当成非客户端包并**缓存**（`pkgMeta` 不过期），之后改回来要重启才认。
- **`exports["./client"]` 必填**（或给 `{ default: ... }`）。声明了 `dsh.client` 却没有它会直接抛错。
- **host 半边必须导出 `apply`**，空的也行。原因：客户端模块扫描器是**遍历 cordis Loader 条目**（不是扫文件系统）来找 browser 半边的；包没有 Loader 条目就不会被扫描到。

### lib/index.js（host 半边）

```js
export const inject = ['webServer'];   // 需要哪些宿主服务
export function apply(ctx) {
  ctx.effect(
    () => ctx.webServer.register({ kind: 'prefix', path: '/my-plugin', handler }),
    'my-plugin: routes'
  );
}
```

### lib/client.js（browser 半边）

没有构建流程，必须手写成这个形状：

```js
window.__ModuleLoader__.load({
  id: 'dsh-my-plugin',            // 必须等于包名
  factory: (require) => {
    const React = require('react');   // 只能 require 静态表里的模块
    const exports = {};
    exports.inject = ['slots', 'sessions'];   // cordis 服务名，不是包名
    exports.apply = function (ctx) {
      ctx.slots.inject('shell.overlay', () =>
        ctx.slots.register({ name: 'shell.overlay', id: 'mine', order: 100 }, MyPanel)
      );
    };
    return exports;
  },
});
```

`require` 的静态表（可直接用，无需声明）：`react`、`react/jsx-runtime`、`react-dom`、`react-dom/client`、`@deepseek-ai/cordis`、`@deepseek-ai/dsh-client-ui-slots`、`@deepseek-ai/dsh-client-ui-primitives`。其它模块要在 `dsh.client.external` 里声明成图里的行。

---

## 二、安装与生效

```powershell
dsh plugin --profile web add file:C:\path\to\my-plugin
```

然后在 `$DSH_HOME/profiles/web/cordis.patch.yml` 里加：

```yaml
- insert:
    - id: my-plugin
      name: dsh-my-plugin
```

### 生效规则（这是最容易踩的部分）

| 改动 | 是否需要重启 |
|---|---|
| 改 `lib/client.js` 的内容 | **不需要**，浏览器半边真热重载（宿主按内容哈希算出新 `rev`，SSE 推送） |
| 加/删插件条目 | 需要**刷新页面**；宿主会重组，但浏览器半边忽略 graph 帧 |
| 改 `lib/index.js`（host 半边的**路由**） | **需要重启宿主进程** |
| 改包的 `dsh.client` / `exports["./client"]` | 需要**重启**（`pkgMeta` 缓存不过期） |
| 改 仓库根目录 里的静态文件 | 不需要（路由按请求读磁盘，且响应 `no-store`） |

**判断是否真的热加载了**：比较服务端字节数与磁盘字节数，别只看时间戳。

```powershell
$a = (Invoke-WebRequest http://127.0.0.1:3080/plugins/dsh-my-plugin/client.js -UseBasicParsing).RawContentLength
$b = (Get-Item my-plugin\lib\client.js).Length
"served=$a disk=$b"
```

### ⚠️ 不要用 `process.cwd()` 找宿主的工作区

**实测踩到的坑**：DSH 宿主进程的当前工作目录可能是**任意位置**——这次是 `C:\WINDOWS\System32`。于是 `join(process.cwd(), 'wiki')` 变成了 `C:\WINDOWS\System32\wiki`，页面直接报「找不到 wiki 目录」。

而且 `DSH_*` 环境变量里**没有工作区变量**（全部只有：`DSH_HOME`、`DSH_SESSION_ID`、`DSH_SESSION_JSONL`、`DSH_SHELL`、`DSH_WEB_URL`、`DSH_AGENTS_HOME`、`DSH_BUNDLED_SKILL_DIR`、`DSH_WEB_FETCH_PROVIDER`、`DSH_WEB_SEARCH_PROVIDER`）。

**可靠的解析顺序**：

```js
const pluginDir = dirname(fileURLToPath(import.meta.url)); // <pkg>/lib

function findRoot() {
  // 1) 显式环境变量 / 插件 config（最高优先，可移植）
  if (process.env.DSH_MYPLUGIN_ROOT) return resolve(process.env.DSH_MYPLUGIN_ROOT);
  // 2) 从 cwd 逐级向上找标志文件
  let dir = resolve(process.cwd());
  for (let i = 0; i < 8; i++) {
    const cand = join(dir, 'wiki');
    if (existsSync(join(cand, 'sites.json'))) return cand;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // 3) 从插件自身真实位置推导
  //    插件通过 junction 装在 profile 里，fileURLToPath 会跟随符号链接给出
  //    工作区内的真实路径，往上两级就是工作区。
  return join(resolve(pluginDir, '..', '..'), 'wiki');
}
```

第 3 条之所以成立，全靠 profile 里是 **junction**（见下一节的 pnpm 坑）。代价是插件与工作区绑定；要真正可移植就用第 1 条，并在 profile patch 里显式给：

```yaml
- id: my-plugin
  name: dsh-my-plugin
  config:
    root: 'C:\path\to\data'
```

**报错信息务必给全**：把「试过哪几条路径、各自结果」都打出来。这次正是靠 `C:\WINDOWS\System32\wiki` 这个字符串反推出宿主 cwd 异常的。

### ⚠️ pnpm 可能只复制不链接

如果 `dsh plugin add` 时 profile 里有进程占用文件（例如 GUI 自己的 `electron.exe`），pnpm 会在「删除旧目录」这步失败，**但它可能已经把文件复制进去了**——于是 `node_modules/my-plugin` 是**一份副本而不是链接**，之后你改源码完全不生效，而插件看起来「已安装」。

这次就中了这个坑：profile 里是 485 字节的旧 `index.js`，工作区是 5121 字节的新版，重启后加载的一直是旧的。

**修法**：把 profile 里的目录换成 junction，之后改源码即时可见。

```powershell
Remove-Item "$env:DSH_HOME\profiles\web\node_modules\dsh-my-plugin" -Recurse -Force
New-Item -ItemType Junction -Path "$env:DSH_HOME\profiles\web\node_modules\dsh-my-plugin" `
  -Target "C:\path\to\my-plugin"
```

---

## 三、客户端 ctx：能拿到什么

`apply(ctx)` 给的是 **root ctx**。服务要**先声明 `inject` 才能访问**——未声明时访问会**抛异常**（不是返回 `undefined`），错误长这样：

```
Error: cannot get property "sessions" without inject
```

这个异常很坑：如果代码里用 `try/catch` 包着探测服务，会静默失败，让你以为是 API 形状不对。

常用服务：

| 服务 | 作用 | 备注 |
|---|---|---|
| `slots` | 槽位注册 | 几乎所有插件都要 |
| `sessions` | 会话列表/当前选择/**作用域解析** | `list` 快照里 `current` 是当前会话 id；`scope(id)` 返回会话作用域 ctx |
| `conversation` | **会话作用域**服务：`send()` / `input.for()` | 从 root ctx 拿不到，必须经 `sessions.scope()` |
| `locale` | 文案 | `register(ns, {zh, en})` |
| `inputTriggers` | `@` / `/` 触发源 | 见下 |
| `theme` / `layout` / `uiRenderer` | 主题、栏位、渲染 | |

---

## 四、把上下文送进对话

这是伴读类插件的核心。有三条路，按可靠性排序：

### 1. 写进输入框（推荐）

前提是拿到**会话作用域 ctx**：

```js
const sessions = svc(ctx, 'sessions');
const id = sessions.list.get().current;          // 当前会话 id
const scoped = sessions.scope(id);                // Agent 作用域 ctx
scoped.conversation.input.for(scoped).setDraft(text);
```

`setDraft` 只写输入框，用户接上自己的问题再发——对「边读边问」最自然。

### 2. 直接发送

```js
await scoped.conversation.send(text);
```

### 3. 内联引用（需要用户按发送）

注册一个 `@` 触发源，`codec.serialize` 决定**注入模型的那段文本长什么样**：

```js
const source = {
  trigger: '@', name: 'myref', 
  candidates: async () => [...],
  onPick: (pick) => ({ insert: { source:'myref', ref, label, appearance:'file', clipboardText } }),
  codec: { clipboardText: (ref) => ref, serialize: (ref) => Promise.resolve(`<myref>${ref}</myref>`) },
};
ctx.inputTriggers.registerSource(source);
```

注意 `serialize` 是在**提交事务里**调用的，所以这条路一定要用户按发送；`serialize` 失败会**阻止发送**。

### 兜底

任何一条路都可能失败（没有活动会话、作用域还没建立、剪贴板无用户手势）。**一定要有 `navigator.clipboard.writeText` 兜底并明确告诉用户发生了什么**，不要静默失败。

---

## 五、槽位与 UI 集成

`shell.overlay` 是**应用级 list 槽位**（`kind:'list', scope:'root'`，由 `dsh-client-ui-layout` 的 `AppFrame` 声明），专为「浮在整个应用之上的附加界面」准备。

### ⚠️ pointer-events 陷阱（这次最严重的一个 bug）

`shell.overlay` 的子元素默认继承 **`pointer-events: none`**——宿主的有意设计：附加层不该吃掉应用的点击。

如果你为了让面板可点，在**外层容器**上写 `pointerEvents: 'auto'`，而那个容器是 `position: fixed` + 铺满视口的 flex 盒，它就会变成**一张看不见的透明遮罩，把整个应用的点击都接走**。表现是「屏幕中间有个关不掉的东西」，用户点哪儿都没反应。

**正确写法**：容器保持穿透，只有真正的控件可点。

```js
wrap:  { position:'fixed', right:14, bottom:14, display:'flex', flexDirection:'column',
         alignItems:'flex-end', pointerEvents:'none' },   // ← 穿透
tab:   { ..., pointerEvents:'auto' },                       // ← 胶囊可点
panel: { ..., pointerEvents:'auto' },                       // ← 面板可点
```

自查方法：打印容器的 `getBoundingClientRect()`。如果它是整个视口大小（而不是面板大小），就是这个 bug。

### ⚠️ iframe 里的弹窗会被面板遮住

面板里嵌 iframe 时，iframe 处在 DSH overlay 层的**堆叠上下文**里。iframe 内部用普通 `div` + `z-index` 做弹窗，**z-index 越不出 iframe**，会被外面的面板盖住。

**修法**：用原生 `<dialog>` + `showModal()`，它进入浏览器 **top layer**，任何 z-index 和堆叠上下文都盖不住。

```js
if (!d.open) d.showModal();     // 开
d.close();                      // 关（Esc 原生支持）
```

自查：`dialog.matches(':modal')` 应为 `true`。

---

## 六、调试入口

客户端插件没有构建流程，也拿不到全局 ctx，所以**在 `apply` 里挂一个诊断函数**是最省事的办法：

```js
window.__myPluginProbe = () => ({
  ctxKeys: Object.keys(ctx).slice(0, 30),
  hasSessions: !!svc(ctx, 'sessions'),
  currentSessionId: ...,
  setDraftAvailable: ...,
});
```

这次的两个关键 bug（`inject` 缺失、作用域不对）都是靠它定位的，而不是靠反复猜 API 形状。

---

## 七、host 半边：注册自己的 HTTP 路由

`webServer` 服务提供三个注册点：

```js
ctx.webServer.register({ kind: 'prefix', path: '/my-plugin', handler });  // 前缀
ctx.webServer.register({ kind: 'exact',  path: '/my-plugin/status', handler });
ctx.webServer.registerFallback(handler);   // 未匹配请求的兜底（一个应用只能有一个）
```

用途：托管静态资源、提供 JSON 接口、做状态中继。

**路由只在插件挂载时注册，改代码要重启**（见第二节的表）。但 handler 内部按请求读磁盘，所以它服务的**文件**改动立即生效。

跨源问题由此消解：插件自己托管 UI 后，浏览器半边与 UI 同源，localStorage / fetch 都能直接读，不需要 postMessage 之类的绕法。

---

## 八、开发检查清单

- [ ] `package.json`：`dsh.client.platform: "web"` + `exports["./client"]` + host 半边导出 `apply`
- [ ] `client.js` 的 `id` 等于包名；`inject` 写的是**服务名**
- [ ] 访问服务前先在 `inject` 里声明（否则抛错，且容易被 try/catch 吞掉）
- [ ] 浮层容器 `pointer-events: none`，控件才 `auto`
- [ ] iframe 内弹窗用 `<dialog>.showModal()`
- [ ] 投放上下文有三级回退 + 明确反馈
- [ ] 挂了 `window.__xxxProbe()` 诊断入口
- [ ] profile 里是 **junction 不是副本**
- [ ] 改完 host 半边记得重启；改 client 半边可以热加载
