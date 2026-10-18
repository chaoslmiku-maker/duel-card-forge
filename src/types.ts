/**
 * 决斗卡牌工坊 · 数据模型
 *
 * 卡牌的全部可编辑字段都在这里：攻击力/守备力/种族/花费/效果/立绘/等级……
 * 战斗规则单独用 DuelRules 描述，UI 里逐项可视化编辑。
 */

export type CardKind = "monster" | "spell" | "trap";

export type CardAttribute =
  | "light"
  | "dark"
  | "earth"
  | "water"
  | "fire"
  | "wind"
  | "divine";

export type EffectTrigger =
  | "on-summon"
  | "on-attack"
  | "on-destroyed"
  | "on-activate";

export type EffectKind =
  | "damage"
  | "heal"
  | "draw"
  | "destroy"
  | "buff"
  | "negate";

export type EffectTarget =
  | "enemy-lp"
  | "self-lp"
  | "both-lp"
  | "enemy-strongest"
  | "enemy-random"
  | "enemy-all"
  | "self"
  | "self-monsters";

export type BuffStat = "attack" | "defense";
export type BuffDuration = "turn" | "duel";

/** 一条可编辑的卡牌效果。字段保持扁平，方便可视化表单直接绑定。 */
export interface CardEffect {
  id: string;
  trigger: EffectTrigger;
  kind: EffectKind;
  target: EffectTarget;
  /** 数值：伤害/回复/抽卡张数/攻守提升值。 */
  value: number;
  /** 仅 kind === "buff" 时使用。 */
  stat: BuffStat;
  /** 仅 kind === "buff" 时使用。 */
  duration: BuffDuration;
}

/** 关键词：用布尔开关表达的战斗特性。 */
export type CardKeyword =
  | "direct"
  | "pierce"
  | "double"
  | "immune"
  | "indestructible";

export interface CardDefinition {
  id: string;
  name: string;
  kind: CardKind;
  /** 种族（龙族、魔法师族……）。自由文本，可新增。 */
  race: string;
  attribute: CardAttribute;
  /** 怪兽等级 1-12，决定祭品需求与卡面星数。 */
  level: number;
  attack: number;
  defense: number;
  /** 召唤/发动需要支付的能量花费。 */
  cost: number;
  /** 立绘：空 = 程序化卡图；"emoji:🐉"；http(s)/data URL；扩展内资源路径。 */
  art: string;
  /** 卡牌效果文本（卡面上展示）。 */
  description: string;
  /** 结构化效果，驱动真实结算。 */
  effects: CardEffect[];
  keywords: CardKeyword[];
  /** 即时模式：移动速度（格/秒）。 */
  moveSpeed?: number;
  /** 即时模式：攻击间隔（毫秒）。 */
  attackIntervalMs?: number;
  /** 即时模式：攻击距离（格）。 */
  range?: number;
}

/** 对战规则：全部可视化编辑。 */
export interface DuelRules {
  startingLp: number;
  startingHand: number;
  drawPerTurn: number;
  /** 0 = 不限制。 */
  handLimit: number;
  monsterZones: number;
  spellZones: number;
  energyStart: number;
  energyPerTurn: number;
  energyMax: number;
  summonPerTurn: number;
  tributeEnabled: boolean;
  tributeLevelOne: number;
  tributeLevelTwo: number;
  directAttackAllowed: boolean;
  /** 守备表示被攻击时，溢出伤害是否贯穿。 */
  piercingEnabled: boolean;
  /** 战斗伤害倍率，百分比。 */
  battleDamageScale: number;
  deckOutLose: boolean;
  /** 0 = 不限。 */
  turnLimit: number;
  firstTurnAttack: boolean;
  aiEnabled: boolean;
  deckMinSize: number;
  /** 战斗模式：回合制（游戏王风）/ 影之诗风 / 即时对战（皇室战争风）。 */
  battleMode: BattleMode;
  /** 影之诗：双方进化点。 */
  evolvePoints: number;
  /** 影之诗：进化提升的攻击力 / 生命。 */
  evolveAttack: number;
  evolveDefense: number;
  /** 即时模式：圣水上限。 */
  elixirMax: number;
  /** 即时模式：每回复 1 点圣水所需毫秒。 */
  elixirRegenMs: number;
  /** 即时模式：一局时长（秒）。 */
  matchSeconds: number;
  /** 即时模式：普通塔生命。 */
  towerHp: number;
  /** 即时模式：国王塔生命。 */
  kingTowerHp: number;
}

export type BattleMode = "duel" | "shadowverse" | "realtime";

export interface DeckEntry {
  cardId: string;
  count: number;
}

export const DEFAULT_RULES: DuelRules = {
  startingLp: 8000,
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
  kingTowerHp: 3000,
};

/** 切换战斗模式时套用的规则预设（只覆盖与该模式强相关的字段）。 */
export const BATTLE_MODE_PRESETS: Record<BattleMode, Partial<DuelRules>> = {
  duel: {
    battleMode: "duel",
    startingLp: 8000,
    startingHand: 5,
    drawPerTurn: 1,
    monsterZones: 3,
    spellZones: 2,
    energyStart: 3,
    energyPerTurn: 1,
    energyMax: 10,
    tributeEnabled: true,
    summonPerTurn: 1,
    firstTurnAttack: false,
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
    evolvePoints: 3,
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
    kingTowerHp: 3000,
  },
};

export const BATTLE_MODE_LABELS: Record<BattleMode, string> = {
  duel: "回合制（游戏王风）",
  shadowverse: "影之诗风",
  realtime: "即时对战（皇室战争风）",
};

export const ATTRIBUTE_LABELS: Record<CardAttribute, string> = {
  light: "光",
  dark: "暗",
  earth: "地",
  water: "水",
  fire: "炎",
  wind: "风",
  divine: "神",
};

export const ATTRIBUTE_GLYPHS: Record<CardAttribute, string> = {
  light: "✦",
  dark: "🌑",
  earth: "⛰",
  water: "💧",
  fire: "🔥",
  wind: "🌪",
  divine: "✧",
};

export const KIND_LABELS: Record<CardKind, string> = {
  monster: "怪兽",
  spell: "魔法",
  trap: "陷阱",
};

export const TRIGGER_LABELS: Record<EffectTrigger, string> = {
  "on-summon": "召唤成功时",
  "on-attack": "攻击宣言时",
  "on-destroyed": "被破坏时",
  "on-activate": "发动时",
};

export const EFFECT_LABELS: Record<EffectKind, string> = {
  damage: "造成伤害",
  heal: "回复生命",
  draw: "抽卡",
  destroy: "破坏怪兽",
  buff: "提升攻守",
  negate: "无效攻击",
};

export const TARGET_LABELS: Record<EffectTarget, string> = {
  "enemy-lp": "对方生命值",
  "self-lp": "自己生命值",
  "both-lp": "双方生命值",
  "enemy-strongest": "对方最强怪兽",
  "enemy-random": "对方随机怪兽",
  "enemy-all": "对方全部怪兽",
  self: "自身",
  "self-monsters": "自己全部怪兽",
};

export const KEYWORD_LABELS: Record<CardKeyword, string> = {
  direct: "直击",
  pierce: "穿透",
  double: "连击",
  immune: "免疫效果伤害",
  indestructible: "不可被效果破坏",
};

export const KEYWORD_HINTS: Record<CardKeyword, string> = {
  direct: "对方场上有怪兽时也能直接攻击玩家。",
  pierce: "攻击守备怪兽时，超出守备力的伤害贯穿到对方生命值。",
  double: "每回合可以攻击两次。",
  immune: "不会受到卡牌效果的伤害。",
  indestructible: "不会被卡牌效果破坏（战斗破坏仍然有效）。",
};

/** 内置种族候选，可在编辑器里直接挑选或手动输入新种族。 */
export const RACE_PRESETS = [
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
  "幻龙族",
];

export const RACE_GLYPHS: Record<string, string> = {
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
  幻龙族: "✨",
};

export function raceGlyph(race: string): string {
  return RACE_GLYPHS[race] ?? "🃏";
}

/** 生成一个稳定的卡牌/效果 id。 */
export function makeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

/** 运行时校验：把任意 JSON 数据归一化成合法卡牌。 */
export function normalizeCard(raw: unknown): CardDefinition | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const rawName = typeof row.name === "string" ? row.name.trim() : "";
  const looksLikeCard =
    rawName !== "" ||
    typeof row.id === "string" ||
    row.kind !== undefined ||
    row.race !== undefined ||
    row.attack !== undefined ||
    row.defense !== undefined;
  if (!looksLikeCard) return null;
  const name = rawName || "未命名卡牌";
  const kind: CardKind =
    row.kind === "spell" || row.kind === "trap" ? row.kind : "monster";
  const attribute: CardAttribute =
    row.attribute === "light" ||
    row.attribute === "dark" ||
    row.attribute === "earth" ||
    row.attribute === "water" ||
    row.attribute === "fire" ||
    row.attribute === "wind" ||
    row.attribute === "divine"
      ? row.attribute
      : "dark";
  const num = (value: unknown, fallback: number, min: number, max: number) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.round(parsed)));
  };
  const effects = Array.isArray(row.effects)
    ? row.effects.flatMap((item): CardEffect[] => {
        if (!item || typeof item !== "object") return [];
        const eff = item as Record<string, unknown>;
        const triggers: EffectTrigger[] = [
          "on-summon",
          "on-attack",
          "on-destroyed",
          "on-activate",
        ];
        const kinds: EffectKind[] = [
          "damage",
          "heal",
          "draw",
          "destroy",
          "buff",
          "negate",
        ];
        const targets: EffectTarget[] = [
          "enemy-lp",
          "self-lp",
          "both-lp",
          "enemy-strongest",
          "enemy-random",
          "enemy-all",
          "self",
          "self-monsters",
        ];
        const trigger = triggers.includes(eff.trigger as EffectTrigger)
          ? (eff.trigger as EffectTrigger)
          : "on-summon";
        const effectKind = kinds.includes(eff.kind as EffectKind)
          ? (eff.kind as EffectKind)
          : "damage";
        const target = targets.includes(eff.target as EffectTarget)
          ? (eff.target as EffectTarget)
          : "enemy-lp";
        return [
          {
            id: typeof eff.id === "string" && eff.id ? eff.id : makeId("eff"),
            trigger,
            kind: effectKind,
            target,
            value: num(eff.value, 0, 0, 99999),
            stat: eff.stat === "defense" ? "defense" : "attack",
            duration: eff.duration === "duel" ? "duel" : "turn",
          },
        ];
      })
    : [];
  const keywords = Array.isArray(row.keywords)
    ? Array.from(
        new Set(
          row.keywords.filter((key): key is CardKeyword =>
            ["direct", "pierce", "double", "immune", "indestructible"].includes(
              String(key),
            ),
          ),
        ),
      )
    : [];
  return {
    id: typeof row.id === "string" && row.id ? row.id : makeId("card"),
    name,
    kind,
    race: typeof row.race === "string" && row.race.trim() ? row.race.trim() : "战士族",
    attribute,
    level: num(row.level, 4, 1, 12),
    attack: num(row.attack, 1000, 0, 99999),
    defense: num(row.defense, 1000, 0, 99999),
    cost: num(row.cost, 1, 0, 99),
    art: typeof row.art === "string" ? row.art : "",
    description: typeof row.description === "string" ? row.description : "",
    effects,
    keywords,
    moveSpeed: Math.max(
      0.2,
      Math.min(5, Number(row.moveSpeed) > 0 ? Number(row.moveSpeed) : 1.2),
    ),
    attackIntervalMs: num(row.attackIntervalMs, 1000, 200, 5000),
    range: Math.max(
      0.2,
      Math.min(6, Number(row.range) > 0 ? Number(row.range) : 0.8),
    ),
  };
}

export function normalizeCards(raw: unknown): CardDefinition[] {
  if (!Array.isArray(raw)) return [];
  const out: CardDefinition[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    const card = normalizeCard(item);
    if (!card || seen.has(card.id)) continue;
    seen.add(card.id);
    out.push(card);
  }
  return out;
}

export function normalizeRules(raw: unknown): DuelRules {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_RULES };
  const row = raw as Record<string, unknown>;
  const num = (key: keyof DuelRules, min: number, max: number) => {
    const parsed = Number(row[key]);
    const fallback = DEFAULT_RULES[key] as number;
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.round(parsed)));
  };
  const bool = (key: keyof DuelRules) =>
    typeof row[key] === "boolean" ? (row[key] as boolean) : (DEFAULT_RULES[key] as boolean);
  const mode: BattleMode =
    row.battleMode === "shadowverse" || row.battleMode === "realtime"
      ? row.battleMode
      : "duel";
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
    elixirRegenMs: num("elixirRegenMs", 300, 20000),
    matchSeconds: num("matchSeconds", 30, 900),
    towerHp: num("towerHp", 100, 99999),
    kingTowerHp: num("kingTowerHp", 100, 99999),
  };
}
