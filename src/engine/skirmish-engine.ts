/**
 * 半即时对战引擎（武器对战 / 资源回复制）。
 *
 * 与另外三种模式的根本区别：
 *   - 没有回合、没有先后手，双方随时可以出牌与行动；
 *   - 资源（费）按「每分钟 N 点」持续回复，出牌只看资源与场面；
 *   - 单位自动攻击（按各自攻击间隔），武器由主战者手动挥砍并消耗耐久；
 *   - 对局限时，时间到按场面评分判定。
 *
 * 卡牌定位（role）：
 *   - unit 单位：上场后自动作战
 *   - ace 王牌：同单位，但每方只能有 1 个
 *   - weapon 武器：装备到主战者，攻击力=每次伤害，守备力=耐久
 *   - spell 法术：立刻结算其「发动时」效果（伤害/回复/抽卡/破坏/强化/缴械/击退）
 *   - field 场地：占场地槽，为全体友方单位提供攻击力加成（attack 字段）
 */
import type { CardDefinition, CardEffect, DeckEntry, DuelRules } from "../types";

export type SkSide = "player" | "opponent";

export interface SkWeapon {
  card: CardDefinition;
  attack: number;
  durability: number;
  maxDurability: number;
  cooldown: number;
}

export interface SkUnit {
  uid: string;
  side: SkSide;
  card: CardDefinition;
  attack: number;
  hp: number;
  maxHp: number;
  /** 是否为王牌。 */
  ace: boolean;
  flying: boolean;
  blocking: boolean;
  /** 存活毫秒，用于战斗经验成长。 */
  survivedMs: number;
  experience: number;
  cooldown: number;
}

export interface SkHero {
  hp: number;
  maxHp: number;
  weapon: SkWeapon | null;
  /** 武器攻击冷却（毫秒）。 */
  weaponCooldown: number;
}

export type SkTone = "info" | "good" | "bad" | "warn";

export interface SkLog {
  id: string;
  tone: SkTone;
  text: string;
}

export interface SkState {
  rules: DuelRules;
  timeMs: number;
  timeLimitMs: number;
  mana: Record<SkSide, number>;
  hand: Record<SkSide, CardDefinition[]>;
  deck: Record<SkSide, CardDefinition[]>;
  units: SkUnit[];
  hero: Record<SkSide, SkHero>;
  /** 场地槽（每方 1 个）。 */
  field: Record<SkSide, CardDefinition | null>;
  winner?: SkSide | "draw";
  log: SkLog[];
  aiCooldown: number;
  drawCooldown: Record<SkSide, number>;
}

export interface SkResult {
  state: SkState;
  ok: boolean;
  message?: string;
}

let skSeq = 0;
function uid(prefix: string): string {
  skSeq += 1;
  return `${prefix}_${skSeq}`;
}

function other(side: SkSide): SkSide {
  return side === "player" ? "opponent" : "player";
}

function sideName(side: SkSide): string {
  return side === "player" ? "你" : "对手";
}

function pushLog(state: SkState, tone: SkTone, text: string): void {
  state.log.push({ id: uid("log"), tone, text });
  if (state.log.length > 220) state.log.splice(0, state.log.length - 220);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function expandDeck(entries: DeckEntry[], cards: CardDefinition[]): CardDefinition[] {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const out: CardDefinition[] = [];
  for (const entry of entries) {
    const card = byId.get(entry.cardId);
    if (!card) continue;
    const count = Math.max(1, Math.min(9, Math.round(entry.count)));
    for (let i = 0; i < count; i += 1) out.push(card);
  }
  return shuffle(out);
}

function roleOf(card: CardDefinition): "unit" | "weapon" | "spell" | "field" | "ace" {
  if (card.role) return card.role;
  if (card.kind === "monster") return "unit";
  if (card.kind === "spell") return "spell";
  return "field";
}

function clone(state: SkState): SkState {
  return {
    ...state,
    mana: { ...state.mana },
    hand: { player: [...state.hand.player], opponent: [...state.hand.opponent] },
    deck: { player: [...state.deck.player], opponent: [...state.deck.opponent] },
    units: state.units.map((unit) => ({ ...unit })),
    hero: {
      player: {
        ...state.hero.player,
        weapon: state.hero.player.weapon ? { ...state.hero.player.weapon } : null,
      },
      opponent: {
        ...state.hero.opponent,
        weapon: state.hero.opponent.weapon
          ? { ...state.hero.opponent.weapon }
          : null,
      },
    },
    field: { ...state.field },
    log: [...state.log],
    drawCooldown: { ...state.drawCooldown },
  };
}

function drawOne(state: SkState, side: SkSide): CardDefinition | null {
  const deck = state.deck[side];
  if (deck.length === 0) {
    state.deck[side] = shuffle([...state.hand[side]]);
    if (state.deck[side].length === 0) return null;
  }
  const card = state.deck[side].shift() ?? null;
  if (card) state.hand[side].push(card);
  return card;
}

const MAX_HAND = 9;

function drawToHand(state: SkState, side: SkSide): void {
  while (state.hand[side].length < MAX_HAND) {
    const card = drawOne(state, side);
    if (!card) break;
    if (state.hand[side].length > 7) break;
  }
}

export function startSkirmish(
  cards: CardDefinition[],
  deck: DeckEntry[],
  rules: DuelRules,
  opponentDeck?: DeckEntry[],
): SkState {
  const state: SkState = {
    rules,
    timeMs: 0,
    timeLimitMs: Math.max(30, rules.matchSeconds) * 1000,
    mana: { player: rules.manaStart, opponent: rules.manaStart },
    hand: { player: [], opponent: [] },
    deck: {
      player: expandDeck(deck, cards),
      opponent: expandDeck(
        opponentDeck && opponentDeck.length > 0 ? opponentDeck : deck,
        cards,
      ),
    },
    units: [],
    hero: {
      player: { hp: rules.startingLp, maxHp: rules.startingLp, weapon: null, weaponCooldown: 0 },
      opponent: { hp: rules.startingLp, maxHp: rules.startingLp, weapon: null, weaponCooldown: 0 },
    },
    field: { player: null, opponent: null },
    log: [],
    aiCooldown: 2500,
    drawCooldown: { player: 5000, opponent: 5000 },
  };
  for (let i = 0; i < Math.max(1, rules.startingHand); i += 1) {
    drawOne(state, "player");
    drawOne(state, "opponent");
  }
  pushLog(
    state,
    "info",
    `半即时对战开始：资源每分钟回复 ${rules.manaPerMinute} 点，主战者 ${rules.startingLp} 生命，` +
      `限时 ${Math.round(rules.matchSeconds / 60)} 分钟。`,
  );
  return state;
}

function unitCap(state: SkState): number {
  return Math.max(1, state.rules.monsterZones);
}

function ownUnits(state: SkState, side: SkSide): SkUnit[] {
  return state.units.filter((unit) => unit.side === side && unit.hp > 0);
}

function enemyUnits(state: SkState, side: SkSide): SkUnit[] {
  return ownUnits(state, other(side));
}

/** 场地提供的攻击加成。 */
function fieldBonus(state: SkState, side: SkSide): number {
  const field = state.field[side];
  return field ? Math.max(0, Math.round(field.attack)) : 0;
}

export function effectiveUnitAttack(state: SkState, unit: SkUnit): number {
  return Math.max(0, unit.attack + fieldBonus(state, unit.side));
}

function damageHero(state: SkState, side: SkSide, amount: number, label: string): void {
  if (amount <= 0) return;
  const hero = state.hero[side];
  hero.hp = Math.max(0, hero.hp - amount);
  pushLog(
    state,
    side === "player" ? "bad" : "good",
    `${sideName(side)}主战者受到 ${amount} 点${label}（剩余 ${hero.hp}）。`,
  );
  if (hero.hp <= 0) {
    state.winner = other(side);
    pushLog(state, side === "player" ? "bad" : "good", `${sideName(other(side))}获胜。`);
  }
}

function healHero(state: SkState, side: SkSide, amount: number): void {
  if (amount <= 0) return;
  const hero = state.hero[side];
  hero.hp = Math.min(hero.maxHp, hero.hp + amount);
  pushLog(
    state,
    side === "player" ? "good" : "bad",
    `${sideName(side)}主战者回复 ${amount} 点（当前 ${hero.hp}）。`,
  );
}

/** 单位被破坏：处理遗效。 */
function destroyUnit(state: SkState, unit: SkUnit, reason: string): void {
  const live = state.units.find((item) => item.uid === unit.uid);
  if (!live || live.hp > 0) return;
  state.units = state.units.filter((item) => item.uid !== unit.uid);
  pushLog(
    state,
    unit.side === "player" ? "bad" : "good",
    `${live.card.name}被${reason}破坏。`,
  );
  for (const effect of live.card.effects) {
    if (effect.trigger !== "on-destroyed") continue;
    applyEffect(state, live.side, effect);
  }
}

function buffOwnUnits(state: SkState, side: SkSide, amount: number): void {
  if (amount <= 0) return;
  for (const unit of ownUnits(state, side)) {
    unit.attack += amount;
  }
  pushLog(state, side === "player" ? "good" : "bad", `${sideName(side)}全体单位攻击 +${amount}。`);
}

function applyEffect(state: SkState, side: SkSide, effect: CardEffect): void {
  const enemy = other(side);
  const value = Math.max(0, Math.round(effect.value));
  switch (effect.kind) {
    case "damage":
      if (effect.target === "both-lp") {
        damageHero(state, "player", value, "效果伤害");
        damageHero(state, "opponent", value, "效果伤害");
      } else {
        damageHero(state, enemy, value, "效果伤害");
      }
      break;
    case "heal":
      healHero(state, side, value);
      break;
    case "draw":
      for (let i = 0; i < Math.min(3, value); i += 1) drawOne(state, side);
      pushLog(state, "info", `${sideName(side)}抽了 ${Math.min(3, value)} 张卡。`);
      break;
    case "destroy": {
      const targets = enemyUnits(state, side);
      if (targets.length > 0) {
        const strongest = targets.reduce((a, b) =>
          a.attack >= b.attack ? a : b,
        );
        strongest.hp = 0;
        destroyUnit(state, strongest, "效果");
      }
      break;
    }
    case "buff":
      buffOwnUnits(state, side, value);
      break;
    case "disarm": {
      const weapon = state.hero[enemy].weapon;
      if (weapon) {
        state.hero[enemy].weapon = null;
        pushLog(state, side === "player" ? "good" : "bad", `缴械：${sideName(enemy)}的${weapon.card.name}被摧毁。`);
      }
      break;
    }
    case "knockback": {
      const targets = enemyUnits(state, side);
      if (targets.length > 0) {
        const strongest = targets.reduce((a, b) => (a.attack >= b.attack ? a : b));
        state.units = state.units.filter((item) => item.uid !== strongest.uid);
        if (state.hand[enemy].length < MAX_HAND) {
          state.hand[enemy].push(strongest.card);
        }
        pushLog(
          state,
          side === "player" ? "good" : "bad",
          `击退：${strongest.card.name}被弹回${sideName(enemy)}手牌。`,
        );
      }
      break;
    }
    default:
      break;
  }
}

export function playCard(state: SkState, side: SkSide, handIndex: number): SkResult {
  if (state.winner) return { state, ok: false, message: "对局已结束。" };
  const card = state.hand[side][handIndex];
  if (!card) return { state, ok: false, message: "手牌里没有这张卡。" };
  if (state.mana[side] + 1e-6 < card.cost) {
    return { state, ok: false, message: `资源不足（需要 ${card.cost}）。` };
  }
  const role = roleOf(card);
  if (role === "unit" || role === "ace") {
    if (ownUnits(state, side).length >= unitCap(state)) {
      return { state, ok: false, message: "场上单位已满。" };
    }
    if (role === "ace" && ownUnits(state, side).some((unit) => unit.ace)) {
      return { state, ok: false, message: "王牌已经在场上了。" };
    }
  }
  if (role === "field" && state.field[side]) {
    return { state, ok: false, message: "场地槽已占用。" };
  }

  const next = clone(state);
  next.mana[side] = Math.max(0, next.mana[side] - card.cost);
  next.hand[side].splice(handIndex, 1);

  if (role === "unit" || role === "ace") {
    next.units.push({
      uid: uid("unit"),
      side,
      card,
      attack: Math.max(1, card.attack),
      hp: Math.max(1, card.defense),
      maxHp: Math.max(1, card.defense),
      ace: role === "ace",
      flying: card.keywords.includes("direct"),
      blocking: card.keywords.includes("indestructible"),
      survivedMs: 0,
      experience: 0,
      cooldown: 400,
    });
    pushLog(
      next,
      side === "player" ? "good" : "bad",
      `${sideName(side)}上场了${role === "ace" ? "王牌" : "单位"}「${card.name}」。`,
    );
  } else if (role === "weapon") {
    const durability = Math.max(1, card.defense);
    next.hero[side].weapon = {
      card,
      attack: Math.max(1, card.attack),
      durability,
      maxDurability: durability,
      cooldown: 0,
    };
    pushLog(
      next,
      side === "player" ? "good" : "bad",
      `${sideName(side)}装备武器「${card.name}」（攻击 ${card.attack} / 耐久 ${durability}）。`,
    );
  } else if (role === "field") {
    next.field[side] = card;
    pushLog(
      next,
      side === "player" ? "good" : "bad",
      `${sideName(side)}布置场地「${card.name}」（友方单位攻击 +${card.attack}）。`,
    );
  } else {
    pushLog(next, side === "player" ? "good" : "bad", `${sideName(side)}发动「${card.name}」。`);
    for (const effect of card.effects) {
      if (effect.trigger !== "on-activate") continue;
      applyEffect(next, side, effect);
    }
  }
  return { state: next, ok: true };
}

/** 主战者用武器攻击：targetUid 为空表示打对方主战者。 */
export function weaponAttack(
  state: SkState,
  side: SkSide,
  targetUid: string | null,
): SkResult {
  if (state.winner) return { state, ok: false, message: "对局已结束。" };
  const weapon = state.hero[side].weapon;
  if (!weapon) return { state, ok: false, message: "没有装备武器。" };
  if (state.hero[side].weaponCooldown > 0) {
    return { state, ok: false, message: "武器还在冷却。" };
  }
  const next = clone(state);
  const ownWeapon = next.hero[side].weapon;
  if (!ownWeapon) return { state, ok: false, message: "没有装备武器。" };
  ownWeapon.cooldown = Math.max(600, ownWeapon.card.attackIntervalMs ?? 1200);
  next.hero[side].weaponCooldown = Math.max(600, ownWeapon.card.attackIntervalMs ?? 1200);

  if (targetUid) {
    const target = enemyUnits(next, side).find((unit) => unit.uid === targetUid);
    if (!target) return { state, ok: false, message: "攻击目标无效。" };
    target.hp = Math.max(0, target.hp - ownWeapon.attack);
    pushLog(
      next,
      side === "player" ? "good" : "bad",
      `${sideName(side)}用${ownWeapon.card.name}攻击${target.card.name}，造成 ${ownWeapon.attack} 点伤害。`,
    );
    if (target.hp <= 0) destroyUnit(next, target, "武器");
  } else {
    damageHero(next, other(side), ownWeapon.attack, "武器伤害");
  }

  ownWeapon.durability -= 1;
  if (ownWeapon.durability <= 0) {
    next.hero[side].weapon = null;
    pushLog(
      next,
      side === "player" ? "warn" : "info",
      `${sideName(side)}的${ownWeapon.card.name}耐久耗尽，损坏了。`,
    );
  }
  return { state: next, ok: true };
}

/** AI：能出牌就出，出不了就挥武器。 */
function runAi(state: SkState, dt: number): void {
  state.aiCooldown -= dt;
  if (state.aiCooldown > 0) return;
  state.aiCooldown = 1800 + Math.random() * 1600;

  const hand = state.hand.opponent;
  let pick = -1;
  for (let i = 0; i < hand.length; i += 1) {
    if (hand[i].cost <= state.mana.opponent) {
      pick = i;
      break;
    }
  }
  if (pick >= 0) {
    const result = playCard(state, "opponent", pick);
    if (result.ok) {
      Object.assign(state, result.state);
      return;
    }
  }
  if (state.hero.opponent.weapon && state.hero.opponent.weaponCooldown <= 0) {
    const targets = enemyUnits(state, "opponent");
    const target = targets.length > 0 ? targets[0] : null;
    const result = weaponAttack(state, "opponent", target ? target.uid : null);
    if (result.ok) Object.assign(state, result.state);
  }
}

export function tick(state: SkState, deltaMs: number): SkState {
  if (state.winner) return state;
  const dt = Math.max(0, Math.min(400, deltaMs));
  if (dt === 0) return state;
  const next = clone(state);
  next.timeMs += dt;

  // 资源回复：每分钟 manaPerMinute 点
  const perMs = next.rules.manaPerMinute / 60000;
  const cap = Math.max(3, next.rules.elixirMax);
  for (const side of ["player", "opponent"] as SkSide[]) {
    next.mana[side] = Math.min(cap, next.mana[side] + perMs * dt);
    next.hero[side].weaponCooldown = Math.max(
      0,
      next.hero[side].weaponCooldown - dt,
    );
  }

  // 自动抽牌（每 6 秒 1 张，牌库循环）
  for (const side of ["player", "opponent"] as SkSide[]) {
    next.drawCooldown[side] -= dt;
    if (next.drawCooldown[side] <= 0) {
      next.drawCooldown[side] = 6000;
      if (next.hand[side].length < MAX_HAND) {
        const card = drawOne(next, side);
        if (card) drawToHand(next, side);
      }
    }
  }

  // 单位行动
  for (const unit of next.units) {
    if (unit.hp <= 0) continue;
    unit.cooldown = Math.max(0, unit.cooldown - dt);
    unit.survivedMs += dt;
    if (unit.survivedMs >= 10000) {
      unit.survivedMs -= 10000;
      unit.experience += 1;
      unit.attack += 1;
      pushLog(
        next,
        "info",
        `${unit.card.name}积累了战斗经验，攻击力 +1（${unit.attack}）。`,
      );
    }
    if (unit.cooldown > 0) continue;
    unit.cooldown = Math.max(600, unit.card.attackIntervalMs ?? 1500);

    const enemies = enemyUnits(next, unit.side);
    // 飞行单位只与飞行单位交战，否则直接越过去打主战者；
    // 地面单位优先被挡刀单位拦截，且打不到飞行单位。
    let target: SkUnit | undefined;
    if (unit.flying) {
      target = enemies.find((candidate) => candidate.flying);
    } else {
      const blocker = enemies.find(
        (candidate) => candidate.blocking && !candidate.flying,
      );
      target = blocker ?? enemies.find((candidate) => !candidate.flying);
    }
    if (target) {
      target.hp = Math.max(0, target.hp - effectiveUnitAttack(next, unit));
      pushLog(
        next,
        unit.side === "player" ? "good" : "bad",
        `${unit.card.name}攻击${target.card.name}（${effectiveUnitAttack(next, unit)} 点）。`,
      );
      if (target.hp <= 0) destroyUnit(next, target, "战斗");
      continue;
    }
    // 没有可打的单位：飞行单位可以直击主战者，其余先压场
    if (unit.flying) {
      damageHero(next, other(unit.side), effectiveUnitAttack(next, unit), "攻击");
    }
  }

  if (next.rules.aiEnabled && !next.winner) runAi(next, dt);

  // 时间到：按场面评分
  if (!next.winner && next.timeMs >= next.timeLimitMs) {
    const score = (side: SkSide): number => {
      const units = ownUnits(next, side);
      return (
        next.hero[side].hp +
        units.reduce((sum, unit) => sum + effectiveUnitAttack(next, unit) * 2 + unit.hp, 0)
      );
    };
    const playerScore = score("player");
    const enemyScore = score("opponent");
    next.winner =
      playerScore > enemyScore
        ? "player"
        : enemyScore > playerScore
          ? "opponent"
          : "draw";
    pushLog(
      next,
      "warn",
      `时间到：场面评分 ${playerScore} : ${enemyScore}。`,
    );
  }

  return next;
}

/** UI：某方场上的单位。 */
export function unitsOf(state: SkState, side: SkSide): SkUnit[] {
  return ownUnits(state, side);
}

/** UI：某方当前场面评分。 */
export function boardScore(state: SkState, side: SkSide): number {
  const units = ownUnits(state, side);
  return (
    state.hero[side].hp +
    units.reduce((sum, unit) => sum + effectiveUnitAttack(state, unit) * 2 + unit.hp, 0)
  );
}
