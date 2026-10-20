/*
 * 从 index.html 抽出全部知识数据，生成白皮书版 markdown 分章文档。
 * index.html 是唯一数据源：网页与文档永远同步，改内容只改网页。
 *
 *   node tools/build-docs.mjs              生成 docs/*.md 与 HANDBOOK.md
 *   node tools/build-docs.mjs --figures    另外用 headless Chrome 截动效图解为 PNG
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "index.html");
const DOCS = path.join(ROOT, "docs");
const FIGS = path.join(DOCS, "figures");
const FIG_TMP = path.join(ROOT, ".figtmp");

// 交互版（动效、进度、逐帧播放）部署在这里，文档只负责静态阅读
const LIVE = "https://ai-agent-knowledge-framework.pages.dev/";

const DEMAND = { core: "岗位核心能力", hot: "高频考点", plus: "加分项" };
const BARRIER = { low: "上手门槛低", mid: "门槛中等", high: "门槛较高" };

/* --------------------------- 1. 取数据：执行页面脚本 --------------------------- */

function stubNode() {
  const n = () => stubNode();
  n.style = {};
  n.classList = { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false };
  n.dataset = {};
  n.addEventListener = () => {};
  n.appendChild = () => {};
  n.children = [];
  n.querySelectorAll = () => [];
  n.textContent = "";
  n.innerHTML = "";
  return n;
}

function loadData() {
  const html = fs.readFileSync(SRC, "utf8");
  const style = /<style>([\s\S]*?)<\/style>/.exec(html)[1];
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]).join(";\n");

  const el = stubNode();
  const ctx = {
    console, JSON, Math, Object, Array, String, Number, Set, Map, RegExp, Date, isNaN, parseInt, parseFloat,
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    document: {
      getElementById: () => el, querySelector: () => el, querySelectorAll: () => [],
      createElement: () => el, addEventListener: () => {}, body: el, documentElement: el,
      readyState: "complete",
    },
    window: {
      addEventListener: () => {}, location: { hash: "" }, scrollTo: () => {},
      matchMedia: () => ({ matches: false, addEventListener: () => {} }),
      requestAnimationFrame: () => 0,
      IntersectionObserver: function () { this.observe = () => {}; this.disconnect = () => {}; },
    },
    location: { hash: "" },
    localStorage: { getItem: () => null, setItem: () => {} },
    navigator: {},
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);

  const probe = `({MODULES,GROUPS,JOB_TYPES,JD_MAP,TRANSFER,HOT_TEN,SYS_DESIGNS,PATH_STAGES,PATH_PROJECTS,
    WEEK_RHYTHM,PATH_EXIT,REVERSE_QUESTIONS,REVERSE_NOTE,INTERVIEW_ROUNDS,COPY,DIAG,ordered})`;
  return { style, data: vm.runInContext(script + ";\n" + probe, ctx) };
}

/* --------------------------- 2. 行内 HTML -> Markdown --------------------------- */

function inline(html) {
  return String(html)
    .replace(/<br\s*\/?>/g, " ")
    .replace(/<(b|strong)>/g, "**").replace(/<\/(b|strong)>/g, "**")
    .replace(/<(em|i)>/g, "*").replace(/<\/(em|i)>/g, "*")
    .replace(/<code>([\s\S]*?)<\/code>/g, (_, c) => "`" + c.trim() + "`")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&nbsp;/g, " ")
    .replace(/\*\*\s*\*\*/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

// 网页里的模块间跳转（<code>学习路径</code> 这类提示）换成文档互链
function inlineDocs(html, D) {
  const obs = D.ordered.find(m => m.id === "observability");
  return inline(html)
    .replace(/`学习路径`/g, "[学习路径](appendix-a-learning-path.md)")
    .replace(/`考点索引`/g, "[考点索引](appendix-c-interview-index.md)")
    .replace(/`可观测性`/g, obs ? `[可观测性](${fileOf(obs)})` : "可观测性")
    .replace(/进度存在浏览器本地。\s*?/g, "");
}

const dots = n => "●".repeat(n) + "○".repeat(5 - n);
const fileOf = m => `${String(m.no).padStart(2, "0")}-${m.id}.md`;
const H = (lvl, t) => "#".repeat(lvl) + " " + t;
const block = (...lines) => lines.join("\n") + "\n\n";
const live = (route, what) => `> **在线交互版（${what}）：<${LIVE}${route}>**`;

/* --------------------------- 3. 分章文档 --------------------------- */

function chapter(m, D) {
  const grp = D.GROUPS.find(g => g.id === m.group);
  const dg = D.DIAG[m.diagram];
  const idx = D.ordered.findIndex(x => x.id === m.id);
  const prev = D.ordered[idx - 1], next = D.ordered[idx + 1];

  let s = "";
  s += block(H(1, `${String(m.no).padStart(2, "0")} · ${m.title}`));
  s += block(`> ${m.en}　|　${grp.name}　|　${DEMAND[m.demand]} · ${BARRIER[m.barrier]} · 权重 ${dots(m.weight)}`);
  s += "\n";

  s += block(H(2, "工程类比"), inline(m.analogy.m), "", `> ${inline(m.analogy.w)}`);

  s += block(
    H(2, "动效图解"),
    `![${inline(dg.title)}](figures/${m.diagram}.png)`,
    "",
    `**${inline(dg.title)}**`,
    "",
    ...dg.steps.map((st, i) => `${i + 1}. ${inline(st.note)}`),
    "",
    `> 动效结论：${inline(dg.cap)}`,
    "",
    `网页版里这段可以逐帧播放：[「${m.title}」动效图解](${LIVE}#/m/${m.id})。`
  );

  s += block(H(2, "核心概念"), ...m.concepts.flatMap(c => [
    `### ${inline(c.t)}${c.e ? `　\`${c.e}\`` : ""}`, "", inline(c.d), "",
  ]));

  s += block(
    H(2, "最小可用代码"),
    `> ${inline(m.code.note)}`, "",
    `\`\`\`${m.code.lang}`, ...m.code.src, "```", "",
    `文件名：\`${m.code.file}\``,
  );

  s += block(H(2, "常见坑"), ...m.pitfalls.map(p => `- ${inline(p)}`));

  s += block(H(2, "面试怎么问"), ...m.interview.flatMap((q, i) => [
    `**Q${m.no}.${i + 1}　${inline(q.q)}**`, "", `A：${inline(q.a)}`, "",
  ]));

  s += block(H(2, "上手练习"), ...m.practice.map(p => `- [ ] ${inline(p)}`));

  s += block("---", "",
    prev ? `← 上一节：[${prev.no}. ${prev.title}](${fileOf(prev)})` : "← 上一节：[00 · 全景](00-overview.md)",
    "",
    next ? `下一节：[${next.no}. ${next.title}](${fileOf(next)}) →` : "下一节：[附录 A · 八周学习路径](appendix-a-learning-path.md) →"
  );
  return s;
}

function overview(D) {
  const c = D.COPY.overview;
  let s = block(
    H(1, `00 · ${inline(c.t)}`),
    `> ${c.en}　|　面向后端 / 前端工程师的转型知识框架`, "",
    inlineDocs(c.lede, D), "",
    live("#/overview", "动效图解、逐帧播放、学习进度"), "",
    `![AI Agent 系统全景](figures/arch.png)`, "",
    inlineDocs(c.note, D)
  );

  s += block(H(2, "四层十四模块"));
  for (const g of D.GROUPS) {
    const ms = D.ordered.filter(m => m.group === g.id);
    s += block(`### ${inline(g.name)}　*${inline(g.hint)}*`, "",
      `| # | 模块 | 一句话 | 定位 | 门槛 | 权重 |`,
      `| - | --- | --- | --- | --- | :-: |`,
      ...ms.map(m => `| ${m.no} | [${inline(m.title)}](${fileOf(m)}) | ${inline(m.analogy.m)} | ${DEMAND[m.demand]} | ${BARRIER[m.barrier]} | ${dots(m.weight)} |`),
      "");
  }

  const stats = {
    概念: D.MODULES.reduce((a, m) => a + m.concepts.length, 0),
    坑: D.MODULES.reduce((a, m) => a + m.pitfalls.length, 0),
    面试题: D.MODULES.reduce((a, m) => a + m.interview.length, 0),
    练习: D.MODULES.reduce((a, m) => a + m.practice.length, 0),
    动效图解: Object.keys(D.DIAG).length,
  };
  s += block(H(2, "这套材料包含什么"),
    ...Object.entries(stats).map(([k, v]) => `- **${k}**：${v} 条`), "",
    `阅读顺序：00 → 01…14 → 附录 A（八周路线）→ 附录 B（岗位地图）→ 附录 C（考点索引）。`
  );
  return s;
}

function appendixA(D) {
  const c = D.COPY.path;
  const ml = id => { const m = D.ordered.find(x => x.id === id); return m ? `[${m.no}. ${inline(m.title)}](${fileOf(m)})` : id; };
  let s = block(H(1, "附录 A · " + inline(c.t)), `> ${c.en}`, "", inline(c.lede), "", live("#/path", "八周路线与进度勾选"));

  s += block(H(2, "四个阶段"));
  for (const st of D.PATH_STAGES) {
    s += block(
      `### ${inline(st.t)}　*${inline(st.w)}*`, "",
      `- **目标**：${inline(st.goal)}`,
      `- **产出**：${inline(st.out)}`,
      `- **做到了的判据**：${inline(st.ok)}`,
      `- **配套模块**：${st.mods.map(ml).join("　·　")}`, ""
    );
  }

  s += block(H(2, "项目组合：简历上放哪个"));
  for (const p of D.PATH_PROJECTS) {
    s += block(`### ${inline(p.n)}　*${inline(p.sub)}*`, "", inline(p.body), "", `> ${inline(p.talk)}`, "");
  }

  s += block(H(2, "每周节奏"),
    `| 环节 | 做这件事的标准 |`, `| --- | --- |`,
    ...D.WEEK_RHYTHM.map(([a, b]) => `| **${a}** | ${inline(b)} |`), "",
    `> **出关判据**：${inlineDocs(D.PATH_EXIT, D)}`
  );
  return s;
}

function appendixB(D) {
  const c = D.COPY.jobs;
  const ml = id => { const m = D.ordered.find(x => x.id === id); return m ? `[${m.no}. ${inline(m.title)}](${fileOf(m)})` : id; };
  let s = block(H(1, "附录 B · " + inline(c.t)), `> ${c.en}`, "", inline(c.lede), "", live("#/jobs", "岗位地图交互对比"), "", `> ${inlineDocs(c.note, D)}`);

  s += block(H(2, "五类岗位对比"),
    `| 岗位 | 实际在做什么 | 招聘时看什么 | 切入成本 | 热度 |`,
    `| --- | --- | --- | --- | --- |`,
    ...D.JOB_TYPES.map(j => `| **${inline(j.role)}**<br><sub>${inline(j.alias)}</sub><br>${j.mods.map(ml).join(" · ")} | ${inline(j.does)} | ${inline(j.wants)} | ${inline(j.cost)} | ${inline(j.heat)} |`)
  );

  s += block(H(2, "JD 关键词反查表"), `> ${inline(c.jdlede)}`, "",
    `| JD 里常见的写法 | 对应模块 |`, `| --- | --- |`,
    ...D.JD_MAP.map(([k, id]) => `| \`${k}\` | ${id ? ml(id) : "**算法侧，本框架不展开**"} |`)
  );

  s += block(H(2, "把已有经验翻译成 agent 语言"), `> ${inline(c.trlede)}`, "",
    `| 你已经有的能力 | 在 agent 项目里对应的活 |`, `| --- | --- |`,
    ...D.TRANSFER.map(([a, b]) => `| **${inline(a)}** | ${inline(b)} |`)
  );

  s += block(H(2, "三轮面试各考什么"),
    ...D.INTERVIEW_ROUNDS.flatMap(r => [`### ${inline(r.h)}　*${inline(r.em)}*`, "", inline(r.p), ""]));
  return s;
}

function appendixC(D) {
  const c = D.COPY.interview;
  const total = D.MODULES.reduce((a, m) => a + m.interview.length, 0);
  const ml = m => `[${m.no}. ${inline(m.title)}](${fileOf(m)})`;
  let s = block(H(1, "附录 C · " + inline(c.t)), `> ${c.en}　|　共 ${total} 题`, "", inline(c.lede), "", live("#/interview", "考点自测可折叠展开"));

  s += block(H(2, "高频十题（先过这个）"));
  for (const id of D.HOT_TEN) {
    const m = D.ordered.find(x => x.id === id);
    s += block(`### ${ml(m)}`, "", `**${inline(m.interview[0].q)}**`, "", `A：${inline(m.interview[0].a)}`, "");
  }

  s += block(H(2, "系统设计题"));
  for (const sd of D.SYS_DESIGNS) {
    s += block(`### ${inline(sd.t)}`, "", ...sd.p.map(p => `- ${inline(p)}`), "");
  }

  s += block(H(2, "全部考点（按模块）"));
  for (const g of D.GROUPS) {
    s += block(`### ${inline(g.name)}`, "");
    for (const m of D.ordered.filter(x => x.group === g.id)) {
      s += block(`#### ${ml(m)}`, ...m.interview.flatMap((q, i) => [
        `- **Q${m.no}.${i + 1}　${inline(q.q)}**`, `  A：${inline(q.a)}`,
      ]), "");
    }
  }

  s += block(H(2, "建议你反问的三个问题"),
    ...D.REVERSE_QUESTIONS.map(q => `- ${inline(q)}`), "",
    `> ${inline(D.REVERSE_NOTE)}`
  );
  return s;
}

/* --------------------------- 4. 图解截屏 --------------------------- */

function captureFigures(D, style) {
  const chrome = fs.existsSync("C:/Program Files/Google/Chrome/Application/chrome.exe")
    ? "C:/Program Files/Google/Chrome/Application/chrome.exe" : "chrome";
  fs.rmSync(FIG_TMP, { recursive: true, force: true });
  fs.mkdirSync(FIG_TMP, { recursive: true });
  fs.mkdirSync(FIGS, { recursive: true });

  for (const [key, dg] of Object.entries(D.DIAG)) {
    const page = `<!doctype html><html lang="zh-CN" data-theme="dark"><head><meta charset="utf-8"><style>${style}
      html,body{margin:0;padding:0;background:var(--bg)}
      .wrap{width:${dg.w}px;height:${dg.h}px;box-sizing:border-box;padding:14px 16px}</style></head>
      <body><div class="wrap">${dg.svg}</div></body></html>`;
    const htmlFile = path.join(FIG_TMP, key + ".html");
    fs.writeFileSync(htmlFile, page);
    execFileSync(chrome, [
      "--headless=new", "--disable-gpu", "--hide-scrollbars",
      "--force-device-scale-factor=2", `--window-size=${dg.w},${dg.h}`,
      "--virtual-time-budget=4000", "--user-data-dir=" + path.join(FIG_TMP, "profile"),
      `--screenshot=${path.join(FIGS, key + ".png")}`, "file:///" + htmlFile.replace(/\\/g, "/"),
    ], { stdio: "pipe" });
    console.log("  figure", key);
  }
  fs.rmSync(FIG_TMP, { recursive: true, force: true });
}

/* --------------------------- 5. 输出 --------------------------- */

const { style, data: D } = loadData();
fs.mkdirSync(DOCS, { recursive: true });

const docs = [];
docs.push(["00-overview.md", overview(D)]);
for (const m of D.ordered) docs.push([fileOf(m), chapter(m, D)]);
docs.push(["appendix-a-learning-path.md", appendixA(D)]);
docs.push(["appendix-b-job-map.md", appendixB(D)]);
docs.push(["appendix-c-interview-index.md", appendixC(D)]);

// docs/ 里的相对链接搬到仓库根目录的全文版时要重新指向
const retarget = b => b
  .replace(/\]\(figures\//g, "](docs/figures/")
  .replace(/\]\(\.\.\/index\.html/g, "](index.html")
  .replace(/\]\(((?:\d\d-[a-z0-9-]+|appendix-[a-c]-[a-z-]+)\.md)\)/g, "](docs/$1)");

// 标题后必须空一行，否则紧跟的表格/引用在部分渲染器里会粘在标题上
const tidy = b => b.replace(/^(#{1,6} .+)\n(?!$)/gm, "$1\n\n").replace(/\n{3,}/g, "\n\n");

for (const [name, body] of docs) {
  fs.writeFileSync(path.join(DOCS, name), tidy(body));
  console.log("  wrote docs/" + name);
}

const fullText = docs
  .map(([name, body]) => retarget(tidy(body)))
  .join("\n\n---\n\n");

fs.writeFileSync(path.join(ROOT, "HANDBOOK.md"),
  `# AI Agent 技术白皮书\n\n` +
  `> **在线交互版（动效图解、逐帧播放、学习进度）：<${LIVE}>**\n\n` +
  `> 本文件由 \`node tools/build-docs.mjs\` 从 \`index.html\`（唯一数据源）自动生成，` +
  `内容与 \`docs/\` 分章完全一致。分章版更适合阅读，本文件适合通读、导出 PDF，或直接喂给你自己的 agent 当检索语料。\n\n` +
  fullText +
  "\n\n---\n\n> 分章目录见 [README](README.md)，逐章文件在 [`docs/`](docs/)。\n");
console.log("  wrote HANDBOOK.md");

if (process.argv.includes("--figures")) {
  console.log("capturing figures …");
  captureFigures(D, style);
}
console.log("done.");
