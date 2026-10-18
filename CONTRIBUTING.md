# 贡献指南

感谢你愿意改进「决斗卡牌工坊」。这是一个 LetsGal Studio（AVG Engine）扩展，
结构清晰，改起来不难。

## 开始之前

```bash
pnpm install      # 安装构建依赖（React 与 SDK 由宿主提供，不进包）
pnpm typecheck    # 类型检查
pnpm test         # 引擎 + UI 冒烟测试（44 + 14 + 9 项断言）
pnpm build        # 产出 dist/index.js，并复制出 dist/index.mjs
pnpm preview:build # 生成浏览器预览包，然后双击 preview/index.html 看界面
```

> `pnpm test` 与 `pnpm validate` 里的脚本会用 TypeScript 自带的 transpile
> 把源码转成 ESM 直接跑，不需要额外测试框架；其中 `pnpm validate` 需要本机
> 安装过 LetsGal Studio（它会调用 Studio 自带的清单校验器）。

## 代码结构

| 路径 | 职责 |
| --- | --- |
| `src/index.ts` | 扩展入口：UI 模块 + 项目设置 + 存档 + 剧本方法，并导出剧情 Block |
| `src/types.ts` | 卡牌与规则的数据模型、归一化与默认值 |
| `src/engine/duel-engine.ts` | 纯函数对战引擎（召唤 / 战斗 / 效果 / AI / 回合 / 剧情注入） |
| `src/state/duel-store.ts` | 面板与剧情 Block 共享的对战状态 |
| `src/blocks/story-blocks.ts` | 四个剧情 Block（印卡 / 加入卡牌 / 修改卡牌 / 直接召唤） |
| `src/ui/` | React 界面（卡牌库、卡组、规则、对战） |
| `src/data/starter-cards.ts` | 内置示例卡与示例卡组 |

## 提交改动

1. 先跑 `pnpm typecheck && pnpm test`，确保断言全绿；
2. 改了界面的话，跑 `pnpm preview:build`，用 `preview/index.html` 亲眼确认；
3. 提交时请说明「改了什么」和「怎么验证的」；
4. 如果改动了行为，请同步更新 `README.md`。

## 约定

- **不要修改 `extension.json` 的 `id`**：它是设置、存档与剧本引用的命名空间，改了会让已有项目断链。
- **不要手改 `dist/`**：它由 `pnpm build` 生成；仓库里提交产物只是为了让人开箱即用。
- 源码文件用 `kebab-case.ts` / `kebab-case.tsx` 命名，保持 TypeScript 严格模式，不要用 `any` 绕过类型。
- 单个 PR 只做一件事，避免混入无关的格式改动。

## 适合上手的方向

- 效果系统目前是「触发 × 效果 × 目标 × 数值」的组合，可以扩展条件判断与连锁；
- AI 是启发式策略，可以做得更聪明（换牌、盖牌诱敌、保留资源）；
- 卡面样式、动画与音效还可以继续打磨；
- 对战过程目前只在内存中，可以接存档实现「决斗中断续打」。
