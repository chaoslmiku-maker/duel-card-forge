/**
 * 引擎烟雾测试：用 TypeScript 自带 transpile（纯 JS，不启动子进程）
 * 把 src/engine 与 src/data 转成 ESM，然后在 Node 里跑真实对局断言。
 */
import ts from "typescript";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const tmp = join(root, "tools", "tmp");
mkdirSync(tmp, { recursive: true });

function transpile(relSrc, relOut) {
  const src = readFileSync(join(root, relSrc), "utf8");
  const out = ts.transpileModule(src, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2021,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: relSrc,
  }).outputText;
  const outPath = join(tmp, relOut);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, out);
  return pathToFileURL(outPath).href;
}

const engineUrl = transpile("src/engine/duel-engine.ts", "engine.mjs");
const realtimeUrl = transpile("src/engine/realtime-engine.ts", "realtime.mjs");
const skirmishUrl = transpile("src/engine/skirmish-engine.ts", "skirmish.mjs");
const cardsUrl = transpile("src/data/starter-cards.ts", "starter.mjs");
const typesUrl = transpile("src/types.ts", "types.mjs");

const engine = await import(engineUrl);
const rt = await import(realtimeUrl);
const sk = await import(skirmishUrl);
const { STARTER_CARDS, STARTER_DECK } = await import(cardsUrl);
const { DEFAULT_RULES } = await import(typesUrl);

let failures = 0;
let checks = 0;
function eq(actual, expected, label) {
  checks += 1;
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failures += 1;
    console.log(`FAIL  ${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  } else {
    console.log(`ok    ${label} = ${JSON.stringify(actual)}`);
  }
}
function truthy(value, label) {
  checks += 1;
  if (!value) {
    failures += 1;
    console.log(`FAIL  ${label}: expected truthy, got ${String(value)}`);
  } else {
    console.log(`ok    ${label}`);
  }
}

const mk = (card, position = "attack") => ({
  uid: `u_${Math.random().toString(36).slice(2, 8)}`,
  card,
  position,
  atkMod: 0,
  defMod: 0,
  tempAtk: 0,
  tempDef: 0,
  attacksUsed: 0,
  changedPosition: false,
  damage: 0,
  evolved: false,
});

const dragon = {
  id: "t_dragon",
  name: "测试小龙",
  kind: "monster",
  race: "龙族",
  attribute: "fire",
  level: 4,
  attack: 2000,
  defense: 1000,
  cost: 2,
  art: "",
  description: "",
  effects: [],
  keywords: [],
};
const bigDragon = {
  ...dragon,
  id: "t_big",
  name: "测试大龙",
  level: 8,
  attack: 3000,
  defense: 2000,
  cost: 6,
};
const wall = {
  ...dragon,
  id: "t_wall",
  name: "测试墙",
  level: 3,
  attack: 500,
  defense: 1500,
  cost: 1,
};
const piercer = {
  ...dragon,
  id: "t_pierce",
  name: "穿透龙",
  keywords: ["pierce"],
};
const bombCard = {
  ...dragon,
  id: "t_bomb",
  name: "炸弹龙",
  effects: [
    { id: "e1", trigger: "on-summon", kind: "damage", target: "enemy-lp", value: 600, stat: "attack", duration: "turn" },
  ],
};
const library = [dragon, bigDragon, wall, piercer, bombCard];

const baseRules = { ...DEFAULT_RULES, startingHand: 2, deckMinSize: 1, aiEnabled: false };
const deckOf = (card, count) => [{ cardId: card.id, count }];

// 1. 开局
let s = engine.startDuel(library, deckOf(dragon, 6), baseRules);
eq(s.player.hand.length, 2, "开局手牌 2 张");
eq(s.player.lp, baseRules.startingLp, "初始 LP");
eq(s.player.energy, baseRules.energyStart, "初始能量");
eq(s.turn, 1, "第 1 回合");
eq(s.active, "player", "玩家先攻");
eq(s.attackLocked, true, "先攻回合攻击锁定");

// 2. 通常召唤
const firstHand = s.player.hand[0];
s.player.energy = 10;
let r = engine.summonMonster(s, firstHand.uid, "attack");
truthy(r.ok, "召唤成功");
s = r.state;
eq(s.player.monsters.filter(Boolean).length, 1, "场上 1 只怪兽");
eq(s.player.hand.length, 1, "手牌减少");
const second = s.player.hand[0];
r = engine.summonMonster(s, second.uid, "attack");
eq(r.ok, false, "每回合只能召唤一次");
eq(r.message.includes("召唤次数"), true, "召唤次数不足提示");

// 3. 结束回合（无 AI 时交还玩家）
s = engine.endTurn(s).state;
eq(s.active, "player", "回合交还玩家");
eq(s.turn, 2, "进入第 2 回合");
eq(s.player.energy, 9, "能量按规则回复（8+1）");
eq(s.attackLocked, false, "第 2 回合可以攻击");

// 4. 祭品召唤
s.player.energy = 20;
s.player.hand = [mk(bigDragon), mk(dragon)];
s.player.monsters = [mk(dragon), mk(wall), null];
r = engine.summonMonster(s, s.player.hand[0].uid, "attack", [s.player.monsters[0].uid, s.player.monsters[1].uid]);
truthy(r.ok, "2 祭品召唤成功");
s = r.state;
truthy(s.player.monsters.some((m) => m && m.card.id === "t_big"), "大龙在场上");
eq(s.player.graveyard.length, 2, "两只祭品进入墓地");

// 5. 直接攻击
s = {
  ...s,
  phase: "battle",
  opponent: { ...s.opponent, lp: 8000, monsters: [null, null, null] },
};
const attacker = s.player.monsters.find((m) => m && m.card.id === "t_big");
const beforeLp = s.opponent.lp;
r = engine.declareAttack(s, attacker.uid, null);
truthy(r.ok, "直接攻击成功");
s = r.state;
eq(s.opponent.lp, beforeLp - 3000, "直接攻击造成 3000 伤害");

// 6. 攻击表示对战（攻高者胜）
s = {
  ...s,
  phase: "battle",
  attackLocked: false,
  player: { ...s.player, monsters: [mk(dragon), null, null] },
  opponent: { ...s.opponent, lp: 8000, monsters: [mk(wall), null, null] },
};
r = engine.declareAttack(s, s.player.monsters[0].uid, s.opponent.monsters[0].uid);
s = r.state;
eq(s.opponent.monsters.filter(Boolean).length, 0, "对方怪兽被战斗破坏");
eq(s.opponent.lp, 8000 - 1500, "攻防差 1500 的伤害");

// 7. 守备表示：无穿透时只破坏怪兽，不造成伤害
s = {
  ...s,
  phase: "battle",
  attackLocked: false,
  player: { ...s.player, monsters: [mk(dragon), null, null] },
  opponent: { ...s.opponent, lp: 8000, monsters: [mk({ ...wall, keywords: [] }, "defense"), null, null] },
};
r = engine.declareAttack(s, s.player.monsters[0].uid, s.opponent.monsters[0].uid);
s = r.state;
eq(s.opponent.monsters.filter(Boolean).length, 0, "守备怪兽被击破");
eq(s.opponent.lp, 8000, "无穿透时不造成战斗伤害");

// 8. 穿透关键词
s = {
  ...s,
  phase: "battle",
  attackLocked: false,
  player: { ...s.player, monsters: [mk(piercer), null, null] },
  opponent: { ...s.opponent, lp: 8000, monsters: [mk(wall, "defense"), null, null] },
};
r = engine.declareAttack(s, s.player.monsters[0].uid, s.opponent.monsters[0].uid);
s = r.state;
eq(s.opponent.lp, 8000 - 500, "穿透造成 2000-1500=500 伤害");

// 9. 召唤触发效果伤害
s = {
  ...s,
  active: "player",
  phase: "main",
  winner: undefined,
  summonsThisTurn: 0,
  attackLocked: false,
  player: { ...s.player, energy: 10, hand: [mk(bombCard)], monsters: [null, null, null] },
  opponent: { ...s.opponent, lp: 8000 },
};
r = engine.summonMonster(s, s.player.hand[0].uid, "attack");
s = r.state;
eq(s.opponent.lp, 7400, "召唤效果造成 600 伤害");

// 10. 陷阱反制
const negateTrap = {
  ...dragon,
  id: "t_negate",
  name: "反制",
  kind: "trap",
  effects: [
    { id: "e2", trigger: "on-activate", kind: "negate", target: "enemy-strongest", value: 0, stat: "attack", duration: "turn" },
  ],
};
s = {
  ...s,
  active: "player",
  phase: "battle",
  attackLocked: false,
  player: { ...s.player, monsters: [mk(dragon), null, null] },
  opponent: { ...s.opponent, lp: 8000, monsters: [null, null, null], traps: [{ uid: "trap1", card: negateTrap }, null] },
};
r = engine.declareAttack(s, s.player.monsters[0].uid, null);
s = r.state;
eq(s.opponent.lp, 8000, "陷阱无效了攻击");
eq(s.opponent.traps.filter(Boolean).length, 0, "陷阱进入墓地");

// 11. 胜利判定
s = {
  ...s,
  active: "player",
  phase: "battle",
  attackLocked: false,
  winner: undefined,
  player: { ...s.player, monsters: [mk(dragon), null, null] },
  opponent: { ...s.opponent, lp: 1500, monsters: [null, null, null], traps: [null, null] },
};
r = engine.declareAttack(s, s.player.monsters[0].uid, null);
s = r.state;
eq(s.winner, "player", "LP 归零判负");

// 12. 卡组抽空判负
s = engine.startDuel(library, deckOf(dragon, 2), { ...baseRules, startingHand: 2 });
s = { ...s, player: { ...s.player, deck: [] } };
r = engine.endTurn(s);
s = r.state;
eq(s.winner, "player", "对手准备抽牌时卡组为空，玩家获胜");

// 13. 内置示例卡组可以正常开局
let starter = engine.startDuel(STARTER_CARDS, STARTER_DECK, DEFAULT_RULES);
eq(starter.player.hand.length, DEFAULT_RULES.startingHand, "示例卡组开局手牌");
truthy(starter.player.deck.length > 0, "示例卡组牌库非空");

// 14. AI 回合
const aiRules = { ...DEFAULT_RULES, startingHand: 3, aiEnabled: true };
let ai = engine.startDuel(STARTER_CARDS, STARTER_DECK, aiRules);
ai = engine.endTurn(ai).state;
eq(ai.active, "player", "AI 行动后交还玩家");
truthy(ai.turn >= 2, "AI 推进了回合");
truthy(ai.log.length > 0, "AI 产生决斗日志");

// 15. AI 遵守每回合召唤次数
const aiRules2 = {
  ...DEFAULT_RULES,
  startingHand: 6,
  aiEnabled: true,
  summonPerTurn: 1,
  energyStart: 10,
  energyPerTurn: 5,
  energyMax: 10,
};
let ai2 = engine.startDuel(STARTER_CARDS, STARTER_DECK, aiRules2);
ai2 = engine.endTurn(ai2).state;
truthy(
  ai2.opponent.monsters.filter(Boolean).length <= 1,
  `AI 每回合最多召唤 1 次（实际 ${ai2.opponent.monsters.filter(Boolean).length}）`,
);

// 16. 剧情 Block：直接召唤（无视花费/次数/祭品）
let story = engine.startDuel(library, deckOf(dragon, 6), { ...baseRules, aiEnabled: false });
story = { ...story, player: { ...story.player, energy: 0 } };
const direct = engine.summonDirect(story, "player", bigDragon, "attack");
truthy(direct.ok, "直接召唤成功（能量为 0 也能召唤）");
story = direct.state;
truthy(
  story.player.monsters.some((m) => m && m.card.id === "t_big"),
  "大龙被直接放到场上",
);

// 17. 剧情 Block：把卡加进手牌 / 卡组
const handBefore = story.player.hand.length;
const deckBefore = story.player.deck.length;
story = engine.addCardToZone(story, "player", wall, "hand", 2);
story = engine.addCardToZone(story, "player", wall, "deck-top", 1);
eq(story.player.hand.length, handBefore + 2, "加牌：手牌 +2");
eq(story.player.deck.length, deckBefore + 1, "加牌：卡组 +1");

// 18. 剧情 Block：改卡后场上/手牌的实例同步更新
const buffedDragon = { ...bigDragon, attack: 3500, defense: 2600, description: "印出来的强化版" };
story = engine.replaceCardInstances(story, "t_big", buffedDragon);
const fieldDragon = story.player.monsters.find((m) => m && m.card.id === "t_big");
eq(fieldDragon.card.attack, 3500, "场上怪兽攻击力同步为 3500");
eq(fieldDragon.card.description, "印出来的强化版", "场上怪兽效果文本同步更新");

// 19. 直接召唤会触发召唤效果
let effectState = engine.startDuel(library, deckOf(bombCard, 6), {
  ...baseRules,
  aiEnabled: false,
});
effectState = { ...effectState, opponent: { ...effectState.opponent, lp: 8000 } };
const bombResult = engine.summonDirect(effectState, "player", bombCard, "defense");
eq(bombResult.state.opponent.lp, 7400, "直接召唤触发 600 点召唤效果伤害");

// 20. 场上满员时直接召唤失败
let fullState = engine.startDuel(library, deckOf(dragon, 6), baseRules);
fullState = {
  ...fullState,
  player: {
    ...fullState.player,
    monsters: [mk(dragon), mk(dragon), mk(dragon)],
  },
};
const fullResult = engine.summonDirect(fullState, "player", dragon, "attack");
eq(fullResult.ok, false, "场上满员时直接召唤失败");

// 21. 指定对手卡组：双方各用各的牌
let twoDecks = engine.startDuel(
  library,
  deckOf(dragon, 5),
  baseRules,
  deckOf(wall, 6),
);
eq(
  twoDecks.opponent.hand.length + twoDecks.opponent.deck.length,
  6,
  "对手使用指定卡组（共 6 张）",
);
truthy(
  [...twoDecks.opponent.hand, ...twoDecks.opponent.deck].every(
    (c) => c.card.id === "t_wall",
  ),
  "对手所有牌都来自指定卡组",
);
truthy(
  [...twoDecks.player.hand, ...twoDecks.player.deck].every(
    (c) => c.card.id === "t_dragon",
  ),
  "玩家牌库不受对手卡组影响",
);

// 22. 对手先攻（AI 关闭时对手直接跳过）
const opponentFirst = engine.startDuel(
  library,
  deckOf(dragon, 6),
  { ...baseRules, aiEnabled: false },
  undefined,
  "opponent",
);
eq(opponentFirst.active, "player", "对手先攻后轮到玩家");
eq(opponentFirst.turn, 2, "对手先攻后回合数推进到 2");
eq(
  opponentFirst.player.hand.length,
  baseRules.startingHand + baseRules.drawPerTurn,
  "后手玩家在首个回合正常抽牌",
);
truthy(
  opponentFirst.log.some((l) => l.text.includes("先攻")),
  "日志记录了对手先攻",
);

// 23. 对手先攻 + 先攻不可攻击：AI 会召唤但不会打掉玩家 LP
const strong = {
  ...dragon,
  id: "t_strong",
  name: "测试强攻",
  level: 3,
  attack: 3000,
  defense: 1000,
  cost: 1,
};
const strongLibrary = [...library, strong];
const lockRules = {
  ...DEFAULT_RULES,
  startingHand: 3,
  aiEnabled: true,
  summonPerTurn: 1,
  energyStart: 10,
  energyPerTurn: 10,
  energyMax: 10,
  firstTurnAttack: false,
};
let lockState = engine.startDuel(
  strongLibrary,
  deckOf(strong, 8),
  lockRules,
  deckOf(strong, 8),
  "opponent",
);
eq(
  lockState.player.lp,
  lockRules.startingLp,
  "先攻不可攻击：AI 首回合不会打掉玩家 LP",
);
truthy(
  lockState.opponent.monsters.filter(Boolean).length > 0,
  "AI 首回合仍然会召唤怪兽",
);

// 24. 先攻可以攻击：AI 首回合就能造成伤害
const rushRules = { ...lockRules, firstTurnAttack: true };
const rush = engine.startDuel(
  strongLibrary,
  deckOf(strong, 8),
  rushRules,
  deckOf(strong, 8),
  "opponent",
);
truthy(
  rush.player.lp < rushRules.startingLp,
  `先攻可攻击：AI 首回合造成伤害（玩家 LP ${rush.player.lp}）`,
);

// ---------------------------------------------------------------------------
// 影之诗模式
// ---------------------------------------------------------------------------
const svRules = {
  ...DEFAULT_RULES,
  battleMode: "shadowverse",
  startingLp: 20,
  startingHand: 3,
  monsterZones: 5,
  spellZones: 0,
  energyStart: 10,
  energyMax: 10,
  aiEnabled: false,
  evolvePoints: 3,
  evolveAttack: 2,
  evolveDefense: 2,
  firstTurnAttack: true,
};
const tankA = {
  ...dragon,
  id: "t_tank_a",
  name: "测试重装A",
  attack: 1000,
  defense: 5000,
};
const tankB = {
  ...dragon,
  id: "t_tank_b",
  name: "测试重装B",
  attack: 500,
  defense: 1500,
};
const svLibrary = [...library, tankA, tankB];

let sv = engine.startDuel(svLibrary, deckOf(tankA, 6), svRules);
sv = {
  ...sv,
  phase: "battle",
  attackLocked: false,
  player: { ...sv.player, monsters: [mk(tankA), null, null, null, null] },
  opponent: { ...sv.opponent, monsters: [mk(tankB), null, null, null, null] },
};
let svResult = engine.declareAttack(sv, sv.player.monsters[0].uid, sv.opponent.monsters[0].uid);
sv = svResult.state;
eq(sv.opponent.monsters[0].damage, 1000, "影之诗：目标累计 1000 伤害");
eq(sv.player.monsters[0].damage, 500, "影之诗：攻击方也受到反击伤害");
eq(engine.monsterHealth(sv.opponent.monsters[0]), 500, "影之诗：生命跨回合保留（1500-1000）");

// 再打一次：生命归零则破坏
sv = {
  ...sv,
  player: {
    ...sv.player,
    monsters: [{ ...sv.player.monsters[0], attacksUsed: 0 }, null, null, null, null],
  },
};
svResult = engine.declareAttack(sv, sv.player.monsters[0].uid, sv.opponent.monsters[0].uid);
sv = svResult.state;
eq(sv.opponent.monsters[0], null, "影之诗：生命归零的随从被破坏");

// 可以直接攻击玩家（即使对面有随从）
const weakA = {
  ...dragon,
  id: "t_weak_a",
  name: "测试轻击",
  attack: 15,
  defense: 5000,
};
let svFace = engine.startDuel(svLibrary, deckOf(tankA, 6), svRules);
svFace = {
  ...svFace,
  phase: "battle",
  attackLocked: false,
  player: { ...svFace.player, monsters: [mk(weakA), null, null, null, null] },
  opponent: { ...svFace.opponent, monsters: [mk(tankB), null, null, null, null] },
};
svResult = engine.declareAttack(svFace, svFace.player.monsters[0].uid, null);
truthy(svResult.ok, "影之诗：对面有随从也能直接攻击玩家");
eq(svResult.state.opponent.lp, 20 - 15, "影之诗：直接攻击扣主战者生命");

// 进化
let svEvolve = engine.startDuel(svLibrary, deckOf(tankA, 6), svRules);
svEvolve = {
  ...svEvolve,
  player: { ...svEvolve.player, monsters: [mk(tankA), null, null, null, null] },
};
const evolveResult = engine.evolveMonster(svEvolve, svEvolve.player.monsters[0].uid);
truthy(evolveResult.ok, "影之诗：进化成功");
const evolved = evolveResult.state.player.monsters[0];
eq(engine.effectiveAttack(evolved), 1002, "影之诗：进化后攻击 +2");
eq(engine.monsterHealth(evolved), 5002, "影之诗：进化后生命 +2");
eq(evolveResult.state.evolve.player, 2, "影之诗：进化点 -1");
const evolveAgain = engine.evolveMonster(evolveResult.state, evolved.uid);
eq(evolveAgain.ok, false, "影之诗：同一随从不能进化两次");

// ---------------------------------------------------------------------------
// 即时对战模式
// ---------------------------------------------------------------------------
const rtRules = { ...DEFAULT_RULES, battleMode: "realtime", elixirMax: 10, aiEnabled: false };
let rs = rt.startRealtime(library, deckOf(dragon, 8), rtRules);
eq(rs.towers.length, 6, "即时：双方各 2 塔 + 1 国王塔");
eq(rs.hand.player.length, 4, "即时：起手 4 张");
eq(rs.elixir.player >= 5, true, "即时：开局有初始圣水");

const playableIndex = rs.hand.player.findIndex(
  (card) => card.cost <= rs.elixir.player,
);
truthy(playableIndex >= 0, "即时：有一张付得起的牌");
const elixirBefore = rs.elixir.player;
const deployResult = rt.deploy(rs, "player", playableIndex, 0);
truthy(deployResult.ok, "即时：部署成功");
rs = deployResult.state;
eq(rs.units.length, 1, "即时：场上出现 1 个单位");
truthy(rs.elixir.player < elixirBefore, "即时：部署扣除圣水");
eq(rs.hand.player.length, 4, "即时：部署后补牌");

const unit = rs.units[0];
const xBefore = unit.x;
rs = rt.tick(rs, 500);
const moved = rs.units.find((u) => u.uid === unit.uid);
truthy(moved && moved.x > xBefore, "即时：单位向敌方推进");

// 单位靠近敌方塔后能造成伤害
const strongUnitCard = {
  ...dragon,
  id: "t_rt_strong",
  name: "测试攻城兽",
  attack: 500,
  defense: 1000,
  moveSpeed: 1,
  attackIntervalMs: 500,
  range: 1,
};
let rsSolo = rt.startRealtime(library, deckOf(dragon, 8), rtRules);
rsSolo = {
  ...rsSolo,
  units: [
    {
      uid: "u_test",
      side: "player",
      lane: 0,
      card: strongUnitCard,
      hp: 1000,
      maxHp: 1000,
      x: 6.2,
      cooldown: 0,
    },
  ],
};
const enemyLaneTower = rsSolo.towers.find(
  (t) => t.side === "opponent" && t.lane === 0,
);
const towerHpBefore = enemyLaneTower.hp;
rsSolo = rt.tick(rsSolo, 600);
const towerAfter = rsSolo.towers.find((t) => t.side === "opponent" && t.lane === 0);
truthy(towerAfter.hp < towerHpBefore, "即时：单位攻击敌方防御塔");

// 推掉普通塔 → 皇冠 +1，国王塔才可被攻击
let rsBreak = rt.startRealtime(library, deckOf(dragon, 8), rtRules);
rsBreak = {
  ...rsBreak,
  towers: rsBreak.towers.map((t) =>
    t.side === "opponent" && t.lane === 0 ? { ...t, hp: 10 } : t,
  ),
  units: [
    {
      uid: "u_break",
      side: "player",
      lane: 0,
      card: strongUnitCard,
      hp: 1000,
      maxHp: 1000,
      x: 6.2,
      cooldown: 0,
    },
  ],
};
rsBreak = rt.tick(rsBreak, 600);
eq(rsBreak.crowns.player, 1, "即时：推掉普通塔获得 1 皇冠");
eq(
  rsBreak.towers.find((t) => t.side === "opponent" && t.lane === 0).alive,
  false,
  "即时：普通塔被摧毁",
);

// 时间到按皇冠判定
let rsTime = rt.startRealtime(library, deckOf(dragon, 8), rtRules);
rsTime = {
  ...rsTime,
  timeMs: rsTime.timeLimitMs - 50,
  crowns: { player: 2, opponent: 0 },
};
rsTime = rt.tick(rsTime, 100);
eq(rsTime.winner, "player", "即时：时间到按皇冠数判定胜负");

// ---------------------------------------------------------------------------
// 半即时（武器对战）
// ---------------------------------------------------------------------------
const skRules = {
  ...DEFAULT_RULES,
  battleMode: "skirmish",
  startingLp: 30,
  startingHand: 5,
  manaStart: 10,
  manaPerMinute: 10,
  elixirMax: 10,
  matchSeconds: 300,
  aiEnabled: false,
  monsterZones: 5,
  spellZones: 1,
};
const skCard = (over) => ({
  id: "sk_x",
  name: "测试卡",
  kind: "monster",
  race: "测试",
  attribute: "light",
  level: 1,
  attack: 10,
  defense: 100,
  cost: 1,
  art: "",
  description: "",
  effects: [],
  keywords: [],
  ...over,
});
const skUnit = skCard({ id: "sk_unit", name: "测试单位", attack: 10, defense: 100, attackIntervalMs: 500 });
const skWall = skCard({ id: "sk_wall", name: "测试挡刀", attack: 1, defense: 500, keywords: ["indestructible"] });
const skFlyer = skCard({ id: "sk_flyer", name: "测试飞行", attack: 10, defense: 100, keywords: ["direct"] });
const skWeapon = skCard({
  id: "sk_weapon",
  name: "测试短剑",
  kind: "trap",
  role: "weapon",
  attack: 5,
  defense: 3,
  attackIntervalMs: 600,
});
const skFieldCard = skCard({ id: "sk_field", name: "测试场地", kind: "trap", role: "field", attack: 4, defense: 0 });
const skSpell = skCard({
  id: "sk_spell",
  name: "测试火球",
  kind: "spell",
  role: "spell",
  effects: [{ id: "e1", trigger: "on-activate", kind: "damage", target: "enemy-lp", value: 5, stat: "attack", duration: "turn" }],
});
const skDeath = skCard({
  id: "sk_death",
  name: "测试遗效",
  attack: 0,
  defense: 1,
  effects: [{ id: "e2", trigger: "on-destroyed", kind: "heal", target: "self-lp", value: 7, stat: "attack", duration: "turn" }],
});
const skLibrary = [...library, skUnit, skWall, skFlyer, skWeapon, skFieldCard, skSpell, skDeath];

let skState = sk.startSkirmish(skLibrary, deckOf(skUnit, 10), skRules);
eq(skState.hand.player.length, 5, "半即时：起手 5 张");
eq(skState.hero.player.hp, 30, "半即时：主战者 30 生命");
eq(skState.mana.player, 10, "半即时：开局资源按规则");

// 资源按分钟回复
let skMana = { ...skState, mana: { player: 0, opponent: 0 } };
for (let i = 0; i < 15; i += 1) skMana = sk.tick(skMana, 400);
truthy(skMana.mana.player >= 1 - 1e-6, `半即时：6 秒回复约 1 点资源（${skMana.mana.player.toFixed(2)}）`);

// 打出单位
let skPlay = {
  ...skState,
  mana: { player: 10, opponent: 10 },
  hand: { player: [skUnit], opponent: [] },
};
const skPlayResult = sk.playCard(skPlay, "player", 0);
truthy(skPlayResult.ok, "半即时：打出单位成功");
eq(skPlayResult.state.units.length, 1, "半即时：单位上场");
eq(skPlayResult.state.mana.player, 9, "半即时：打出消耗资源");
eq(skPlayResult.state.hand.player.length, 0, "半即时：手牌减少");

// 单位自动攻击
let skFight = {
  ...skState,
  units: [
    { uid: "a", side: "player", card: skUnit, attack: 10, hp: 100, maxHp: 100, ace: false, flying: false, blocking: false, survivedMs: 0, experience: 0, cooldown: 0 },
    { uid: "b", side: "opponent", card: skUnit, attack: 10, hp: 100, maxHp: 100, ace: false, flying: false, blocking: false, survivedMs: 0, experience: 0, cooldown: 0 },
  ],
};
skFight = sk.tick(skFight, 600);
eq(skFight.units.find((u) => u.uid === "b").hp, 90, "半即时：单位自动攻击对方单位");

// 挡刀：非飞行单位先打挡刀单位
let skBlock = {
  ...skState,
  units: [
    { uid: "a", side: "player", card: skUnit, attack: 10, hp: 100, maxHp: 100, ace: false, flying: false, blocking: false, survivedMs: 0, experience: 0, cooldown: 0 },
    { uid: "wall", side: "opponent", card: skWall, attack: 1, hp: 500, maxHp: 500, ace: false, flying: false, blocking: true, survivedMs: 0, experience: 0, cooldown: 0 },
  ],
};
skBlock = sk.tick(skBlock, 600);
eq(skBlock.hero.opponent.hp, 30, "半即时：挡刀单位存在时不会打到主战者");
eq(skBlock.units.find((u) => u.uid === "wall").hp, 490, "半即时：攻击被挡刀单位接下");

// 飞行：越过地面单位直击主战者
let skFly = {
  ...skState,
  units: [
    { uid: "f", side: "player", card: skFlyer, attack: 10, hp: 100, maxHp: 100, ace: false, flying: true, blocking: false, survivedMs: 0, experience: 0, cooldown: 0 },
    { uid: "wall", side: "opponent", card: skWall, attack: 1, hp: 500, maxHp: 500, ace: false, flying: false, blocking: true, survivedMs: 0, experience: 0, cooldown: 0 },
  ],
};
skFly = sk.tick(skFly, 600);
eq(skFly.hero.opponent.hp, 20, "半即时：飞行单位越过地面单位直击主战者");

// 武器：装备、攻击、掉耐久
let skWeaponState = {
  ...skState,
  mana: { player: 10, opponent: 10 },
  hand: { player: [skWeapon], opponent: [] },
};
const equipResult = sk.playCard(skWeaponState, "player", 0);
truthy(equipResult.ok, "半即时：装备武器成功");
eq(equipResult.state.hero.player.weapon.durability, 3, "半即时：武器耐久取守备力");
const swing = sk.weaponAttack(equipResult.state, "player", null);
truthy(swing.ok, "半即时：武器攻击成功");
eq(swing.state.hero.opponent.hp, 25, "半即时：武器直击主战者 5 点");
eq(swing.state.hero.player.weapon.durability, 2, "半即时：武器攻击消耗 1 点耐久");

// 遗效：被破坏时回血
let skDeathState = {
  ...skState,
  hero: { ...skState.hero, opponent: { ...skState.hero.opponent, hp: 20 } },
  units: [
    { uid: "a", side: "player", card: skUnit, attack: 10, hp: 100, maxHp: 100, ace: false, flying: false, blocking: false, survivedMs: 0, experience: 0, cooldown: 0 },
    { uid: "d", side: "opponent", card: skDeath, attack: 0, hp: 1, maxHp: 1, ace: false, flying: false, blocking: false, survivedMs: 0, experience: 0, cooldown: 0 },
  ],
};
skDeathState = sk.tick(skDeathState, 600);
eq(skDeathState.hero.opponent.hp, 27, "半即时：遗效在被破坏时回复其主战者生命");

// 场地：给全体友方加攻击
let skFieldState = {
  ...skState,
  mana: { player: 10, opponent: 10 },
  hand: { player: [skFieldCard], opponent: [] },
  units: [
    { uid: "a", side: "player", card: skUnit, attack: 10, hp: 100, maxHp: 100, ace: false, flying: false, blocking: false, survivedMs: 0, experience: 0, cooldown: 0 },
  ],
};
const fieldResult = sk.playCard(skFieldState, "player", 0);
truthy(fieldResult.ok, "半即时：布置场地成功");
eq(
  sk.effectiveUnitAttack(fieldResult.state, fieldResult.state.units[0]),
  14,
  "半即时：场地为友方单位 +4 攻击",
);

// 法术：直接结算
let skSpellState = {
  ...skState,
  mana: { player: 10, opponent: 10 },
  hand: { player: [skSpell], opponent: [] },
};
const spellResult = sk.playCard(skSpellState, "player", 0);
truthy(spellResult.ok, "半即时：发动法术成功");
eq(spellResult.state.hero.opponent.hp, 25, "半即时：法术造成 5 点伤害");

// 时间到按场面评分
let skTime = { ...skState, timeMs: skState.timeLimitMs - 50, hero: { player: { ...skState.hero.player, hp: 30 }, opponent: { ...skState.hero.opponent, hp: 10 } } };
skTime = sk.tick(skTime, 100);
eq(skTime.winner, "player", "半即时：时间到按场面评分判定");

console.log(`\n${checks - failures}/${checks} 项通过`);
if (failures > 0) process.exitCode = 1;
