import { useExtensionContext, BlockExtension, defineSave, Extension, meta, settings } from "@avg-studio/sdk";
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useRef, useEffect, useSyncExternalStore } from "react";
const STARTER_CARDS = [
  {
    id: "card_azure_star_dragon",
    name: "苍蓝星龙",
    kind: "monster",
    race: "龙族",
    attribute: "light",
    level: 8,
    attack: 3e3,
    defense: 2500,
    cost: 8,
    art: "emoji:🐉",
    description: "此卡召唤成功时，对玩家造成 600 点伤害。",
    effects: [
      {
        id: "eff_azure_1",
        trigger: "on-summon",
        kind: "damage",
        target: "enemy-lp",
        value: 600,
        stat: "attack",
        duration: "turn"
      }
    ],
    keywords: ["pierce"]
  },
  {
    id: "card_crimson_mage",
    name: "赤瞳魔导士",
    kind: "monster",
    race: "魔法师族",
    attribute: "dark",
    level: 7,
    attack: 2500,
    defense: 2100,
    cost: 7,
    art: "emoji:🔮",
    description: "此卡召唤成功时，对玩家造成 500 点伤害。",
    effects: [
      {
        id: "eff_mage_1",
        trigger: "on-summon",
        kind: "damage",
        target: "enemy-lp",
        value: 500,
        stat: "attack",
        duration: "turn"
      }
    ],
    keywords: []
  },
  {
    id: "card_iron_guard",
    name: "铁壁守卫",
    kind: "monster",
    race: "战士族",
    attribute: "earth",
    level: 4,
    attack: 1200,
    defense: 2e3,
    cost: 4,
    art: "emoji:🛡️",
    description: "以坚固守备力保护阵地的战士。",
    effects: [],
    keywords: []
  },
  {
    id: "card_gale_falcon",
    name: "疾风猎鹰",
    kind: "monster",
    race: "鸟兽族",
    attribute: "wind",
    level: 4,
    attack: 1600,
    defense: 1200,
    cost: 4,
    art: "emoji:🦅",
    description: "直击：对方场上有怪兽时也能直接攻击玩家。",
    effects: [],
    keywords: ["direct"]
  },
  {
    id: "card_blaze_behemoth",
    name: "烈焰巨兽",
    kind: "monster",
    race: "兽族",
    attribute: "fire",
    level: 6,
    attack: 2200,
    defense: 1500,
    cost: 6,
    art: "emoji:🔥",
    description: "此卡攻击宣言时，对玩家造成 300 点伤害。",
    effects: [
      {
        id: "eff_blaze_1",
        trigger: "on-attack",
        kind: "damage",
        target: "enemy-lp",
        value: 300,
        stat: "attack",
        duration: "turn"
      }
    ],
    keywords: []
  },
  {
    id: "card_holy_angel",
    name: "圣光天使",
    kind: "monster",
    race: "天使族",
    attribute: "light",
    level: 5,
    attack: 1800,
    defense: 2400,
    cost: 5,
    art: "emoji:😇",
    description: "此卡召唤成功时，回复 600 点生命值。",
    effects: [
      {
        id: "eff_angel_1",
        trigger: "on-summon",
        kind: "heal",
        target: "self-lp",
        value: 600,
        stat: "defense",
        duration: "turn"
      }
    ],
    keywords: []
  },
  {
    id: "card_abyss_demon",
    name: "深渊恶魔",
    kind: "monster",
    race: "恶魔族",
    attribute: "dark",
    level: 6,
    attack: 2300,
    defense: 1700,
    cost: 6,
    art: "emoji:😈",
    description: "此卡被破坏时，对玩家造成 800 点伤害。",
    effects: [
      {
        id: "eff_demon_1",
        trigger: "on-destroyed",
        kind: "damage",
        target: "enemy-lp",
        value: 800,
        stat: "attack",
        duration: "turn"
      }
    ],
    keywords: []
  },
  {
    id: "card_siege_ram",
    name: "机械攻城槌",
    kind: "monster",
    race: "机械族",
    attribute: "earth",
    level: 5,
    attack: 2e3,
    defense: 1800,
    cost: 5,
    art: "emoji:⚙️",
    description: "穿透：攻击守备怪兽时，超出守备力的伤害贯穿到对方生命值。",
    effects: [],
    keywords: ["pierce"]
  },
  {
    id: "card_undead_legion",
    name: "亡者军团",
    kind: "monster",
    race: "不死族",
    attribute: "dark",
    level: 3,
    attack: 900,
    defense: 1500,
    cost: 3,
    art: "emoji:💀",
    description: "此卡召唤成功时，自身攻击力提升 300（持续到回合结束）。",
    effects: [
      {
        id: "eff_undead_1",
        trigger: "on-summon",
        kind: "buff",
        target: "self",
        value: 300,
        stat: "attack",
        duration: "turn"
      }
    ],
    keywords: []
  },
  {
    id: "card_thunder_bird",
    name: "雷鸣鸟",
    kind: "monster",
    race: "雷族",
    attribute: "wind",
    level: 4,
    attack: 1700,
    defense: 1300,
    cost: 4,
    art: "emoji:⚡",
    description: "此卡召唤成功时，对玩家造成 200 点伤害。",
    effects: [
      {
        id: "eff_thunder_1",
        trigger: "on-summon",
        kind: "damage",
        target: "enemy-lp",
        value: 200,
        stat: "attack",
        duration: "turn"
      }
    ],
    keywords: []
  },
  {
    id: "card_rock_giant",
    name: "岩石巨兵",
    kind: "monster",
    race: "岩石族",
    attribute: "earth",
    level: 7,
    attack: 2600,
    defense: 2200,
    cost: 7,
    art: "emoji:🪨",
    description: "由岩石构成的巨大守卫，攻守兼备。",
    effects: [],
    keywords: ["indestructible"]
  },
  {
    id: "card_phantom_knight",
    name: "幻龙骑士",
    kind: "monster",
    race: "战士族",
    attribute: "light",
    level: 6,
    attack: 2400,
    defense: 1800,
    cost: 6,
    art: "emoji:⚔️",
    description: "连击：每回合可以攻击两次。",
    effects: [],
    keywords: ["double"]
  },
  {
    id: "card_energy_spring",
    name: "能量涌泉",
    kind: "spell",
    race: "魔法",
    attribute: "water",
    level: 1,
    attack: 0,
    defense: 0,
    cost: 2,
    art: "emoji:💧",
    description: "抽 2 张卡。",
    effects: [
      {
        id: "eff_spring_1",
        trigger: "on-activate",
        kind: "draw",
        target: "self",
        value: 2,
        stat: "attack",
        duration: "turn"
      }
    ],
    keywords: []
  },
  {
    id: "card_scorching_storm",
    name: "灼热风暴",
    kind: "spell",
    race: "魔法",
    attribute: "fire",
    level: 1,
    attack: 0,
    defense: 0,
    cost: 4,
    art: "emoji:🌪",
    description: "对玩家造成 1200 点伤害。",
    effects: [
      {
        id: "eff_storm_1",
        trigger: "on-activate",
        kind: "damage",
        target: "enemy-lp",
        value: 1200,
        stat: "attack",
        duration: "turn"
      }
    ],
    keywords: []
  },
  {
    id: "card_guard_barrier",
    name: "守护结界",
    kind: "spell",
    race: "魔法",
    attribute: "light",
    level: 1,
    attack: 0,
    defense: 0,
    cost: 3,
    art: "emoji:✨",
    description: "回复 1000 点生命值。",
    effects: [
      {
        id: "eff_barrier_1",
        trigger: "on-activate",
        kind: "heal",
        target: "self-lp",
        value: 1e3,
        stat: "defense",
        duration: "turn"
      }
    ],
    keywords: []
  },
  {
    id: "card_counter_trap",
    name: "反制陷阱",
    kind: "trap",
    race: "陷阱",
    attribute: "dark",
    level: 1,
    attack: 0,
    defense: 0,
    cost: 2,
    art: "emoji:🕸️",
    description: "盖放后，对方攻击宣言时无效那次攻击。",
    effects: [
      {
        id: "eff_counter_1",
        trigger: "on-activate",
        kind: "negate",
        target: "enemy-strongest",
        value: 0,
        stat: "attack",
        duration: "turn"
      }
    ],
    keywords: []
  },
  {
    id: "card_burst_ambush",
    name: "爆裂伏击",
    kind: "trap",
    race: "陷阱",
    attribute: "fire",
    level: 1,
    attack: 0,
    defense: 0,
    cost: 3,
    art: "emoji:💥",
    description: "盖放后，对方攻击宣言时破坏对方攻击力最高的怪兽。",
    effects: [
      {
        id: "eff_ambush_1",
        trigger: "on-activate",
        kind: "destroy",
        target: "enemy-strongest",
        value: 0,
        stat: "attack",
        duration: "turn"
      }
    ],
    keywords: []
  }
];
const STARTER_DECK = [
  { cardId: "card_azure_star_dragon", count: 2 },
  { cardId: "card_crimson_mage", count: 2 },
  { cardId: "card_iron_guard", count: 3 },
  { cardId: "card_gale_falcon", count: 3 },
  { cardId: "card_blaze_behemoth", count: 2 },
  { cardId: "card_holy_angel", count: 2 },
  { cardId: "card_abyss_demon", count: 2 },
  { cardId: "card_siege_ram", count: 2 },
  { cardId: "card_undead_legion", count: 2 },
  { cardId: "card_thunder_bird", count: 2 },
  { cardId: "card_rock_giant", count: 2 },
  { cardId: "card_phantom_knight", count: 2 },
  { cardId: "card_energy_spring", count: 2 },
  { cardId: "card_scorching_storm", count: 2 },
  { cardId: "card_guard_barrier", count: 2 },
  { cardId: "card_counter_trap", count: 2 },
  { cardId: "card_burst_ambush", count: 2 }
];
const DEFAULT_RULES = {
  startingLp: 8e3,
  startingHand: 5,
  drawPerTurn: 1,
  handLimit: 0,
  monsterZones: 3,
  spellZones: 2,
  energyStart: 3,
  energyPerTurn: 1,
  energyMax: 10,
  summonPerTurn: 1,
  tributeEnabled: true,
  tributeLevelOne: 5,
  tributeLevelTwo: 7,
  directAttackAllowed: true,
  piercingEnabled: false,
  battleDamageScale: 100,
  deckOutLose: true,
  turnLimit: 30,
  firstTurnAttack: false,
  aiEnabled: true,
  deckMinSize: 15,
  battleMode: "duel",
  evolvePoints: 3,
  evolveAttack: 2,
  evolveDefense: 2,
  elixirMax: 10,
  elixirRegenMs: 2800,
  matchSeconds: 180,
  towerHp: 1500,
  kingTowerHp: 3e3
};
const BATTLE_MODE_PRESETS = {
  duel: {
    battleMode: "duel",
    startingLp: 8e3,
    startingHand: 5,
    drawPerTurn: 1,
    monsterZones: 3,
    spellZones: 2,
    energyStart: 3,
    energyPerTurn: 1,
    energyMax: 10,
    tributeEnabled: true,
    summonPerTurn: 1,
    firstTurnAttack: false
  },
  shadowverse: {
    battleMode: "shadowverse",
    startingLp: 20,
    startingHand: 4,
    drawPerTurn: 1,
    monsterZones: 5,
    spellZones: 0,
    energyStart: 1,
    energyPerTurn: 1,
    energyMax: 10,
    tributeEnabled: false,
    summonPerTurn: 9,
    firstTurnAttack: false,
    evolvePoints: 3
  },
  realtime: {
    battleMode: "realtime",
    startingHand: 0,
    drawPerTurn: 0,
    handLimit: 0,
    elixirMax: 10,
    elixirRegenMs: 2800,
    matchSeconds: 180,
    towerHp: 1500,
    kingTowerHp: 3e3
  }
};
const BATTLE_MODE_LABELS = {
  duel: "回合制（游戏王风）",
  shadowverse: "影之诗风",
  realtime: "即时对战（皇室战争风）"
};
const ATTRIBUTE_LABELS = {
  light: "光",
  dark: "暗",
  earth: "地",
  water: "水",
  fire: "炎",
  wind: "风",
  divine: "神"
};
const ATTRIBUTE_GLYPHS = {
  light: "✦",
  dark: "🌑",
  earth: "⛰",
  water: "💧",
  fire: "🔥",
  wind: "🌪",
  divine: "✧"
};
const KIND_LABELS = {
  monster: "怪兽",
  spell: "魔法",
  trap: "陷阱"
};
const TRIGGER_LABELS = {
  "on-summon": "召唤成功时",
  "on-attack": "攻击宣言时",
  "on-destroyed": "被破坏时",
  "on-activate": "发动时"
};
const EFFECT_LABELS = {
  damage: "造成伤害",
  heal: "回复生命",
  draw: "抽卡",
  destroy: "破坏怪兽",
  buff: "提升攻守",
  negate: "无效攻击"
};
const TARGET_LABELS = {
  "enemy-lp": "对方生命值",
  "self-lp": "自己生命值",
  "both-lp": "双方生命值",
  "enemy-strongest": "对方最强怪兽",
  "enemy-random": "对方随机怪兽",
  "enemy-all": "对方全部怪兽",
  self: "自身",
  "self-monsters": "自己全部怪兽"
};
const KEYWORD_LABELS = {
  direct: "直击",
  pierce: "穿透",
  double: "连击",
  immune: "免疫效果伤害",
  indestructible: "不可被效果破坏"
};
const KEYWORD_HINTS = {
  direct: "对方场上有怪兽时也能直接攻击玩家。",
  pierce: "攻击守备怪兽时，超出守备力的伤害贯穿到对方生命值。",
  double: "每回合可以攻击两次。",
  immune: "不会受到卡牌效果的伤害。",
  indestructible: "不会被卡牌效果破坏（战斗破坏仍然有效）。"
};
const RACE_PRESETS = [
  "龙族",
  "魔法师族",
  "战士族",
  "兽族",
  "恶魔族",
  "天使族",
  "机械族",
  "不死族",
  "海龙族",
  "昆虫族",
  "岩石族",
  "雷族",
  "炎族",
  "鸟兽族",
  "植物族",
  "鱼族",
  "恐龙族",
  "幻龙族"
];
const RACE_GLYPHS = {
  龙族: "🐉",
  魔法师族: "🔮",
  战士族: "⚔️",
  兽族: "🐺",
  恶魔族: "😈",
  天使族: "😇",
  机械族: "⚙️",
  不死族: "💀",
  海龙族: "🌊",
  昆虫族: "🦋",
  岩石族: "🪨",
  雷族: "⚡",
  炎族: "🔥",
  鸟兽族: "🦅",
  植物族: "🌿",
  鱼族: "🐟",
  恐龙族: "🦖",
  幻龙族: "✨"
};
function raceGlyph(race) {
  return RACE_GLYPHS[race] ?? "🃏";
}
function makeId(prefix) {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}
function normalizeCard(raw) {
  if (!raw || typeof raw !== "object") return null;
  const row = raw;
  const rawName = typeof row.name === "string" ? row.name.trim() : "";
  const looksLikeCard = rawName !== "" || typeof row.id === "string" || row.kind !== void 0 || row.race !== void 0 || row.attack !== void 0 || row.defense !== void 0;
  if (!looksLikeCard) return null;
  const name = rawName || "未命名卡牌";
  const kind = row.kind === "spell" || row.kind === "trap" ? row.kind : "monster";
  const attribute = row.attribute === "light" || row.attribute === "dark" || row.attribute === "earth" || row.attribute === "water" || row.attribute === "fire" || row.attribute === "wind" || row.attribute === "divine" ? row.attribute : "dark";
  const num = (value, fallback, min, max) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.round(parsed)));
  };
  const effects = Array.isArray(row.effects) ? row.effects.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const eff = item;
    const triggers = [
      "on-summon",
      "on-attack",
      "on-destroyed",
      "on-activate"
    ];
    const kinds = [
      "damage",
      "heal",
      "draw",
      "destroy",
      "buff",
      "negate"
    ];
    const targets = [
      "enemy-lp",
      "self-lp",
      "both-lp",
      "enemy-strongest",
      "enemy-random",
      "enemy-all",
      "self",
      "self-monsters"
    ];
    const trigger = triggers.includes(eff.trigger) ? eff.trigger : "on-summon";
    const effectKind = kinds.includes(eff.kind) ? eff.kind : "damage";
    const target = targets.includes(eff.target) ? eff.target : "enemy-lp";
    return [
      {
        id: typeof eff.id === "string" && eff.id ? eff.id : makeId("eff"),
        trigger,
        kind: effectKind,
        target,
        value: num(eff.value, 0, 0, 99999),
        stat: eff.stat === "defense" ? "defense" : "attack",
        duration: eff.duration === "duel" ? "duel" : "turn"
      }
    ];
  }) : [];
  const keywords = Array.isArray(row.keywords) ? Array.from(
    new Set(
      row.keywords.filter(
        (key) => ["direct", "pierce", "double", "immune", "indestructible"].includes(
          String(key)
        )
      )
    )
  ) : [];
  return {
    id: typeof row.id === "string" && row.id ? row.id : makeId("card"),
    name,
    kind,
    race: typeof row.race === "string" && row.race.trim() ? row.race.trim() : "战士族",
    attribute,
    level: num(row.level, 4, 1, 12),
    attack: num(row.attack, 1e3, 0, 99999),
    defense: num(row.defense, 1e3, 0, 99999),
    cost: num(row.cost, 1, 0, 99),
    art: typeof row.art === "string" ? row.art : "",
    description: typeof row.description === "string" ? row.description : "",
    effects,
    keywords,
    moveSpeed: Math.max(
      0.2,
      Math.min(5, Number(row.moveSpeed) > 0 ? Number(row.moveSpeed) : 1.2)
    ),
    attackIntervalMs: num(row.attackIntervalMs, 1e3, 200, 5e3),
    range: Math.max(
      0.2,
      Math.min(6, Number(row.range) > 0 ? Number(row.range) : 0.8)
    )
  };
}
function normalizeCards(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const item of raw) {
    const card = normalizeCard(item);
    if (!card || seen.has(card.id)) continue;
    seen.add(card.id);
    out.push(card);
  }
  return out;
}
function normalizeRules(raw) {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_RULES };
  const row = raw;
  const num = (key, min, max) => {
    const parsed = Number(row[key]);
    const fallback = DEFAULT_RULES[key];
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.round(parsed)));
  };
  const bool = (key) => typeof row[key] === "boolean" ? row[key] : DEFAULT_RULES[key];
  const mode = row.battleMode === "shadowverse" || row.battleMode === "realtime" ? row.battleMode : "duel";
  return {
    startingLp: num("startingLp", 100, 999999),
    startingHand: num("startingHand", 0, 8),
    drawPerTurn: num("drawPerTurn", 0, 5),
    handLimit: num("handLimit", 0, 20),
    monsterZones: num("monsterZones", 1, 5),
    spellZones: num("spellZones", 0, 5),
    energyStart: num("energyStart", 0, 99),
    energyPerTurn: num("energyPerTurn", 0, 99),
    energyMax: num("energyMax", 1, 99),
    summonPerTurn: num("summonPerTurn", 1, 9),
    tributeEnabled: bool("tributeEnabled"),
    tributeLevelOne: num("tributeLevelOne", 1, 12),
    tributeLevelTwo: num("tributeLevelTwo", 1, 12),
    directAttackAllowed: bool("directAttackAllowed"),
    piercingEnabled: bool("piercingEnabled"),
    battleDamageScale: num("battleDamageScale", 0, 500),
    deckOutLose: bool("deckOutLose"),
    turnLimit: num("turnLimit", 0, 999),
    firstTurnAttack: bool("firstTurnAttack"),
    aiEnabled: bool("aiEnabled"),
    deckMinSize: num("deckMinSize", 1, 60),
    battleMode: mode,
    evolvePoints: num("evolvePoints", 0, 9),
    evolveAttack: num("evolveAttack", 0, 20),
    evolveDefense: num("evolveDefense", 0, 20),
    elixirMax: num("elixirMax", 1, 20),
    elixirRegenMs: num("elixirRegenMs", 300, 2e4),
    matchSeconds: num("matchSeconds", 30, 900),
    towerHp: num("towerHp", 100, 99999),
    kingTowerHp: num("kingTowerHp", 100, 99999)
  };
}
let currentState = null;
let realtimeState = null;
let panelOpen = false;
const listeners = /* @__PURE__ */ new Set();
function notify() {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch (error) {
      console.warn("[duel-store] listener 执行失败", error);
    }
  }
}
function getDuelState() {
  return currentState;
}
function setDuelState(next) {
  currentState = next;
  if (next) realtimeState = null;
  notify();
}
function subscribeDuelState(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
function getRealtimeState() {
  return realtimeState;
}
function setRealtimeState(next) {
  realtimeState = next;
  if (next) currentState = null;
  notify();
}
function setPanelOpen(open) {
  if (panelOpen === open) return;
  panelOpen = open;
  notify();
}
function isPanelOpen() {
  return panelOpen;
}
let cachedDeck = [];
function setCachedDeck(deck) {
  cachedDeck = deck;
}
function getCachedDeck() {
  return cachedDeck;
}
let uidSeq = 0;
function nextUid$1() {
  uidSeq += 1;
  return `ci_${uidSeq}`;
}
function otherSide(side) {
  return side === "player" ? "opponent" : "player";
}
function sideOf(state, side) {
  return side === "player" ? state.player : state.opponent;
}
function withSide(state, side, next) {
  return side === "player" ? { ...state, player: next } : { ...state, opponent: next };
}
function cloneSide(side) {
  return {
    lp: side.lp,
    energy: side.energy,
    deck: [...side.deck],
    hand: [...side.hand],
    graveyard: [...side.graveyard],
    monsters: side.monsters.map((m) => m ? { ...m } : null),
    traps: side.traps.map((t) => t ? { ...t } : null)
  };
}
function cloneState(state) {
  return {
    ...state,
    evolve: { ...state.evolve },
    player: cloneSide(state.player),
    opponent: cloneSide(state.opponent),
    log: [...state.log]
  };
}
function log(state, tone, text) {
  state.log.push({ id: `log_${state.log.length}_${Date.now().toString(36)}`, tone, text });
}
function effectiveAttack(monster) {
  return Math.max(0, monster.card.attack + monster.atkMod + monster.tempAtk);
}
function effectiveDefense(monster) {
  return Math.max(0, monster.card.defense + monster.defMod + monster.tempDef);
}
function shuffle$1(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function makeSide(library, deck, rules) {
  const cards = [];
  for (const entry of deck) {
    const card = library.get(entry.cardId);
    if (!card) continue;
    const count = Math.max(0, Math.min(20, Math.round(entry.count)));
    for (let i = 0; i < count; i += 1) {
      cards.push({ uid: nextUid$1(), card });
    }
  }
  return {
    lp: rules.startingLp,
    energy: rules.energyStart,
    deck: shuffle$1(cards),
    hand: [],
    graveyard: [],
    monsters: new Array(rules.monsterZones).fill(null),
    traps: new Array(rules.spellZones).fill(null)
  };
}
function drawCards(state, side, count) {
  let current = cloneState(state);
  let drawn = 0;
  for (let i = 0; i < count; i += 1) {
    const s = sideOf(current, side);
    if (s.deck.length === 0) {
      if (current.rules.deckOutLose) {
        current = { ...current, winner: otherSide(side) };
        log(current, "bad", `${sideName$1(side)} 卡组已抽空，判负。`);
      }
      break;
    }
    const [top, ...rest] = s.deck;
    const next = { ...s, deck: rest, hand: [...s.hand, top] };
    current = withSide(current, side, next);
    drawn += 1;
  }
  return { state: current, drawn };
}
function sideName$1(side) {
  return side === "player" ? "你" : "对手";
}
function beginTurn(state, side, first) {
  let current = cloneState(state);
  const s = sideOf(current, side);
  const energy = first ? Math.min(current.rules.energyMax, current.rules.energyStart) : Math.min(current.rules.energyMax, s.energy + current.rules.energyPerTurn);
  current = withSide(current, side, {
    ...s,
    energy,
    monsters: s.monsters.map(
      (m) => m ? { ...m, attacksUsed: 0, changedPosition: false } : null
    )
  });
  if (!first && current.rules.drawPerTurn > 0) {
    const result = drawCards(current, side, current.rules.drawPerTurn);
    current = result.state;
    if (result.drawn > 0) {
      log(current, "info", `${sideName$1(side)} 抽了 ${result.drawn} 张卡。`);
    }
  }
  if (current.rules.turnLimit > 0 && current.turn > current.rules.turnLimit) {
    current = { ...current, winner: "draw" };
    log(current, "warn", `达到回合上限（${current.rules.turnLimit}），决斗判定为平局。`);
  }
  return { ...current, attackLocked: false };
}
function startDuel(libraryCards, deck, rules, opponentDeck, firstSide = "player") {
  const library = new Map(libraryCards.map((card) => [card.id, card]));
  const enemyDeck = opponentDeck && opponentDeck.length > 0 ? opponentDeck : deck;
  let state = {
    rules,
    turn: 1,
    active: firstSide,
    phase: "main",
    player: makeSide(library, deck, rules),
    opponent: makeSide(library, enemyDeck, rules),
    summonsThisTurn: 0,
    attackLocked: !rules.firstTurnAttack,
    evolve: {
      player: rules.evolvePoints,
      opponent: rules.evolvePoints
    },
    log: []
  };
  log(state, "info", "决斗开始！");
  const playerDraw = drawCards(state, "player", rules.startingHand);
  state = playerDraw.state;
  const opponentDraw = drawCards(state, "opponent", rules.startingHand);
  state = opponentDraw.state;
  log(state, "info", `双方各抽了 ${rules.startingHand} 张起始手牌。`);
  if (firstSide === "player") return state;
  log(state, "warn", "对手获得先攻。");
  state = beginTurn(state, "opponent", true);
  state = { ...state, attackLocked: !rules.firstTurnAttack };
  if (state.winner) return state;
  if (rules.aiEnabled) return runAiTurn(state);
  return handOverToPlayer(state);
}
function slotOfMonster(side, uid) {
  return side.monsters.findIndex((m) => m !== null && m.uid === uid);
}
function strongestSlot(side) {
  let best = -1;
  let bestAtk = -1;
  side.monsters.forEach((m, index) => {
    if (!m) return;
    const atk = effectiveAttack(m);
    if (atk > bestAtk) {
      bestAtk = atk;
      best = index;
    }
  });
  return best;
}
function randomSlot(side) {
  const filled = [];
  side.monsters.forEach((m, index) => {
    if (m) filled.push(index);
  });
  if (filled.length === 0) return -1;
  return filled[Math.floor(Math.random() * filled.length)];
}
function destroyMonster(state, side, slot, reason) {
  const s = sideOf(state, side);
  const monster = s.monsters[slot];
  if (!monster) return state;
  if (reason === "effect" && monster.card.keywords.includes("indestructible")) {
    log(state, "warn", `${monster.card.name} 不受效果破坏。`);
    return state;
  }
  const monsters = [...s.monsters];
  monsters[slot] = null;
  let current = withSide(state, side, {
    ...s,
    monsters,
    graveyard: [...s.graveyard, { uid: monster.uid, card: monster.card }]
  });
  log(
    current,
    side === "player" ? "bad" : "good",
    `${monster.card.name} 被${reason === "battle" ? "战斗" : "效果"}破坏。`
  );
  current = resolveEffects(current, side, monster.card, "on-destroyed", {
    selfMonsterUid: monster.uid
  });
  return current;
}
function applyDamage(state, side, amount, label) {
  if (amount <= 0) return state;
  const s = sideOf(state, side);
  const next = { ...s, lp: Math.max(0, s.lp - amount) };
  const current = withSide(state, side, next);
  log(current, side === "player" ? "bad" : "good", `${sideName$1(side)} 受到 ${amount} 点${label}（剩余 ${next.lp}）。`);
  return current;
}
function applyHeal(state, side, amount) {
  if (amount <= 0) return state;
  const s = sideOf(state, side);
  const next = { ...s, lp: s.lp + amount };
  const current = withSide(state, side, next);
  log(current, side === "player" ? "good" : "bad", `${sideName$1(side)} 回复 ${amount} 点生命值（当前 ${next.lp}）。`);
  return current;
}
function applyBuff(state, side, effect, selfMonsterUid) {
  const s = sideOf(state, side);
  const amount = effect.value;
  if (amount <= 0) return state;
  const targets = [];
  if (effect.target === "self-monsters") {
    s.monsters.forEach((m, index) => {
      if (m) targets.push(index);
    });
  } else {
    const slot = selfMonsterUid ? slotOfMonster(s, selfMonsterUid) : strongestSlot(s);
    if (slot >= 0) targets.push(slot);
  }
  if (targets.length === 0) return state;
  const monsters = [...s.monsters];
  for (const slot of targets) {
    const m = monsters[slot];
    if (!m) continue;
    monsters[slot] = effect.duration === "duel" ? effect.stat === "attack" ? { ...m, atkMod: m.atkMod + amount } : { ...m, defMod: m.defMod + amount } : effect.stat === "attack" ? { ...m, tempAtk: m.tempAtk + amount } : { ...m, tempDef: m.tempDef + amount };
  }
  const current = withSide(state, side, { ...s, monsters });
  log(
    current,
    "info",
    `${sideName$1(side)} 的 ${effect.stat === "attack" ? "攻击力" : "守备力"} +${amount}（${effect.target === "self-monsters" ? "全体" : "单体"}）。`
  );
  return current;
}
function resolveEffects(state, side, card, trigger, opts = {}) {
  let current = state;
  for (const effect of card.effects) {
    if (effect.trigger !== trigger) continue;
    if (effect.kind === "damage") {
      if (effect.target === "both-lp") {
        current = applyDamage(current, "player", effect.value, "效果伤害");
        current = applyDamage(current, "opponent", effect.value, "效果伤害");
      } else {
        current = applyDamage(current, otherSide(side), effect.value, "效果伤害");
      }
      continue;
    }
    if (effect.kind === "heal") {
      current = applyHeal(current, side, effect.value);
      continue;
    }
    if (effect.kind === "draw") {
      const result = drawCards(current, side, effect.value);
      current = result.state;
      if (result.drawn > 0) {
        log(current, "info", `${sideName$1(side)} 因「${card.name}」抽了 ${result.drawn} 张卡。`);
      }
      continue;
    }
    if (effect.kind === "destroy") {
      const enemy = otherSide(side);
      const enemySide = sideOf(current, enemy);
      const slots = [];
      if (effect.target === "enemy-all") {
        enemySide.monsters.forEach((m, index) => {
          if (m) slots.push(index);
        });
      } else if (effect.target === "enemy-random") {
        const slot = randomSlot(enemySide);
        if (slot >= 0) slots.push(slot);
      } else {
        const slot = strongestSlot(enemySide);
        if (slot >= 0) slots.push(slot);
      }
      for (const slot of slots) {
        current = destroyMonster(current, enemy, slot, "effect");
      }
      continue;
    }
    if (effect.kind === "buff") {
      current = applyBuff(current, side, effect, opts.selfMonsterUid);
      continue;
    }
  }
  return current;
}
function checkVictory(state) {
  if (state.winner) return state;
  const p = state.player.lp;
  const o = state.opponent.lp;
  if (p <= 0 && o <= 0) {
    const current = { ...state, winner: "draw" };
    log(current, "warn", "双方生命值同时归零，平局。");
    return current;
  }
  if (p <= 0) {
    const current = { ...state, winner: "opponent" };
    log(current, "bad", "你的生命值归零，决斗失败。");
    return current;
  }
  if (o <= 0) {
    const current = { ...state, winner: "player" };
    log(current, "good", "对手生命值归零，你赢得了决斗！");
    return current;
  }
  return state;
}
function tributeRequirement(card, rules) {
  if (!rules.tributeEnabled || card.kind !== "monster") return 0;
  if (card.level >= rules.tributeLevelTwo) return 2;
  if (card.level >= rules.tributeLevelOne) return 1;
  return 0;
}
function freeMonsterSlot(side) {
  return side.monsters.findIndex((m) => m === null);
}
function freeTrapSlot(side) {
  return side.traps.findIndex((t) => t === null);
}
function summonBlocker(state, handUid) {
  if (state.winner) return "决斗已结束。";
  if (state.active !== "player") return "现在不是你的回合。";
  if (state.phase !== "main") return "只能在主要阶段召唤。";
  const side = state.player;
  const card = side.hand.find((c) => c.uid === handUid)?.card;
  if (!card) return "手牌里没有这张卡。";
  if (card.kind !== "monster") return "只有怪兽可以召唤。";
  if (state.summonsThisTurn >= state.rules.summonPerTurn) return "本回合召唤次数已用完。";
  if (freeMonsterSlot(side) < 0) return "怪兽区已满。";
  if (side.energy < card.cost) return `能量不足（需要 ${card.cost}）。`;
  const need = tributeRequirement(card, state.rules);
  const available = side.monsters.filter((m) => m !== null).length;
  if (need > 0 && available < need) return `需要 ${need} 只祭品。`;
  return null;
}
function summonMonster(state, handUid, position, tributeUids = []) {
  const blocker = summonBlocker(state, handUid);
  if (blocker) return { state, ok: false, message: blocker };
  let current = cloneState(state);
  const side = current.player;
  const handCard = side.hand.find((c) => c.uid === handUid);
  if (!handCard) return { state, ok: false, message: "手牌里没有这张卡。" };
  const card = handCard.card;
  const need = tributeRequirement(card, current.rules);
  if (tributeUids.length !== need) {
    return { state, ok: false, message: `需要选择 ${need} 只祭品。` };
  }
  const slots = [];
  for (const uid of tributeUids) {
    const slot = slotOfMonster(side, uid);
    if (slot < 0) return { state, ok: false, message: "祭品选择无效。" };
    slots.push(slot);
  }
  let next = {
    ...side,
    energy: side.energy - card.cost,
    hand: side.hand.filter((c) => c.uid !== handUid)
  };
  const graveyard = [...next.graveyard];
  const monsters = [...next.monsters];
  for (const slot of slots) {
    const sacrifice = monsters[slot];
    if (sacrifice) {
      graveyard.push({ uid: sacrifice.uid, card: sacrifice.card });
      monsters[slot] = null;
      log(current, "info", `献祭了 ${sacrifice.card.name}。`);
    }
  }
  const targetSlot = monsters.findIndex((m) => m === null);
  monsters[targetSlot] = {
    uid: handCard.uid,
    card,
    position,
    atkMod: 0,
    defMod: 0,
    tempAtk: 0,
    tempDef: 0,
    attacksUsed: 0,
    changedPosition: false,
    damage: 0,
    evolved: false
  };
  next = { ...next, monsters, graveyard };
  current = withSide(current, "player", next);
  current = {
    ...current,
    summonsThisTurn: current.summonsThisTurn + 1
  };
  log(
    current,
    "good",
    `你召唤了 ${card.name}（${position === "attack" ? "攻击表示" : "守备表示"}）。`
  );
  current = resolveEffects(current, "player", card, "on-summon", { selfMonsterUid: handCard.uid });
  current = checkVictory(current);
  return { state: current, ok: true };
}
function activateSpell(state, handUid) {
  if (state.winner) return { state, ok: false, message: "决斗已结束。" };
  if (state.active !== "player") return { state, ok: false, message: "现在不是你的回合。" };
  if (state.phase !== "main") return { state, ok: false, message: "只能在主要阶段发动。" };
  const card = state.player.hand.find((c) => c.uid === handUid)?.card;
  if (!card) return { state, ok: false, message: "手牌里没有这张卡。" };
  if (card.kind !== "spell") return { state, ok: false, message: "这张卡不是魔法卡。" };
  if (state.player.energy < card.cost) {
    return { state, ok: false, message: `能量不足（需要 ${card.cost}）。` };
  }
  let current = cloneState(state);
  const side = current.player;
  current = withSide(current, "player", {
    ...side,
    energy: side.energy - card.cost,
    hand: side.hand.filter((c) => c.uid !== handUid),
    graveyard: [...side.graveyard, { uid: handUid, card }]
  });
  log(current, "good", `你发动了魔法卡「${card.name}」。`);
  current = resolveEffects(current, "player", card, "on-activate");
  current = checkVictory(current);
  return { state: current, ok: true };
}
function setTrap(state, handUid) {
  if (state.winner) return { state, ok: false, message: "决斗已结束。" };
  if (state.active !== "player") return { state, ok: false, message: "现在不是你的回合。" };
  if (state.phase !== "main") return { state, ok: false, message: "只能在主要阶段盖放。" };
  const card = state.player.hand.find((c) => c.uid === handUid)?.card;
  if (!card) return { state, ok: false, message: "手牌里没有这张卡。" };
  if (card.kind !== "trap") return { state, ok: false, message: "这张卡不是陷阱卡。" };
  if (state.player.energy < card.cost) {
    return { state, ok: false, message: `能量不足（需要 ${card.cost}）。` };
  }
  const slot = freeTrapSlot(state.player);
  if (slot < 0) return { state, ok: false, message: "魔法陷阱区已满。" };
  let current = cloneState(state);
  const side = current.player;
  const traps = [...side.traps];
  traps[slot] = { uid: handUid, card };
  current = withSide(current, "player", {
    ...side,
    energy: side.energy - card.cost,
    hand: side.hand.filter((c) => c.uid !== handUid),
    traps
  });
  log(current, "info", `你盖放了一张陷阱卡。`);
  return { state: current, ok: true };
}
function changePosition(state, monsterUid) {
  if (state.winner) return { state, ok: false, message: "决斗已结束。" };
  if (state.active !== "player") return { state, ok: false, message: "现在不是你的回合。" };
  const side = state.player;
  const slot = slotOfMonster(side, monsterUid);
  if (slot < 0) return { state, ok: false, message: "没有这只怪兽。" };
  const monster = side.monsters[slot];
  if (!monster) return { state, ok: false, message: "没有这只怪兽。" };
  if (monster.changedPosition) return { state, ok: false, message: "这只怪兽本回合已经改变过表示形式。" };
  const monsters = [...side.monsters];
  monsters[slot] = {
    ...monster,
    position: monster.position === "attack" ? "defense" : "attack",
    changedPosition: true
  };
  let current = withSide(state, "player", { ...side, monsters });
  log(
    current,
    "info",
    `${monster.card.name} 变为${monsters[slot]?.position === "attack" ? "攻击" : "守备"}表示。`
  );
  return { state: current, ok: true };
}
function startBattlePhase(state) {
  if (state.winner) return { state, ok: false, message: "决斗已结束。" };
  if (state.active !== "player") return { state, ok: false, message: "现在不是你的回合。" };
  if (state.phase === "battle") return { state, ok: false, message: "已经进入战斗阶段。" };
  return { state: { ...state, phase: "battle" }, ok: true };
}
function maxAttacks(monster) {
  return monster.card.keywords.includes("double") ? 2 : 1;
}
function triggerDefenderTrap(state, defender) {
  const dside = sideOf(state, defender);
  const trapSlot = dside.traps.findIndex((t) => t !== null);
  if (trapSlot < 0) return { state, negated: false };
  const trap = dside.traps[trapSlot];
  if (!trap) return { state, negated: false };
  let current = cloneState(state);
  const side = sideOf(current, defender);
  const traps = [...side.traps];
  traps[trapSlot] = null;
  current = withSide(current, defender, {
    ...side,
    traps,
    graveyard: [...side.graveyard, { uid: trap.uid, card: trap.card }]
  });
  log(current, "warn", `${sideName$1(defender)} 发动了陷阱卡「${trap.card.name}」。`);
  const negate = trap.card.effects.some(
    (effect) => effect.trigger === "on-activate" && effect.kind === "negate"
  );
  current = resolveEffects(current, defender, trap.card, "on-activate");
  if (negate) {
    log(current, "warn", "这次攻击被无效了。");
    return { state: current, negated: true };
  }
  return { state: current, negated: false };
}
function battleDamage(state, side, amount) {
  const scaled = Math.round(amount * state.rules.battleDamageScale / 100);
  return applyDamage(state, side, scaled, "战斗伤害");
}
function monsterHealth(monster) {
  return Math.max(0, monster.card.defense + monster.defMod - monster.damage);
}
function damageMonster(state, side, slot, amount) {
  const s = sideOf(state, side);
  const monster = s.monsters[slot];
  if (!monster || amount <= 0) return state;
  const monsters = [...s.monsters];
  monsters[slot] = { ...monster, damage: monster.damage + amount };
  const current = withSide(state, side, { ...s, monsters });
  const updated = monsters[slot];
  if (updated && monsterHealth(updated) <= 0) {
    return destroyMonster(current, side, slot, "battle");
  }
  return current;
}
function resolveShadowverseBattle(state, attackerSlot, targetUid) {
  let current = state;
  const attacker = sideOf(current, "player").monsters[attackerSlot];
  if (!attacker) return { state: current, ok: false, message: "没有这只怪兽。" };
  const atk = effectiveAttack(attacker);
  if (targetUid === null) {
    current = applyDamage(current, "opponent", atk, "攻击");
    log(
      current,
      "good",
      `${attacker.card.name} 直接攻击，造成 ${atk} 点伤害。`
    );
    return { state: checkVictory(current), ok: true };
  }
  const enemySide = sideOf(current, "opponent");
  const targetSlot = enemySide.monsters.findIndex(
    (m) => m !== null && m.uid === targetUid
  );
  if (targetSlot < 0) {
    return { state: current, ok: false, message: "攻击目标无效。" };
  }
  const target = enemySide.monsters[targetSlot];
  if (!target) return { state: current, ok: false, message: "攻击目标无效。" };
  const retaliation = effectiveAttack(target);
  log(
    current,
    "info",
    `${attacker.card.name}（${atk}）与 ${target.card.name}（${retaliation}）交战。`
  );
  const targetHealthBefore = monsterHealth(target);
  const attackerHealthBefore = monsterHealth(attacker);
  current = damageMonster(current, "opponent", targetSlot, atk);
  current = damageMonster(current, "player", attackerSlot, retaliation);
  log(
    current,
    "info",
    `目标剩余 ${Math.max(0, targetHealthBefore - atk)}，${attacker.card.name} 剩余 ${Math.max(0, attackerHealthBefore - retaliation)}。`
  );
  return { state: checkVictory(current), ok: true };
}
function evolveMonster(state, monsterUid) {
  if (state.winner) return { state, ok: false, message: "决斗已结束。" };
  if (state.rules.battleMode !== "shadowverse") {
    return { state, ok: false, message: "当前模式不支持进化。" };
  }
  if (state.active !== "player") return { state, ok: false, message: "现在不是你的回合。" };
  const side = state.player;
  const slot = slotOfMonster(side, monsterUid);
  if (slot < 0) return { state, ok: false, message: "没有这只怪兽。" };
  const monster = side.monsters[slot];
  if (!monster) return { state, ok: false, message: "没有这只怪兽。" };
  if (monster.evolved) return { state, ok: false, message: "这只随从已经进化过了。" };
  if (state.evolve.player <= 0) {
    return { state, ok: false, message: "进化点已用完。" };
  }
  const monsters = [...side.monsters];
  monsters[slot] = {
    ...monster,
    evolved: true,
    atkMod: monster.atkMod + state.rules.evolveAttack,
    defMod: monster.defMod + state.rules.evolveDefense,
    attacksUsed: 0,
    changedPosition: false
  };
  const current = withSide(state, "player", { ...side, monsters });
  current.evolve = { ...current.evolve, player: current.evolve.player - 1 };
  log(
    current,
    "good",
    `${monster.card.name} 进化：攻击力 +${state.rules.evolveAttack}、生命 +${state.rules.evolveDefense}（剩余进化点 ${current.evolve.player}）。`
  );
  return { state: current, ok: true };
}
function declareAttack(state, attackerUid, targetUid) {
  if (state.winner) return { state, ok: false, message: "决斗已结束。" };
  if (state.active !== "player") return { state, ok: false, message: "现在不是你的回合。" };
  if (state.phase !== "battle") return { state, ok: false, message: "请先进入战斗阶段。" };
  if (state.attackLocked) return { state, ok: false, message: "先攻回合不能攻击。" };
  const side = state.player;
  const attackerSlot = slotOfMonster(side, attackerUid);
  if (attackerSlot < 0) return { state, ok: false, message: "没有这只怪兽。" };
  const attacker = side.monsters[attackerSlot];
  if (!attacker) return { state, ok: false, message: "没有这只怪兽。" };
  if (attacker.position !== "attack") {
    return { state, ok: false, message: "守备表示的怪兽不能攻击。" };
  }
  if (attacker.attacksUsed >= maxAttacks(attacker)) {
    return { state, ok: false, message: "这只怪兽本回合已经攻击过了。" };
  }
  const enemy = state.opponent;
  const enemyHasMonsters = enemy.monsters.some((m) => m !== null);
  const shadowverse = state.rules.battleMode === "shadowverse";
  const canDirect = shadowverse || !enemyHasMonsters || attacker.card.keywords.includes("direct");
  if (targetUid === null) {
    if (!canDirect) return { state, ok: false, message: "对方场上有怪兽，无法直接攻击。" };
    if (!shadowverse && !state.rules.directAttackAllowed) {
      return { state, ok: false, message: "当前规则禁止直接攻击。" };
    }
  }
  let current = cloneState(state);
  const attackerNow = sideOf(current, "player").monsters[attackerSlot];
  if (!attackerNow) return { state, ok: false, message: "没有这只怪兽。" };
  const monsters = [...sideOf(current, "player").monsters];
  monsters[attackerSlot] = { ...attackerNow, attacksUsed: attackerNow.attacksUsed + 1 };
  current = withSide(current, "player", { ...sideOf(current, "player"), monsters });
  log(
    current,
    "info",
    `你用 ${attacker.card.name} ${targetUid === null ? "直接攻击" : "发起攻击"}。`
  );
  const trap = triggerDefenderTrap(current, "opponent");
  current = trap.state;
  if (trap.negated) return { state: current, ok: true };
  current = resolveEffects(current, "player", attacker.card, "on-attack", {
    selfMonsterUid: attackerUid
  });
  current = checkVictory(current);
  if (current.winner) return { state: current, ok: true };
  if (current.rules.battleMode === "shadowverse") {
    return resolveShadowverseBattle(current, attackerSlot, targetUid);
  }
  const atk = effectiveAttack(attackerNow);
  if (targetUid === null) {
    current = battleDamage(current, "opponent", atk);
    log(current, "good", `直接攻击造成 ${Math.round(atk * current.rules.battleDamageScale / 100)} 点伤害。`);
    return { state: checkVictory(current), ok: true };
  }
  const enemySide = sideOf(current, "opponent");
  const targetSlot = enemySide.monsters.findIndex((m) => m !== null && m.uid === targetUid);
  if (targetSlot < 0) return { state, ok: false, message: "攻击目标无效。" };
  const target = enemySide.monsters[targetSlot];
  if (!target) return { state, ok: false, message: "攻击目标无效。" };
  if (target.position === "attack") {
    const def2 = effectiveAttack(target);
    if (atk > def2) {
      current = destroyMonster(current, "opponent", targetSlot, "battle");
      current = battleDamage(current, "opponent", atk - def2);
    } else if (atk < def2) {
      current = destroyMonster(current, "player", attackerSlot, "battle");
      current = battleDamage(current, "player", def2 - atk);
    } else {
      current = destroyMonster(current, "opponent", targetSlot, "battle");
      current = destroyMonster(current, "player", attackerSlot, "battle");
      log(current, "warn", "攻击力相同，双方怪兽同时被破坏。");
    }
    return { state: checkVictory(current), ok: true };
  }
  const def = effectiveDefense(target);
  if (atk > def) {
    const piercing = attacker.card.keywords.includes("pierce") || current.rules.piercingEnabled;
    current = destroyMonster(current, "opponent", targetSlot, "battle");
    if (piercing) {
      current = battleDamage(current, "opponent", atk - def);
      log(current, "good", "穿透伤害贯穿了守备怪兽。");
    }
  } else if (atk < def) {
    current = battleDamage(current, "player", def - atk);
  } else {
    log(current, "info", "攻击力与守备力相同，没有发生战斗伤害。");
  }
  return { state: checkVictory(current), ok: true };
}
function endTurn(state) {
  if (state.winner) return { state, ok: false, message: "决斗已结束。" };
  if (state.active !== "player") return { state, ok: false, message: "现在不是你的回合。" };
  let current = cloneState(state);
  const side = current.player;
  if (current.rules.handLimit > 0 && side.hand.length > current.rules.handLimit) {
    const overflow = side.hand.length - current.rules.handLimit;
    const discarded = side.hand.slice(0, overflow);
    current = withSide(current, "player", {
      ...side,
      hand: side.hand.slice(overflow),
      graveyard: [...side.graveyard, ...discarded]
    });
    log(current, "warn", `手牌超过上限，丢弃了 ${overflow} 张卡。`);
  }
  const cleared = sideOf(current, "player").monsters.map(
    (m) => m ? { ...m, tempAtk: 0, tempDef: 0 } : null
  );
  current = withSide(current, "player", { ...sideOf(current, "player"), monsters: cleared });
  current = { ...current, active: "opponent", phase: "main", summonsThisTurn: 0 };
  current = beginTurn(current, "opponent", false);
  if (current.rules.aiEnabled && !current.winner) {
    current = runAiTurn(current);
  } else if (!current.rules.aiEnabled) {
    current = handOverToPlayer(current);
  }
  return { state: current, ok: true };
}
function handOverToPlayer(state) {
  if (state.winner) return state;
  let next = cloneState(state);
  const opp = next.opponent;
  const cleared = opp.monsters.map((m) => m ? { ...m, tempAtk: 0, tempDef: 0 } : null);
  next = withSide(next, "opponent", { ...opp, monsters: cleared });
  next = {
    ...next,
    turn: next.turn + 1,
    active: "player",
    phase: "main",
    summonsThisTurn: 0
  };
  next = beginTurn(next, "player", false);
  log(next, "info", "你的回合开始。");
  return next;
}
function runAiTurn(state) {
  let current = state;
  if (current.winner) return current;
  const rules = current.rules;
  let aiSummonsThisTurn = 0;
  const tryPlay = () => {
    const side = current.opponent;
    for (const handCard of [...side.hand]) {
      if (aiSummonsThisTurn >= rules.summonPerTurn) break;
      if (handCard.card.kind !== "monster") continue;
      const need = tributeRequirement(handCard.card, rules);
      const tributes = side.monsters.filter((m) => m !== null).sort((a, b) => effectiveAttack(a) - effectiveAttack(b)).slice(0, need).map((m) => m.uid);
      if (need > 0 && tributes.length < need) continue;
      if (side.monsters.every((m) => m !== null)) continue;
      if (side.energy < handCard.card.cost) continue;
      const position = handCard.card.defense > handCard.card.attack ? "defense" : "attack";
      const result = aiSummon(current, handCard.uid, position, tributes);
      if (result.ok) {
        current = result.state;
        aiSummonsThisTurn += 1;
        return true;
      }
    }
    for (const handCard of [...side.hand]) {
      if (handCard.card.kind !== "spell") continue;
      if (side.energy < handCard.card.cost) continue;
      const result = aiActivateSpell(current, handCard.uid);
      if (result.ok) {
        current = result.state;
        return true;
      }
    }
    for (const handCard of [...side.hand]) {
      if (handCard.card.kind !== "trap") continue;
      if (side.energy < handCard.card.cost) continue;
      if (side.traps.every((t) => t !== null)) continue;
      const result = aiSetTrap(current, handCard.uid);
      if (result.ok) {
        current = result.state;
        return true;
      }
    }
    return false;
  };
  let guard = 0;
  while (!current.winner && guard < 24 && tryPlay()) {
    guard += 1;
    if (current.opponent.hand.length === 0) break;
  }
  if (!current.winner && !current.attackLocked) {
    current = { ...current, phase: "battle" };
    let safety = 0;
    while (!current.winner && safety < 12) {
      safety += 1;
      const side = current.opponent;
      const attackerIndex = side.monsters.findIndex(
        (m) => m !== null && m.position === "attack" && m.attacksUsed < maxAttacks(m)
      );
      if (attackerIndex < 0) break;
      const attacker = side.monsters[attackerIndex];
      if (!attacker) break;
      const playerSide = current.player;
      const filled = playerSide.monsters.map((m, index) => ({ m, index })).filter((row) => row.m !== null);
      const atk = effectiveAttack(attacker);
      let targetUid = null;
      if (filled.length > 0) {
        const beatable = filled.filter(
          (row) => row.m.position === "attack" ? atk > effectiveAttack(row.m) : atk > effectiveDefense(row.m)
        ).sort((a, b) => effectiveAttack(a.m) - effectiveAttack(b.m));
        const weakest = filled.sort((a, b) => effectiveAttack(a.m) - effectiveAttack(b.m))[0];
        if (beatable.length > 0) {
          targetUid = beatable[0].m.uid;
        } else if (weakest && atk > effectiveDefense(weakest.m) && weakest.m.position === "defense") {
          targetUid = weakest.m.uid;
        } else {
          const monsters = [...side.monsters];
          monsters[attackerIndex] = { ...attacker, attacksUsed: maxAttacks(attacker) };
          current = withSide(current, "opponent", { ...side, monsters });
          continue;
        }
      } else {
        targetUid = null;
      }
      const result = aiDeclareAttack(current, attacker.uid, targetUid);
      if (!result.ok) {
        const monsters = [...side.monsters];
        monsters[attackerIndex] = { ...attacker, attacksUsed: maxAttacks(attacker) };
        current = withSide(current, "opponent", { ...side, monsters });
        continue;
      }
      current = result.state;
    }
  }
  if (current.winner) return current;
  return handOverToPlayer(current);
}
function aiSummon(state, handUid, position, tributeUids) {
  let current = cloneState(state);
  const side = current.opponent;
  const handCard = side.hand.find((c) => c.uid === handUid);
  if (!handCard) return { state, ok: false, message: "no card" };
  const card = handCard.card;
  const monsters = [...side.monsters];
  const graveyard = [...side.graveyard];
  for (const uid of tributeUids) {
    const slot2 = monsters.findIndex((m) => m !== null && m.uid === uid);
    if (slot2 >= 0) {
      const sacrifice = monsters[slot2];
      if (sacrifice) {
        graveyard.push({ uid: sacrifice.uid, card: sacrifice.card });
        monsters[slot2] = null;
      }
    }
  }
  const slot = monsters.findIndex((m) => m === null);
  if (slot < 0) return { state, ok: false, message: "no zone" };
  monsters[slot] = {
    uid: handCard.uid,
    card,
    position,
    atkMod: 0,
    defMod: 0,
    tempAtk: 0,
    tempDef: 0,
    attacksUsed: 0,
    changedPosition: false,
    damage: 0,
    evolved: false
  };
  current = withSide(current, "opponent", {
    ...side,
    energy: side.energy - card.cost,
    hand: side.hand.filter((c) => c.uid !== handUid),
    monsters,
    graveyard
  });
  log(current, "bad", `对手召唤了 ${card.name}（${position === "attack" ? "攻击" : "守备"}表示）。`);
  current = resolveEffects(current, "opponent", card, "on-summon", { selfMonsterUid: handCard.uid });
  return { state: checkVictory(current), ok: true };
}
function aiActivateSpell(state, handUid) {
  let current = cloneState(state);
  const side = current.opponent;
  const handCard = side.hand.find((c) => c.uid === handUid);
  if (!handCard) return { state, ok: false, message: "no card" };
  const card = handCard.card;
  current = withSide(current, "opponent", {
    ...side,
    energy: side.energy - card.cost,
    hand: side.hand.filter((c) => c.uid !== handUid),
    graveyard: [...side.graveyard, { uid: handUid, card }]
  });
  log(current, "bad", `对手发动了魔法卡「${card.name}」。`);
  current = resolveEffects(current, "opponent", card, "on-activate");
  return { state: checkVictory(current), ok: true };
}
function aiSetTrap(state, handUid) {
  let current = cloneState(state);
  const side = current.opponent;
  const handCard = side.hand.find((c) => c.uid === handUid);
  if (!handCard) return { state, ok: false, message: "no card" };
  const card = handCard.card;
  const traps = [...side.traps];
  const slot = traps.findIndex((t) => t === null);
  if (slot < 0) return { state, ok: false, message: "no zone" };
  traps[slot] = { uid: handUid, card };
  current = withSide(current, "opponent", {
    ...side,
    energy: side.energy - card.cost,
    hand: side.hand.filter((c) => c.uid !== handUid),
    traps
  });
  log(current, "bad", "对手盖放了一张陷阱卡。");
  return { state: current, ok: true };
}
function aiDeclareAttack(state, attackerUid, targetUid) {
  let current = cloneState(state);
  const side = current.opponent;
  const attackerSlot = slotOfMonster(side, attackerUid);
  if (attackerSlot < 0) return { state, ok: false, message: "no monster" };
  const attacker = side.monsters[attackerSlot];
  if (!attacker) return { state, ok: false, message: "no monster" };
  const monsters = [...side.monsters];
  monsters[attackerSlot] = { ...attacker, attacksUsed: attacker.attacksUsed + 1 };
  current = withSide(current, "opponent", { ...side, monsters });
  log(
    current,
    "bad",
    `对手用 ${attacker.card.name} ${targetUid === null ? "直接攻击" : "发起攻击"}。`
  );
  const trap = triggerDefenderTrap(current, "player");
  current = trap.state;
  if (trap.negated) return { state: current, ok: true };
  current = resolveEffects(current, "opponent", attacker.card, "on-attack", {
    selfMonsterUid: attackerUid
  });
  current = checkVictory(current);
  if (current.winner) return { state: current, ok: true };
  const atk = effectiveAttack(attacker);
  if (targetUid === null) {
    current = battleDamage(current, "player", atk);
    return { state: checkVictory(current), ok: true };
  }
  const targetSlot = slotOfMonster(current.player, targetUid);
  if (targetSlot < 0) return { state: current, ok: true };
  const target = current.player.monsters[targetSlot];
  if (!target) return { state: current, ok: true };
  if (target.position === "attack") {
    const def = effectiveAttack(target);
    if (atk > def) {
      current = destroyMonster(current, "player", targetSlot, "battle");
      current = battleDamage(current, "player", atk - def);
    } else if (atk < def) {
      current = destroyMonster(current, "opponent", attackerSlot, "battle");
      current = battleDamage(current, "opponent", def - atk);
    } else {
      current = destroyMonster(current, "player", targetSlot, "battle");
      current = destroyMonster(current, "opponent", attackerSlot, "battle");
    }
  } else {
    const def = effectiveDefense(target);
    if (atk > def) {
      const piercing = attacker.card.keywords.includes("pierce") || current.rules.piercingEnabled;
      current = destroyMonster(current, "player", targetSlot, "battle");
      if (piercing) current = battleDamage(current, "player", atk - def);
    } else if (atk < def) {
      current = battleDamage(current, "opponent", def - atk);
    }
  }
  return { state: checkVictory(current), ok: true };
}
function createCardInstance(card) {
  return { uid: nextUid$1(), card };
}
function addCardToZone(state, side, card, zone, count = 1) {
  const amount = Math.max(1, Math.min(9, Math.round(count)));
  let current = cloneState(state);
  for (let i = 0; i < amount; i += 1) {
    const instance = createCardInstance(card);
    const s = sideOf(current, side);
    const next = zone === "hand" ? { ...s, hand: [...s.hand, instance] } : zone === "deck-top" ? { ...s, deck: [instance, ...s.deck] } : zone === "deck-bottom" ? { ...s, deck: [...s.deck, instance] } : { ...s, graveyard: [...s.graveyard, instance] };
    current = withSide(current, side, next);
  }
  log(
    current,
    "info",
    `${sideName$1(side)} 获得 ${amount} 张「${card.name}」（${zone === "hand" ? "手牌" : zone === "graveyard" ? "墓地" : zone === "deck-top" ? "卡组顶" : "卡组底"}）。`
  );
  return current;
}
function summonDirect(state, side, card, position, slot) {
  if (state.winner) return { state, ok: false, message: "决斗已结束，无法再召唤。" };
  if (card.kind !== "monster") return { state, ok: false, message: "只有怪兽可以召唤到场上。" };
  let current = cloneState(state);
  const s = sideOf(current, side);
  const preferred = freeMonsterSlot(s);
  if (preferred < 0) return { state, ok: false, message: "场上没有空余的怪兽区。" };
  const instance = createCardInstance(card);
  const monsters = [...s.monsters];
  monsters[preferred] = {
    uid: instance.uid,
    card,
    position,
    atkMod: 0,
    defMod: 0,
    tempAtk: 0,
    tempDef: 0,
    attacksUsed: 0,
    changedPosition: false,
    damage: 0,
    evolved: false
  };
  current = withSide(current, side, { ...sideOf(current, side), monsters });
  log(
    current,
    side === "player" ? "good" : "bad",
    `${sideName$1(side)} 的「${card.name}」被直接召唤到场上（${position === "attack" ? "攻击" : "守备"}表示）。`
  );
  current = resolveEffects(current, side, card, "on-summon", { selfMonsterUid: instance.uid });
  return { state: checkVictory(current), ok: true };
}
function replaceCardInstances(state, cardId, next) {
  const current = cloneState(state);
  const mapSide = (side) => ({
    ...side,
    deck: side.deck.map((c) => c.card.id === cardId ? { ...c, card: next } : c),
    hand: side.hand.map((c) => c.card.id === cardId ? { ...c, card: next } : c),
    graveyard: side.graveyard.map(
      (c) => c.card.id === cardId ? { ...c, card: next } : c
    ),
    monsters: side.monsters.map(
      (m) => m && m.card.id === cardId ? { ...m, card: next } : m
    ),
    traps: side.traps.map((t) => t && t.card.id === cardId ? { ...t, card: next } : t)
  });
  return {
    ...current,
    player: mapSide(current.player),
    opponent: mapSide(current.opponent)
  };
}
const RT_LANE_COUNT = 2;
let rtSeq = 0;
function nextUid(prefix) {
  rtSeq += 1;
  return `${prefix}_${rtSeq}`;
}
function laneOf(index) {
  return index === 1 ? 1 : 0;
}
function sideName(side) {
  return side === "player" ? "你" : "对手";
}
function other(side) {
  return side === "player" ? "opponent" : "player";
}
function pushLog(state, tone, text) {
  state.log.push({ id: nextUid("log"), tone, text });
  if (state.log.length > 200) state.log.splice(0, state.log.length - 200);
}
function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function expandDeck(deck, cards) {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const out = [];
  for (const entry of deck) {
    const card = byId.get(entry.cardId);
    if (!card) continue;
    const count = Math.max(1, Math.min(9, Math.round(entry.count)));
    for (let i = 0; i < count; i += 1) out.push(card);
  }
  return shuffle(out);
}
function makeTowers(rules, side) {
  const base = side === "player" ? 3 : 7;
  const kingX = side === "player" ? 1 : 9;
  const towers = [0, 1].map((lane) => ({
    key: `${side}_lane_${lane}`,
    side,
    lane,
    x: lane === 0 ? base - 0.4 : base + 0.4,
    hp: rules.towerHp,
    maxHp: rules.towerHp,
    cooldown: 0,
    alive: true
  }));
  towers.push({
    key: `${side}_king`,
    side,
    lane: "king",
    x: kingX,
    hp: rules.kingTowerHp,
    maxHp: rules.kingTowerHp,
    cooldown: 0,
    alive: true
  });
  return towers;
}
function clone(state) {
  return {
    ...state,
    elixir: { ...state.elixir },
    hand: {
      player: [...state.hand.player],
      opponent: [...state.hand.opponent]
    },
    deck: {
      player: [...state.deck.player],
      opponent: [...state.deck.opponent]
    },
    towers: state.towers.map((tower) => ({ ...tower })),
    units: state.units.map((unit) => ({ ...unit })),
    crowns: { ...state.crowns },
    log: [...state.log]
  };
}
function drawHand(state, side) {
  while (state.hand[side].length < 4) {
    if (state.deck[side].length === 0) {
      state.deck[side] = shuffle([...state.hand[side]]);
    }
    const next = state.deck[side].shift();
    if (!next) break;
    state.hand[side].push(next);
  }
}
function startRealtime(cards, deck, rules, opponentDeck) {
  const playerDeck = expandDeck(deck, cards);
  const enemyDeck = expandDeck(
    opponentDeck && opponentDeck.length > 0 ? opponentDeck : deck,
    cards
  );
  const state = {
    rules,
    timeMs: 0,
    timeLimitMs: Math.max(30, rules.matchSeconds) * 1e3,
    elixir: { player: Math.min(rules.elixirMax, 5), opponent: Math.min(rules.elixirMax, 5) },
    hand: { player: [], opponent: [] },
    deck: { player: playerDeck, opponent: enemyDeck },
    towers: [...makeTowers(rules, "player"), ...makeTowers(rules, "opponent")],
    units: [],
    crowns: { player: 0, opponent: 0 },
    log: [],
    aiCooldown: 3e3
  };
  drawHand(state, "player");
  drawHand(state, "opponent");
  pushLog(state, "info", "即时对战开始：圣水会随时间回复，摧毁对方国王塔即可获胜。");
  return state;
}
function towerAt(state, side, lane) {
  return state.towers.find(
    (tower) => tower.side === side && tower.lane === lane && tower.alive
  );
}
function targetableTowers(state, side, lane) {
  const enemy = other(side);
  const laneTower = towerAt(state, enemy, lane);
  if (laneTower) return [laneTower];
  const king = towerAt(state, enemy, "king");
  return king ? [king] : [];
}
function damageTower(state, tower, amount, attackerSide) {
  const live = state.towers.find((item) => item.key === tower.key);
  if (!live || !live.alive) return;
  live.hp = Math.max(0, live.hp - amount);
  if (live.hp > 0) return;
  live.alive = false;
  if (live.lane === "king") {
    state.winner = attackerSide;
    pushLog(
      state,
      attackerSide === "player" ? "good" : "bad",
      `${sideName(attackerSide)}摧毁了国王塔，战斗结束。`
    );
    return;
  }
  state.crowns[attackerSide] += 1;
  const label = live.lane === 0 ? "左路" : "右路";
  pushLog(
    state,
    attackerSide === "player" ? "good" : "bad",
    `${sideName(attackerSide)}推掉了${sideName(live.side)}${label}防御塔。`
  );
}
function nearestEnemyUnit(state, unit) {
  const range = unit.card.range ?? 0.8;
  let best;
  let bestGap = Number.POSITIVE_INFINITY;
  for (const candidate of state.units) {
    if (candidate.side === unit.side || candidate.hp <= 0) continue;
    if (candidate.lane !== unit.lane) continue;
    const gap = Math.abs(candidate.x - unit.x);
    if (gap <= range && gap < bestGap) {
      best = candidate;
      bestGap = gap;
    }
  }
  return best;
}
function nearestTowerInRange(state, unit) {
  const range = unit.card.range ?? 0.8;
  let best;
  let bestGap = Number.POSITIVE_INFINITY;
  for (const tower of targetableTowers(state, unit.side, unit.lane)) {
    const gap = Math.abs(tower.x - unit.x);
    if (gap <= range && gap < bestGap) {
      best = tower;
      bestGap = gap;
    }
  }
  return best;
}
function removeDead(state) {
  const survivors = [];
  for (const unit of state.units) {
    if (unit.hp > 0) {
      survivors.push(unit);
      continue;
    }
    pushLog(
      state,
      unit.side === "player" ? "bad" : "good",
      `${unit.card.name}被击倒。`
    );
  }
  state.units = survivors;
}
function tick(state, deltaMs) {
  if (state.winner) return state;
  const dt = Math.max(0, Math.min(500, deltaMs));
  if (dt === 0) return state;
  const next = clone(state);
  next.timeMs += dt;
  for (const side of ["player", "opponent"]) {
    const gain = dt / Math.max(300, next.rules.elixirRegenMs);
    next.elixir[side] = Math.min(next.rules.elixirMax, next.elixir[side] + gain);
  }
  for (const unit of next.units) {
    if (unit.hp <= 0) continue;
    unit.cooldown = Math.max(0, unit.cooldown - dt);
    const target = nearestEnemyUnit(next, unit);
    if (target) {
      if (unit.cooldown <= 0) {
        target.hp = Math.max(0, target.hp - unit.card.attack);
        unit.cooldown = Math.max(200, unit.card.attackIntervalMs ?? 1e3);
      }
      continue;
    }
    const tower = nearestTowerInRange(next, unit);
    if (tower) {
      if (unit.cooldown <= 0) {
        damageTower(next, tower, unit.card.attack, unit.side);
        unit.cooldown = Math.max(200, unit.card.attackIntervalMs ?? 1e3);
      }
      continue;
    }
    const dir = unit.side === "player" ? 1 : -1;
    const speed = Math.max(0.2, unit.card.moveSpeed ?? 1.2);
    unit.x = Math.max(0, Math.min(10, unit.x + dir * speed * dt / 1e3));
  }
  for (const tower of next.towers) {
    if (!tower.alive) continue;
    tower.cooldown = Math.max(0, tower.cooldown - dt);
    if (tower.cooldown > 0) continue;
    const range = tower.lane === "king" ? 7 : 6.5;
    let target;
    let bestGap = Number.POSITIVE_INFINITY;
    for (const unit of next.units) {
      if (unit.side === tower.side || unit.hp <= 0) continue;
      if (tower.lane !== "king" && unit.lane !== tower.lane) continue;
      const gap = Math.abs(unit.x - tower.x);
      if (gap <= range && gap < bestGap) {
        target = unit;
        bestGap = gap;
      }
    }
    if (!target) continue;
    target.hp = Math.max(0, target.hp - Math.round(next.rules.towerHp * 0.05));
    tower.cooldown = 1e3;
  }
  removeDead(next);
  if (next.rules.aiEnabled && !next.winner) {
    next.aiCooldown -= dt;
    if (next.aiCooldown <= 0) {
      const playable = next.hand.opponent.map((card, index) => ({ card, index })).filter((item) => item.card.cost <= next.elixir.opponent).sort((a, b) => b.card.cost - a.card.cost);
      const pick = playable[0];
      if (pick) {
        const lane = Math.random() < 0.5 ? 0 : 1;
        const deployed = deploy(next, "opponent", pick.index, lane);
        if (deployed.ok) {
          Object.assign(next, deployed.state);
        }
      }
      next.aiCooldown = 2200 + Math.random() * 1800;
    }
  }
  if (!next.winner && next.timeMs >= next.timeLimitMs) {
    const playerCrowns = next.crowns.player;
    const enemyCrowns = next.crowns.opponent;
    if (playerCrowns > enemyCrowns) next.winner = "player";
    else if (enemyCrowns > playerCrowns) next.winner = "opponent";
    else {
      const playerKing = towerAt(next, "player", "king")?.hp ?? 0;
      const enemyKing = towerAt(next, "opponent", "king")?.hp ?? 0;
      if (playerKing > enemyKing) next.winner = "player";
      else if (enemyKing > playerKing) next.winner = "opponent";
      else next.winner = "draw";
    }
    pushLog(next, "warn", "时间到，按皇冠数与国王塔血量判定胜负。");
  }
  return next;
}
function deploy(state, side, handIndex, lane) {
  if (state.winner) return { state, ok: false, message: "战斗已结束。" };
  const card = state.hand[side][handIndex];
  if (!card) return { state, ok: false, message: "手牌里没有这张卡。" };
  if (card.kind !== "monster") {
    return { state, ok: false, message: "即时模式目前只能部署怪兽卡。" };
  }
  if (state.elixir[side] + 1e-6 < card.cost) {
    return { state, ok: false, message: `圣水不足（需要 ${card.cost}）。` };
  }
  const next = clone(state);
  next.elixir[side] = Math.max(0, next.elixir[side] - card.cost);
  next.hand[side].splice(handIndex, 1);
  drawHand(next, side);
  const laneIndex = laneOf(lane);
  const spawnX = side === "player" ? 2 : 8;
  next.units.push({
    uid: nextUid("unit"),
    side,
    lane: laneIndex,
    card,
    hp: Math.max(1, card.defense),
    maxHp: Math.max(1, card.defense),
    x: spawnX,
    cooldown: 300
  });
  pushLog(
    next,
    side === "player" ? "good" : "bad",
    `${sideName(side)}在${laneIndex === 0 ? "左路" : "右路"}部署了${card.name}。`
  );
  return { state: next, ok: true };
}
function unitsOnLane(state, lane) {
  return state.units.filter((unit) => unit.lane === lane).sort((a, b) => a.x - b.x);
}
function towerOf(state, side, lane) {
  return state.towers.find((tower) => tower.side === side && tower.lane === lane);
}
const colors = {
  bg: "#0d1220",
  bgSoft: "#141a2c",
  panel: "#192034",
  panel2: "#202943",
  border: "#2f3c63",
  borderSoft: "#26314f",
  text: "#eaeefb",
  muted: "#9aa7c9",
  faint: "#6d7a9c",
  gold: "#e7c46a",
  goldSoft: "#f4e3b0",
  red: "#ff7373",
  redSoft: "#5c2430",
  green: "#5fd6a2",
  greenSoft: "#1d4a3c",
  blue: "#74aaff",
  purple: "#b58cff",
  orange: "#ffab5e"
};
const radius = {
  sm: 6,
  md: 10,
  lg: 14
};
const shadow = {
  card: "0 8px 20px rgba(0,0,0,0.45)"
};
const attributeGradient = {
  light: "linear-gradient(140deg,#fff3c4,#e7c46a 45%,#b48a2c)",
  dark: "linear-gradient(140deg,#6c5a92,#3a2f5c 45%,#221a38)",
  earth: "linear-gradient(140deg,#c9a877,#8d6b3f 45%,#5a4227)",
  water: "linear-gradient(140deg,#9fd8ff,#4a90c8 45%,#22557a)",
  fire: "linear-gradient(140deg,#ffb27a,#e2622f 45%,#8f2c14)",
  wind: "linear-gradient(140deg,#b7f0cf,#4fb182 45%,#276b52)",
  divine: "linear-gradient(140deg,#ffe9a8,#d8a3ff 50%,#7a5bd6)"
};
const kindSurface = {
  monster: "#f6efdb",
  spell: "#e8f2e4",
  trap: "#f4e6ee"
};
const kindAccent = {
  monster: "#8a6a2f",
  spell: "#3f6b52",
  trap: "#7a3f5e"
};
function CardArt(props) {
  const { card } = props;
  const ctx = useExtensionContext();
  const [broken, setBroken] = useState(false);
  const art = card.art.trim();
  const resolvedUrl = useMemo(() => {
    if (!art || art.startsWith("emoji:")) return null;
    if (/^(https?:|data:|blob:)/i.test(art)) return art;
    try {
      const ref = ctx.asset.resolve(art);
      return ref?.url ?? null;
    } catch {
      return null;
    }
  }, [art, ctx]);
  const height = props.height ?? 120;
  const baseStyle = {
    height,
    width: "100%",
    borderRadius: props.radius ?? 6,
    overflow: "hidden",
    position: "relative",
    background: attributeGradient[card.attribute] ?? attributeGradient.dark,
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  };
  if (resolvedUrl && !broken) {
    return /* @__PURE__ */ jsx("div", { style: baseStyle, children: /* @__PURE__ */ jsx(
      "img",
      {
        src: resolvedUrl,
        alt: card.name,
        onError: () => setBroken(true),
        style: { width: "100%", height: "100%", objectFit: "cover", display: "block" }
      }
    ) });
  }
  if (art.startsWith("emoji:")) {
    const glyph = art.slice(6).trim() || "🃏";
    return /* @__PURE__ */ jsxs("div", { style: baseStyle, children: [
      /* @__PURE__ */ jsx(ProceduralBackdrop, { card }),
      /* @__PURE__ */ jsx(
        "span",
        {
          style: {
            fontSize: typeof height === "number" ? Math.max(18, height * 0.52) : 44,
            lineHeight: 1,
            filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.45))",
            position: "relative"
          },
          children: glyph
        }
      )
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { style: baseStyle, children: [
    /* @__PURE__ */ jsx(ProceduralBackdrop, { card }),
    /* @__PURE__ */ jsx(
      "span",
      {
        style: {
          fontSize: typeof height === "number" ? Math.max(16, height * 0.44) : 40,
          lineHeight: 1,
          opacity: 0.92,
          filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.5))",
          position: "relative"
        },
        children: raceGlyph(card.race)
      }
    )
  ] });
}
function ProceduralBackdrop(props) {
  const { card } = props;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 55%)"
        }
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          position: "absolute",
          inset: 0,
          opacity: 0.16,
          backgroundImage: "repeating-linear-gradient(135deg, rgba(0,0,0,0.65) 0 2px, transparent 2px 9px)"
        }
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          position: "absolute",
          right: 6,
          bottom: 4,
          fontSize: 11,
          color: "rgba(255,255,255,0.75)",
          textShadow: "0 1px 2px rgba(0,0,0,0.6)"
        },
        children: ATTRIBUTE_GLYPHS[card.attribute]
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          position: "absolute",
          left: 6,
          bottom: 4,
          fontSize: 10,
          color: "rgba(255,255,255,0.65)",
          letterSpacing: 1
        },
        children: card.race
      }
    )
  ] });
}
const SIZES = {
  lg: { width: 268, height: 392, name: 15, body: 11, stars: 11, artHeight: 150, pad: 8 },
  md: { width: 182, height: 266, name: 12.5, body: 9.5, stars: 9, artHeight: 96, pad: 6 },
  sm: { width: 116, height: 170, name: 10.5, body: 8.5, stars: 8, artHeight: 58, pad: 4 },
  mini: { width: 88, height: 128, name: 9.5, body: 8, stars: 7, artHeight: 40, pad: 3 }
};
function CardFrame(props) {
  const {
    card,
    size = "md",
    selected = false,
    dimmed = false,
    onClick,
    badge,
    badgeTone = colors.gold,
    footerExtra,
    style
  } = props;
  const spec = SIZES[size];
  const isMonster = card.kind === "monster";
  const stars = isMonster ? Math.max(1, Math.min(12, card.level)) : 0;
  const starText = "★".repeat(Math.min(stars, 10));
  const lineClamp = size === "lg" ? 6 : size === "md" ? 4 : size === "sm" ? 3 : 2;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: onClick ? "dcf-card is-clickable" : "dcf-card",
      onClick,
      style: {
        width: spec.width,
        minWidth: spec.width,
        height: spec.height,
        padding: 3,
        borderRadius: radius.md,
        background: attributeGradient[card.attribute] ?? attributeGradient.dark,
        boxShadow: selected ? `0 0 0 2px ${colors.gold}, 0 10px 26px rgba(0,0,0,.55)` : shadow.card,
        cursor: onClick ? "pointer" : "default",
        opacity: dimmed ? 0.55 : 1,
        filter: dimmed ? "grayscale(0.45)" : void 0,
        position: "relative",
        transition: "transform .12s ease, box-shadow .12s ease",
        ...style
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            height: "100%",
            borderRadius: radius.md - 3,
            background: kindSurface[card.kind],
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: spec.pad,
            gap: size === "lg" ? 5 : 3,
            boxSizing: "border-box",
            position: "relative"
          },
          children: [
            /* @__PURE__ */ jsxs(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "linear-gradient(180deg,#332818,#241c11)",
                  border: "1px solid rgba(231,196,106,0.45)",
                  borderRadius: 4,
                  padding: `${size === "lg" ? 4 : 2}px ${size === "lg" ? 7 : 4}px`
                },
                children: [
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      style: {
                        flex: 1,
                        minWidth: 0,
                        color: colors.goldSoft,
                        fontSize: spec.name,
                        fontWeight: 700,
                        lineHeight: 1.25,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      },
                      children: card.name
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      style: {
                        flexShrink: 0,
                        fontSize: spec.body - 1,
                        color: "#cbb27a",
                        letterSpacing: 0.5
                      },
                      children: isMonster ? ATTRIBUTE_LABELS[card.attribute] : KIND_LABELS[card.kind]
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minHeight: spec.stars + 2
                },
                children: [
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      style: {
                        color: "#c9962c",
                        fontSize: spec.stars,
                        letterSpacing: 0.5,
                        lineHeight: 1,
                        textShadow: "0 1px 0 rgba(255,255,255,.6)"
                      },
                      children: isMonster ? starText : "◆"
                    }
                  ),
                  isMonster && stars > 10 ? /* @__PURE__ */ jsxs("span", { style: { fontSize: spec.stars - 1, color: "#9a7320" }, children: [
                    "Lv",
                    stars
                  ] }) : null,
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      style: {
                        fontSize: spec.body - 1,
                        color: kindAccent[card.kind],
                        letterSpacing: 0.6
                      },
                      children: card.race
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsx(CardArt, { card, height: spec.artHeight, radius: 4 }),
            /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  flex: 1,
                  minHeight: 0,
                  borderRadius: 4,
                  border: `1px solid ${kindAccent[card.kind]}44`,
                  background: "rgba(255,255,255,0.45)",
                  padding: size === "lg" ? 6 : 4,
                  overflow: "hidden"
                },
                children: /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      fontSize: spec.body,
                      lineHeight: 1.45,
                      color: "#3c3323",
                      display: "-webkit-box",
                      WebkitLineClamp: lineClamp,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      wordBreak: "break-word"
                    },
                    children: card.description || "（尚未填写卡牌效果）"
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxs(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 4,
                  fontSize: spec.body,
                  color: "#3c3323"
                },
                children: [
                  isMonster ? /* @__PURE__ */ jsxs("span", { style: { display: "flex", gap: size === "lg" ? 10 : 6 }, children: [
                    /* @__PURE__ */ jsxs("span", { style: { color: "#a5341e", fontWeight: 700 }, children: [
                      "攻 ",
                      card.attack
                    ] }),
                    /* @__PURE__ */ jsxs("span", { style: { color: "#27568f", fontWeight: 700 }, children: [
                      "守 ",
                      card.defense
                    ] })
                  ] }) : /* @__PURE__ */ jsxs("span", { style: { color: kindAccent[card.kind], fontWeight: 700 }, children: [
                    KIND_LABELS[card.kind],
                    "卡"
                  ] }),
                  /* @__PURE__ */ jsxs(
                    "span",
                    {
                      style: {
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 3,
                        background: "linear-gradient(180deg,#f4d98c,#d8ae4a)",
                        color: "#3a2a08",
                        borderRadius: 999,
                        padding: `0 ${size === "lg" ? 7 : 5}px`,
                        fontWeight: 700,
                        fontSize: spec.body - 0.5,
                        border: "1px solid rgba(120,86,20,.5)"
                      },
                      children: [
                        "◈ ",
                        card.cost
                      ]
                    }
                  )
                ]
              }
            ),
            footerExtra,
            badge ? /* @__PURE__ */ jsx(
              "span",
              {
                style: {
                  position: "absolute",
                  top: 2,
                  right: 2,
                  fontSize: spec.body - 1,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: "rgba(20,16,8,.82)",
                  color: badgeTone,
                  border: `1px solid ${badgeTone}`,
                  pointerEvents: "none"
                },
                children: badge
              }
            ) : null
          ]
        }
      )
    }
  );
}
function Btn(props) {
  const {
    children,
    onClick,
    variant = "ghost",
    size = "md",
    disabled = false,
    title,
    full,
    style
  } = props;
  const palette = {
    primary: {
      background: "linear-gradient(180deg,#3f5fa8,#2c4379)",
      border: "1px solid #5577c4",
      color: "#eef4ff"
    },
    gold: {
      background: "linear-gradient(180deg,#e7c46a,#c49a3a)",
      border: "1px solid #f0d68f",
      color: "#2a2109",
      fontWeight: 700
    },
    ghost: {
      background: colors.panel2,
      border: `1px solid ${colors.border}`,
      color: colors.text
    },
    danger: {
      background: "linear-gradient(180deg,#7a2b34,#4d1a22)",
      border: "1px solid #a2434f",
      color: "#ffe3e6"
    },
    quiet: {
      background: "transparent",
      border: `1px solid ${colors.borderSoft}`,
      color: colors.muted
    }
  };
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      className: "dcf-btn",
      title,
      disabled,
      onClick,
      style: {
        ...palette[variant],
        padding: size === "sm" ? "4px 9px" : "7px 14px",
        borderRadius: radius.sm,
        fontSize: size === "sm" ? 12 : 13,
        lineHeight: 1.35,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        width: full ? "100%" : void 0,
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        ...style
      },
      children
    }
  );
}
function Chip(props) {
  const { children, active = false, onClick, tone = "gold", title } = props;
  const activeColor = tone === "blue" ? colors.blue : tone === "plain" ? colors.text : colors.gold;
  return /* @__PURE__ */ jsx(
    "button",
    {
      type: "button",
      className: "dcf-chip",
      title,
      onClick,
      style: {
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontFamily: "inherit",
        cursor: onClick ? "pointer" : "default",
        border: `1px solid ${active ? activeColor : colors.border}`,
        background: active ? "rgba(231,196,106,0.14)" : colors.panel2,
        color: active ? activeColor : colors.muted
      },
      children
    }
  );
}
function Field(props) {
  return /* @__PURE__ */ jsxs("label", { style: { display: "block", ...props.style }, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4
        },
        children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: colors.muted }, children: props.label }),
          props.hint ? /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: colors.faint }, children: props.hint }) : null
        ]
      }
    ),
    props.children
  ] });
}
const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 9px",
  borderRadius: radius.sm,
  border: `1px solid ${colors.border}`,
  background: colors.bgSoft,
  color: colors.text,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none"
};
function TextInput(props) {
  if (props.multiline) {
    return /* @__PURE__ */ jsx(
      "textarea",
      {
        value: props.value,
        rows: props.rows ?? 3,
        placeholder: props.placeholder,
        onChange: (event) => props.onChange(event.target.value),
        style: { ...inputStyle, resize: "vertical", lineHeight: 1.55, ...props.style }
      }
    );
  }
  return /* @__PURE__ */ jsx(
    "input",
    {
      value: props.value,
      list: props.list,
      placeholder: props.placeholder,
      onChange: (event) => props.onChange(event.target.value),
      style: { ...inputStyle, ...props.style }
    }
  );
}
function NumInput(props) {
  const { value, onChange, min = 0, max = 999999, step = 1, suffix } = props;
  return /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "number",
        value: String(value),
        min,
        max,
        step,
        onChange: (event) => {
          const parsed = Number(event.target.value);
          if (!Number.isFinite(parsed)) return;
          onChange(Math.max(min, Math.min(max, Math.round(parsed))));
        },
        style: { ...inputStyle, paddingRight: suffix ? 30 : 9 }
      }
    ),
    suffix ? /* @__PURE__ */ jsx(
      "span",
      {
        style: {
          position: "absolute",
          right: 9,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 11,
          color: colors.faint,
          pointerEvents: "none"
        },
        children: suffix
      }
    ) : null
  ] });
}
function Toggle(props) {
  const { checked, onChange, label, hint } = props;
  return /* @__PURE__ */ jsxs(
    "button",
    {
      type: "button",
      onClick: () => onChange(!checked),
      style: {
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        background: colors.panel2,
        border: `1px solid ${checked ? "rgba(231,196,106,0.55)" : colors.border}`,
        borderRadius: radius.md,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left"
      },
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            style: {
              width: 34,
              height: 18,
              borderRadius: 999,
              background: checked ? colors.gold : "#3b466a",
              position: "relative",
              flexShrink: 0,
              transition: "background .15s ease"
            },
            children: /* @__PURE__ */ jsx(
              "span",
              {
                style: {
                  position: "absolute",
                  top: 2,
                  left: checked ? 18 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: checked ? "#2a2109" : "#c9d3ee",
                  transition: "left .15s ease"
                }
              }
            )
          }
        ),
        /* @__PURE__ */ jsxs("span", { style: { flex: 1 }, children: [
          /* @__PURE__ */ jsx("span", { style: { display: "block", fontSize: 13, color: colors.text }, children: label }),
          hint ? /* @__PURE__ */ jsx("span", { style: { display: "block", fontSize: 11, color: colors.faint, marginTop: 2 }, children: hint }) : null
        ] })
      ]
    }
  );
}
function Select(props) {
  return /* @__PURE__ */ jsx(
    "select",
    {
      value: props.value,
      onChange: (event) => props.onChange(event.target.value),
      style: { ...inputStyle, cursor: "pointer" },
      children: props.options.map((option) => /* @__PURE__ */ jsx("option", { value: option.value, style: { background: colors.panel }, children: option.label }, option.value))
    }
  );
}
function Panel(props) {
  return /* @__PURE__ */ jsxs(
    "section",
    {
      style: {
        background: colors.panel,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: radius.lg,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        ...props.style
      },
      children: [
        props.title ? /* @__PURE__ */ jsxs(
          "header",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderBottom: `1px solid ${colors.borderSoft}`,
              background: "rgba(255,255,255,0.02)"
            },
            children: [
              /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 13, fontWeight: 600, color: colors.goldSoft }, children: props.title }),
                props.subtitle ? /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: colors.faint, marginTop: 2 }, children: props.subtitle }) : null
              ] }),
              props.right
            ]
          }
        ) : null,
        /* @__PURE__ */ jsx("div", { style: { padding: 12, minHeight: 0, ...props.bodyStyle }, children: props.children })
      ]
    }
  );
}
function Empty(props) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        padding: "28px 12px",
        textAlign: "center",
        color: colors.faint,
        fontSize: 12,
        lineHeight: 1.7
      },
      children: props.text
    }
  );
}
function StatBar(props) {
  const ratio = props.max > 0 ? Math.max(0, Math.min(1, props.value / props.max)) : 0;
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: colors.muted,
          marginBottom: 3
        },
        children: [
          /* @__PURE__ */ jsx("span", { children: props.label }),
          /* @__PURE__ */ jsx("span", { style: { color: colors.text }, children: props.text ?? props.value })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          height: 8,
          borderRadius: 999,
          background: "#0b1020",
          border: `1px solid ${colors.borderSoft}`,
          overflow: "hidden"
        },
        children: /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              width: `${ratio * 100}%`,
              height: "100%",
              background: props.color,
              transition: "width .3s ease"
            }
          }
        )
      }
    )
  ] });
}
function BattleBoard(props) {
  const { state } = props;
  const [selectedHand, setSelectedHand] = useState(null);
  const [selectedMonster, setSelectedMonster] = useState(null);
  const [attackMode, setAttackMode] = useState(false);
  const [pendingSummon, setPendingSummon] = useState(null);
  const [tributes, setTributes] = useState([]);
  const logRef = useRef(null);
  useEffect(() => {
    setSelectedHand(null);
    setSelectedMonster(null);
    setAttackMode(false);
    setPendingSummon(null);
    setTributes([]);
  }, [state?.turn]);
  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [state?.log.length]);
  if (!state) {
    return /* @__PURE__ */ jsx(StartScreen, { ...props });
  }
  const player = state.player;
  const opponent = state.opponent;
  const enemyHasMonsters = opponent.monsters.some((monster) => monster !== null);
  const myTurn = state.active === "player" && !state.winner;
  const shadowverse = state.rules.battleMode === "shadowverse";
  const handCard = selectedHand ? player.hand.find((card) => card.uid === selectedHand)?.card ?? null : null;
  const selectedMonsterObj = selectedMonster ? player.monsters.find((monster) => monster?.uid === selectedMonster) ?? null : null;
  const toggleTribute = (uid) => {
    if (!pendingSummon) return;
    setTributes((current) => {
      if (current.includes(uid)) return current.filter((item) => item !== uid);
      if (current.length >= pendingSummon.need) return current;
      return [...current, uid];
    });
  };
  const beginSummon = (position) => {
    if (!handCard || !selectedHand) return;
    const need = tributeRequirement(handCard, state.rules);
    if (need === 0) {
      props.onSummon(selectedHand, position, []);
      setSelectedHand(null);
      return;
    }
    setPendingSummon({ handUid: selectedHand, position, need });
    setTributes([]);
    setSelectedHand(null);
    setSelectedMonster(null);
  };
  const confirmSummon = () => {
    if (!pendingSummon) return;
    if (tributes.length !== pendingSummon.need) return;
    props.onSummon(pendingSummon.handUid, pendingSummon.position, tributes);
    setPendingSummon(null);
    setTributes([]);
  };
  const handleOwnMonsterClick = (monster) => {
    if (pendingSummon) {
      toggleTribute(monster.uid);
      return;
    }
    if (selectedMonster === monster.uid) {
      setSelectedMonster(null);
      setAttackMode(false);
      return;
    }
    setSelectedMonster(monster.uid);
    setSelectedHand(null);
    setAttackMode(false);
  };
  const handleEnemyMonsterClick = (monster) => {
    if (!attackMode || !selectedMonster) return;
    props.onAttack(selectedMonster, monster.uid);
    setAttackMode(false);
    setSelectedMonster(null);
  };
  const zoneSize = state.rules.monsterZones >= 5 ? "mini" : "sm";
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 10, height: "100%", minHeight: 0 }, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
          paddingRight: 2
        },
        children: [
          /* @__PURE__ */ jsx(
            SideStrip,
            {
              title: "对手",
              side: opponent,
              tone: "enemy",
              active: state.active === "opponent",
              energyMax: state.rules.energyMax
            }
          ),
          /* @__PURE__ */ jsx(
            ZoneRow,
            {
              label: "对手场地",
              monsterZones: state.rules.monsterZones,
              trapZones: state.rules.spellZones,
              size: zoneSize,
              monsters: opponent.monsters,
              traps: opponent.traps,
              highlight: attackMode,
              shadowverse,
              onMonsterClick: handleEnemyMonsterClick
            }
          ),
          /* @__PURE__ */ jsx(
            CenterBar,
            {
              state,
              myTurn,
              onStartBattle: props.onStartBattle,
              onEndTurn: props.onEndTurn,
              onDirectAttack: () => {
                if (!selectedMonster) return;
                props.onAttack(selectedMonster, null);
                setAttackMode(false);
                setSelectedMonster(null);
              },
              directAttackEnabled: shadowverse || state.rules.directAttackAllowed && (!enemyHasMonsters || Boolean(
                selectedMonsterObj?.card.keywords.includes("direct")
              )),
              hasSelectedMonster: Boolean(selectedMonsterObj),
              attackMode,
              evolvePoints: shadowverse ? state.evolve.player : void 0
            }
          ),
          /* @__PURE__ */ jsx(
            ZoneRow,
            {
              label: "你的场地",
              monsterZones: state.rules.monsterZones,
              trapZones: state.rules.spellZones,
              size: zoneSize,
              monsters: player.monsters,
              traps: player.traps,
              highlight: Boolean(pendingSummon),
              selectedUid: selectedMonster,
              shadowverse,
              tributeUids: tributes,
              onMonsterClick: (monster) => handleOwnMonsterClick(monster)
            }
          ),
          /* @__PURE__ */ jsx(
            SideStrip,
            {
              title: "你",
              side: player,
              tone: "self",
              active: state.active === "player",
              energyMax: state.rules.energyMax
            }
          ),
          /* @__PURE__ */ jsxs(
            Panel,
            {
              title: `手牌 · ${player.hand.length}`,
              subtitle: state.winner ? "决斗已结束" : state.active === "player" ? state.phase === "main" ? "主要阶段：召唤怪兽、发动魔法、盖放陷阱" : "战斗阶段：选择怪兽攻击" : "对手回合…",
              bodyStyle: { padding: 8, display: "flex", flexDirection: "column", gap: 8 },
              children: [
                player.hand.length === 0 ? /* @__PURE__ */ jsx("div", { style: { fontSize: 11.5, color: colors.faint, padding: "10px 4px" }, children: "手牌为空。" }) : /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      display: "flex",
                      gap: 6,
                      overflowX: "auto",
                      paddingBottom: 2,
                      minHeight: 176,
                      alignItems: "flex-end"
                    },
                    children: player.hand.map((instance) => {
                      const card = instance.card;
                      const blocker = myTurn ? summonBlocker(state, instance.uid) : null;
                      const dimmed = myTurn && card.kind === "monster" && blocker !== null;
                      return /* @__PURE__ */ jsx(
                        CardFrame,
                        {
                          card,
                          size: "sm",
                          selected: selectedHand === instance.uid,
                          dimmed,
                          onClick: () => {
                            if (pendingSummon) return;
                            setSelectedHand(selectedHand === instance.uid ? null : instance.uid);
                            setSelectedMonster(null);
                            setAttackMode(false);
                          }
                        },
                        instance.uid
                      );
                    })
                  }
                ),
                pendingSummon ? /* @__PURE__ */ jsxs(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      background: "rgba(231,196,106,0.10)",
                      border: `1px solid ${colors.gold}`,
                      borderRadius: radius.md,
                      padding: "8px 10px"
                    },
                    children: [
                      /* @__PURE__ */ jsxs("span", { style: { fontSize: 12, color: colors.goldSoft }, children: [
                        "祭品召唤：请选择 ",
                        pendingSummon.need,
                        " 只祭品（已选 ",
                        tributes.length,
                        "）"
                      ] }),
                      /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
                      /* @__PURE__ */ jsx(
                        Btn,
                        {
                          size: "sm",
                          variant: "gold",
                          disabled: tributes.length !== pendingSummon.need,
                          onClick: confirmSummon,
                          children: "确认召唤"
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        Btn,
                        {
                          size: "sm",
                          disabled: false,
                          onClick: () => {
                            setPendingSummon(null);
                            setTributes([]);
                          },
                          children: "取消"
                        }
                      )
                    ]
                  }
                ) : selectedHand && handCard ? /* @__PURE__ */ jsx(
                  ActionBar,
                  {
                    card: handCard,
                    canSummon: myTurn && summonBlocker(state, selectedHand) === null,
                    canActivate: myTurn && state.phase === "main" && player.energy >= handCard.cost,
                    onSummonAttack: () => beginSummon("attack"),
                    onSummonDefense: () => beginSummon("defense"),
                    onActivateSpell: () => {
                      props.onActivateSpell(selectedHand);
                      setSelectedHand(null);
                    },
                    onSetTrap: () => {
                      props.onSetTrap(selectedHand);
                      setSelectedHand(null);
                    }
                  }
                ) : selectedMonsterObj ? /* @__PURE__ */ jsxs(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                      background: colors.panel2,
                      border: `1px solid ${colors.border}`,
                      borderRadius: radius.md,
                      padding: "8px 10px"
                    },
                    children: [
                      /* @__PURE__ */ jsxs("span", { style: { fontSize: 12, color: colors.text }, children: [
                        selectedMonsterObj.card.name,
                        /* @__PURE__ */ jsxs("span", { style: { color: colors.faint, marginLeft: 6 }, children: [
                          "攻 ",
                          effectiveAttack(selectedMonsterObj),
                          " /",
                          " ",
                          shadowverse ? `生命 ${monsterHealth(selectedMonsterObj)}` : `守 ${effectiveDefense(selectedMonsterObj)}`,
                          shadowverse ? selectedMonsterObj.evolved ? " · 已进化" : "" : ` · ${selectedMonsterObj.position === "attack" ? "攻击表示" : "守备表示"}`
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
                      selectedMonsterObj.position === "attack" && state.phase === "battle" && myTurn && !state.attackLocked && selectedMonsterObj.attacksUsed < (selectedMonsterObj.card.keywords.includes("double") ? 2 : 1) ? shadowverse ? /* @__PURE__ */ jsxs(Fragment, { children: [
                        /* @__PURE__ */ jsx(
                          Btn,
                          {
                            size: "sm",
                            variant: "gold",
                            onClick: () => {
                              props.onAttack(selectedMonsterObj.uid, null);
                              setSelectedMonster(null);
                            },
                            children: "攻击玩家"
                          }
                        ),
                        enemyHasMonsters ? /* @__PURE__ */ jsx(Btn, { size: "sm", onClick: () => setAttackMode(true), children: "攻击随从" }) : null
                      ] }) : /* @__PURE__ */ jsx(
                        Btn,
                        {
                          size: "sm",
                          variant: "gold",
                          onClick: () => {
                            if (enemyHasMonsters) setAttackMode(true);
                            else {
                              props.onAttack(selectedMonsterObj.uid, null);
                              setSelectedMonster(null);
                            }
                          },
                          children: enemyHasMonsters ? "选择攻击目标" : "直接攻击"
                        }
                      ) : null,
                      shadowverse ? /* @__PURE__ */ jsxs(
                        Btn,
                        {
                          size: "sm",
                          variant: "primary",
                          disabled: !myTurn || selectedMonsterObj.evolved || state.evolve.player <= 0,
                          onClick: () => {
                            props.onEvolve(selectedMonsterObj.uid);
                            setSelectedMonster(null);
                          },
                          children: [
                            "进化（剩余 ",
                            state.evolve.player,
                            "）"
                          ]
                        }
                      ) : /* @__PURE__ */ jsx(
                        Btn,
                        {
                          size: "sm",
                          onClick: () => {
                            props.onChangePosition(selectedMonsterObj.uid);
                            setSelectedMonster(null);
                          },
                          children: "改变表示形式"
                        }
                      ),
                      /* @__PURE__ */ jsx(Btn, { size: "sm", variant: "quiet", onClick: () => setSelectedMonster(null), children: "取消" })
                    ]
                  }
                ) : /* @__PURE__ */ jsxs("div", { style: { fontSize: 11.5, color: colors.faint }, children: [
                  "点击手牌查看可执行的操作；点击自己的怪兽可以攻击",
                  shadowverse ? "或进化" : "或改变表示形式",
                  "。"
                ] })
              ]
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      Panel,
      {
        title: "决斗记录",
        subtitle: `第 ${state.turn} 回合`,
        style: { width: 264, flex: "0 0 264px", alignSelf: "stretch" },
        bodyStyle: { padding: 0, minHeight: 0, flex: 1, display: "flex" },
        children: /* @__PURE__ */ jsx(
          "div",
          {
            ref: logRef,
            style: {
              flex: 1,
              overflowY: "auto",
              padding: "8px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 5,
              fontSize: 11.5,
              lineHeight: 1.5
            },
            children: state.log.slice(-120).map((entry) => /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  color: entry.tone === "good" ? colors.green : entry.tone === "bad" ? colors.red : entry.tone === "warn" ? colors.gold : colors.muted
                },
                children: entry.text
              },
              entry.id
            ))
          }
        )
      }
    ),
    state.winner ? /* @__PURE__ */ jsx(
      ResultOverlay,
      {
        winner: state.winner,
        onRestart: props.onStart,
        onExit: props.onExit,
        wins: props.wins,
        losses: props.losses
      }
    ) : null
  ] });
}
function StartScreen(props) {
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "center", paddingTop: 20 }, children: /* @__PURE__ */ jsxs(
    Panel,
    {
      title: "准备决斗",
      subtitle: "规则与卡组来自「规则」「卡组」两页",
      style: { width: 560 },
      bodyStyle: { display: "flex", flexDirection: "column", gap: 12 },
      children: [
        /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }, children: [
          /* @__PURE__ */ jsx(Metric, { label: "卡组张数", value: `${props.deckCount}`, tone: colors.gold }),
          /* @__PURE__ */ jsx(Metric, { label: "胜场", value: `${props.wins}`, tone: colors.green }),
          /* @__PURE__ */ jsx(Metric, { label: "败场", value: `${props.losses}`, tone: colors.red })
        ] }),
        !props.deckValid ? /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              fontSize: 12,
              color: colors.red,
              border: `1px solid ${colors.redSoft}`,
              background: "rgba(255,115,115,0.08)",
              borderRadius: 8,
              padding: "8px 10px",
              lineHeight: 1.6
            },
            children: "卡组为空或不满足规则要求，请先到「卡组」页准备一套卡组。"
          }
        ) : /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: colors.muted, lineHeight: 1.7 }, children: "使用当前卡组与对手进行一场决斗。生命值归零或卡组抽空即分胜负。 你也可以先到「规则」页调整生命值、能量、召唤次数与祭品规则。" }),
        /* @__PURE__ */ jsx(Btn, { variant: "gold", onClick: props.onStart, disabled: !props.deckValid, children: "开始决斗" })
      ]
    }
  ) });
}
function Metric(props) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        background: colors.bgSoft,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 8,
        padding: "8px 10px",
        textAlign: "center"
      },
      children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 18, fontWeight: 700, color: props.tone }, children: props.value }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: colors.faint, marginTop: 2 }, children: props.label })
      ]
    }
  );
}
function SideStrip(props) {
  const { side, tone } = props;
  const accent = tone === "self" ? colors.blue : colors.red;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "grid",
        gridTemplateColumns: "150px minmax(0,1fr) 212px",
        gap: 12,
        alignItems: "center",
        background: colors.panel,
        border: `1px solid ${props.active ? accent : colors.borderSoft}`,
        borderRadius: radius.md,
        padding: "8px 12px"
      },
      children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 12.5, color: colors.text, fontWeight: 600 }, children: [
            props.title,
            props.active ? /* @__PURE__ */ jsx("span", { style: { marginLeft: 6, fontSize: 10.5, color: accent }, children: "● 行动中" }) : null
          ] }),
          /* @__PURE__ */ jsxs("div", { style: { fontSize: 10.5, color: colors.faint, marginTop: 2 }, children: [
            "卡组 ",
            side.deck.length,
            " · 墓地 ",
            side.graveyard.length,
            " · 手牌 ",
            side.hand.length
          ] }),
          tone === "enemy" && side.hand.length > 0 ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 2, marginTop: 4, alignItems: "center" }, children: [
            Array.from({ length: Math.min(side.hand.length, 8) }).map((_, index) => /* @__PURE__ */ jsx(
              "span",
              {
                style: {
                  width: 9,
                  height: 14,
                  borderRadius: 2,
                  border: `1px solid ${colors.purple}`,
                  background: "repeating-linear-gradient(45deg,#3a2a52 0 3px,#2a1e3c 3px 6px)"
                }
              },
              index
            )),
            side.hand.length > 8 ? /* @__PURE__ */ jsxs("span", { style: { fontSize: 10, color: colors.faint }, children: [
              "+",
              side.hand.length - 8
            ] }) : null
          ] }) : null
        ] }),
        /* @__PURE__ */ jsx(
          StatBar,
          {
            label: "生命值",
            value: side.lp,
            max: Math.max(side.lp, 1),
            color: tone === "self" ? "linear-gradient(90deg,#3f7ad6,#69a8ff)" : "linear-gradient(90deg,#a13a3a,#ff7373)",
            text: `${side.lp}`
          }
        ),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }, children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 10.5, color: colors.faint }, children: "能量" }),
          /* @__PURE__ */ jsx(EnergyOrbs, { value: side.energy, max: props.energyMax })
        ] })
      ]
    }
  );
}
function EnergyOrbs(props) {
  const total = Math.max(1, Math.min(12, props.max));
  const filled = Math.max(0, Math.min(total, props.value));
  return /* @__PURE__ */ jsxs("span", { style: { display: "flex", gap: 3, alignItems: "center" }, children: [
    Array.from({ length: total }).map((_, index) => /* @__PURE__ */ jsx(
      "span",
      {
        style: {
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: index < filled ? colors.gold : "#2c3552",
          border: `1px solid ${index < filled ? colors.goldSoft : colors.border}`,
          boxShadow: index < filled ? "0 0 6px rgba(231,196,106,.7)" : void 0
        }
      },
      index
    )),
    /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: colors.muted, marginLeft: 3 }, children: [
      props.value,
      "/",
      props.max
    ] })
  ] });
}
function ZoneRow(props) {
  const { monsters, traps, size } = props;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        background: props.highlight ? "rgba(231,196,106,0.06)" : colors.bgSoft,
        border: `1px dashed ${props.highlight ? colors.gold : colors.border}`,
        borderRadius: radius.md,
        padding: 8,
        overflowX: "auto"
      },
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            style: {
              writingMode: "vertical-rl",
              fontSize: 10.5,
              color: colors.faint,
              letterSpacing: 2,
              alignSelf: "center"
            },
            children: props.label
          }
        ),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6 }, children: monsters.slice(0, props.monsterZones).map((monster, index) => {
          const isTribute = Boolean(monster && props.tributeUids?.includes(monster.uid));
          if (!monster) {
            return /* @__PURE__ */ jsx("div", { style: emptySlotStyle(size), children: /* @__PURE__ */ jsx("span", { style: { fontSize: 10, color: colors.faint }, children: "空" }) }, `slot_${index}`);
          }
          const attacked = monster.attacksUsed >= (monster.card.keywords.includes("double") ? 2 : 1);
          return /* @__PURE__ */ jsxs("div", { style: { position: "relative" }, children: [
            /* @__PURE__ */ jsx(
              CardFrame,
              {
                card: monster.card,
                size,
                selected: props.selectedUid === monster.uid || isTribute,
                dimmed: attacked && monster.position === "attack",
                onClick: () => props.onMonsterClick?.(monster)
              }
            ),
            /* @__PURE__ */ jsxs(
              "div",
              {
                style: {
                  marginTop: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontSize: 10,
                  whiteSpace: "nowrap"
                },
                children: [
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      style: {
                        color: isTribute ? colors.gold : props.shadowverse ? colors.red : monster.position === "defense" ? colors.blue : colors.red
                      },
                      children: isTribute ? "祭品" : props.shadowverse ? "随从" : monster.position === "defense" ? "守备" : "攻击"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { style: { color: colors.faint }, children: props.shadowverse ? `生命 ${monsterHealth(monster)}` : monster.position === "defense" ? effectiveDefense(monster) : effectiveAttack(monster) })
                ]
              }
            )
          ] }, monster.uid);
        }) }),
        props.trapZones > 0 ? /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 5, marginLeft: 4 }, children: traps.slice(0, props.trapZones).map(
          (trap, index) => trap ? /* @__PURE__ */ jsx(
            "div",
            {
              title: trap.card.name,
              style: {
                width: size === "mini" ? 44 : 52,
                height: size === "mini" ? 64 : 78,
                borderRadius: 6,
                border: `1px solid ${colors.purple}`,
                background: "repeating-linear-gradient(45deg,#3a2a52 0 5px,#2a1e3c 5px 10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: colors.purple,
                fontSize: 9,
                textAlign: "center"
              },
              children: "盖放"
            },
            trap.uid
          ) : /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                width: size === "mini" ? 44 : 52,
                height: size === "mini" ? 64 : 78,
                borderRadius: 6,
                border: `1px dashed ${colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                color: colors.faint
              },
              children: "魔陷"
            },
            `trap_${index}`
          )
        ) }) : null
      ]
    }
  );
}
function emptySlotStyle(size) {
  return {
    width: size === "mini" ? 88 : 116,
    height: size === "mini" ? 128 : 170,
    borderRadius: 8,
    border: `1px dashed ${colors.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.015)"
  };
}
function CenterBar(props) {
  const { state } = props;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: colors.panel,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: radius.md,
        padding: "8px 12px"
      },
      children: [
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: colors.goldSoft, fontWeight: 600 }, children: [
          "第 ",
          state.turn,
          " 回合"
        ] }),
        /* @__PURE__ */ jsx(
          "span",
          {
            style: {
              fontSize: 10.5,
              color: colors.muted,
              border: `1px solid ${colors.border}`,
              borderRadius: 999,
              padding: "2px 8px"
            },
            children: state.phase === "main" ? "主要阶段" : "战斗阶段"
          }
        ),
        /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: colors.faint }, children: [
          "召唤 ",
          state.summonsThisTurn,
          "/",
          state.rules.summonPerTurn,
          " · 攻击",
          " ",
          state.attackLocked ? "锁定（先攻）" : "可用",
          props.evolvePoints !== void 0 ? ` · 进化点 ${props.evolvePoints}` : ""
        ] }),
        /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
        props.attackMode ? /* @__PURE__ */ jsx("span", { style: { fontSize: 11.5, color: colors.gold }, children: "请点击对方怪兽选择攻击目标" }) : null,
        props.hasSelectedMonster && props.directAttackEnabled ? /* @__PURE__ */ jsx(Btn, { size: "sm", variant: "primary", onClick: props.onDirectAttack, children: "直接攻击" }) : null,
        /* @__PURE__ */ jsx(
          Btn,
          {
            size: "sm",
            onClick: props.onStartBattle,
            disabled: !props.myTurn || state.phase === "battle",
            children: "进入战斗阶段"
          }
        ),
        /* @__PURE__ */ jsx(Btn, { size: "sm", variant: "gold", onClick: props.onEndTurn, disabled: !props.myTurn, children: "结束回合" })
      ]
    }
  );
}
function ActionBar(props) {
  const { card } = props;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        background: colors.panel2,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        padding: "8px 10px"
      },
      children: [
        /* @__PURE__ */ jsxs("span", { style: { fontSize: 12, color: colors.text }, children: [
          card.name,
          /* @__PURE__ */ jsxs("span", { style: { color: colors.faint, marginLeft: 6 }, children: [
            "◈",
            card.cost,
            card.kind === "monster" ? ` · 攻 ${card.attack} / 守 ${card.defense} / Lv${card.level}` : ` · ${card.kind === "spell" ? "魔法" : "陷阱"}`
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
        card.kind === "monster" ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Btn, { size: "sm", variant: "gold", disabled: !props.canSummon, onClick: props.onSummonAttack, children: "攻击表示召唤" }),
          /* @__PURE__ */ jsx(Btn, { size: "sm", disabled: !props.canSummon, onClick: props.onSummonDefense, children: "守备表示召唤" })
        ] }) : card.kind === "spell" ? /* @__PURE__ */ jsx(Btn, { size: "sm", variant: "gold", disabled: !props.canActivate, onClick: props.onActivateSpell, children: "发动魔法" }) : /* @__PURE__ */ jsx(Btn, { size: "sm", variant: "gold", disabled: !props.canActivate, onClick: props.onSetTrap, children: "盖放陷阱" })
      ]
    }
  );
}
function ResultOverlay(props) {
  const text = props.winner === "player" ? "你赢得了决斗！" : props.winner === "opponent" ? "决斗失败…" : "平局";
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(6,9,18,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50
      },
      children: /* @__PURE__ */ jsxs(
        "div",
        {
          style: {
            width: 360,
            background: colors.panel,
            border: `1px solid ${colors.gold}`,
            borderRadius: radius.lg,
            padding: 22,
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,.6)"
          },
          children: [
            /* @__PURE__ */ jsx("div", { style: { fontSize: 22, color: colors.goldSoft, fontWeight: 700, marginBottom: 8 }, children: text }),
            /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: colors.muted, marginBottom: 18 }, children: [
              "战绩：",
              props.wins,
              " 胜 / ",
              props.losses,
              " 负"
            ] }),
            /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
              /* @__PURE__ */ jsx(Btn, { variant: "gold", full: true, onClick: props.onRestart, children: "再来一局" }),
              /* @__PURE__ */ jsx(Btn, { variant: "ghost", full: true, onClick: props.onExit, children: "返回" })
            ] })
          ]
        }
      )
    }
  );
}
function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1e3));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
function RealtimeBoard(props) {
  const { state } = props;
  const [selected, setSelected] = useState(null);
  const tickRef = useRef(props.onTick);
  tickRef.current = props.onTick;
  const running = Boolean(state && !state.winner);
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => tickRef.current(100), 100);
    return () => window.clearInterval(timer);
  }, [running]);
  useEffect(() => {
    setSelected(null);
  }, [state?.winner]);
  if (!state) {
    return /* @__PURE__ */ jsx("div", { style: { display: "flex", justifyContent: "center", paddingTop: 20 }, children: /* @__PURE__ */ jsxs(
      Panel,
      {
        title: "即时对战 · 准备",
        subtitle: "圣水随时间回复，摧毁对方国王塔获胜",
        style: { width: 560 },
        bodyStyle: { display: "flex", flexDirection: "column", gap: 12 },
        children: [
          /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: colors.muted, lineHeight: 1.8 }, children: "规则页的「圣水上限 / 圣水回复 / 对局时长 / 塔血量」会直接影响这一局。 卡牌的攻击力 = 每次伤害，守备力 = 生命，花费 = 圣水消耗； 卡牌的「移动速度 / 攻击间隔 / 攻击距离」在卡牌编辑器的战斗数值里调整。" }),
          !props.deckValid ? /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: colors.red }, children: "卡组为空或不满足规则要求，请先到「卡组」页准备一套卡组。" }) : /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: colors.faint }, children: [
            "当前卡组 ",
            props.deckCount,
            " 张。对手会镜像你的卡组。"
          ] }),
          /* @__PURE__ */ jsx(Btn, { variant: "gold", onClick: props.onStart, disabled: !props.deckValid, children: "开始即时对战" })
        ]
      }
    ) });
  }
  const elixir = state.elixir.player;
  const selectedCard = selected !== null ? state.hand.player[selected] ?? null : null;
  return /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 8, height: "100%", minHeight: 0 }, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: colors.panel,
          border: `1px solid ${colors.borderSoft}`,
          borderRadius: radius.md,
          padding: "8px 12px"
        },
        children: [
          /* @__PURE__ */ jsx("span", { style: { fontSize: 13, color: colors.goldSoft, fontWeight: 600 }, children: formatTime(state.timeLimitMs - state.timeMs) }),
          /* @__PURE__ */ jsxs("span", { style: { fontSize: 11, color: colors.faint }, children: [
            "皇冠 ",
            state.crowns.player,
            " : ",
            state.crowns.opponent
          ] }),
          /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
          /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: colors.faint }, children: "圣水" }),
          /* @__PURE__ */ jsx("div", { style: { width: 220 }, children: /* @__PURE__ */ jsx(
            StatBar,
            {
              label: "",
              value: Math.floor(elixir),
              max: state.rules.elixirMax,
              color: "linear-gradient(90deg,#b264ff,#e0a0ff)",
              text: `${Math.floor(elixir)}/${state.rules.elixirMax}`
            }
          ) })
        ]
      }
    ),
    /* @__PURE__ */ jsx(KingStrip, { state, side: "opponent" }),
    /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 6, flex: 1, minHeight: 0 }, children: Array.from({ length: RT_LANE_COUNT }).map((_, lane) => /* @__PURE__ */ jsx(
      LaneTrack,
      {
        state,
        lane,
        deployable: selectedCard !== null,
        onDeploy: (laneIndex) => {
          if (selected === null) return;
          props.onDeploy(selected, laneIndex);
          setSelected(null);
        }
      },
      lane
    )) }),
    /* @__PURE__ */ jsx(KingStrip, { state, side: "player" }),
    /* @__PURE__ */ jsxs(
      Panel,
      {
        title: `手牌 · ${state.hand.player.length}`,
        subtitle: selectedCard ? `已选中「${selectedCard.name}」——点兵线的「部署」按钮，或再点一次取消` : "点一张手牌，然后选左路/右路部署",
        bodyStyle: { padding: 8, display: "flex", flexDirection: "column", gap: 8 },
        children: [
          /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6, overflowX: "auto", minHeight: 176 }, children: state.hand.player.map((card, index) => {
            const affordable = card.cost <= elixir + 1e-6;
            return /* @__PURE__ */ jsx(
              CardFrame,
              {
                card,
                size: "sm",
                selected: selected === index,
                dimmed: !affordable,
                onClick: () => setSelected(selected === index ? null : index)
              },
              `${card.id}_${index}`
            );
          }) }),
          selectedCard ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
            Array.from({ length: RT_LANE_COUNT }).map((_, lane) => /* @__PURE__ */ jsxs(
              Btn,
              {
                size: "sm",
                variant: "gold",
                onClick: () => {
                  props.onDeploy(selected, lane);
                  setSelected(null);
                },
                children: [
                  "部署到",
                  lane === 0 ? "左路" : "右路",
                  "（圣水 ",
                  selectedCard.cost,
                  "）"
                ]
              },
              lane
            )),
            /* @__PURE__ */ jsx(Btn, { size: "sm", variant: "quiet", onClick: () => setSelected(null), children: "取消" })
          ] }) : null
        ]
      }
    ),
    state.winner ? /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(6,9,18,0.82)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 50
        },
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            style: {
              width: 360,
              background: colors.panel,
              border: `1px solid ${colors.gold}`,
              borderRadius: radius.lg,
              padding: 22,
              textAlign: "center"
            },
            children: [
              /* @__PURE__ */ jsx("div", { style: { fontSize: 22, color: colors.goldSoft, fontWeight: 700, marginBottom: 8 }, children: state.winner === "player" ? "你摧毁了国王塔！" : state.winner === "opponent" ? "你的国王塔被摧毁了…" : "时间到，平局" }),
              /* @__PURE__ */ jsxs("div", { style: { fontSize: 12, color: colors.muted, marginBottom: 18 }, children: [
                "皇冠 ",
                state.crowns.player,
                " : ",
                state.crowns.opponent
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 8 }, children: [
                /* @__PURE__ */ jsx(Btn, { variant: "gold", full: true, onClick: props.onStart, children: "再来一局" }),
                /* @__PURE__ */ jsx(Btn, { variant: "ghost", full: true, onClick: props.onExit, children: "返回" })
              ] })
            ]
          }
        )
      }
    ) : null
  ] });
}
function KingStrip(props) {
  const { state, side } = props;
  const king = towerOf(state, side, "king");
  const laneTowers = [towerOf(state, side, 0), towerOf(state, side, 1)];
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: colors.panel,
        border: `1px solid ${side === "player" ? colors.blue : colors.red}`,
        borderRadius: radius.md,
        padding: "6px 12px"
      },
      children: [
        /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: colors.text, minWidth: 60 }, children: side === "player" ? "你的王国" : "对手王国" }),
        /* @__PURE__ */ jsx(KingBar, { tower: king, label: "国王塔" }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 8 }, children: laneTowers.map((tower, index) => /* @__PURE__ */ jsx(KingBar, { tower, label: index === 0 ? "左塔" : "右塔", compact: true }, index)) })
      ]
    }
  );
}
function KingBar(props) {
  const { tower } = props;
  if (!tower) return /* @__PURE__ */ jsx("span", {});
  const ratio = tower.maxHp > 0 ? tower.hp / tower.maxHp : 0;
  return /* @__PURE__ */ jsxs("div", { style: { width: props.compact ? 90 : 180 }, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: {
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: tower.alive ? colors.faint : colors.red
        },
        children: [
          /* @__PURE__ */ jsx("span", { children: props.label }),
          /* @__PURE__ */ jsx("span", { children: tower.alive ? Math.ceil(tower.hp) : "已摧毁" })
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          height: 6,
          borderRadius: 999,
          background: "#0b1020",
          border: `1px solid ${colors.borderSoft}`,
          overflow: "hidden"
        },
        children: /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              width: `${Math.max(0, Math.min(1, ratio)) * 100}%`,
              height: "100%",
              background: tower.alive ? "linear-gradient(90deg,#e7c46a,#f4e3b0)" : "#5c2430"
            }
          }
        )
      }
    )
  ] });
}
function LaneTrack(props) {
  const { state, lane } = props;
  const units = unitsOnLane(state, lane);
  const playerTower = towerOf(state, "player", lane);
  const enemyTower = towerOf(state, "opponent", lane);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        position: "relative",
        flex: 1,
        minHeight: 96,
        background: lane === 0 ? "linear-gradient(90deg,rgba(63,122,214,0.10),rgba(161,58,58,0.10))" : "linear-gradient(90deg,rgba(63,122,214,0.16),rgba(161,58,58,0.16))",
        border: `1px dashed ${colors.border}`,
        borderRadius: radius.md,
        overflow: "hidden"
      },
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            style: {
              position: "absolute",
              left: 8,
              top: 6,
              fontSize: 10,
              color: colors.faint,
              letterSpacing: 2
            },
            children: lane === 0 ? "左路" : "右路"
          }
        ),
        /* @__PURE__ */ jsx(TowerChip, { tower: playerTower }),
        /* @__PURE__ */ jsx(TowerChip, { tower: enemyTower }),
        units.map((unit) => /* @__PURE__ */ jsx(UnitChip, { unit }, unit.uid)),
        props.deployable ? /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => props.onDeploy(lane),
            style: {
              position: "absolute",
              right: 8,
              top: 8,
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 999,
              border: `1px solid ${colors.gold}`,
              background: "rgba(231,196,106,0.16)",
              color: colors.gold,
              cursor: "pointer",
              fontFamily: "inherit"
            },
            children: [
              "部署到",
              lane === 0 ? "左路" : "右路"
            ]
          }
        ) : null
      ]
    }
  );
}
function TowerChip(props) {
  const { tower } = props;
  if (!tower) return null;
  const left = `${tower.x / 10 * 100}%`;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        position: "absolute",
        left,
        top: "50%",
        transform: "translate(-50%,-50%)",
        textAlign: "center",
        opacity: tower.alive ? 1 : 0.35
      },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              width: 34,
              height: 34,
              borderRadius: 6,
              border: `1px solid ${tower.side === "player" ? colors.blue : colors.red}`,
              background: tower.side === "player" ? "#1e3358" : "#5c2430",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16
            },
            children: "🏰"
          }
        ),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 9, color: colors.faint, marginTop: 2 }, children: tower.alive ? Math.ceil(tower.hp) : "×" })
      ]
    }
  );
}
function UnitChip(props) {
  const { unit } = props;
  const left = `${unit.x / 10 * 100}%`;
  const ratio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
  const tone = unit.side === "player" ? colors.blue : colors.red;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        position: "absolute",
        left,
        top: "50%",
        transform: "translate(-50%,-50%)",
        width: 74
      },
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              fontSize: 9.5,
              color: colors.text,
              background: unit.side === "player" ? "#1e3358" : "#5c2430",
              border: `1px solid ${tone}`,
              borderRadius: 6,
              padding: "2px 4px",
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            },
            children: unit.card.name
          }
        ),
        /* @__PURE__ */ jsx(
          "div",
          {
            style: {
              height: 4,
              marginTop: 2,
              borderRadius: 999,
              background: "#0b1020",
              overflow: "hidden"
            },
            children: /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  width: `${Math.max(0, Math.min(1, ratio)) * 100}%`,
                  height: "100%",
                  background: tone
                }
              }
            )
          }
        ),
        /* @__PURE__ */ jsxs("div", { style: { fontSize: 8.5, color: colors.faint, textAlign: "center" }, children: [
          Math.ceil(unit.hp),
          "/",
          unit.maxHp
        ] })
      ]
    }
  );
}
const TRIGGER_OPTIONS$1 = Object.keys(TRIGGER_LABELS).map((value) => ({ value, label: TRIGGER_LABELS[value] }));
const KIND_OPTIONS$1 = Object.keys(EFFECT_LABELS).map((value) => ({ value, label: EFFECT_LABELS[value] }));
const STAT_OPTIONS = [
  { value: "attack", label: "攻击力" },
  { value: "defense", label: "守备力" }
];
const DURATION_OPTIONS = [
  { value: "turn", label: "本回合" },
  { value: "duel", label: "整场决斗" }
];
function targetsFor(kind) {
  if (kind === "damage") return ["enemy-lp", "both-lp"];
  if (kind === "heal") return ["self-lp"];
  if (kind === "draw") return ["self"];
  if (kind === "destroy") return ["enemy-strongest", "enemy-random", "enemy-all"];
  if (kind === "buff") return ["self", "self-monsters"];
  return ["enemy-strongest"];
}
function valueLabel(kind) {
  if (kind === "damage" || kind === "heal") return "数值";
  if (kind === "draw") return "张数";
  if (kind === "buff") return "提升值";
  return "数值";
}
function CardEditor(props) {
  const { cards, selectedId, onSelect, onChange, onAdd, onDuplicate, onDelete } = props;
  const [query, setQuery] = useState("");
  const [importError, setImportError] = useState(null);
  const fileRef = useRef(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (card) => card.name.toLowerCase().includes(q) || card.race.toLowerCase().includes(q) || KIND_LABELS[card.kind].includes(q)
    );
  }, [cards, query]);
  const selected = cards.find((card) => card.id === selectedId) ?? null;
  const patch = (part) => {
    if (!selected) return;
    onChange({ ...selected, ...part });
  };
  const patchEffect = (effectId, part) => {
    if (!selected) return;
    onChange({
      ...selected,
      effects: selected.effects.map(
        (effect) => effect.id === effectId ? { ...effect, ...part } : effect
      )
    });
  };
  const addEffect = () => {
    if (!selected) return;
    onChange({
      ...selected,
      effects: [
        ...selected.effects,
        {
          id: makeId("eff"),
          trigger: selected.kind === "monster" ? "on-summon" : "on-activate",
          kind: "damage",
          target: "enemy-lp",
          value: 300,
          stat: "attack",
          duration: "turn"
        }
      ]
    });
  };
  const removeEffect = (effectId) => {
    if (!selected) return;
    onChange({
      ...selected,
      effects: selected.effects.filter((effect) => effect.id !== effectId)
    });
  };
  const toggleKeyword = (keyword) => {
    if (!selected) return;
    const has = selected.keywords.includes(keyword);
    patch({
      keywords: has ? selected.keywords.filter((item) => item !== keyword) : [...selected.keywords, keyword]
    });
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "grid",
        gridTemplateColumns: "236px minmax(0,1fr) 300px",
        gap: 12,
        alignItems: "stretch",
        minHeight: 0,
        height: "100%"
      },
      children: [
        /* @__PURE__ */ jsxs(
          Panel,
          {
            title: `卡牌库 · ${cards.length}`,
            subtitle: "点击卡牌开始编辑",
            right: /* @__PURE__ */ jsx(Btn, { size: "sm", variant: "gold", onClick: onAdd, children: "+ 新建" }),
            bodyStyle: { padding: 10, display: "flex", flexDirection: "column", gap: 8, minHeight: 0 },
            children: [
              /* @__PURE__ */ jsx(
                TextInput,
                {
                  value: query,
                  onChange: setQuery,
                  placeholder: "搜索卡名 / 种族 / 种类…"
                }
              ),
              /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6 }, children: [
                /* @__PURE__ */ jsx(Btn, { size: "sm", full: true, onClick: props.onExport, children: "导出 JSON" }),
                /* @__PURE__ */ jsx(Btn, { size: "sm", full: true, onClick: () => fileRef.current?.click(), children: "导入 JSON" })
              ] }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  ref: fileRef,
                  type: "file",
                  accept: ".json,application/json",
                  style: { display: "none" },
                  onChange: async (event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (!file) return;
                    const text = await file.text();
                    const error = props.onImportText(text);
                    setImportError(error);
                  }
                }
              ),
              importError ? /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: colors.red, lineHeight: 1.5 }, children: importError }) : null,
              /* @__PURE__ */ jsx("div", { style: { flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 2 }, children: filtered.length === 0 ? /* @__PURE__ */ jsx(Empty, { text: "还没有卡牌。点击「+ 新建」创建第一张。" }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: filtered.map((card) => {
                const active = card.id === selectedId;
                return /* @__PURE__ */ jsxs(
                  "button",
                  {
                    type: "button",
                    onClick: () => onSelect(card.id),
                    style: {
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      border: `1px solid ${active ? colors.gold : colors.borderSoft}`,
                      background: active ? "rgba(231,196,106,0.10)" : colors.panel2
                    },
                    children: [
                      /* @__PURE__ */ jsx("div", { style: { width: 36, flexShrink: 0, borderRadius: 4, overflow: "hidden" }, children: /* @__PURE__ */ jsx(CardArt, { card, height: 46, radius: 4 }) }),
                      /* @__PURE__ */ jsxs("div", { style: { minWidth: 0, flex: 1 }, children: [
                        /* @__PURE__ */ jsx(
                          "div",
                          {
                            style: {
                              fontSize: 12.5,
                              color: colors.text,
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            },
                            children: card.name
                          }
                        ),
                        /* @__PURE__ */ jsxs("div", { style: { fontSize: 10.5, color: colors.faint, marginTop: 2 }, children: [
                          KIND_LABELS[card.kind],
                          card.kind === "monster" ? ` · ${card.race}` : ""
                        ] }),
                        /* @__PURE__ */ jsxs("div", { style: { fontSize: 10.5, color: colors.muted, marginTop: 1 }, children: [
                          card.kind === "monster" ? `攻 ${card.attack} / 守 ${card.defense}` : "魔法·陷阱",
                          " · ",
                          "花费 ",
                          card.cost
                        ] })
                      ] })
                    ]
                  },
                  card.id
                );
              }) }) })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Panel,
          {
            title: selected ? `编辑：${selected.name}` : "编辑器",
            subtitle: selected ? "所有字段即时生效，卡面右侧实时预览" : "从左侧选择一张卡牌",
            right: selected ? /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6 }, children: [
              /* @__PURE__ */ jsx(Btn, { size: "sm", onClick: () => onDuplicate(selected.id), children: "复制" }),
              /* @__PURE__ */ jsx(Btn, { size: "sm", variant: "danger", onClick: () => onDelete(selected.id), children: "删除" })
            ] }) : void 0,
            bodyStyle: { padding: 12, overflowY: "auto", minHeight: 0 },
            children: !selected ? /* @__PURE__ */ jsx(Empty, { text: "选择一张卡牌开始编辑，或点击「+ 新建」。\n攻击力、守备力、种族、花费、效果、立绘都可以随时修改。" }) : /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 14 }, children: [
              /* @__PURE__ */ jsx(Section, { title: "基础信息", children: /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }, children: [
                /* @__PURE__ */ jsx(Field, { label: "卡名", children: /* @__PURE__ */ jsx(TextInput, { value: selected.name, onChange: (name) => patch({ name }) }) }),
                /* @__PURE__ */ jsx(Field, { label: "种类", children: /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 6 }, children: Object.keys(KIND_LABELS).map((kind) => /* @__PURE__ */ jsx(
                  Chip,
                  {
                    active: selected.kind === kind,
                    onClick: () => {
                      const nextKind = kind;
                      patch({
                        kind: nextKind,
                        effects: nextKind === "monster" ? selected.effects : selected.effects.map((effect) => ({
                          ...effect,
                          trigger: effect.trigger === "on-summon" || effect.trigger === "on-attack" || effect.trigger === "on-destroyed" ? "on-activate" : effect.trigger
                        }))
                      });
                    },
                    children: KIND_LABELS[kind]
                  },
                  kind
                )) }) }),
                /* @__PURE__ */ jsxs(Field, { label: "种族", hint: "可自由输入新种族", children: [
                  /* @__PURE__ */ jsx(
                    TextInput,
                    {
                      list: "dcf-race-list",
                      value: selected.race,
                      onChange: (race) => patch({ race })
                    }
                  ),
                  /* @__PURE__ */ jsx("datalist", { id: "dcf-race-list", children: RACE_PRESETS.map((race) => /* @__PURE__ */ jsx("option", { value: race }, race)) })
                ] }),
                /* @__PURE__ */ jsx(Field, { label: "属性", children: /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 5 }, children: Object.keys(ATTRIBUTE_LABELS).map((attr) => /* @__PURE__ */ jsxs(
                  Chip,
                  {
                    active: selected.attribute === attr,
                    title: ATTRIBUTE_LABELS[attr],
                    onClick: () => patch({ attribute: attr }),
                    children: [
                      ATTRIBUTE_GLYPHS[attr],
                      " ",
                      ATTRIBUTE_LABELS[attr]
                    ]
                  },
                  attr
                )) }) })
              ] }) }),
              /* @__PURE__ */ jsxs(Section, { title: selected.kind === "monster" ? "战斗数值" : "费用", children: [
                /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10 }, children: [
                  selected.kind === "monster" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx(Field, { label: "等级", hint: "1-12，影响祭品", children: /* @__PURE__ */ jsx(NumInput, { value: selected.level, min: 1, max: 12, onChange: (level) => patch({ level }) }) }),
                    /* @__PURE__ */ jsx(Field, { label: "攻击力", children: /* @__PURE__ */ jsx(
                      NumInput,
                      {
                        value: selected.attack,
                        min: 0,
                        max: 99999,
                        step: 100,
                        onChange: (attack) => patch({ attack })
                      }
                    ) }),
                    /* @__PURE__ */ jsx(Field, { label: "守备力", children: /* @__PURE__ */ jsx(
                      NumInput,
                      {
                        value: selected.defense,
                        min: 0,
                        max: 99999,
                        step: 100,
                        onChange: (defense) => patch({ defense })
                      }
                    ) })
                  ] }) : /* @__PURE__ */ jsx(Field, { label: "等级", children: /* @__PURE__ */ jsx(NumInput, { value: selected.level, min: 1, max: 12, onChange: (level) => patch({ level }) }) }),
                  /* @__PURE__ */ jsx(Field, { label: "花费", hint: "召唤/发动消耗的能量", children: /* @__PURE__ */ jsx(NumInput, { value: selected.cost, min: 0, max: 30, onChange: (cost) => patch({ cost }) }) })
                ] }),
                /* @__PURE__ */ jsx("div", { style: { marginTop: 10, fontSize: 11, color: colors.faint }, children: "即时对战（皇室战争风）专用；回合制与影之诗模式会忽略这三项。" }),
                /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10, marginTop: 6 }, children: [
                  /* @__PURE__ */ jsx(Field, { label: "移动速度", hint: "格 / 秒", children: /* @__PURE__ */ jsx(
                    NumInput,
                    {
                      value: selected.moveSpeed ?? 1.2,
                      min: 0,
                      max: 5,
                      step: 1,
                      onChange: (moveSpeed) => patch({ moveSpeed })
                    }
                  ) }),
                  /* @__PURE__ */ jsx(Field, { label: "攻击间隔", hint: "毫秒", children: /* @__PURE__ */ jsx(
                    NumInput,
                    {
                      value: selected.attackIntervalMs ?? 1e3,
                      min: 200,
                      max: 5e3,
                      step: 100,
                      onChange: (attackIntervalMs) => patch({ attackIntervalMs })
                    }
                  ) }),
                  /* @__PURE__ */ jsx(Field, { label: "攻击距离", hint: "格", children: /* @__PURE__ */ jsx(
                    NumInput,
                    {
                      value: selected.range ?? 0.8,
                      min: 0,
                      max: 6,
                      step: 1,
                      onChange: (range) => patch({ range })
                    }
                  ) })
                ] })
              ] }),
              /* @__PURE__ */ jsxs(Section, { title: "立绘 / 卡图", children: [
                /* @__PURE__ */ jsx(Field, { label: "立绘地址", hint: "emoji:🐉 / 图片 URL / 素材路径", children: /* @__PURE__ */ jsx(
                  TextInput,
                  {
                    value: selected.art,
                    placeholder: "留空则使用属性渐变 + 种族符号",
                    onChange: (art) => patch({ art })
                  }
                ) }),
                /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }, children: [
                  ["🐉", "🔮", "⚔️", "🐺", "😈", "😇", "⚙️", "💀", "🌊", "⚡", "🪨", "🔥", "🦅", "🌿", "✨", "🃏"].map(
                    (emoji) => /* @__PURE__ */ jsx(
                      Chip,
                      {
                        active: selected.art === `emoji:${emoji}`,
                        onClick: () => patch({ art: selected.art === `emoji:${emoji}` ? "" : `emoji:${emoji}` }),
                        children: emoji
                      },
                      emoji
                    )
                  ),
                  /* @__PURE__ */ jsx(Chip, { onClick: () => patch({ art: "" }), children: "清空（程序化）" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs(Section, { title: "卡牌效果", children: [
                /* @__PURE__ */ jsx(Field, { label: "效果文本（显示在卡面上）", children: /* @__PURE__ */ jsx(
                  TextInput,
                  {
                    multiline: true,
                    rows: 3,
                    value: selected.description,
                    placeholder: "例如：此卡召唤成功时，对玩家造成 600 点伤害。",
                    onChange: (description) => patch({ description })
                  }
                ) }),
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      margin: "12px 0 6px"
                    },
                    children: [
                      /* @__PURE__ */ jsx("span", { style: { fontSize: 12, color: colors.muted }, children: "效果规则（驱动真实结算）" }),
                      /* @__PURE__ */ jsx(Btn, { size: "sm", variant: "primary", onClick: addEffect, children: "+ 添加效果" })
                    ]
                  }
                ),
                selected.effects.length === 0 ? /* @__PURE__ */ jsx(
                  "div",
                  {
                    style: {
                      fontSize: 11.5,
                      color: colors.faint,
                      border: `1px dashed ${colors.border}`,
                      borderRadius: 8,
                      padding: "10px 12px",
                      lineHeight: 1.6
                    },
                    children: "暂无结构化效果。只有写了效果规则，卡牌才会在对战中真正产生伤害、抽卡、破坏等行为。"
                  }
                ) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 8 }, children: selected.effects.map((effect, index) => {
                  const validTargets = targetsFor(effect.kind);
                  return /* @__PURE__ */ jsxs(
                    "div",
                    {
                      style: {
                        border: `1px solid ${colors.borderSoft}`,
                        borderRadius: 10,
                        background: colors.bgSoft,
                        padding: 10
                      },
                      children: [
                        /* @__PURE__ */ jsxs(
                          "div",
                          {
                            style: {
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginBottom: 8
                            },
                            children: [
                              /* @__PURE__ */ jsxs("span", { style: { fontSize: 11.5, color: colors.gold }, children: [
                                "效果 ",
                                index + 1
                              ] }),
                              /* @__PURE__ */ jsx(Btn, { size: "sm", variant: "quiet", onClick: () => removeEffect(effect.id), children: "移除" })
                            ]
                          }
                        ),
                        /* @__PURE__ */ jsxs(
                          "div",
                          {
                            style: {
                              display: "grid",
                              gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                              gap: 8
                            },
                            children: [
                              /* @__PURE__ */ jsx(Field, { label: "触发时机", children: /* @__PURE__ */ jsx(
                                Select,
                                {
                                  value: effect.trigger,
                                  options: TRIGGER_OPTIONS$1,
                                  onChange: (trigger) => patchEffect(effect.id, { trigger })
                                }
                              ) }),
                              /* @__PURE__ */ jsx(Field, { label: "效果", children: /* @__PURE__ */ jsx(
                                Select,
                                {
                                  value: effect.kind,
                                  options: KIND_OPTIONS$1,
                                  onChange: (kind) => {
                                    const nextTargets = targetsFor(kind);
                                    patchEffect(effect.id, {
                                      kind,
                                      target: nextTargets.includes(effect.target) ? effect.target : nextTargets[0]
                                    });
                                  }
                                }
                              ) }),
                              /* @__PURE__ */ jsx(Field, { label: "作用目标", children: /* @__PURE__ */ jsx(
                                Select,
                                {
                                  value: effect.target,
                                  options: validTargets.map((value) => ({
                                    value,
                                    label: TARGET_LABELS[value]
                                  })),
                                  onChange: (target) => patchEffect(effect.id, { target })
                                }
                              ) }),
                              effect.kind === "buff" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                                /* @__PURE__ */ jsx(Field, { label: "提升", children: /* @__PURE__ */ jsx(
                                  Select,
                                  {
                                    value: effect.stat,
                                    options: STAT_OPTIONS,
                                    onChange: (stat) => patchEffect(effect.id, { stat })
                                  }
                                ) }),
                                /* @__PURE__ */ jsx(Field, { label: "持续时间", children: /* @__PURE__ */ jsx(
                                  Select,
                                  {
                                    value: effect.duration,
                                    options: DURATION_OPTIONS,
                                    onChange: (duration) => patchEffect(effect.id, { duration })
                                  }
                                ) }),
                                /* @__PURE__ */ jsx(Field, { label: valueLabel(effect.kind), children: /* @__PURE__ */ jsx(
                                  NumInput,
                                  {
                                    value: effect.value,
                                    min: 0,
                                    max: 99999,
                                    step: 100,
                                    onChange: (value) => patchEffect(effect.id, { value })
                                  }
                                ) })
                              ] }) : /* @__PURE__ */ jsx(Field, { label: valueLabel(effect.kind), children: /* @__PURE__ */ jsx(
                                NumInput,
                                {
                                  value: effect.value,
                                  min: 0,
                                  max: 99999,
                                  step: effect.kind === "draw" ? 1 : 100,
                                  onChange: (value) => patchEffect(effect.id, { value })
                                }
                              ) })
                            ]
                          }
                        )
                      ]
                    },
                    effect.id
                  );
                }) })
              ] }),
              /* @__PURE__ */ jsxs(Section, { title: "关键词", children: [
                /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 6 }, children: Object.keys(KEYWORD_LABELS).map((keyword) => /* @__PURE__ */ jsx(
                  Chip,
                  {
                    active: selected.keywords.includes(keyword),
                    title: KEYWORD_HINTS[keyword],
                    onClick: () => toggleKeyword(keyword),
                    children: KEYWORD_LABELS[keyword]
                  },
                  keyword
                )) }),
                /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: colors.faint, marginTop: 8, lineHeight: 1.6 }, children: selected.keywords.length === 0 ? "未启用关键词。鼠标悬停可查看每个关键词的说明。" : selected.keywords.map((keyword) => `「${KEYWORD_LABELS[keyword]}」${KEYWORD_HINTS[keyword]}`).join(" ") })
              ] })
            ] })
          }
        ),
        /* @__PURE__ */ jsx(
          Panel,
          {
            title: "卡面预览",
            subtitle: "与实际对战中的卡面一致",
            bodyStyle: {
              padding: 12,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              overflowY: "auto",
              minHeight: 0
            },
            children: selected ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(CardFrame, { card: selected, size: "lg" }),
              /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    width: "100%",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    fontSize: 11.5,
                    color: colors.muted
                  },
                  children: [
                    /* @__PURE__ */ jsx(InfoRow, { label: "种类", value: KIND_LABELS[selected.kind] }),
                    /* @__PURE__ */ jsx(InfoRow, { label: "种族", value: selected.race }),
                    /* @__PURE__ */ jsx(InfoRow, { label: "属性", value: ATTRIBUTE_LABELS[selected.attribute] }),
                    /* @__PURE__ */ jsx(InfoRow, { label: "等级", value: `${selected.level}` }),
                    /* @__PURE__ */ jsx(InfoRow, { label: "花费", value: `${selected.cost} 能量` }),
                    /* @__PURE__ */ jsx(InfoRow, { label: "效果数", value: `${selected.effects.length}` })
                  ]
                }
              ),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: colors.faint, lineHeight: 1.7, width: "100%" }, children: "提示：卡面会随编辑实时变化，文本过长时在卡面上自动截断，完整效果仍会正常结算。" })
            ] }) : /* @__PURE__ */ jsx(Empty, { text: "选择卡牌后这里会显示卡面。" })
          }
        )
      ]
    }
  );
}
function Section(props) {
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          fontSize: 12,
          fontWeight: 600,
          color: colors.goldSoft,
          marginBottom: 8,
          paddingBottom: 5,
          borderBottom: `1px solid ${colors.borderSoft}`,
          letterSpacing: 0.5
        },
        children: props.title
      }
    ),
    props.children
  ] });
}
function InfoRow(props) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "flex",
        justifyContent: "space-between",
        background: colors.bgSoft,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 6,
        padding: "4px 8px"
      },
      children: [
        /* @__PURE__ */ jsx("span", { style: { color: colors.faint }, children: props.label }),
        /* @__PURE__ */ jsx("span", { style: { color: colors.text }, children: props.value })
      ]
    }
  );
}
function DeckBuilder(props) {
  const { cards, deck, rules } = props;
  const [query, setQuery] = useState("");
  const counts = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const entry of deck) map.set(entry.cardId, entry.count);
    return map;
  }, [deck]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? cards.filter(
      (card) => card.name.toLowerCase().includes(q) || card.race.toLowerCase().includes(q)
    ) : cards;
    return [...list].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "monster" ? -1 : 1;
      return b.cost - a.cost;
    });
  }, [cards, query]);
  const setCount = (cardId, next) => {
    const count = Math.max(0, Math.min(9, next));
    const rest = deck.filter((entry) => entry.cardId !== cardId);
    if (count === 0) {
      props.onChange(rest);
      return;
    }
    props.onChange([...rest, { cardId, count }]);
  };
  const total = deck.reduce((sum, entry) => sum + entry.count, 0);
  const stats = useMemo(() => {
    const byKind = { monster: 0, spell: 0, trap: 0 };
    const costBuckets = [0, 0, 0, 0, 0, 0];
    let atkSum = 0;
    let atkCount = 0;
    for (const entry of deck) {
      const card = cards.find((item) => item.id === entry.cardId);
      if (!card) continue;
      byKind[card.kind] += entry.count;
      const bucket = Math.min(5, Math.floor(card.cost));
      costBuckets[bucket] += entry.count;
      if (card.kind === "monster") {
        atkSum += card.attack * entry.count;
        atkCount += entry.count;
      }
    }
    return {
      byKind,
      costBuckets,
      avgAtk: atkCount > 0 ? Math.round(atkSum / atkCount) : 0
    };
  }, [deck, cards]);
  const warnings = [];
  if (total < rules.deckMinSize) {
    warnings.push(`卡组只有 ${total} 张，规则要求至少 ${rules.deckMinSize} 张。`);
  }
  if (total === 0) warnings.push("卡组为空，无法开始决斗。");
  const missing = deck.filter((entry) => !cards.some((card) => card.id === entry.cardId));
  if (missing.length > 0) warnings.push(`有 ${missing.length} 种卡牌已从卡牌库删除。`);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 320px",
        gap: 12,
        minHeight: 0,
        height: "100%"
      },
      children: [
        /* @__PURE__ */ jsx(
          Panel,
          {
            title: "卡牌库",
            subtitle: "点击「+」把卡牌加入卡组，同一张最多 9 张",
            right: /* @__PURE__ */ jsx("div", { style: { width: 220, flexShrink: 0 }, children: /* @__PURE__ */ jsx(TextInput, { value: query, onChange: setQuery, placeholder: "搜索卡名 / 种族…" }) }),
            bodyStyle: { padding: 10, overflowY: "auto", minHeight: 0 },
            children: cards.length === 0 ? /* @__PURE__ */ jsx(Empty, { text: "卡牌库是空的，先去「卡牌库」页创建卡牌。" }) : /* @__PURE__ */ jsx("div", { style: { display: "flex", flexDirection: "column", gap: 6 }, children: filtered.map((card) => {
              const count = counts.get(card.id) ?? 0;
              return /* @__PURE__ */ jsxs(
                "div",
                {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: `1px solid ${count > 0 ? "rgba(231,196,106,0.5)" : colors.borderSoft}`,
                    background: count > 0 ? "rgba(231,196,106,0.07)" : colors.panel2
                  },
                  children: [
                    /* @__PURE__ */ jsx("div", { style: { width: 36, flexShrink: 0, borderRadius: 4, overflow: "hidden" }, children: /* @__PURE__ */ jsx(CardArt, { card, height: 46, radius: 4 }) }),
                    /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
                      /* @__PURE__ */ jsxs("div", { style: { fontSize: 12.5, color: colors.text, fontWeight: 600 }, children: [
                        card.name,
                        /* @__PURE__ */ jsxs("span", { style: { marginLeft: 6, fontSize: 10.5, color: colors.faint }, children: [
                          KIND_LABELS[card.kind],
                          card.kind === "monster" ? ` · ${card.race}` : "",
                          " · ◈",
                          card.cost
                        ] })
                      ] }),
                      /* @__PURE__ */ jsx("div", { style: { fontSize: 10.5, color: colors.muted, marginTop: 1 }, children: card.kind === "monster" ? `攻 ${card.attack} / 守 ${card.defense} / Lv${card.level}` : card.description || "（无效果文本）" })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 5 }, children: [
                      /* @__PURE__ */ jsx(Btn, { size: "sm", onClick: () => setCount(card.id, count - 1), disabled: count === 0, children: "−" }),
                      /* @__PURE__ */ jsx(
                        "span",
                        {
                          style: {
                            minWidth: 22,
                            textAlign: "center",
                            fontSize: 13,
                            color: count > 0 ? colors.gold : colors.faint,
                            fontWeight: 700
                          },
                          children: count
                        }
                      ),
                      /* @__PURE__ */ jsx(Btn, { size: "sm", variant: "primary", onClick: () => setCount(card.id, count + 1), children: "+" })
                    ] })
                  ]
                },
                card.id
              );
            }) })
          }
        ),
        /* @__PURE__ */ jsxs(
          Panel,
          {
            title: `当前卡组 · ${total} 张`,
            subtitle: "规则检查与费用曲线",
            right: /* @__PURE__ */ jsxs("div", { style: { display: "flex", gap: 6 }, children: [
              /* @__PURE__ */ jsx(Btn, { size: "sm", onClick: props.onReset, children: "示例卡组" }),
              /* @__PURE__ */ jsx(Btn, { size: "sm", variant: "danger", onClick: () => props.onChange([]), children: "清空" })
            ] }),
            bodyStyle: { padding: 12, display: "flex", flexDirection: "column", gap: 12, minHeight: 0, overflowY: "auto" },
            children: [
              /* @__PURE__ */ jsxs("div", { style: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }, children: [
                /* @__PURE__ */ jsx(Stat, { label: "怪兽", value: stats.byKind.monster, tone: colors.orange }),
                /* @__PURE__ */ jsx(Stat, { label: "魔法", value: stats.byKind.spell, tone: colors.green }),
                /* @__PURE__ */ jsx(Stat, { label: "陷阱", value: stats.byKind.trap, tone: colors.purple })
              ] }),
              /* @__PURE__ */ jsxs("div", { style: { fontSize: 11.5, color: colors.muted }, children: [
                "平均攻击力 ",
                /* @__PURE__ */ jsx("span", { style: { color: colors.goldSoft, fontWeight: 700 }, children: stats.avgAtk })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("div", { style: { fontSize: 12, color: colors.muted, marginBottom: 6 }, children: "费用曲线" }),
                /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "flex-end", gap: 6, height: 68 }, children: stats.costBuckets.map((count, index) => {
                  const max = Math.max(1, ...stats.costBuckets);
                  return /* @__PURE__ */ jsxs("div", { style: { flex: 1, textAlign: "center" }, children: [
                    /* @__PURE__ */ jsx(
                      "div",
                      {
                        style: {
                          height: `${count / max * 46}px`,
                          minHeight: count > 0 ? 4 : 1,
                          background: count > 0 ? "linear-gradient(180deg,#e7c46a,#a47c2b)" : colors.borderSoft,
                          borderRadius: 3,
                          transition: "height .2s ease"
                        }
                      }
                    ),
                    /* @__PURE__ */ jsx("div", { style: { fontSize: 10, color: colors.faint, marginTop: 3 }, children: index === 5 ? "6+" : index })
                  ] }, index);
                }) })
              ] }),
              warnings.length > 0 ? /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    border: `1px solid ${colors.redSoft}`,
                    background: "rgba(255,115,115,0.08)",
                    borderRadius: 8,
                    padding: "8px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4
                  },
                  children: warnings.map((text) => /* @__PURE__ */ jsxs("div", { style: { fontSize: 11.5, color: colors.red, lineHeight: 1.5 }, children: [
                    "· ",
                    text
                  ] }, text))
                }
              ) : /* @__PURE__ */ jsx(
                "div",
                {
                  style: {
                    fontSize: 11.5,
                    color: colors.green,
                    border: `1px solid ${colors.greenSoft}`,
                    background: "rgba(95,214,162,0.08)",
                    borderRadius: 8,
                    padding: "8px 10px"
                  },
                  children: "卡组符合规则，可以开始决斗。"
                }
              ),
              /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: colors.faint, lineHeight: 1.7 }, children: "卡组会保存到当前存档槽位；卡牌本身保存在扩展的项目设置里，导出 JSON 即可分享给其他项目。" })
            ]
          }
        )
      ]
    }
  );
}
function Stat(props) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        background: colors.bgSoft,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 8,
        padding: "6px 8px",
        textAlign: "center"
      },
      children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 16, fontWeight: 700, color: props.tone }, children: props.value }),
        /* @__PURE__ */ jsx("div", { style: { fontSize: 10.5, color: colors.faint, marginTop: 1 }, children: props.label })
      ]
    }
  );
}
const MODE_HINTS = {
  duel: "回合制：攻守表示、祭品召唤、攻对攻/守对守的破坏判定，8000 LP。",
  shadowverse: "影之诗风：主战者 20 生命，费用（PP）每回合 +1 上限 10，随从有生命值、伤害跨回合保留，可用进化点让随从 +2/+2。",
  realtime: "即时对战：圣水随时间回复，两条兵线自动推进，先摧毁对方国王塔者胜；卡牌的攻击力=伤害、守备力=生命。"
};
function RulesEditor(props) {
  const { rules, onChange } = props;
  const set = (key, value) => onChange({ ...rules, [key]: value });
  return /* @__PURE__ */ jsxs(
    "div",
    {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0,1fr))",
        gap: 12,
        alignItems: "stretch",
        minHeight: 0,
        height: "100%",
        overflowY: "auto",
        paddingBottom: 4,
        alignContent: "start"
      },
      children: [
        /* @__PURE__ */ jsx("div", { style: { gridColumn: "1 / -1" }, children: /* @__PURE__ */ jsxs(Panel, { title: "战斗模式", subtitle: "切换模式会套用该模式的推荐规则", children: [
          /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: Object.keys(BATTLE_MODE_LABELS).map((mode) => /* @__PURE__ */ jsx(
            Chip,
            {
              active: rules.battleMode === mode,
              onClick: () => onChange({ ...rules, ...BATTLE_MODE_PRESETS[mode] }),
              children: BATTLE_MODE_LABELS[mode]
            },
            mode
          )) }),
          /* @__PURE__ */ jsx(
            "div",
            {
              style: {
                fontSize: 11,
                color: colors.faint,
                marginTop: 8,
                lineHeight: 1.7
              },
              children: MODE_HINTS[rules.battleMode]
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx(Panel, { title: "基础规则", subtitle: "生命值与资源", children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
          /* @__PURE__ */ jsx(
            NumRow,
            {
              label: "初始生命值",
              hint: "双方开局 LP",
              value: rules.startingLp,
              min: 100,
              max: 1e5,
              step: 100,
              onChange: (value) => set("startingLp", value)
            }
          ),
          /* @__PURE__ */ jsx(
            NumRow,
            {
              label: "起始手牌",
              hint: "开局抽牌数",
              value: rules.startingHand,
              min: 0,
              max: 8,
              onChange: (value) => set("startingHand", value)
            }
          ),
          /* @__PURE__ */ jsx(
            NumRow,
            {
              label: "每回合抽卡",
              hint: "自己回合开始时",
              value: rules.drawPerTurn,
              min: 0,
              max: 5,
              onChange: (value) => set("drawPerTurn", value)
            }
          ),
          /* @__PURE__ */ jsx(
            NumRow,
            {
              label: "手牌上限",
              hint: "0 = 不限制",
              value: rules.handLimit,
              min: 0,
              max: 20,
              onChange: (value) => set("handLimit", value)
            }
          ),
          /* @__PURE__ */ jsx(
            NumRow,
            {
              label: "卡组最少张数",
              hint: "组卡检查用",
              value: rules.deckMinSize,
              min: 1,
              max: 60,
              onChange: (value) => set("deckMinSize", value)
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx(Panel, { title: "场地与能量", subtitle: "区域数量与能量曲线", children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
          /* @__PURE__ */ jsx(
            NumRow,
            {
              label: "怪兽区数量",
              hint: "1-5",
              value: rules.monsterZones,
              min: 1,
              max: 5,
              onChange: (value) => set("monsterZones", value)
            }
          ),
          /* @__PURE__ */ jsx(
            NumRow,
            {
              label: "魔法·陷阱区数量",
              hint: "0-5",
              value: rules.spellZones,
              min: 0,
              max: 5,
              onChange: (value) => set("spellZones", value)
            }
          ),
          /* @__PURE__ */ jsx(
            NumRow,
            {
              label: "初始能量",
              hint: "第一回合可用",
              value: rules.energyStart,
              min: 0,
              max: 20,
              onChange: (value) => set("energyStart", value)
            }
          ),
          /* @__PURE__ */ jsx(
            NumRow,
            {
              label: "每回合能量",
              hint: "每回合开始回复",
              value: rules.energyPerTurn,
              min: 0,
              max: 20,
              onChange: (value) => set("energyPerTurn", value)
            }
          ),
          /* @__PURE__ */ jsx(
            NumRow,
            {
              label: "能量上限",
              value: rules.energyMax,
              min: 1,
              max: 99,
              onChange: (value) => set("energyMax", value)
            }
          )
        ] }) }),
        /* @__PURE__ */ jsx(Panel, { title: "召唤与战斗", subtitle: "祭品、攻击与胜负", children: /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 12 }, children: [
          /* @__PURE__ */ jsx(
            NumRow,
            {
              label: "每回合召唤次数",
              value: rules.summonPerTurn,
              min: 1,
              max: 5,
              onChange: (value) => set("summonPerTurn", value)
            }
          ),
          /* @__PURE__ */ jsx("div", { onClick: () => void 0, children: /* @__PURE__ */ jsx(
            Toggle,
            {
              checked: rules.tributeEnabled,
              onChange: (value) => set("tributeEnabled", value),
              label: "启用祭品召唤",
              hint: "高等级怪兽需要献祭场上怪兽"
            }
          ) }),
          rules.tributeEnabled ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              NumRow,
              {
                label: "1 祭品等级",
                hint: "等级 ≥ 此值需要 1 只祭品",
                value: rules.tributeLevelOne,
                min: 1,
                max: 12,
                onChange: (value) => set("tributeLevelOne", value)
              }
            ),
            /* @__PURE__ */ jsx(
              NumRow,
              {
                label: "2 祭品等级",
                hint: "等级 ≥ 此值需要 2 只祭品",
                value: rules.tributeLevelTwo,
                min: 1,
                max: 12,
                onChange: (value) => set("tributeLevelTwo", value)
              }
            )
          ] }) : null,
          /* @__PURE__ */ jsx(
            Toggle,
            {
              checked: rules.directAttackAllowed,
              onChange: (value) => set("directAttackAllowed", value),
              label: "允许直接攻击",
              hint: "对方场上没有怪兽时可以直接攻击玩家"
            }
          ),
          /* @__PURE__ */ jsx(
            Toggle,
            {
              checked: rules.piercingEnabled,
              onChange: (value) => set("piercingEnabled", value),
              label: "守备穿透",
              hint: "所有怪兽攻击守备表示时溢出伤害贯穿"
            }
          ),
          /* @__PURE__ */ jsx(
            NumRow,
            {
              label: "战斗伤害倍率",
              hint: "%",
              value: rules.battleDamageScale,
              min: 0,
              max: 300,
              step: 10,
              onChange: (value) => set("battleDamageScale", value)
            }
          ),
          /* @__PURE__ */ jsx(
            Toggle,
            {
              checked: rules.firstTurnAttack,
              onChange: (value) => set("firstTurnAttack", value),
              label: "先攻可以攻击",
              hint: "关闭时第一回合不能攻击"
            }
          ),
          /* @__PURE__ */ jsx(
            Toggle,
            {
              checked: rules.aiEnabled,
              onChange: (value) => set("aiEnabled", value),
              label: "AI 对手",
              hint: "关闭后对手回合会直接结束"
            }
          ),
          /* @__PURE__ */ jsx(
            Toggle,
            {
              checked: rules.deckOutLose,
              onChange: (value) => set("deckOutLose", value),
              label: "卡组抽空判负"
            }
          ),
          /* @__PURE__ */ jsx(
            NumRow,
            {
              label: "回合上限",
              hint: "0 = 不限，达到则平局",
              value: rules.turnLimit,
              min: 0,
              max: 999,
              onChange: (value) => set("turnLimit", value)
            }
          )
        ] }) }),
        rules.battleMode !== "duel" ? /* @__PURE__ */ jsx("div", { style: { gridColumn: "1 / -1" }, children: /* @__PURE__ */ jsx(
          Panel,
          {
            title: "模式专属设置",
            subtitle: BATTLE_MODE_LABELS[rules.battleMode],
            children: /* @__PURE__ */ jsx(
              "div",
              {
                style: {
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                  gap: 12
                },
                children: rules.battleMode === "shadowverse" ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(
                    NumRow,
                    {
                      label: "进化点",
                      hint: "每方可用次数",
                      value: rules.evolvePoints,
                      min: 0,
                      max: 9,
                      onChange: (value) => set("evolvePoints", value)
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    NumRow,
                    {
                      label: "进化攻击加成",
                      value: rules.evolveAttack,
                      min: 0,
                      max: 20,
                      onChange: (value) => set("evolveAttack", value)
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    NumRow,
                    {
                      label: "进化生命加成",
                      value: rules.evolveDefense,
                      min: 0,
                      max: 20,
                      onChange: (value) => set("evolveDefense", value)
                    }
                  )
                ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(
                    NumRow,
                    {
                      label: "圣水上限",
                      value: rules.elixirMax,
                      min: 1,
                      max: 20,
                      onChange: (value) => set("elixirMax", value)
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    NumRow,
                    {
                      label: "圣水回复（毫秒/点）",
                      hint: "越小回复越快",
                      value: rules.elixirRegenMs,
                      min: 300,
                      max: 2e4,
                      step: 100,
                      onChange: (value) => set("elixirRegenMs", value)
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    NumRow,
                    {
                      label: "对局时长（秒）",
                      value: rules.matchSeconds,
                      min: 30,
                      max: 900,
                      step: 10,
                      onChange: (value) => set("matchSeconds", value)
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    NumRow,
                    {
                      label: "普通塔生命",
                      value: rules.towerHp,
                      min: 100,
                      max: 99999,
                      step: 100,
                      onChange: (value) => set("towerHp", value)
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    NumRow,
                    {
                      label: "国王塔生命",
                      value: rules.kingTowerHp,
                      min: 100,
                      max: 99999,
                      step: 100,
                      onChange: (value) => set("kingTowerHp", value)
                    }
                  )
                ] })
              }
            )
          }
        ) }) : null,
        /* @__PURE__ */ jsx("div", { style: { gridColumn: "1 / -1" }, children: /* @__PURE__ */ jsxs(
          Panel,
          {
            title: "规则速览",
            subtitle: "当前生效的规则摘要",
            right: /* @__PURE__ */ jsx(Btn, { size: "sm", variant: "danger", onClick: props.onReset, children: "恢复默认规则" }),
            children: [
              /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 8 }, children: [
                `生命值 ${rules.startingLp}`,
                `起手 ${rules.startingHand} 张`,
                `每回合抽 ${rules.drawPerTurn} 张`,
                rules.handLimit > 0 ? `手牌上限 ${rules.handLimit}` : "手牌不限",
                `怪兽区 ${rules.monsterZones}`,
                `魔陷区 ${rules.spellZones}`,
                `能量 ${rules.energyStart} → ${rules.energyMax}（+${rules.energyPerTurn}/回合）`,
                `每回合召唤 ${rules.summonPerTurn} 次`,
                rules.tributeEnabled ? `祭品：Lv${rules.tributeLevelOne}+ 需 1 只，Lv${rules.tributeLevelTwo}+ 需 2 只` : "不启用祭品",
                rules.directAttackAllowed ? "可直接攻击" : "禁止直接攻击",
                rules.piercingEnabled ? "守备穿透" : "无穿透",
                `战斗伤害 ${rules.battleDamageScale}%`,
                rules.deckOutLose ? "抽空判负" : "抽空不判负",
                rules.turnLimit > 0 ? `回合上限 ${rules.turnLimit}` : "无回合上限",
                rules.aiEnabled ? "AI 对手" : "无 AI"
              ].map((text) => /* @__PURE__ */ jsx(
                "span",
                {
                  style: {
                    fontSize: 11.5,
                    color: colors.muted,
                    background: colors.bgSoft,
                    border: `1px solid ${colors.borderSoft}`,
                    borderRadius: 999,
                    padding: "4px 10px"
                  },
                  children: text
                },
                text
              )) }),
              /* @__PURE__ */ jsx("div", { style: { fontSize: 11, color: colors.faint, marginTop: 10, lineHeight: 1.7 }, children: "这些规则适用于「对战」页的每一场决斗，也决定卡牌编辑里「等级 / 花费」的实际意义。" })
            ]
          }
        ) })
      ]
    }
  );
}
function NumRow(props) {
  return /* @__PURE__ */ jsx(Field, { label: props.label, hint: props.hint, children: /* @__PURE__ */ jsx(
    NumInput,
    {
      value: props.value,
      min: props.min,
      max: props.max,
      step: props.step,
      onChange: props.onChange
    }
  ) });
}
const TABS = [
  { id: "cards", label: "卡牌库" },
  { id: "deck", label: "卡组" },
  { id: "rules", label: "规则" },
  { id: "battle", label: "对战" }
];
function DuelApp(props) {
  const ctx = useExtensionContext();
  const [cardsRaw, setCardsRaw] = useState(
    () => ctx.settings.get("cardsJson")
  );
  const [rulesRaw, setRulesRaw] = useState(
    () => ctx.settings.get("rulesJson")
  );
  useEffect(() => {
    const subscribeText = (key, apply) => {
      try {
        const off = ctx.settings.subscribe(
          key,
          (next) => apply(typeof next === "string" ? next : "")
        );
        return typeof off === "function" ? off : () => void 0;
      } catch {
        return () => void 0;
      }
    };
    const offCards = subscribeText("cardsJson", setCardsRaw);
    const offRules = subscribeText("rulesJson", setRulesRaw);
    return () => {
      offCards();
      offRules();
    };
  }, [ctx]);
  const [deck, setDeckState] = useState(
    () => props.save.get("deck") ?? []
  );
  const [wins, setWinsState] = useState(() => props.save.get("wins") ?? 0);
  const [losses, setLossesState] = useState(
    () => props.save.get("losses") ?? 0
  );
  const setDeck = (next) => {
    setDeckState(next);
    try {
      props.save.set("deck", next);
    } catch {
    }
  };
  const setWins = (next) => {
    setWinsState(next);
    try {
      props.save.set("wins", next);
    } catch {
    }
  };
  const setLosses = (next) => {
    setLossesState(next);
    try {
      props.save.set("losses", next);
    } catch {
    }
  };
  useEffect(() => {
    setCachedDeck(deck);
  }, [deck]);
  useEffect(() => {
    setPanelOpen(true);
    return () => setPanelOpen(false);
  }, []);
  const [tab, setTab] = useState("cards");
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [notice, setNotice] = useState(null);
  const duel = useSyncExternalStore(
    subscribeDuelState,
    getDuelState,
    getDuelState
  );
  const realtime = useSyncExternalStore(
    subscribeDuelState,
    getRealtimeState,
    getRealtimeState
  );
  const cardsState = useMemo(() => {
    if (!cardsRaw) return { list: STARTER_CARDS, error: null };
    try {
      return { list: normalizeCards(JSON.parse(cardsRaw)), error: null };
    } catch {
      return {
        list: STARTER_CARDS,
        error: "卡牌库 JSON 解析失败，已回退到内置示例卡。"
      };
    }
  }, [cardsRaw]);
  const cards = cardsState.list;
  const rulesState = useMemo(() => {
    if (!rulesRaw) return { value: DEFAULT_RULES, error: null };
    try {
      return {
        value: normalizeRules(JSON.parse(rulesRaw)),
        error: null
      };
    } catch {
      return { value: DEFAULT_RULES, error: "规则 JSON 解析失败，已回退到默认规则。" };
    }
  }, [rulesRaw]);
  const rules = rulesState.value;
  const parseError = [cardsState.error, rulesState.error].filter(Boolean).join(" ");
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);
  const persistCards = (next) => {
    const raw = JSON.stringify(next, null, 2);
    setCardsRaw(raw);
    try {
      ctx.settings.set("cardsJson", raw);
    } catch {
    }
  };
  const persistRules = (next) => {
    const raw = JSON.stringify(next, null, 2);
    setRulesRaw(raw);
    try {
      ctx.settings.set("rulesJson", raw);
    } catch {
    }
  };
  const updateCard = (card) => {
    persistCards(cards.map((item) => item.id === card.id ? card : item));
  };
  const addCard = () => {
    const base = normalizeCards([
      {
        name: "新卡牌",
        kind: "monster",
        race: "战士族",
        attribute: "light",
        level: 4,
        attack: 1500,
        defense: 1200,
        cost: 4,
        description: "",
        effects: [],
        keywords: []
      }
    ])[0];
    if (!base) return;
    const card = { ...base, id: makeId("card") };
    persistCards([...cards, card]);
    setSelectedCardId(card.id);
  };
  const duplicateCard = (id) => {
    const source = cards.find((card) => card.id === id);
    if (!source) return;
    const copy = {
      ...source,
      id: makeId("card"),
      name: `${source.name} 副本`,
      effects: source.effects.map((effect) => ({ ...effect, id: makeId("eff") })),
      keywords: [...source.keywords]
    };
    persistCards([...cards, copy]);
    setSelectedCardId(copy.id);
  };
  const deleteCard = (id) => {
    const target = cards.find((card) => card.id === id);
    if (!target) return;
    if (!window.confirm(`删除卡牌「${target.name}」？此操作不可撤销。`)) return;
    const next = cards.filter((card) => card.id !== id);
    persistCards(next);
    setSelectedCardId(next[0]?.id ?? null);
    if (deck.some((entry) => entry.cardId === id)) {
      setDeck(deck.filter((entry) => entry.cardId !== id));
    }
  };
  const exportCards = () => {
    const blob = new Blob([JSON.stringify(cards, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "duel-cards.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`已导出 ${cards.length} 张卡牌。`);
  };
  const importCards = (text) => {
    try {
      const parsed = JSON.parse(text);
      const incoming = normalizeCards(parsed);
      if (incoming.length === 0) return "文件里没有可识别的卡牌。";
      const existing = new Map(cards.map((card) => [card.id, card]));
      for (const card of incoming) existing.set(card.id, card);
      const merged = Array.from(existing.values());
      persistCards(merged);
      setNotice(`已导入 ${incoming.length} 张卡牌。`);
      return null;
    } catch (error) {
      return `解析失败：${error instanceof Error ? error.message : String(error)}`;
    }
  };
  const deckTotal = deck.reduce((sum, entry) => sum + entry.count, 0);
  const deckValid = deckTotal > 0 && deckTotal >= rules.deckMinSize && deck.every((entry) => cards.some((card) => card.id === entry.cardId));
  const run = (result) => {
    if (!result.ok && result.message) setNotice(result.message);
    const previousWinner = duel?.winner;
    setDuelState(result.state);
    if (result.state.winner && !previousWinner) {
      if (result.state.winner === "player") setWins(wins + 1);
      else if (result.state.winner === "opponent") setLosses(losses + 1);
    }
  };
  const startRealtimeBattle = () => {
    const validDeck = deck.filter(
      (entry) => cards.some((card) => card.id === entry.cardId)
    );
    if (validDeck.length === 0) {
      setNotice("卡组为空，先到「卡组」页准备卡组。");
      return;
    }
    setRealtimeState(startRealtime(cards, validDeck, rules));
  };
  const handleStart = () => {
    const validDeck = deck.filter(
      (entry) => cards.some((card) => card.id === entry.cardId)
    );
    if (validDeck.length === 0) {
      setNotice("卡组为空，先到「卡组」页准备卡组。");
      return;
    }
    if (rules.battleMode === "realtime") {
      setRealtimeState(startRealtime(cards, validDeck, rules));
      return;
    }
    setDuelState(startDuel(cards, validDeck, rules));
  };
  const handleRealtimeTick = (deltaMs) => {
    const currentRt = getRealtimeState();
    if (!currentRt || currentRt.winner) return;
    setRealtimeState(tick(currentRt, deltaMs));
  };
  const handleRealtimeDeploy = (handIndex, lane) => {
    const currentRt = getRealtimeState();
    if (!currentRt) return;
    const result = deploy(currentRt, "player", handIndex, lane);
    if (!result.ok) {
      if (result.message) setNotice(result.message);
      return;
    }
    setRealtimeState(result.state);
  };
  const currentCards = cards;
  const effectiveSelectedId = selectedCardId && currentCards.some((card) => card.id === selectedCardId) ? selectedCardId : currentCards[0]?.id ?? null;
  return /* @__PURE__ */ jsxs("div", { className: "dcf-root", style: rootStyle, children: [
    /* @__PURE__ */ jsx("style", { children: globalCss }),
    /* @__PURE__ */ jsxs(
      "header",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingBottom: 10,
          flexWrap: "wrap"
        },
        children: [
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "baseline", gap: 8 }, children: [
            /* @__PURE__ */ jsx("span", { style: { fontSize: 17, fontWeight: 700, color: colors.goldSoft, letterSpacing: 1 }, children: "决斗卡牌工坊" }),
            /* @__PURE__ */ jsx("span", { style: { fontSize: 11, color: colors.faint }, children: "可视化编辑卡牌与规则" })
          ] }),
          /* @__PURE__ */ jsx("div", { style: { display: "flex", gap: 4 }, children: TABS.map((item) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setTab(item.id),
              style: {
                padding: "6px 14px",
                borderRadius: radius.sm,
                border: `1px solid ${tab === item.id ? colors.gold : colors.borderSoft}`,
                background: tab === item.id ? "rgba(231,196,106,0.14)" : colors.panel2,
                color: tab === item.id ? colors.gold : colors.muted,
                fontSize: 12.5,
                cursor: "pointer",
                fontFamily: "inherit"
              },
              children: item.label
            },
            item.id
          )) }),
          /* @__PURE__ */ jsx("div", { style: { flex: 1 } }),
          /* @__PURE__ */ jsxs("div", { style: { display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: colors.faint }, children: [
            /* @__PURE__ */ jsxs("span", { children: [
              "卡牌 ",
              cards.length
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              "卡组 ",
              deckTotal,
              " 张"
            ] }),
            /* @__PURE__ */ jsxs("span", { children: [
              "战绩 ",
              wins,
              " 胜 / ",
              losses,
              " 负"
            ] }),
            /* @__PURE__ */ jsx(Btn, { size: "sm", onClick: handleStart, variant: "gold", children: "快速开始决斗" })
          ] })
        ]
      }
    ),
    parseError ? /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          marginBottom: 8,
          fontSize: 11.5,
          color: colors.gold,
          border: `1px solid ${colors.gold}`,
          background: "rgba(231,196,106,0.08)",
          borderRadius: radius.sm,
          padding: "6px 10px"
        },
        children: parseError
      }
    ) : null,
    /* @__PURE__ */ jsxs("main", { style: { flex: 1, minHeight: 0 }, children: [
      tab === "cards" ? /* @__PURE__ */ jsx(
        CardEditor,
        {
          cards,
          selectedId: effectiveSelectedId,
          onSelect: setSelectedCardId,
          onChange: updateCard,
          onAdd: addCard,
          onDuplicate: duplicateCard,
          onDelete: deleteCard,
          onExport: exportCards,
          onImportText: importCards
        }
      ) : null,
      tab === "deck" ? /* @__PURE__ */ jsx(
        DeckBuilder,
        {
          cards,
          deck,
          rules,
          onChange: (next) => setDeck(next),
          onReset: () => setDeck(STARTER_DECK)
        }
      ) : null,
      tab === "rules" ? /* @__PURE__ */ jsx(
        RulesEditor,
        {
          rules,
          onChange: persistRules,
          onReset: () => persistRules(DEFAULT_RULES)
        }
      ) : null,
      tab === "battle" ? rules.battleMode === "realtime" ? /* @__PURE__ */ jsx(
        RealtimeBoard,
        {
          state: realtime,
          deckCount: deckTotal,
          deckValid,
          onStart: startRealtimeBattle,
          onTick: handleRealtimeTick,
          onDeploy: handleRealtimeDeploy,
          onExit: () => setRealtimeState(null)
        }
      ) : /* @__PURE__ */ jsx(
        BattleBoard,
        {
          state: duel,
          deckCount: deckTotal,
          deckValid,
          wins,
          losses,
          onStart: handleStart,
          onSummon: (handUid, position, tributes) => run(summonMonster(duel, handUid, position, tributes)),
          onActivateSpell: (handUid) => run(activateSpell(duel, handUid)),
          onSetTrap: (handUid) => run(setTrap(duel, handUid)),
          onAttack: (attackerUid, targetUid) => run(declareAttack(duel, attackerUid, targetUid)),
          onChangePosition: (uid) => run(changePosition(duel, uid)),
          onStartBattle: () => run(startBattlePhase(duel)),
          onEndTurn: () => run(endTurn(duel)),
          onEvolve: (uid) => run(evolveMonster(duel, uid)),
          onExit: () => setDuelState(null)
        }
      ) : null
    ] }),
    notice ? /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          position: "fixed",
          left: "50%",
          bottom: 24,
          transform: "translateX(-50%)",
          background: "rgba(18,24,42,0.96)",
          border: `1px solid ${colors.gold}`,
          color: colors.goldSoft,
          fontSize: 12,
          padding: "8px 16px",
          borderRadius: 999,
          zIndex: 60,
          boxShadow: "0 8px 24px rgba(0,0,0,.5)",
          whiteSpace: "nowrap"
        },
        children: notice
      }
    ) : null
  ] });
}
const rootStyle = {
  width: "100%",
  height: "100%",
  minHeight: 560,
  boxSizing: "border-box",
  padding: 12,
  display: "flex",
  flexDirection: "column",
  background: colors.bg,
  color: colors.text,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  overflow: "hidden"
};
const globalCss = `
.dcf-root *, .dcf-root *::before, .dcf-root *::after { box-sizing: border-box; }
.dcf-root ::-webkit-scrollbar { width: 8px; height: 8px; }
.dcf-root ::-webkit-scrollbar-track { background: transparent; }
.dcf-root ::-webkit-scrollbar-thumb { background: #33405f; border-radius: 8px; }
.dcf-root ::-webkit-scrollbar-thumb:hover { background: #455579; }
.dcf-btn { transition: filter .12s ease, transform .12s ease; }
.dcf-btn:hover:not(:disabled) { filter: brightness(1.12); }
.dcf-btn:active:not(:disabled) { transform: translateY(1px); }
.dcf-card { transition: transform .12s ease, box-shadow .12s ease; }
.dcf-card.is-clickable:hover { transform: translateY(-3px); box-shadow: 0 12px 26px rgba(0,0,0,.5); }
.dcf-chip:hover { filter: brightness(1.15); }
`;
const KIND_OPTIONS = [
  { label: "怪兽", value: "monster" },
  { label: "魔法", value: "spell" },
  { label: "陷阱", value: "trap" }
];
const ATTRIBUTE_OPTIONS = [
  { label: "光", value: "light" },
  { label: "暗", value: "dark" },
  { label: "地", value: "earth" },
  { label: "水", value: "water" },
  { label: "炎", value: "fire" },
  { label: "风", value: "wind" },
  { label: "神", value: "divine" }
];
const KEYWORD_OPTIONS = [
  { label: "无", value: "none" },
  { label: "直击", value: "direct" },
  { label: "穿透", value: "pierce" },
  { label: "连击", value: "double" },
  { label: "免疫效果伤害", value: "immune" },
  { label: "不可被效果破坏", value: "indestructible" }
];
const TRIGGER_OPTIONS = [
  { label: "不追加", value: "none" },
  { label: "召唤成功时", value: "on-summon" },
  { label: "攻击宣言时", value: "on-attack" },
  { label: "被破坏时", value: "on-destroyed" },
  { label: "发动时", value: "on-activate" }
];
const EFFECT_OPTIONS = [
  { label: "不追加", value: "none" },
  { label: "造成伤害", value: "damage" },
  { label: "回复生命", value: "heal" },
  { label: "抽卡", value: "draw" },
  { label: "破坏怪兽", value: "destroy" },
  { label: "提升攻守", value: "buff" },
  { label: "无效攻击", value: "negate" }
];
const POSITION_OPTIONS = [
  { label: "攻击表示", value: "attack" },
  { label: "守备表示", value: "defense" }
];
const SIDE_OPTIONS = [
  { label: "玩家", value: "player" },
  { label: "对手", value: "opponent" }
];
function readLibrary(ctx) {
  const raw = ctx.settings.get("cardsJson");
  if (!raw) return STARTER_CARDS;
  try {
    const cards = normalizeCards(JSON.parse(raw));
    return cards.length > 0 ? cards : STARTER_CARDS;
  } catch {
    return STARTER_CARDS;
  }
}
function writeLibrary(ctx, cards) {
  ctx.settings.set("cardsJson", JSON.stringify(cards, null, 2));
}
function findCard(cards, name) {
  const target = name.trim().toLowerCase();
  if (!target) return null;
  return cards.find((card) => card.name.trim().toLowerCase() === target) ?? cards.find((card) => card.name.toLowerCase().includes(target)) ?? null;
}
function buildEffect(trigger, kind, value) {
  if (trigger === "none" || kind === "none") return null;
  const triggers = ["on-summon", "on-attack", "on-destroyed", "on-activate"];
  if (!triggers.includes(trigger)) return null;
  const amount = Math.max(0, Math.round(value));
  const base = {
    id: makeId("eff"),
    trigger,
    stat: "attack",
    duration: "turn"
  };
  switch (kind) {
    case "damage":
      return { ...base, kind: "damage", target: "enemy-lp", value: amount };
    case "heal":
      return { ...base, kind: "heal", target: "self-lp", value: amount };
    case "draw":
      return { ...base, kind: "draw", target: "self", value: amount };
    case "destroy":
      return { ...base, kind: "destroy", target: "enemy-strongest", value: 0 };
    case "buff":
      return { ...base, kind: "buff", target: "self", value: amount };
    case "negate":
      return { ...base, kind: "negate", target: "enemy-strongest", value: 0 };
    default:
      return null;
  }
}
function commitDuel(next) {
  if (next) setDuelState(next);
}
function requireDuel(actionLabel) {
  const state = getDuelState();
  if (!state) {
    console.warn(`[决斗卡牌工坊] ${actionLabel}：当前没有进行中的决斗，已跳过。`);
    return null;
  }
  if (state.winner) {
    console.warn(`[决斗卡牌工坊] ${actionLabel}：决斗已结束，已跳过。`);
    return null;
  }
  return state;
}
const _PrintCardBlock = class _PrintCardBlock extends BlockExtension {
  run(ctx, params) {
    const p = params;
    const name = (p.cardName ?? "").trim();
    if (!name) {
      console.warn("[决斗卡牌工坊] 印卡：卡名不能为空。");
      return;
    }
    const effect = buildEffect(p.effectTrigger, p.effectKind, Number(p.effectValue));
    const draft = {
      id: makeId("card"),
      name,
      kind: p.kind ?? "monster",
      race: (p.race ?? "战士族").trim() || "战士族",
      attribute: p.attribute ?? "light",
      level: Number(p.level) || 4,
      attack: Number(p.attack) || 0,
      defense: Number(p.defense) || 0,
      cost: Number(p.cost) || 0,
      art: p.art ?? "",
      description: p.description ?? "",
      effects: effect ? [effect] : [],
      keywords: p.keyword && p.keyword !== "none" ? [p.keyword] : []
    };
    const card = normalizeCard(draft);
    if (!card) {
      console.warn("[决斗卡牌工坊] 印卡：卡牌数据不合法，已跳过。");
      return;
    }
    const cards = readLibrary(ctx);
    writeLibrary(ctx, [...cards, card]);
    const target = p.target ?? "library";
    if (target === "library") return;
    const state = requireDuel("印卡并放入对战");
    if (!state) return;
    if (target === "hand" || target === "deck-top") {
      commitDuel(
        addCardToZone(state, "player", card, target === "hand" ? "hand" : "deck-top", Number(p.count) || 1)
      );
      return;
    }
    const side = target === "opponent-field" ? "opponent" : "player";
    const result = summonDirect(
      state,
      side,
      card,
      p.position ?? "attack"
    );
    if (!result.ok) {
      console.warn(`[决斗卡牌工坊] 印卡并召唤失败：${result.message ?? "未知原因"}`);
      return;
    }
    commitDuel(result.state);
  }
};
_PrintCardBlock.type = "dcf-print-card";
_PrintCardBlock.title = "印卡：创建一张新卡";
_PrintCardBlock.description = "现场印出一张新卡写进卡牌库；也可以直接放进手牌、卡组或召唤到场上。";
_PrintCardBlock.category = "卡牌工坊";
_PrintCardBlock.schema = {
  cardName: { type: "string", label: "卡名", required: true },
  kind: { type: "enum", label: "种类", options: KIND_OPTIONS, default: "monster" },
  race: { type: "string", label: "种族", default: "战士族" },
  attribute: { type: "enum", label: "属性", options: ATTRIBUTE_OPTIONS, default: "light" },
  level: { type: "number", label: "等级", default: 4, min: 1, max: 12 },
  attack: { type: "number", label: "攻击力", default: 1500, min: 0, max: 99999, step: 100 },
  defense: { type: "number", label: "守备力", default: 1200, min: 0, max: 99999, step: 100 },
  cost: { type: "number", label: "花费", default: 4, min: 0, max: 30 },
  art: {
    type: "string",
    label: "立绘",
    default: "",
    multiline: false
  },
  description: { type: "string", label: "效果文本", default: "", multiline: true },
  keyword: { type: "enum", label: "关键词", options: KEYWORD_OPTIONS, default: "none" },
  effectTrigger: {
    type: "enum",
    label: "追加效果时机",
    options: TRIGGER_OPTIONS,
    default: "none"
  },
  effectKind: {
    type: "enum",
    label: "追加效果",
    options: EFFECT_OPTIONS,
    default: "none"
  },
  effectValue: {
    type: "number",
    label: "追加效果数值",
    default: 0,
    min: 0,
    max: 99999,
    step: 100
  },
  target: {
    type: "enum",
    label: "同时放入",
    options: [
      { label: "只进卡牌库", value: "library" },
      { label: "手牌", value: "hand" },
      { label: "卡组顶", value: "deck-top" },
      { label: "玩家场上", value: "player-field" },
      { label: "对手场上", value: "opponent-field" }
    ],
    default: "library"
  },
  position: {
    type: "enum",
    label: "场上表示",
    options: POSITION_OPTIONS,
    default: "attack"
  },
  count: { type: "number", label: "手牌/卡组张数", default: 1, min: 1, max: 9 }
};
let PrintCardBlock = _PrintCardBlock;
const _GiveCardBlock = class _GiveCardBlock extends BlockExtension {
  run(ctx, params) {
    const p = params;
    const card = findCard(readLibrary(ctx), p.cardName ?? "");
    if (!card) {
      console.warn(`[决斗卡牌工坊] 加入卡牌：卡牌库里没有「${p.cardName ?? ""}」。`);
      return;
    }
    const state = requireDuel("加入卡牌");
    if (!state) return;
    const zone = p.zone ?? "hand";
    commitDuel(addCardToZone(state, "player", card, zone, Number(p.count) || 1));
  }
};
_GiveCardBlock.type = "dcf-give-card";
_GiveCardBlock.title = "加入卡牌：把卡放进手牌/卡组";
_GiveCardBlock.description = "从卡牌库里找一张已有的卡，放进玩家手牌或卡组。";
_GiveCardBlock.category = "卡牌工坊";
_GiveCardBlock.schema = {
  cardName: {
    type: "string",
    label: "卡名",
    required: true,
    suggestions: { key: "dcf-card-name" }
  },
  zone: {
    type: "enum",
    label: "放入位置",
    options: [
      { label: "手牌", value: "hand" },
      { label: "卡组顶", value: "deck-top" },
      { label: "卡组底", value: "deck-bottom" }
    ],
    default: "hand"
  },
  count: { type: "number", label: "张数", default: 1, min: 1, max: 9 }
};
let GiveCardBlock = _GiveCardBlock;
const _ModifyCardBlock = class _ModifyCardBlock extends BlockExtension {
  run(ctx, params) {
    const p = params;
    const cards = readLibrary(ctx);
    const card = findCard(cards, p.cardName ?? "");
    if (!card) {
      console.warn(`[决斗卡牌工坊] 修改卡牌：卡牌库里没有「${p.cardName ?? ""}」。`);
      return;
    }
    const next = {
      ...card,
      effects: [...card.effects],
      keywords: [...card.keywords]
    };
    const value = Math.round(Number(p.numberValue) || 0);
    const text = (p.textValue ?? "").trim();
    switch (p.field) {
      case "attack":
        next.attack = Math.max(0, value);
        break;
      case "defense":
        next.defense = Math.max(0, value);
        break;
      case "cost":
        next.cost = Math.max(0, value);
        break;
      case "level":
        next.level = Math.max(1, Math.min(12, value || 1));
        break;
      case "race":
        if (text) next.race = text;
        break;
      case "description":
        next.description = p.textValue ?? "";
        break;
      case "art":
        next.art = p.textValue ?? "";
        break;
    }
    const extra = buildEffect(p.appendTrigger, p.appendKind, Number(p.appendValue));
    if (extra) next.effects.push(extra);
    const updated = normalizeCard(next);
    if (!updated) {
      console.warn("[决斗卡牌工坊] 修改卡牌：结果不合法，已跳过。");
      return;
    }
    writeLibrary(
      ctx,
      cards.map((item) => item.id === card.id ? updated : item)
    );
    const state = getDuelState();
    if (state) {
      commitDuel(replaceCardInstances(state, card.id, updated));
    }
  }
};
_ModifyCardBlock.type = "dcf-modify-card";
_ModifyCardBlock.title = "修改卡牌：改数值/文本/追加效果";
_ModifyCardBlock.description = "修改卡牌库里的一张卡；如果对局进行中，场上、手牌、卡组里的同名卡会同步更新。";
_ModifyCardBlock.category = "卡牌工坊";
_ModifyCardBlock.schema = {
  cardName: {
    type: "string",
    label: "卡名",
    required: true,
    suggestions: { key: "dcf-card-name" }
  },
  field: {
    type: "enum",
    label: "修改项",
    options: [
      { label: "攻击力", value: "attack" },
      { label: "守备力", value: "defense" },
      { label: "花费", value: "cost" },
      { label: "等级", value: "level" },
      { label: "种族", value: "race" },
      { label: "效果文本", value: "description" },
      { label: "立绘", value: "art" }
    ],
    default: "attack"
  },
  numberValue: {
    type: "number",
    label: "数值（攻击/守备/花费/等级）",
    default: 0,
    min: 0,
    max: 99999,
    step: 100
  },
  textValue: {
    type: "string",
    label: "文本（种族/效果/立绘）",
    default: "",
    multiline: true
  },
  appendTrigger: {
    type: "enum",
    label: "追加效果时机",
    options: TRIGGER_OPTIONS,
    default: "none"
  },
  appendKind: {
    type: "enum",
    label: "追加效果",
    options: EFFECT_OPTIONS,
    default: "none"
  },
  appendValue: {
    type: "number",
    label: "追加效果数值",
    default: 0,
    min: 0,
    max: 99999,
    step: 100
  }
};
let ModifyCardBlock = _ModifyCardBlock;
const _DirectSummonBlock = class _DirectSummonBlock extends BlockExtension {
  run(ctx, params) {
    const p = params;
    const card = findCard(readLibrary(ctx), p.cardName ?? "");
    if (!card) {
      console.warn(`[决斗卡牌工坊] 直接召唤：卡牌库里没有「${p.cardName ?? ""}」。`);
      return;
    }
    const state = requireDuel("直接召唤");
    if (!state) return;
    const result = summonDirect(
      state,
      p.side ?? "player",
      card,
      p.position ?? "attack"
    );
    if (!result.ok) {
      console.warn(`[决斗卡牌工坊] 直接召唤失败：${result.message ?? "未知原因"}`);
      return;
    }
    commitDuel(result.state);
  }
};
_DirectSummonBlock.type = "dcf-summon-card";
_DirectSummonBlock.title = "直接召唤：把卡召唤到场上";
_DirectSummonBlock.description = "无视花费、召唤次数和祭品，把卡牌库里的一张怪兽直接召唤到玩家或对手场上。";
_DirectSummonBlock.category = "卡牌工坊";
_DirectSummonBlock.schema = {
  cardName: {
    type: "string",
    label: "卡名",
    required: true,
    suggestions: { key: "dcf-card-name" }
  },
  side: { type: "enum", label: "召唤到", options: SIDE_OPTIONS, default: "player" },
  position: {
    type: "enum",
    label: "表示形式",
    options: POSITION_OPTIONS,
    default: "attack"
  }
};
let DirectSummonBlock = _DirectSummonBlock;
function readRules(ctx) {
  const raw = ctx.settings.get("rulesJson");
  if (!raw) return DEFAULT_RULES;
  try {
    return normalizeRules(JSON.parse(raw));
  } catch {
    return DEFAULT_RULES;
  }
}
function resolveDeck(cards, source) {
  const candidates = source === "starter" ? STARTER_DECK : getCachedDeck();
  const usable = candidates.filter(
    (entry) => entry.count > 0 && cards.some((card) => card.id === entry.cardId)
  );
  if (usable.length > 0) {
    return { deck: usable, note: source === "starter" ? "内置示例卡组" : "当前卡组" };
  }
  const fallback = STARTER_DECK.filter(
    (entry) => cards.some((card) => card.id === entry.cardId)
  );
  return {
    deck: fallback,
    note: source === "starter" ? "内置示例卡组" : "当前卡组为空（面板还没打开过），已改用示例卡组"
  };
}
function parseDeckSpec(text, cards) {
  const counts = /* @__PURE__ */ new Map();
  const parts = text.split(/[,;，；\n]/).map((part) => part.trim()).filter(Boolean);
  for (const part of parts) {
    const matched = part.match(/^(.+?)(?:\s*[*x×]\s*(\d+))?$/);
    if (!matched) continue;
    const card = findCard(cards, matched[1].trim());
    if (!card) {
      console.warn(`[决斗卡牌工坊] 对手卡组：卡牌库里没有「${matched[1].trim()}」，已忽略。`);
      continue;
    }
    const count = Math.max(1, Math.min(9, Number(matched[2] ?? 1) || 1));
    counts.set(card.id, Math.min(9, (counts.get(card.id) ?? 0) + count));
  }
  return Array.from(counts.entries()).map(([cardId, count]) => ({
    cardId,
    count
  }));
}
function resolveOpponentDeck(cards, p) {
  const source = p.opponentDeckSource ?? "mirror";
  if (source === "mirror") return void 0;
  if (source === "starter") {
    const starter = STARTER_DECK.filter(
      (entry) => cards.some((card) => card.id === entry.cardId)
    );
    return starter.length > 0 ? starter : void 0;
  }
  const parsed = parseDeckSpec(p.opponentDeckSpec ?? "", cards);
  if (parsed.length === 0) {
    console.warn(
      "[决斗卡牌工坊] 对手卡组：自定义内容为空或没匹配到卡牌，已改回镜像玩家卡组。"
    );
    return void 0;
  }
  return parsed;
}
function waitForDuelEnd() {
  const initial = getDuelState();
  if (!initial) return Promise.resolve("aborted");
  if (initial.winner) return Promise.resolve(initial.winner);
  return new Promise((resolve) => {
    let settled = false;
    let sawPanelOpen = isPanelOpen();
    let unsubscribe = null;
    function finish(result) {
      if (settled) return;
      settled = true;
      unsubscribe?.();
      resolve(result);
    }
    unsubscribe = subscribeDuelState(() => {
      const state = getDuelState();
      if (state?.winner) {
        finish(state.winner);
        return;
      }
      if (!state) {
        finish("aborted");
        return;
      }
      if (isPanelOpen()) {
        sawPanelOpen = true;
        return;
      }
      if (sawPanelOpen) finish("aborted");
    });
  });
}
function waitForRealtimeEnd() {
  const initial = getRealtimeState();
  if (!initial) return Promise.resolve("aborted");
  if (initial.winner) return Promise.resolve(initial.winner);
  return new Promise((resolve) => {
    let settled = false;
    let sawPanelOpen = isPanelOpen();
    let unsubscribe = null;
    function finish(result) {
      if (settled) return;
      settled = true;
      unsubscribe?.();
      resolve(result);
    }
    unsubscribe = subscribeDuelState(() => {
      const state = getRealtimeState();
      if (state?.winner) {
        finish(state.winner);
        return;
      }
      if (!state) {
        finish("aborted");
        return;
      }
      if (isPanelOpen()) {
        sawPanelOpen = true;
        return;
      }
      if (sawPanelOpen) finish("aborted");
    });
  });
}
const _StartBattleBlock = class _StartBattleBlock extends BlockExtension {
  async run(ctx, params) {
    const p = params;
    const cards = readLibrary(ctx);
    const { deck, note } = resolveDeck(cards, p.deckSource ?? "cached");
    if (deck.length === 0) {
      console.warn("[决斗卡牌工坊] 开始战斗：没有可用的卡组，已跳过。");
      return;
    }
    const opponentDeck = resolveOpponentDeck(cards, p);
    const firstSide = p.firstSide === "opponent" ? "opponent" : "player";
    const rules = readRules(ctx);
    const realtime = rules.battleMode === "realtime";
    if (realtime) {
      setRealtimeState(startRealtime(cards, deck, rules, opponentDeck));
      console.log(
        `[决斗卡牌工坊] 开始战斗（即时模式）：玩家使用${note}（${deck.length} 张）。`
      );
    } else {
      setDuelState(startDuel(cards, deck, rules, opponentDeck, firstSide));
      console.log(
        `[决斗卡牌工坊] 开始战斗：玩家使用${note}（${deck.length} 张），${firstSide === "opponent" ? "对手先攻" : "玩家先攻"}。`
      );
    }
    const openPanel = p.openPanel !== false;
    let waitForEnd = p.waitForEnd !== false;
    if (openPanel) {
      try {
        await ctx.ui.show("duel-forge", void 0, {
          size: "(100%, 100%)",
          position: "(0, 0)",
          interactable: true
        });
      } catch (error) {
        console.warn("[决斗卡牌工坊] 开始战斗：打开面板失败", error);
      }
    }
    if (!openPanel && waitForEnd) {
      console.warn(
        "[决斗卡牌工坊] 开始战斗：未开启「自动打开面板」，无法等待战斗结束，已改为立即继续剧情。"
      );
      waitForEnd = false;
    }
    if (!waitForEnd) return;
    const result = realtime ? await waitForRealtimeEnd() : await waitForDuelEnd();
    const variable = (p.resultVariable ?? "").trim() || "duelResult";
    try {
      ctx.variables.set(variable, result);
    } catch (error) {
      console.warn("[决斗卡牌工坊] 开始战斗：写入结果变量失败", error);
    }
    if (p.closePanelOnEnd !== false && result !== "aborted") {
      try {
        await ctx.ui.hide("duel-forge");
      } catch {
      }
    }
  }
};
_StartBattleBlock.type = "dcf-start-battle";
_StartBattleBlock.title = "开始战斗：在剧情中开一局";
_StartBattleBlock.description = "用面板里的卡组（或指定卡组）开始一场决斗，可指定对手卡组与先后手；自动打开面板，可等分出胜负后再继续剧情，并把结果写入变量供 If 分支使用。";
_StartBattleBlock.category = "卡牌工坊";
_StartBattleBlock.schema = {
  deckSource: {
    type: "enum",
    label: "玩家卡组",
    options: [
      { label: "当前卡组（玩家在面板里组的）", value: "cached" },
      { label: "内置示例卡组", value: "starter" }
    ],
    default: "cached"
  },
  opponentDeckSource: {
    type: "enum",
    label: "对手卡组",
    options: [
      { label: "与玩家相同（镜像）", value: "mirror" },
      { label: "内置示例卡组", value: "starter" },
      { label: "自定义（按卡名书写）", value: "custom" }
    ],
    default: "mirror"
  },
  opponentDeckSpec: {
    type: "string",
    label: "对手卡组内容（卡名*张数，逗号或换行分隔）",
    multiline: true,
    default: "",
    visibleWhen: { field: "opponentDeckSource", equals: "custom" }
  },
  firstSide: {
    type: "enum",
    label: "先手",
    options: [
      { label: "玩家先攻", value: "player" },
      { label: "对手先攻", value: "opponent" }
    ],
    default: "player"
  },
  openPanel: {
    type: "boolean",
    label: "自动打开面板",
    default: true
  },
  waitForEnd: {
    type: "boolean",
    label: "等待战斗结束再继续剧情",
    default: true
  },
  resultVariable: {
    type: "string",
    label: "结果写入变量",
    default: "duelResult"
  },
  closePanelOnEnd: {
    type: "boolean",
    label: "结束后关闭面板",
    default: true
  }
};
let StartBattleBlock = _StartBattleBlock;
const duelSave = defineSave({
  deck: {
    type: "list",
    persistence: "slot",
    default: STARTER_DECK,
    label: "当前卡组"
  },
  wins: { type: "number", persistence: "slot", default: 0, label: "胜场" },
  losses: { type: "number", persistence: "slot", default: 0, label: "败场" }
});
const _DuelCardForge = class _DuelCardForge extends Extension.withSave(duelSave) {
  render() {
    return {
      component: DuelApp,
      props: { save: this.save }
    };
  }
};
_DuelCardForge.meta = meta({
  id: "duel-forge",
  label: "决斗卡牌工坊",
  description: "可视化自由编辑规则的卡牌战斗：攻击力 / 守备力 / 种族 / 花费 / 效果 / 立绘。",
  category: "卡牌战斗"
});
_DuelCardForge.settings = settings((s) => ({
  cardsJson: s.string("卡牌库 JSON").multiline().default("").describe("留空时使用内置示例卡。通过「卡牌库」页导出/导入，或在这里直接粘贴 JSON。"),
  rulesJson: s.string("对战规则 JSON").multiline().default("").describe("留空时使用默认规则（8000 LP / 3 怪兽区 / 祭品召唤……）。可在「规则」页可视化修改。")
}));
_DuelCardForge.resetDeck = _DuelCardForge.method({
  title: "重置卡组为示例",
  description: "把当前存档的卡组替换为内置示例卡组（37 张）。",
  schema: {},
  run() {
    this.save.set("deck", STARTER_DECK);
  }
});
_DuelCardForge.openForge = _DuelCardForge.method({
  title: "打开卡牌工坊",
  description: "在游戏中全屏打开决斗卡牌工坊（卡牌库/卡组/规则/对战四页）。",
  schema: {},
  async run(ctx) {
    await ctx.ui.show("duel-forge", void 0, {
      size: "(100%, 100%)",
      position: "(0, 0)",
      interactable: true,
      modal: true
    });
  }
});
_DuelCardForge.cardCount = _DuelCardForge.method({
  title: "读取卡牌数量",
  description: "读取当前项目卡牌库中的卡牌张数。",
  schema: {},
  returns: { type: "number", label: "卡牌数量" },
  run(ctx) {
    const raw = ctx.settings.get("cardsJson");
    if (!raw) return STARTER_CARDS.length;
    try {
      const cards = normalizeCards(JSON.parse(raw));
      return cards.length;
    } catch {
      return STARTER_CARDS.length;
    }
  }
});
let DuelCardForge = _DuelCardForge;
export {
  DirectSummonBlock,
  DuelCardForge,
  GiveCardBlock,
  ModifyCardBlock,
  PrintCardBlock,
  StartBattleBlock,
  DuelCardForge as default
};
//# sourceMappingURL=index.js.map
