/**
 * UI 冒烟测试：
 * 1. 用 TypeScript 自带 transpile 把本地 sdk/ 转成 ESM（纯 JS，不启子进程）
 * 2. 把构建产物 dist/index.js 的 @avg-studio/sdk 指向本地副本
 * 3. 用 React SSR 渲染真实扩展 UI，确认能挂载、能读到示例卡牌
 */
import ts from "typescript";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = process.cwd();
const tmp = join(root, "tools", "tmp", "ssr");
mkdirSync(tmp, { recursive: true });

const sdkSrc = join(root, "sdk");
const sdkOut = join(tmp, "sdk");
mkdirSync(sdkOut, { recursive: true });

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      walk(full);
    } else if (name.endsWith(".ts") && !name.endsWith(".d.ts")) {
      const rel = relative(sdkSrc, full).replace(/\\/g, "/");
      const outRel = rel.replace(/\.ts$/, ".mjs");
      const outPath = join(sdkOut, outRel);
      mkdirSync(dirname(outPath), { recursive: true });
      let text = ts.transpileModule(readFileSync(full, "utf8"), {
        compilerOptions: {
          target: ts.ScriptTarget.ES2021,
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.ReactJSX,
        },
        fileName: rel,
      }).outputText;
      // 相对 import 补上 .mjs 后缀（含目录形式 ./types → ./types/index.mjs）
      text = text.replace(/(from\s+")(\.[^"]*)(")/g, (match, a, spec, c) => {
        if (/\.mjs$/.test(spec)) return match;
        if (/\.(json|css)$/.test(spec)) return match;
        const baseDir = dirname(join(sdkSrc, rel));
        if (existsSync(join(baseDir, `${spec}.ts`))) return `${a}${spec}.mjs${c}`;
        if (existsSync(join(baseDir, spec, "index.ts"))) {
          return `${a}${spec}/index.mjs${c}`;
        }
        return match;
      });
      writeFileSync(outPath, text);
      if (outRel === "extension-inspector.mjs") {
        // sdk/extension-inspector.ts 只有类型声明（占位文件），
        // SSR 需要真实导出名，这里补一个运行时占位。
        writeFileSync(outPath, `${text}\nexport const ExtensionInspector = undefined;\n`);
      }
    }
  }
}
walk(sdkSrc);

const bundle = readFileSync(join(root, "dist", "index.js"), "utf8").replace(
  /from\s+"@avg-studio\/sdk"/g,
  `from "${pathToFileURL(join(sdkOut, "index.mjs")).href}"`,
);
const bundlePath = join(tmp, "bundle.mjs");
writeFileSync(bundlePath, bundle);

const sdk = await import(pathToFileURL(join(sdkOut, "index.mjs")).href);
const mod = await import(pathToFileURL(bundlePath).href);
const ExtensionClass = mod.DuelCardForge ?? mod.default;

let checks = 0;
let failures = 0;
function truthy(value, label) {
  checks += 1;
  if (!value) {
    failures += 1;
    console.log(`FAIL  ${label}`);
  } else {
    console.log(`ok    ${label}`);
  }
}

truthy(typeof ExtensionClass === "function", "导出 Extension 子类");
truthy(Boolean(ExtensionClass.meta?.id), `模块 meta.id = ${ExtensionClass.meta?.id}`);
truthy(ExtensionClass.extensionKind === "module", "extensionKind === module");
truthy(typeof ExtensionClass.settings?.build === "function", "声明了 settings");

const instance = new ExtensionClass();
const settingsStore = { cardsJson: "", rulesJson: "" };
const saveStore = { deck: [], wins: 0, losses: 0 };
const fakeContext = {
  settings: {
    get: (key) => settingsStore[key],
    set: (key, value) => {
      settingsStore[key] = value;
    },
    snapshot: () => ({ ...settingsStore }),
    useValue: (key) => React.useState(settingsStore[key]),
    useSnapshot: () => React.useState({ ...settingsStore })[0],
    subscribe: () => () => undefined,
    cross: {
      get: () => undefined,
      set: () => undefined,
      subscribe: () => () => undefined,
    },
  },
  asset: { resolve: (uri) => ({ url: uri }) },
  variables: { get: () => undefined, set: () => undefined, useValue: () => [undefined, () => undefined] },
  ui: { show: () => undefined, hide: () => undefined, hideAll: () => undefined, isVisible: () => false },
  game: { exit: () => undefined, title: () => "test", window: {} },
  subscribe: () => () => undefined,
};

instance.__attachHost({
  id: "test-instance",
  context: fakeContext,
  close: () => undefined,
});
instance.__attachSaveProxy({
  get: (key) => saveStore[key],
  set: (key, value) => {
    saveStore[key] = value;
  },
  useValue: (key) => React.useState(saveStore[key]),
});

const rendered = instance.render();
truthy(rendered && typeof rendered.component === "function", "render() 返回组件");

const html = renderToStaticMarkup(
  React.createElement(
    sdk.ExtensionContextProvider,
    { context: fakeContext },
    React.createElement(rendered.component, rendered.props),
  ),
);
truthy(html.includes("决斗卡牌工坊"), "界面标题渲染成功");
truthy(html.includes("卡牌库"), "卡牌库页渲染成功");
truthy(html.includes("苍蓝星龙"), "内置示例卡牌出现在列表里");
truthy(html.includes("赤瞳魔导士"), "第二张示例卡牌出现在列表里");
truthy(html.includes("攻击力") && html.includes("守备力"), "攻击力/守备力编辑项出现");
truthy(html.includes("花费"), "花费编辑项出现");
truthy(html.includes("种族"), "种族编辑项出现");
truthy(html.includes("立绘") || html.includes("卡图"), "立绘编辑项出现");
truthy(html.includes("卡牌效果"), "卡牌效果编辑区出现");
console.log(`HTML 长度 ${html.length}`);
writeFileSync(join(tmp, "render.html"), html);

console.log(`\n${checks - failures}/${checks} 项通过`);
if (failures > 0) process.exitCode = 1;
