/**
 * 对战界面冒烟测试：把 src/ 全部转成 ESM（含 tsx），用真实引擎状态渲染对战 UI。
 */
import ts from "typescript";
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const root = process.cwd();
const outRoot = join(root, "tools", "tmp", "ui-ssr");
mkdirSync(outRoot, { recursive: true });

// 先复用 ssr-check 产出的 sdk ESM 副本
const sdkDir = join(root, "tools", "tmp", "ssr", "sdk");
if (!existsSync(join(sdkDir, "index.mjs"))) {
  console.error("先运行 tools/ssr-check.mjs 生成 sdk 转译产物。");
  process.exit(1);
}
const sdkUrl = pathToFileURL(join(sdkDir, "index.mjs")).href;

function resolveRelative(baseDir, spec) {
  for (const ext of [".ts", ".tsx"]) {
    if (existsSync(join(baseDir, `${spec}${ext}`))) return `${spec}.mjs`;
  }
  for (const ext of [".ts", ".tsx"]) {
    if (existsSync(join(baseDir, spec, `index${ext}`))) return `${spec}/index.mjs`;
  }
  return null;
}

function transpileTree(srcDir, srcRoot, dstRoot) {
  for (const name of readdirSync(srcDir)) {
    const full = join(srcDir, name);
    if (statSync(full).isDirectory()) {
      transpileTree(full, srcRoot, dstRoot);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(name)) continue;
    const relPath = relative(srcRoot, full).replace(/\\/g, "/");
    const outRel = relPath.replace(/\.(ts|tsx)$/, ".mjs");
    const outPath = join(dstRoot, outRel);
    mkdirSync(dirname(outPath), { recursive: true });
    let text = ts.transpileModule(readFileSync(full, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2021,
        module: ts.ModuleKind.ESNext,
        jsx: ts.JsxEmit.ReactJSX,
      },
      fileName: relPath,
    }).outputText;
    const baseDir = dirname(full);
    text = text.replace(/(from\s+")([^"]+)(")/g, (match, a, spec, c) => {
      if (spec === "@avg-studio/sdk") return `${a}${sdkUrl}${c}`;
      if (!spec.startsWith(".")) return match;
      const resolved = resolveRelative(baseDir, spec);
      return resolved ? `${a}${resolved}${c}` : match;
    });
    writeFileSync(outPath, text);
  }
}

transpileTree(join(root, "src"), join(root, "src"), join(outRoot, "src"));

const sdk = await import(sdkUrl);
const { BattleBoard } = await import(pathToFileURL(join(outRoot, "src", "ui", "battle-board.mjs")).href);
const engine = await import(pathToFileURL(join(outRoot, "src", "engine", "duel-engine.mjs")).href);
const starter = await import(pathToFileURL(join(outRoot, "src", "data", "starter-cards.mjs")).href);
const types = await import(pathToFileURL(join(outRoot, "src", "types.mjs")).href);

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

const fakeContext = {
  settings: {
    get: () => undefined,
    set: () => undefined,
    snapshot: () => ({}),
    useValue: (key) => React.useState(undefined),
    useSnapshot: () => ({}),
    subscribe: () => () => undefined,
    cross: { get: () => undefined, set: () => undefined, subscribe: () => () => undefined },
  },
  asset: { resolve: (uri) => ({ url: uri }) },
  variables: { get: () => undefined, set: () => undefined, useValue: () => [undefined, () => undefined] },
  ui: { show: () => undefined, hide: () => undefined, hideAll: () => undefined, isVisible: () => false },
  game: { exit: () => undefined, title: () => "test", window: {} },
  subscribe: () => () => undefined,
};

let duel = engine.startDuel(starter.STARTER_CARDS, starter.STARTER_DECK, types.DEFAULT_RULES);
// 手动召唤一只，确保场地渲染分支被覆盖
duel.player.energy = 10;
const firstMonster = duel.player.hand.find((c) => c.card.kind === "monster");
if (firstMonster) {
  const result = engine.summonMonster(duel, firstMonster.uid, "attack");
  if (result.ok) duel = result.state;
}

const noop = () => undefined;
const element = React.createElement(
  sdk.ExtensionContextProvider,
  { context: fakeContext },
  React.createElement(BattleBoard, {
    state: duel,
    deckCount: 37,
    deckValid: true,
    wins: 2,
    losses: 1,
    onStart: noop,
    onSummon: noop,
    onActivateSpell: noop,
    onSetTrap: noop,
    onAttack: noop,
    onChangePosition: noop,
    onStartBattle: noop,
    onEndTurn: noop,
    onExit: noop,
  }),
);
const html = renderToStaticMarkup(element);
truthy(html.includes("决斗记录"), "对战日志面板渲染");
truthy(html.includes("手牌"), "手牌区渲染");
truthy(html.includes("8000"), "生命值显示");
truthy(html.includes("进入战斗阶段"), "战斗阶段按钮渲染");
truthy(html.includes("结束回合"), "结束回合按钮渲染");
truthy(html.includes("能量"), "能量条渲染");
truthy(html.includes("空") || html.includes("攻 "), "场地槽位渲染");

// 开始界面（无对局）
const startHtml = renderToStaticMarkup(
  React.createElement(
    sdk.ExtensionContextProvider,
    { context: fakeContext },
    React.createElement(BattleBoard, {
      state: null,
      deckCount: 37,
      deckValid: true,
      wins: 0,
      losses: 0,
      onStart: noop,
      onSummon: noop,
      onActivateSpell: noop,
      onSetTrap: noop,
      onAttack: noop,
      onChangePosition: noop,
      onStartBattle: noop,
      onEndTurn: noop,
      onExit: noop,
    }),
  ),
);
truthy(startHtml.includes("准备决斗"), "开始界面渲染");
truthy(startHtml.includes("开始决斗"), "开始按钮渲染");

writeFileSync(join(outRoot, "battle.html"), html);
console.log(`HTML 长度 ${html.length}`);
console.log(`\n${checks - failures}/${checks} 项通过`);
if (failures > 0) process.exitCode = 1;
