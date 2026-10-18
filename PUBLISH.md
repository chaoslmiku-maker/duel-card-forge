# 发布清单 · 决斗卡牌工坊 v1.4.0

面向 **LetsGal Studio 扩展工坊** 的上传准备。所有物料都已生成并校验通过。

## 一、两种包，别用错

| 用途 | 位置 | 内容 |
| --- | --- | --- |
| **工坊提交（源码包）** | `submit/duel-card-forge/`<br>`submit/duel-card-forge-src-v1.4.0.zip` | `package.json` + `src/` + `sdk/` + `dist/` + `assets/` + 配置，**不含 `node_modules`**（1.9 MB） |
| 分发给玩家（运行包） | `release/duel-card-forge/`<br>`release/duel-card-forge-v1.4.0.zip` | 只含运行时文件（约 800 KB） |

> 工坊提交校验**要求 `package.json`，也要求 `dist/index.mjs`**。所以：
> - 提交用 `submit/duel-card-forge`（源码包）；
> - `release/` 只用于「把扩展直接发给别人导入」，拿去提交会报「源码包里找不到 package.json」。

源码包结构：

```
duel-card-forge/
├── extension.json
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vite.config.ts / vite.preview.config.ts
├── README.md / PUBLISH.md
├── scripts/postbuild.mjs
├── src/                  ← 全部源码
├── sdk/                  ← Studio SDK 副本
├── dist/                 ← index.js / index.mjs / map
├── assets/               ← 图标 + 4 张截图
├── preview/              ← 浏览器预览页
└── tools/                ← 自测脚本
```

## 二、两个常见报错

| 报错 | 原因 | 处理 |
| --- | --- | --- |
| **找不到构建产物**：请生成 `dist/index.mjs` | 提交包里只有 `dist/index.js` | `pnpm build` 会自动复制出 `dist/index.mjs`；已包含在 `submit/` 与 `release/` 里 |
| **源码包里找不到 package.json** | 提交了纯运行包 `release/` | 改提交 `submit/duel-card-forge`（或对应 zip） |

## 三、上传前必须确认的两件事

1. **作者名**：`extension.json` 里 `author` 现在是「卡牌作战自定义」，建议改成你的工坊昵称，改完重新打包（`id` 千万不要改，改了会断开设置/存档/剧本引用）。
2. **版本号**：当前是 `1.4.0`；之后每次更新都要递增（工坊按版本判定「有新版本」）。

## 四、工坊提交步骤

1. Studio 顶部进入 **工坊**；
2. 切到 **我发布的**，点右上角的 **提交 / 上传扩展**；
3. 选择目录/压缩包：`submit/duel-card-forge` 或 `submit/duel-card-forge-src-v1.4.0.zip`；
4. 填写投稿信息（下面有小节可直接复制）；
5. 截图区域拖入 `assets/screenshots/` 的 4 张图，顺序建议：卡牌库 → 对战 → 卡组 → 规则；
6. README 区域粘贴 `README.md` 内容（或上传该文件）；
7. 提交，等待审核；审核状态与「提交新版本」都在 **我发布的** 里。

## 五、投稿文案（可直接复制）

**标题**：决斗卡牌工坊

**一句话简介**：
> 攻击力、守备力、种族、花费、效果、立绘全部可视化编辑的游戏王风卡牌对战扩展，对战规则也能随时改。

**详细简介**：
> 决斗卡牌工坊把「做卡」和「打牌」放进同一个面板：左边改卡，右边卡面实时预览；规则页调生命值、能量、召唤次数、祭品等级、穿透与胜负条件，改完立刻生效。
> 内置 17 张示例卡与 36 张示例卡组，装好即可开打；卡牌库支持导出/导入 JSON，方便把整套卡搬到别的项目。
> 对战按游戏王式规则结算：攻守表示、祭品召唤、攻对攻比攻击力、攻对守比守备力、穿透、陷阱在攻击宣言时自动触发。
> 剧情里还能用「开始战斗 / 印卡 / 加入卡牌 / 修改卡牌 / 直接召唤」五个 Block 直接开战并实时干预牌局：剧本中开一局、打完按胜负分支、临场印出王牌、改 BOSS 的攻击力、把角色专属卡直接拍上场，面板会立即刷新。
> 卡牌与规则保存在项目设置里（创作者内容），卡组与战绩保存在存档里（玩家进度）。

**标签建议**：卡牌、卡牌战斗、小游戏、回合制、对战、游戏王、可视化编辑、规则自定义

**首版更新说明**：
> 1.0.0 首次发布：卡牌库可视化编辑（攻击/守备/种族/花费/效果/立绘/关键词）、卡组构筑、完整规则编辑、游戏王式对战与 AI 对手、JSON 导入导出、四个剧情 Block（印卡 / 加入卡牌 / 修改卡牌 / 直接召唤）、剧本方法（打开面板 / 重置示例卡组 / 读取卡牌数量）。

**1.1.0 更新说明**：
> 新增「开始战斗」Block：可以在剧情里直接开一局，自动打开面板，等分出胜负后再继续剧情，并把 `win / lose / draw` 写入变量供 If 分支使用；玩家中途关闭面板记为 `aborted`，不会卡住剧本。

**1.2.0 更新说明**：
> 「开始战斗」Block 支持指定**对手卡组**（与玩家相同 / 示例卡组 / 按「卡名*张数」自定义）与**先手**（玩家先攻 / 对手先攻）；对手先攻时会自动打完自己的首回合再把操作权交给玩家，并遵守「先攻可否攻击」规则。

**1.3.0 更新说明**：
> 新增两套可切换的战斗模式：**影之诗风**（主战者 20 生命、费用逐回合增长、随从有生命值且伤害跨回合保留、进化点 +2/+2、可直接攻击主战者）与**即时对战·皇室战争风**（圣水随时间回复、两条兵线自动推进、防御塔与国王塔、时间到按皇冠判定）。规则页顶部一键切换并套用推荐规则；卡牌编辑器新增即时模式专用的移动速度 / 攻击间隔 / 攻击距离；剧情「开始战斗」会自动按当前模式开局。

**1.4.0 更新说明**：
> 新增第四种战斗模式「**半即时（武器对战）**」：没有回合与先后手，资源按每分钟回复，双方随时出牌；卡牌新增「单位 / 武器 / 法术 / 场地 / 王牌」定位，武器装备到主战者并可挥砍、消耗耐久；支持飞行越线、挡刀、战斗经验成长、被破坏触发遗效，以及缴械、击退两种新效果；限时结束按场面评分判定。规则页新增开局资源、每分钟回复、资源上限与对局时长设置。

## 六、审核会看什么（本扩展的现状）

| 项目 | 状态 |
| --- | --- |
| `extension.json` 合法性 | 已用 Studio 自带校验器 `sdk/types/validate-manifest.ts` 校验通过 |
| 权限声明 | `permissions: []`，不申请任何敏感权限 |
| 网络访问 | 无；立绘支持填 URL，但扩展自身不发请求，由宿主渲染 `<img>` |
| 外部依赖 | 无；`react` / `react-dom` / `@avg-studio/sdk` 全部外置，由宿主提供 |
| 风险分级 | `riskTier: "safe"` |
| 产物大小 | `dist/index.mjs` 184 KB（含 sourcemap 共约 505 KB） |

## 七、发布后的维护

- **改卡/改规则**：不需要重新发版，玩家在面板里改的是项目设置。
- **改代码/加功能**：改 `src/` → `pnpm build` → 递增 `extension.json.version` → 重新打包 → 在「我发布的 → 提交新版本」上传；扩展 `id` 保持不变，项目引用与存档不受影响。
- **自检命令**：
  - `pnpm typecheck`
  - `pnpm build`
  - `node tools/test-engine.mjs`（101 项）
  - `node tools/ssr-check.mjs`（14 项）
  - `node tools/ssr-battle.mjs`（9 项）
  - `node tools/validate-release.mjs`（用 Studio 校验器检查发布清单）

## 八、GitHub 仓库

仓库地址：https://github.com/chaoslmiku-maker/duel-card-forge （公开，MIT）

仓库里**已经包含 `dist/`**，所以别人 `git clone` 后不用装依赖、不用构建，直接把这个目录当扩展导入 Studio 就能用。

```bash
git clone https://github.com/chaoslmiku-maker/duel-card-forge.git
cd duel-card-forge
# 直接导入 Studio，或想改源码时：
pnpm install && pnpm build && pnpm test
```

日常更新流程：

```bash
pnpm build              # 改了 src/ 之后必须重新构建（dist 也要一起提交）
pnpm test               # 确认断言全绿
git add -A
git commit -m "feat: 说明这次改了什么"
git push
```

发版（打标签 + GitHub Release）：

```bash
# extension.json 里的 version 先递增，例如 1.0.0 → 1.0.1
pnpm build && pnpm pack:release
git add -A && git commit -m "chore: release v1.0.1"
git tag -a v1.0.1 -m "决斗卡牌工坊 v1.0.1"
git push && git push origin v1.0.1
```

然后在 GitHub 的 `Releases → Draft a new release` 里选刚推的标签，
把 `release/duel-card-forge-v1.0.1.zip`（玩家导入用）和
`submit/duel-card-forge-src-v1.0.1.zip`（工坊提交用）拖进附件即可。

> 推送凭据已经存在 Windows 凭据管理器里，平时 `git push` 不会再次要求输入 Token；
> Token 过期后重新生成一个，下次推送时输入新的即可。

