/**
 * 剧情 Block：在剧本里直接干预卡牌与对战。
 *
 * - 印卡：现场创建一张新卡，写进卡牌库，并可同时放进手牌/卡组/场上；
 * - 给予卡牌：把卡牌库里已有的卡放进手牌或卡组；
 * - 修改卡牌：改攻击力/守备力/花费/等级/种族/效果文本/立绘，或追加一条效果；
 * - 直接召唤：把一张卡直接召唤到玩家或对手场上（不看花费、召唤次数与祭品）。
 *
 * 这些 Block 与面板共用 src/state/duel-store.ts，改完面板会立即刷新。
 */

import {
  BlockExtension,
  type BlockSchema,
  type ExtensionContext,
} from "@avg-studio/sdk";
import {
  makeId,
  normalizeCard,
  normalizeCards,
  type CardAttribute,
  type CardDefinition,
  type CardEffect,
  type CardKeyword,
  type CardKind,
} from "../types";
import { STARTER_CARDS } from "../data/starter-cards";
import {
  addCardToZone,
  replaceCardInstances,
  summonDirect,
  type DuelState,
  type MonsterPosition,
  type SideId,
} from "../engine/duel-engine";
import { getDuelState, setDuelState } from "../state/duel-store";

// ---------------------------------------------------------------------------
// 公共工具
// ---------------------------------------------------------------------------

const KIND_OPTIONS = [
  { label: "怪兽", value: "monster" },
  { label: "魔法", value: "spell" },
  { label: "陷阱", value: "trap" },
];

const ATTRIBUTE_OPTIONS = [
  { label: "光", value: "light" },
  { label: "暗", value: "dark" },
  { label: "地", value: "earth" },
  { label: "水", value: "water" },
  { label: "炎", value: "fire" },
  { label: "风", value: "wind" },
  { label: "神", value: "divine" },
];

const KEYWORD_OPTIONS = [
  { label: "无", value: "none" },
  { label: "直击", value: "direct" },
  { label: "穿透", value: "pierce" },
  { label: "连击", value: "double" },
  { label: "免疫效果伤害", value: "immune" },
  { label: "不可被效果破坏", value: "indestructible" },
];

const TRIGGER_OPTIONS = [
  { label: "不追加", value: "none" },
  { label: "召唤成功时", value: "on-summon" },
  { label: "攻击宣言时", value: "on-attack" },
  { label: "被破坏时", value: "on-destroyed" },
  { label: "发动时", value: "on-activate" },
];

const EFFECT_OPTIONS = [
  { label: "不追加", value: "none" },
  { label: "造成伤害", value: "damage" },
  { label: "回复生命", value: "heal" },
  { label: "抽卡", value: "draw" },
  { label: "破坏怪兽", value: "destroy" },
  { label: "提升攻守", value: "buff" },
  { label: "无效攻击", value: "negate" },
];

const POSITION_OPTIONS = [
  { label: "攻击表示", value: "attack" },
  { label: "守备表示", value: "defense" },
];

const SIDE_OPTIONS = [
  { label: "玩家", value: "player" },
  { label: "对手", value: "opponent" },
];

function readLibrary(ctx: ExtensionContext): CardDefinition[] {
  const raw = ctx.settings.get<string>("cardsJson");
  if (!raw) return STARTER_CARDS;
  try {
    const cards = normalizeCards(JSON.parse(raw) as unknown);
    return cards.length > 0 ? cards : STARTER_CARDS;
  } catch {
    return STARTER_CARDS;
  }
}

function writeLibrary(ctx: ExtensionContext, cards: CardDefinition[]): void {
  ctx.settings.set("cardsJson", JSON.stringify(cards, null, 2));
}

function findCard(cards: CardDefinition[], name: string): CardDefinition | null {
  const target = name.trim().toLowerCase();
  if (!target) return null;
  return (
    cards.find((card) => card.name.trim().toLowerCase() === target) ??
    cards.find((card) => card.name.toLowerCase().includes(target)) ??
    null
  );
}

/** 剧情里只给了一个“追加效果类型”，这里换算成引擎能结算的目标。 */
function buildEffect(
  trigger: string,
  kind: string,
  value: number,
): CardEffect | null {
  if (trigger === "none" || kind === "none") return null;
  const triggers = ["on-summon", "on-attack", "on-destroyed", "on-activate"] as const;
  if (!triggers.includes(trigger as (typeof triggers)[number])) return null;
  const amount = Math.max(0, Math.round(value));
  const base = {
    id: makeId("eff"),
    trigger: trigger as CardEffect["trigger"],
    stat: "attack" as const,
    duration: "turn" as const,
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

function commitDuel(next: DuelState | null): void {
  if (next) setDuelState(next);
}

/** 有对局才能改手牌/场面；没有对局时提示并返回 null。 */
function requireDuel(actionLabel: string): DuelState | null {
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

// ---------------------------------------------------------------------------
// 1. 印卡
// ---------------------------------------------------------------------------

interface PrintCardParams {
  cardName: string;
  kind: string;
  race: string;
  attribute: string;
  level: number;
  attack: number;
  defense: number;
  cost: number;
  art: string;
  description: string;
  keyword: string;
  effectTrigger: string;
  effectKind: string;
  effectValue: number;
  target: string;
  position: string;
  count: number;
}

export class PrintCardBlock extends BlockExtension {
  static readonly type = "dcf-print-card";
  static readonly title = "印卡：创建一张新卡";
  static readonly description =
    "现场印出一张新卡写进卡牌库；也可以直接放进手牌、卡组或召唤到场上。";
  static readonly category = "卡牌工坊";

  static readonly schema: BlockSchema = {
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
      multiline: false,
    },
    description: { type: "string", label: "效果文本", default: "", multiline: true },
    keyword: { type: "enum", label: "关键词", options: KEYWORD_OPTIONS, default: "none" },
    effectTrigger: {
      type: "enum",
      label: "追加效果时机",
      options: TRIGGER_OPTIONS,
      default: "none",
    },
    effectKind: {
      type: "enum",
      label: "追加效果",
      options: EFFECT_OPTIONS,
      default: "none",
    },
    effectValue: {
      type: "number",
      label: "追加效果数值",
      default: 0,
      min: 0,
      max: 99999,
      step: 100,
    },
    target: {
      type: "enum",
      label: "同时放入",
      options: [
        { label: "只进卡牌库", value: "library" },
        { label: "手牌", value: "hand" },
        { label: "卡组顶", value: "deck-top" },
        { label: "玩家场上", value: "player-field" },
        { label: "对手场上", value: "opponent-field" },
      ],
      default: "library",
    },
    position: {
      type: "enum",
      label: "场上表示",
      options: POSITION_OPTIONS,
      default: "attack",
    },
    count: { type: "number", label: "手牌/卡组张数", default: 1, min: 1, max: 9 },
  };

  run(ctx: ExtensionContext, params: Record<string, unknown>): void {
    const p = params as unknown as PrintCardParams;
    const name = (p.cardName ?? "").trim();
    if (!name) {
      console.warn("[决斗卡牌工坊] 印卡：卡名不能为空。");
      return;
    }

    const effect = buildEffect(p.effectTrigger, p.effectKind, Number(p.effectValue));
    const draft = {
      id: makeId("card"),
      name,
      kind: (p.kind as CardKind) ?? "monster",
      race: (p.race ?? "战士族").trim() || "战士族",
      attribute: (p.attribute as CardAttribute) ?? "light",
      level: Number(p.level) || 4,
      attack: Number(p.attack) || 0,
      defense: Number(p.defense) || 0,
      cost: Number(p.cost) || 0,
      art: p.art ?? "",
      description: p.description ?? "",
      effects: effect ? [effect] : [],
      keywords:
        p.keyword && p.keyword !== "none" ? [p.keyword as CardKeyword] : [],
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
        addCardToZone(state, "player", card, target === "hand" ? "hand" : "deck-top", Number(p.count) || 1),
      );
      return;
    }

    const side: SideId = target === "opponent-field" ? "opponent" : "player";
    const result = summonDirect(
      state,
      side,
      card,
      (p.position as MonsterPosition) ?? "attack",
    );
    if (!result.ok) {
      console.warn(`[决斗卡牌工坊] 印卡并召唤失败：${result.message ?? "未知原因"}`);
      return;
    }
    commitDuel(result.state);
  }
}

// ---------------------------------------------------------------------------
// 2. 加入已有卡牌
// ---------------------------------------------------------------------------

interface GiveCardParams {
  cardName: string;
  zone: string;
  count: number;
}

export class GiveCardBlock extends BlockExtension {
  static readonly type = "dcf-give-card";
  static readonly title = "加入卡牌：把卡放进手牌/卡组";
  static readonly description = "从卡牌库里找一张已有的卡，放进玩家手牌或卡组。";
  static readonly category = "卡牌工坊";

  static readonly schema: BlockSchema = {
    cardName: {
      type: "string",
      label: "卡名",
      required: true,
      suggestions: { key: "dcf-card-name" },
    },
    zone: {
      type: "enum",
      label: "放入位置",
      options: [
        { label: "手牌", value: "hand" },
        { label: "卡组顶", value: "deck-top" },
        { label: "卡组底", value: "deck-bottom" },
      ],
      default: "hand",
    },
    count: { type: "number", label: "张数", default: 1, min: 1, max: 9 },
  };

  run(ctx: ExtensionContext, params: Record<string, unknown>): void {
    const p = params as unknown as GiveCardParams;
    const card = findCard(readLibrary(ctx), p.cardName ?? "");
    if (!card) {
      console.warn(`[决斗卡牌工坊] 加入卡牌：卡牌库里没有「${p.cardName ?? ""}」。`);
      return;
    }
    const state = requireDuel("加入卡牌");
    if (!state) return;
    const zone = (p.zone as "hand" | "deck-top" | "deck-bottom") ?? "hand";
    commitDuel(addCardToZone(state, "player", card, zone, Number(p.count) || 1));
  }
}

// ---------------------------------------------------------------------------
// 3. 修改卡牌
// ---------------------------------------------------------------------------

interface ModifyCardParams {
  cardName: string;
  field: string;
  numberValue: number;
  textValue: string;
  appendTrigger: string;
  appendKind: string;
  appendValue: number;
}

export class ModifyCardBlock extends BlockExtension {
  static readonly type = "dcf-modify-card";
  static readonly title = "修改卡牌：改数值/文本/追加效果";
  static readonly description =
    "修改卡牌库里的一张卡；如果对局进行中，场上、手牌、卡组里的同名卡会同步更新。";
  static readonly category = "卡牌工坊";

  static readonly schema: BlockSchema = {
    cardName: {
      type: "string",
      label: "卡名",
      required: true,
      suggestions: { key: "dcf-card-name" },
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
        { label: "立绘", value: "art" },
      ],
      default: "attack",
    },
    numberValue: {
      type: "number",
      label: "数值（攻击/守备/花费/等级）",
      default: 0,
      min: 0,
      max: 99999,
      step: 100,
    },
    textValue: {
      type: "string",
      label: "文本（种族/效果/立绘）",
      default: "",
      multiline: true,
    },
    appendTrigger: {
      type: "enum",
      label: "追加效果时机",
      options: TRIGGER_OPTIONS,
      default: "none",
    },
    appendKind: {
      type: "enum",
      label: "追加效果",
      options: EFFECT_OPTIONS,
      default: "none",
    },
    appendValue: {
      type: "number",
      label: "追加效果数值",
      default: 0,
      min: 0,
      max: 99999,
      step: 100,
    },
  };

  run(ctx: ExtensionContext, params: Record<string, unknown>): void {
    const p = params as unknown as ModifyCardParams;
    const cards = readLibrary(ctx);
    const card = findCard(cards, p.cardName ?? "");
    if (!card) {
      console.warn(`[决斗卡牌工坊] 修改卡牌：卡牌库里没有「${p.cardName ?? ""}」。`);
      return;
    }

    const next: CardDefinition = {
      ...card,
      effects: [...card.effects],
      keywords: [...card.keywords],
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
      default:
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
      cards.map((item) => (item.id === card.id ? updated : item)),
    );

    const state = getDuelState();
    if (state) {
      commitDuel(replaceCardInstances(state, card.id, updated));
    }
  }
}

// ---------------------------------------------------------------------------
// 4. 直接召唤
// ---------------------------------------------------------------------------

interface SummonParams {
  cardName: string;
  side: string;
  position: string;
}

export class DirectSummonBlock extends BlockExtension {
  static readonly type = "dcf-summon-card";
  static readonly title = "直接召唤：把卡召唤到场上";
  static readonly description =
    "无视花费、召唤次数和祭品，把卡牌库里的一张怪兽直接召唤到玩家或对手场上。";
  static readonly category = "卡牌工坊";

  static readonly schema: BlockSchema = {
    cardName: {
      type: "string",
      label: "卡名",
      required: true,
      suggestions: { key: "dcf-card-name" },
    },
    side: { type: "enum", label: "召唤到", options: SIDE_OPTIONS, default: "player" },
    position: {
      type: "enum",
      label: "表示形式",
      options: POSITION_OPTIONS,
      default: "attack",
    },
  };

  run(ctx: ExtensionContext, params: Record<string, unknown>): void {
    const p = params as unknown as SummonParams;
    const card = findCard(readLibrary(ctx), p.cardName ?? "");
    if (!card) {
      console.warn(`[决斗卡牌工坊] 直接召唤：卡牌库里没有「${p.cardName ?? ""}」。`);
      return;
    }
    const state = requireDuel("直接召唤");
    if (!state) return;
    const result = summonDirect(
      state,
      (p.side as SideId) ?? "player",
      card,
      (p.position as MonsterPosition) ?? "attack",
    );
    if (!result.ok) {
      console.warn(`[决斗卡牌工坊] 直接召唤失败：${result.message ?? "未知原因"}`);
      return;
    }
    commitDuel(result.state);
  }
}

/** 规则默认值仅用于文档/校验时参考，避免误删导入。 */
