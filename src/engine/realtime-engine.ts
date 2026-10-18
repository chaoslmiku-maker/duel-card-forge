/**
 * 即时对战引擎（皇室战争风）。
 *
 * 与回合制引擎完全独立：
 *   - 圣水随时间回复，双方各自计；
 *   - 两条兵线，单位自动向对方塔推进，进入射程后按攻速互砍；
 *   - 每方 2 座普通塔 + 1 座国王塔，国王塔在双塔倒下后才可被攻击；
 *   - 时间结束按皇冠数、再按国王塔血量判定胜负。
 *
 * 所有操作都是纯函数：tick / deploy 返回新的 RtState。
 */

import type { CardDefinition, DeckEntry, DuelRules } from "../types";

export type RtSide = "player" | "opponent";
export type RtLane = 0 | 1;

export interface RtUnit {
  uid: string;
  side: RtSide;
  lane: number;
  card: CardDefinition;
  hp: number;
  maxHp: number;
  /** 横向位置：0 = 玩家基地，10 = 对手基地。 */
  x: number;
  /** 距离下次攻击的剩余毫秒。 */
  cooldown: number;
}

export interface RtTower {
  key: string;
  side: RtSide;
  lane: number | "king";
  x: number;
  hp: number;
  maxHp: number;
  cooldown: number;
  alive: boolean;
}

export type RtTone = "info" | "good" | "bad" | "warn";

export interface RtLog {
  id: string;
  tone: RtTone;
  text: string;
}

export interface RtState {
  rules: DuelRules;
  timeMs: number;
  timeLimitMs: number;
  elixir: Record<RtSide, number>;
  hand: Record<RtSide, CardDefinition[]>;
  deck: Record<RtSide, CardDefinition[]>;
  towers: RtTower[];
  units: RtUnit[];
  crowns: Record<RtSide, number>;
  winner?: RtSide | "draw";
  log: RtLog[];
  /** AI 下次尝试出兵的剩余毫秒。 */
  aiCooldown: number;
}

export interface RtResult {
  state: RtState;
  ok: boolean;
  message?: string;
}

const LANE_Y = [3.5, 6.5];
export const RT_LANE_COUNT = 2;

let rtSeq = 0;
function nextUid(prefix: string): string {
  rtSeq += 1;
  return `${prefix}_${rtSeq}`;
}

export function laneOf(index: number): number {
  return index === 1 ? 1 : 0;
}

export function unitY(lane: number): number {
  return LANE_Y[lane] ?? LANE_Y[0];
}

function sideName(side: RtSide): string {
  return side === "player" ? "你" : "对手";
}

function other(side: RtSide): RtSide {
  return side === "player" ? "opponent" : "player";
}

function pushLog(state: RtState, tone: RtTone, text: string): void {
  state.log.push({ id: nextUid("log"), tone, text });
  if (state.log.length > 200) state.log.splice(0, state.log.length - 200);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function expandDeck(deck: DeckEntry[], cards: CardDefinition[]): CardDefinition[] {
  const byId = new Map(cards.map((card) => [card.id, card]));
  const out: CardDefinition[] = [];
  for (const entry of deck) {
    const card = byId.get(entry.cardId);
    if (!card) continue;
    const count = Math.max(1, Math.min(9, Math.round(entry.count)));
    for (let i = 0; i < count; i += 1) out.push(card);
  }
  return shuffle(out);
}

function makeTowers(rules: DuelRules, side: RtSide): RtTower[] {
  const base = side === "player" ? 3 : 7;
  const kingX = side === "player" ? 1 : 9;
  const towers: RtTower[] = [0, 1].map((lane) => ({
    key: `${side}_lane_${lane}`,
    side,
    lane,
    x: lane === 0 ? base - 0.4 : base + 0.4,
    hp: rules.towerHp,
    maxHp: rules.towerHp,
    cooldown: 0,
    alive: true,
  }));
  towers.push({
    key: `${side}_king`,
    side,
    lane: "king",
    x: kingX,
    hp: rules.kingTowerHp,
    maxHp: rules.kingTowerHp,
    cooldown: 0,
    alive: true,
  });
  return towers;
}

function clone(state: RtState): RtState {
  return {
    ...state,
    elixir: { ...state.elixir },
    hand: {
      player: [...state.hand.player],
      opponent: [...state.hand.opponent],
    },
    deck: {
      player: [...state.deck.player],
      opponent: [...state.deck.opponent],
    },
    towers: state.towers.map((tower) => ({ ...tower })),
    units: state.units.map((unit) => ({ ...unit })),
    crowns: { ...state.crowns },
    log: [...state.log],
  };
}

function drawHand(state: RtState, side: RtSide): void {
  while (state.hand[side].length < 4) {
    if (state.deck[side].length === 0) {
      // 牌库循环：把已出的牌重新洗回去（简化处理）
      state.deck[side] = shuffle([...state.hand[side]]);
    }
    const next = state.deck[side].shift();
    if (!next) break;
    state.hand[side].push(next);
  }
}

export function startRealtime(
  cards: CardDefinition[],
  deck: DeckEntry[],
  rules: DuelRules,
  opponentDeck?: DeckEntry[],
): RtState {
  const playerDeck = expandDeck(deck, cards);
  const enemyDeck = expandDeck(
    opponentDeck && opponentDeck.length > 0 ? opponentDeck : deck,
    cards,
  );
  const state: RtState = {
    rules,
    timeMs: 0,
    timeLimitMs: Math.max(30, rules.matchSeconds) * 1000,
    elixir: { player: Math.min(rules.elixirMax, 5), opponent: Math.min(rules.elixirMax, 5) },
    hand: { player: [], opponent: [] },
    deck: { player: playerDeck, opponent: enemyDeck },
    towers: [...makeTowers(rules, "player"), ...makeTowers(rules, "opponent")],
    units: [],
    crowns: { player: 0, opponent: 0 },
    log: [],
    aiCooldown: 3000,
  };
  drawHand(state, "player");
  drawHand(state, "opponent");
  pushLog(state, "info", "即时对战开始：圣水会随时间回复，摧毁对方国王塔即可获胜。");
  return state;
}

function towerAt(state: RtState, side: RtSide, lane: number | "king"): RtTower | undefined {
  return state.towers.find(
    (tower) => tower.side === side && tower.lane === lane && tower.alive,
  );
}

/** 该方在当前兵线上还可被攻击的塔（普通塔优先，双塔倒后才轮到国王塔）。 */
function targetableTowers(state: RtState, side: RtSide, lane: number): RtTower[] {
  const enemy = other(side);
  const laneTower = towerAt(state, enemy, lane);
  if (laneTower) return [laneTower];
  const king = towerAt(state, enemy, "king");
  return king ? [king] : [];
}

function damageTower(
  state: RtState,
  tower: RtTower,
  amount: number,
  attackerSide: RtSide,
): void {
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
      `${sideName(attackerSide)}摧毁了国王塔，战斗结束。`,
    );
    return;
  }
  state.crowns[attackerSide] += 1;
  const label = live.lane === 0 ? "左路" : "右路";
  pushLog(
    state,
    attackerSide === "player" ? "good" : "bad",
    `${sideName(attackerSide)}推掉了${sideName(live.side)}${label}防御塔。`,
  );
}

function nearestEnemyUnit(
  state: RtState,
  unit: RtUnit,
): RtUnit | undefined {
  const range = unit.card.range ?? 0.8;
  let best: RtUnit | undefined;
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

function nearestTowerInRange(state: RtState, unit: RtUnit): RtTower | undefined {
  const range = unit.card.range ?? 0.8;
  let best: RtTower | undefined;
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

function removeDead(state: RtState): void {
  const survivors: RtUnit[] = [];
  for (const unit of state.units) {
    if (unit.hp > 0) {
      survivors.push(unit);
      continue;
    }
    pushLog(
      state,
      unit.side === "player" ? "bad" : "good",
      `${unit.card.name}被击倒。`,
    );
  }
  state.units = survivors;
}

export function tick(state: RtState, deltaMs: number): RtState {
  if (state.winner) return state;
  const dt = Math.max(0, Math.min(500, deltaMs));
  if (dt === 0) return state;
  const next = clone(state);
  next.timeMs += dt;

  // 圣水回复
  for (const side of ["player", "opponent"] as RtSide[]) {
    const gain = dt / Math.max(300, next.rules.elixirRegenMs);
    next.elixir[side] = Math.min(next.rules.elixirMax, next.elixir[side] + gain);
  }

  // 单位移动与攻击
  for (const unit of next.units) {
    if (unit.hp <= 0) continue;
    unit.cooldown = Math.max(0, unit.cooldown - dt);
    const target = nearestEnemyUnit(next, unit);
    if (target) {
      if (unit.cooldown <= 0) {
        target.hp = Math.max(0, target.hp - unit.card.attack);
        unit.cooldown = Math.max(200, unit.card.attackIntervalMs ?? 1000);
      }
      continue;
    }
    const tower = nearestTowerInRange(next, unit);
    if (tower) {
      if (unit.cooldown <= 0) {
        damageTower(next, tower, unit.card.attack, unit.side);
        unit.cooldown = Math.max(200, unit.card.attackIntervalMs ?? 1000);
      }
      continue;
    }
    const dir = unit.side === "player" ? 1 : -1;
    const speed = Math.max(0.2, unit.card.moveSpeed ?? 1.2);
    unit.x = Math.max(0, Math.min(10, unit.x + (dir * speed * dt) / 1000));
  }

  // 塔攻击范围内最近的敌方单位
  for (const tower of next.towers) {
    if (!tower.alive) continue;
    tower.cooldown = Math.max(0, tower.cooldown - dt);
    if (tower.cooldown > 0) continue;
    const range = tower.lane === "king" ? 7 : 6.5;
    let target: RtUnit | undefined;
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
    tower.cooldown = 1000;
  }

  removeDead(next);

  // AI 出兵
  if (next.rules.aiEnabled && !next.winner) {
    next.aiCooldown -= dt;
    if (next.aiCooldown <= 0) {
      const playable = next.hand.opponent
        .map((card, index) => ({ card, index }))
        .filter((item) => item.card.cost <= next.elixir.opponent)
        .sort((a, b) => b.card.cost - a.card.cost);
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

  // 时间到：按皇冠数、再按国王塔血量判定
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

export function deploy(
  state: RtState,
  side: RtSide,
  handIndex: number,
  lane: number,
): RtResult {
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
    cooldown: 300,
  });
  pushLog(
    next,
    side === "player" ? "good" : "bad",
    `${sideName(side)}在${laneIndex === 0 ? "左路" : "右路"}部署了${card.name}。`,
  );
  return { state: next, ok: true };
}

/** UI 用：某条兵线上、按位置排序的单位。 */
export function unitsOnLane(state: RtState, lane: number): RtUnit[] {
  return state.units
    .filter((unit) => unit.lane === lane)
    .sort((a, b) => a.x - b.x);
}

export function towerOf(state: RtState, side: RtSide, lane: number | "king"): RtTower | undefined {
  return state.towers.find((tower) => tower.side === side && tower.lane === lane);
}
