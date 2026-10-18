/**
 * 决斗引擎：纯函数实现的一套「游戏王风」对战规则。
 *
 * 所有操作都返回新的 DuelState，UI 只负责展示与调用。
 * 规则数值全部来自 DuelRules，不在这里写死。
 */

import type {
  CardDefinition,
  CardEffect,
  DeckEntry,
  DuelRules,
  EffectTrigger,
} from "../types";

export type SideId = "player" | "opponent";
export type MonsterPosition = "attack" | "defense";

export interface DuelCardInstance {
  uid: string;
  card: CardDefinition;
}

export interface FieldMonster {
  uid: string;
  card: CardDefinition;
  position: MonsterPosition;
  /** 永久攻守修正（buff duration=duel）。 */
  atkMod: number;
  defMod: number;
  /** 回合内攻守修正（buff duration=turn），己方回合结束时清空。 */
  tempAtk: number;
  tempDef: number;
  attacksUsed: number;
  changedPosition: boolean;
}

export interface SetTrapEntry {
  uid: string;
  card: CardDefinition;
}

export interface DuelSide {
  lp: number;
  energy: number;
  deck: DuelCardInstance[];
  hand: DuelCardInstance[];
  graveyard: DuelCardInstance[];
  monsters: Array<FieldMonster | null>;
  traps: Array<SetTrapEntry | null>;
}

export type LogTone = "info" | "good" | "bad" | "warn";

export interface DuelLog {
  id: string;
  tone: LogTone;
  text: string;
}

export interface DuelState {
  rules: DuelRules;
  turn: number;
  active: SideId;
  phase: "main" | "battle";
  player: DuelSide;
  opponent: DuelSide;
  summonsThisTurn: number;
  /** 先攻第一回合不允许攻击。 */
  attackLocked: boolean;
  log: DuelLog[];
  winner?: SideId | "draw";
}

export interface DuelResult {
  state: DuelState;
  ok: boolean;
  message?: string;
}

let uidSeq = 0;
function nextUid(): string {
  uidSeq += 1;
  return `ci_${uidSeq}`;
}

export function otherSide(side: SideId): SideId {
  return side === "player" ? "opponent" : "player";
}

export function sideOf(state: DuelState, side: SideId): DuelSide {
  return side === "player" ? state.player : state.opponent;
}

function withSide(state: DuelState, side: SideId, next: DuelSide): DuelState {
  return side === "player" ? { ...state, player: next } : { ...state, opponent: next };
}

function cloneSide(side: DuelSide): DuelSide {
  return {
    lp: side.lp,
    energy: side.energy,
    deck: [...side.deck],
    hand: [...side.hand],
    graveyard: [...side.graveyard],
    monsters: side.monsters.map((m) => (m ? { ...m } : null)),
    traps: side.traps.map((t) => (t ? { ...t } : null)),
  };
}

function cloneState(state: DuelState): DuelState {
  return {
    ...state,
    player: cloneSide(state.player),
    opponent: cloneSide(state.opponent),
    log: [...state.log],
  };
}

function log(state: DuelState, tone: LogTone, text: string): void {
  state.log.push({ id: `log_${state.log.length}_${Date.now().toString(36)}`, tone, text });
}

export function effectiveAttack(monster: FieldMonster): number {
  return Math.max(0, monster.card.attack + monster.atkMod + monster.tempAtk);
}

export function effectiveDefense(monster: FieldMonster): number {
  return Math.max(0, monster.card.defense + monster.defMod + monster.tempDef);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeSide(
  library: Map<string, CardDefinition>,
  deck: DeckEntry[],
  rules: DuelRules,
): DuelSide {
  const cards: DuelCardInstance[] = [];
  for (const entry of deck) {
    const card = library.get(entry.cardId);
    if (!card) continue;
    const count = Math.max(0, Math.min(20, Math.round(entry.count)));
    for (let i = 0; i < count; i += 1) {
      cards.push({ uid: nextUid(), card });
    }
  }
  return {
    lp: rules.startingLp,
    energy: rules.energyStart,
    deck: shuffle(cards),
    hand: [],
    graveyard: [],
    monsters: new Array<FieldMonster | null>(rules.monsterZones).fill(null),
    traps: new Array<SetTrapEntry | null>(rules.spellZones).fill(null),
  };
}

function drawCards(
  state: DuelState,
  side: SideId,
  count: number,
): { state: DuelState; drawn: number } {
  let current = cloneState(state);
  let drawn = 0;
  for (let i = 0; i < count; i += 1) {
    const s = sideOf(current, side);
    if (s.deck.length === 0) {
      if (current.rules.deckOutLose) {
        current = { ...current, winner: otherSide(side) };
        log(current, "bad", `${sideName(side)} 卡组已抽空，判负。`);
      }
      break;
    }
    const [top, ...rest] = s.deck;
    const next: DuelSide = { ...s, deck: rest, hand: [...s.hand, top] };
    current = withSide(current, side, next);
    drawn += 1;
  }
  return { state: current, drawn };
}

function sideName(side: SideId): string {
  return side === "player" ? "你" : "对手";
}

function beginTurn(state: DuelState, side: SideId, first: boolean): DuelState {
  let current = cloneState(state);
  const s = sideOf(current, side);
  const energy = first
    ? Math.min(current.rules.energyMax, current.rules.energyStart)
    : Math.min(current.rules.energyMax, s.energy + current.rules.energyPerTurn);
  current = withSide(current, side, {
    ...s,
    energy,
    monsters: s.monsters.map((m) =>
      m ? { ...m, attacksUsed: 0, changedPosition: false } : null,
    ),
  });
  if (!first && current.rules.drawPerTurn > 0) {
    const result = drawCards(current, side, current.rules.drawPerTurn);
    current = result.state;
    if (result.drawn > 0) {
      log(current, "info", `${sideName(side)} 抽了 ${result.drawn} 张卡。`);
    }
  }
  if (current.rules.turnLimit > 0 && current.turn > current.rules.turnLimit) {
    current = { ...current, winner: "draw" };
    log(current, "warn", `达到回合上限（${current.rules.turnLimit}），决斗判定为平局。`);
  }
  return { ...current, attackLocked: false };
}

export function startDuel(
  libraryCards: CardDefinition[],
  deck: DeckEntry[],
  rules: DuelRules,
): DuelState {
  const library = new Map(libraryCards.map((card) => [card.id, card]));
  const base: DuelState = {
    rules,
    turn: 1,
    active: "player",
    phase: "main",
    player: makeSide(library, deck, rules),
    opponent: makeSide(library, deck, rules),
    summonsThisTurn: 0,
    attackLocked: !rules.firstTurnAttack,
    log: [],
  };
  let state: DuelState = base;
  log(state, "info", "决斗开始！");
  const playerDraw = drawCards(state, "player", rules.startingHand);
  state = playerDraw.state;
  const opponentDraw = drawCards(state, "opponent", rules.startingHand);
  state = opponentDraw.state;
  log(state, "info", `双方各抽了 ${rules.startingHand} 张起始手牌。`);
  return state;
}

// ---------------------------------------------------------------------------
// 效果结算
// ---------------------------------------------------------------------------

function slotOfMonster(side: DuelSide, uid: string): number {
  return side.monsters.findIndex((m) => m !== null && m.uid === uid);
}

function strongestSlot(side: DuelSide): number {
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

function randomSlot(side: DuelSide): number {
  const filled: number[] = [];
  side.monsters.forEach((m, index) => {
    if (m) filled.push(index);
  });
  if (filled.length === 0) return -1;
  return filled[Math.floor(Math.random() * filled.length)];
}

function destroyMonster(
  state: DuelState,
  side: SideId,
  slot: number,
  reason: "battle" | "effect",
): DuelState {
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
    graveyard: [...s.graveyard, { uid: monster.uid, card: monster.card }],
  });
  log(
    current,
    side === "player" ? "bad" : "good",
    `${monster.card.name} 被${reason === "battle" ? "战斗" : "效果"}破坏。`,
  );
  current = resolveEffects(current, side, monster.card, "on-destroyed", {
    selfMonsterUid: monster.uid,
  });
  return current;
}

function applyDamage(state: DuelState, side: SideId, amount: number, label: string): DuelState {
  if (amount <= 0) return state;
  const s = sideOf(state, side);
  const next: DuelSide = { ...s, lp: Math.max(0, s.lp - amount) };
  const current = withSide(state, side, next);
  log(current, side === "player" ? "bad" : "good", `${sideName(side)} 受到 ${amount} 点${label}（剩余 ${next.lp}）。`);
  return current;
}

function applyHeal(state: DuelState, side: SideId, amount: number): DuelState {
  if (amount <= 0) return state;
  const s = sideOf(state, side);
  const next: DuelSide = { ...s, lp: s.lp + amount };
  const current = withSide(state, side, next);
  log(current, side === "player" ? "good" : "bad", `${sideName(side)} 回复 ${amount} 点生命值（当前 ${next.lp}）。`);
  return current;
}

function applyBuff(
  state: DuelState,
  side: SideId,
  effect: CardEffect,
  selfMonsterUid: string | undefined,
): DuelState {
  const s = sideOf(state, side);
  const amount = effect.value;
  if (amount <= 0) return state;
  const targets: number[] = [];
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
    monsters[slot] =
      effect.duration === "duel"
        ? effect.stat === "attack"
          ? { ...m, atkMod: m.atkMod + amount }
          : { ...m, defMod: m.defMod + amount }
        : effect.stat === "attack"
          ? { ...m, tempAtk: m.tempAtk + amount }
          : { ...m, tempDef: m.tempDef + amount };
  }
  const current = withSide(state, side, { ...s, monsters });
  log(
    current,
    "info",
    `${sideName(side)} 的 ${effect.stat === "attack" ? "攻击力" : "守备力"} +${amount}（${effect.target === "self-monsters" ? "全体" : "单体"}）。`,
  );
  return current;
}

function resolveEffects(
  state: DuelState,
  side: SideId,
  card: CardDefinition,
  trigger: EffectTrigger,
  opts: { selfMonsterUid?: string } = {},
): DuelState {
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
        log(current, "info", `${sideName(side)} 因「${card.name}」抽了 ${result.drawn} 张卡。`);
      }
      continue;
    }
    if (effect.kind === "destroy") {
      const enemy = otherSide(side);
      const enemySide = sideOf(current, enemy);
      const slots: number[] = [];
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

// ---------------------------------------------------------------------------
// 胜负
// ---------------------------------------------------------------------------

function checkVictory(state: DuelState): DuelState {
  if (state.winner) return state;
  const p = state.player.lp;
  const o = state.opponent.lp;
  if (p <= 0 && o <= 0) {
    const current = { ...state, winner: "draw" as const };
    log(current, "warn", "双方生命值同时归零，平局。");
    return current;
  }
  if (p <= 0) {
    const current = { ...state, winner: "opponent" as const };
    log(current, "bad", "你的生命值归零，决斗失败。");
    return current;
  }
  if (o <= 0) {
    const current = { ...state, winner: "player" as const };
    log(current, "good", "对手生命值归零，你赢得了决斗！");
    return current;
  }
  return state;
}

// ---------------------------------------------------------------------------
// 召唤 / 发动
// ---------------------------------------------------------------------------

export function tributeRequirement(card: CardDefinition, rules: DuelRules): number {
  if (!rules.tributeEnabled || card.kind !== "monster") return 0;
  if (card.level >= rules.tributeLevelTwo) return 2;
  if (card.level >= rules.tributeLevelOne) return 1;
  return 0;
}

function freeMonsterSlot(side: DuelSide): number {
  return side.monsters.findIndex((m) => m === null);
}

function freeTrapSlot(side: DuelSide): number {
  return side.traps.findIndex((t) => t === null);
}

export function summonBlocker(state: DuelState, handUid: string): string | null {
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

export function summonMonster(
  state: DuelState,
  handUid: string,
  position: MonsterPosition,
  tributeUids: string[] = [],
): DuelResult {
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
  const slots: number[] = [];
  for (const uid of tributeUids) {
    const slot = slotOfMonster(side, uid);
    if (slot < 0) return { state, ok: false, message: "祭品选择无效。" };
    slots.push(slot);
  }
  let next: DuelSide = {
    ...side,
    energy: side.energy - card.cost,
    hand: side.hand.filter((c) => c.uid !== handUid),
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
  };
  next = { ...next, monsters, graveyard };
  current = withSide(current, "player", next);
  current = {
    ...current,
    summonsThisTurn: current.summonsThisTurn + 1,
  };
  log(
    current,
    "good",
    `你召唤了 ${card.name}（${position === "attack" ? "攻击表示" : "守备表示"}）。`,
  );
  current = resolveEffects(current, "player", card, "on-summon", { selfMonsterUid: handCard.uid });
  current = checkVictory(current);
  return { state: current, ok: true };
}

export function activateSpell(state: DuelState, handUid: string): DuelResult {
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
    graveyard: [...side.graveyard, { uid: handUid, card }],
  });
  log(current, "good", `你发动了魔法卡「${card.name}」。`);
  current = resolveEffects(current, "player", card, "on-activate");
  current = checkVictory(current);
  return { state: current, ok: true };
}

export function setTrap(state: DuelState, handUid: string): DuelResult {
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
    traps,
  });
  log(current, "info", `你盖放了一张陷阱卡。`);
  return { state: current, ok: true };
}

export function changePosition(state: DuelState, monsterUid: string): DuelResult {
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
    changedPosition: true,
  };
  let current = withSide(state, "player", { ...side, monsters });
  log(
    current,
    "info",
    `${monster.card.name} 变为${monsters[slot]?.position === "attack" ? "攻击" : "守备"}表示。`,
  );
  return { state: current, ok: true };
}

export function startBattlePhase(state: DuelState): DuelResult {
  if (state.winner) return { state, ok: false, message: "决斗已结束。" };
  if (state.active !== "player") return { state, ok: false, message: "现在不是你的回合。" };
  if (state.phase === "battle") return { state, ok: false, message: "已经进入战斗阶段。" };
  return { state: { ...state, phase: "battle" }, ok: true };
}

// ---------------------------------------------------------------------------
// 战斗
// ---------------------------------------------------------------------------

function maxAttacks(monster: FieldMonster): number {
  return monster.card.keywords.includes("double") ? 2 : 1;
}

function triggerDefenderTrap(
  state: DuelState,
  defender: SideId,
): { state: DuelState; negated: boolean } {
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
    graveyard: [...side.graveyard, { uid: trap.uid, card: trap.card }],
  });
  log(current, "warn", `${sideName(defender)} 发动了陷阱卡「${trap.card.name}」。`);
  const negate = trap.card.effects.some(
    (effect) => effect.trigger === "on-activate" && effect.kind === "negate",
  );
  current = resolveEffects(current, defender, trap.card, "on-activate");
  if (negate) {
    log(current, "warn", "这次攻击被无效了。");
    return { state: current, negated: true };
  }
  return { state: current, negated: false };
}

function battleDamage(state: DuelState, side: SideId, amount: number): DuelState {
  const scaled = Math.round((amount * state.rules.battleDamageScale) / 100);
  return applyDamage(state, side, scaled, "战斗伤害");
}

export function declareAttack(
  state: DuelState,
  attackerUid: string,
  targetUid: string | null,
): DuelResult {
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
  const canDirect =
    !enemyHasMonsters ||
    attacker.card.keywords.includes("direct") ||
    (state.rules.directAttackAllowed && !enemyHasMonsters);
  if (targetUid === null) {
    if (!canDirect) return { state, ok: false, message: "对方场上有怪兽，无法直接攻击。" };
    if (!state.rules.directAttackAllowed) {
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
    `你用 ${attacker.card.name} ${targetUid === null ? "直接攻击" : "发起攻击"}。`,
  );

  const trap = triggerDefenderTrap(current, "opponent");
  current = trap.state;
  if (trap.negated) return { state: current, ok: true };

  current = resolveEffects(current, "player", attacker.card, "on-attack", {
    selfMonsterUid: attackerUid,
  });
  current = checkVictory(current);
  if (current.winner) return { state: current, ok: true };

  const atk = effectiveAttack(attackerNow);

  if (targetUid === null) {
    current = battleDamage(current, "opponent", atk);
    log(current, "good", `直接攻击造成 ${Math.round((atk * current.rules.battleDamageScale) / 100)} 点伤害。`);
    return { state: checkVictory(current), ok: true };
  }

  const enemySide = sideOf(current, "opponent");
  const targetSlot = enemySide.monsters.findIndex((m) => m !== null && m.uid === targetUid);
  if (targetSlot < 0) return { state, ok: false, message: "攻击目标无效。" };
  const target = enemySide.monsters[targetSlot];
  if (!target) return { state, ok: false, message: "攻击目标无效。" };

  if (target.position === "attack") {
    const def = effectiveAttack(target);
    if (atk > def) {
      current = destroyMonster(current, "opponent", targetSlot, "battle");
      current = battleDamage(current, "opponent", atk - def);
    } else if (atk < def) {
      current = destroyMonster(current, "player", attackerSlot, "battle");
      current = battleDamage(current, "player", def - atk);
    } else {
      current = destroyMonster(current, "opponent", targetSlot, "battle");
      current = destroyMonster(current, "player", attackerSlot, "battle");
      log(current, "warn", "攻击力相同，双方怪兽同时被破坏。");
    }
    return { state: checkVictory(current), ok: true };
  }

  const def = effectiveDefense(target);
  if (atk > def) {
    const piercing =
      attacker.card.keywords.includes("pierce") || current.rules.piercingEnabled;
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

// ---------------------------------------------------------------------------
// 回合流转
// ---------------------------------------------------------------------------

export function endTurn(state: DuelState): DuelResult {
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
      graveyard: [...side.graveyard, ...discarded],
    });
    log(current, "warn", `手牌超过上限，丢弃了 ${overflow} 张卡。`);
  }
  const cleared = sideOf(current, "player").monsters.map((m) =>
    m ? { ...m, tempAtk: 0, tempDef: 0 } : null,
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

/** 对手回合直接结束（AI 关闭时使用），把回合交给玩家。 */
function handOverToPlayer(state: DuelState): DuelState {
  if (state.winner) return state;
  let next = cloneState(state);
  const opp = next.opponent;
  const cleared = opp.monsters.map((m) => (m ? { ...m, tempAtk: 0, tempDef: 0 } : null));
  next = withSide(next, "opponent", { ...opp, monsters: cleared });
  next = {
    ...next,
    turn: next.turn + 1,
    active: "player",
    phase: "main",
    summonsThisTurn: 0,
  };  next = beginTurn(next, "player", false);
  log(next, "info", "你的回合开始。");
  return next;
}

/** AI 行动后交还回合给玩家。 */
function runAiTurn(state: DuelState): DuelState {
  let current = state;
  if (current.winner) return current;
  const rules = current.rules;
  let aiSummonsThisTurn = 0;

  const tryPlay = (): boolean => {
    const side = current.opponent;
    // 1. 召唤怪兽（优先高攻，其次守备；遵守每回合召唤次数）
    for (const handCard of [...side.hand]) {
      if (aiSummonsThisTurn >= rules.summonPerTurn) break;
      if (handCard.card.kind !== "monster") continue;
      const need = tributeRequirement(handCard.card, rules);
      const tributes = side.monsters
        .filter((m): m is FieldMonster => m !== null)
        .sort((a, b) => effectiveAttack(a) - effectiveAttack(b))
        .slice(0, need)
        .map((m) => m.uid);
      if (need > 0 && tributes.length < need) continue;
      if (side.monsters.every((m) => m !== null)) continue;
      if (side.energy < handCard.card.cost) continue;
      const position: MonsterPosition =
        handCard.card.defense > handCard.card.attack ? "defense" : "attack";
      const result = aiSummon(current, handCard.uid, position, tributes);
      if (result.ok) {
        current = result.state;
        aiSummonsThisTurn += 1;
        return true;
      }
    }
    // 2. 使用魔法
    for (const handCard of [...side.hand]) {
      if (handCard.card.kind !== "spell") continue;
      if (side.energy < handCard.card.cost) continue;
      const result = aiActivateSpell(current, handCard.uid);
      if (result.ok) {
        current = result.state;
        return true;
      }
    }
    // 3. 盖放陷阱
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

  if (!current.winner) {
    current = { ...current, phase: "battle" };
    let safety = 0;
    while (!current.winner && safety < 12) {
      safety += 1;
      const side = current.opponent;
      const attackerIndex = side.monsters.findIndex(
        (m) => m !== null && m.position === "attack" && m.attacksUsed < maxAttacks(m),
      );
      if (attackerIndex < 0) break;
      const attacker = side.monsters[attackerIndex];
      if (!attacker) break;
      const playerSide = current.player;
      const filled = playerSide.monsters
        .map((m, index) => ({ m, index }))
        .filter((row): row is { m: FieldMonster; index: number } => row.m !== null);
      const atk = effectiveAttack(attacker);
      let targetUid: string | null = null;
      if (filled.length > 0) {
        const beatable = filled
          .filter((row) =>
            row.m.position === "attack" ? atk > effectiveAttack(row.m) : atk > effectiveDefense(row.m),
          )
          .sort((a, b) => effectiveAttack(a.m) - effectiveAttack(b.m));
        const weakest = filled.sort((a, b) => effectiveAttack(a.m) - effectiveAttack(b.m))[0];
        if (beatable.length > 0) {
          targetUid = beatable[0].m.uid;
        } else if (weakest && atk > effectiveDefense(weakest.m) && weakest.m.position === "defense") {
          targetUid = weakest.m.uid;
        } else {
          // 打不过就换下一只
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

function aiSummon(
  state: DuelState,
  handUid: string,
  position: MonsterPosition,
  tributeUids: string[],
): DuelResult {
  let current = cloneState(state);
  const side = current.opponent;
  const handCard = side.hand.find((c) => c.uid === handUid);
  if (!handCard) return { state, ok: false, message: "no card" };
  const card = handCard.card;
  const monsters = [...side.monsters];
  const graveyard = [...side.graveyard];
  for (const uid of tributeUids) {
    const slot = monsters.findIndex((m) => m !== null && m.uid === uid);
    if (slot >= 0) {
      const sacrifice = monsters[slot];
      if (sacrifice) {
        graveyard.push({ uid: sacrifice.uid, card: sacrifice.card });
        monsters[slot] = null;
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
  };
  current = withSide(current, "opponent", {
    ...side,
    energy: side.energy - card.cost,
    hand: side.hand.filter((c) => c.uid !== handUid),
    monsters,
    graveyard,
  });
  log(current, "bad", `对手召唤了 ${card.name}（${position === "attack" ? "攻击" : "守备"}表示）。`);
  current = resolveEffects(current, "opponent", card, "on-summon", { selfMonsterUid: handCard.uid });
  return { state: checkVictory(current), ok: true };
}

function aiActivateSpell(state: DuelState, handUid: string): DuelResult {
  let current = cloneState(state);
  const side = current.opponent;
  const handCard = side.hand.find((c) => c.uid === handUid);
  if (!handCard) return { state, ok: false, message: "no card" };
  const card = handCard.card;
  current = withSide(current, "opponent", {
    ...side,
    energy: side.energy - card.cost,
    hand: side.hand.filter((c) => c.uid !== handUid),
    graveyard: [...side.graveyard, { uid: handUid, card }],
  });
  log(current, "bad", `对手发动了魔法卡「${card.name}」。`);
  current = resolveEffects(current, "opponent", card, "on-activate");
  return { state: checkVictory(current), ok: true };
}

function aiSetTrap(state: DuelState, handUid: string): DuelResult {
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
    traps,
  });
  log(current, "bad", "对手盖放了一张陷阱卡。");
  return { state: current, ok: true };
}

function aiDeclareAttack(
  state: DuelState,
  attackerUid: string,
  targetUid: string | null,
): DuelResult {
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
    `对手用 ${attacker.card.name} ${targetUid === null ? "直接攻击" : "发起攻击"}。`,
  );

  const trap = triggerDefenderTrap(current, "player");
  current = trap.state;
  if (trap.negated) return { state: current, ok: true };

  current = resolveEffects(current, "opponent", attacker.card, "on-attack", {
    selfMonsterUid: attackerUid,
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

/** UI 用：玩家可以进行哪些操作。 */
export function playerCanAttack(state: DuelState): boolean {
  if (state.winner || state.active !== "player" || state.phase !== "battle") return false;
  if (state.attackLocked) return false;
  return state.player.monsters.some(
    (m) => m !== null && m.position === "attack" && m.attacksUsed < maxAttacks(m),
  );
}

// ---------------------------------------------------------------------------
// 剧情注入（Block 用）：印卡、加牌、改卡、直接召唤
// ---------------------------------------------------------------------------

/** 把一张卡定义变成可放进手牌/卡组的实例。 */
export function createCardInstance(card: CardDefinition): DuelCardInstance {
  return { uid: nextUid(), card };
}

/** 把一张卡放进指定区域（手牌 / 卡组顶 / 卡组底 / 墓地）。 */
export function addCardToZone(
  state: DuelState,
  side: SideId,
  card: CardDefinition,
  zone: "hand" | "deck-top" | "deck-bottom" | "graveyard",
  count = 1,
): DuelState {
  const amount = Math.max(1, Math.min(9, Math.round(count)));
  let current = cloneState(state);
  for (let i = 0; i < amount; i += 1) {
    const instance = createCardInstance(card);
    const s = sideOf(current, side);
    const next: DuelSide =
      zone === "hand"
        ? { ...s, hand: [...s.hand, instance] }
        : zone === "deck-top"
          ? { ...s, deck: [instance, ...s.deck] }
          : zone === "deck-bottom"
            ? { ...s, deck: [...s.deck, instance] }
            : { ...s, graveyard: [...s.graveyard, instance] };
    current = withSide(current, side, next);
  }
  log(
    current,
    "info",
    `${sideName(side)} 获得 ${amount} 张「${card.name}」（${
      zone === "hand" ? "手牌" : zone === "graveyard" ? "墓地" : zone === "deck-top" ? "卡组顶" : "卡组底"
    }）。`,
  );
  return current;
}

/** 直接把一张卡召唤到场上（无视花费、召唤次数与祭品，但会触发召唤效果）。 */
export function summonDirect(
  state: DuelState,
  side: SideId,
  card: CardDefinition,
  position: MonsterPosition,
  slot?: number,
): DuelResult {
  if (state.winner) return { state, ok: false, message: "决斗已结束，无法再召唤。" };
  if (card.kind !== "monster") return { state, ok: false, message: "只有怪兽可以召唤到场上。" };
  let current = cloneState(state);
  const s = sideOf(current, side);
  const preferred =
    slot !== undefined && slot >= 0 && slot < s.monsters.length && s.monsters[slot] === null
      ? slot
      : freeMonsterSlot(s);
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
  };
  current = withSide(current, side, { ...sideOf(current, side), monsters });
  log(
    current,
    side === "player" ? "good" : "bad",
    `${sideName(side)} 的「${card.name}」被直接召唤到场上（${position === "attack" ? "攻击" : "守备"}表示）。`,
  );
  current = resolveEffects(current, side, card, "on-summon", { selfMonsterUid: instance.uid });
  return { state: checkVictory(current), ok: true };
}

/** 卡牌库里的定义被改写后，同步更新场上/手牌/卡组里同 id 的实例。 */
export function replaceCardInstances(
  state: DuelState,
  cardId: string,
  next: CardDefinition,
): DuelState {
  const current = cloneState(state);
  const mapSide = (side: DuelSide): DuelSide => ({
    ...side,
    deck: side.deck.map((c) => (c.card.id === cardId ? { ...c, card: next } : c)),
    hand: side.hand.map((c) => (c.card.id === cardId ? { ...c, card: next } : c)),
    graveyard: side.graveyard.map((c) =>
      c.card.id === cardId ? { ...c, card: next } : c,
    ),
    monsters: side.monsters.map((m) =>
      m && m.card.id === cardId ? { ...m, card: next } : m,
    ),
    traps: side.traps.map((t) => (t && t.card.id === cardId ? { ...t, card: next } : t)),
  });
  return {
    ...current,
    player: mapSide(current.player),
    opponent: mapSide(current.opponent),
  };
}
