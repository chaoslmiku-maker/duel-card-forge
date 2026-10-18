/**
 * 对战状态的共享存储。
 *
 * 面板 UI 与剧情 Block 跑在不同的执行环境里：UI 是 React 组件，Block 是剧本运行时。
 * 两者都要读写同一场决斗，所以用一个模块级的可订阅存储做单一数据源：
 *   - 面板用 useSyncExternalStore 订阅；
 *   - Block 用 get/set 直接改，改完面板立刻重渲染。
 *
 * 一个扩展实例内只有一场决斗；重新开始/离开时把状态置为 null。
 *
 * 另外缓存两份 UI 侧信息，供拿不到 this.save 的 Block 使用：
 *   - cachedDeck：玩家当前卡组（面板读取/修改时同步）；
 *   - panelOpen：面板是否可见（用于判断剧情等待战斗时玩家是否中途关掉了面板）。
 */
import type { DuelState } from "../engine/duel-engine";
import type { RtState } from "../engine/realtime-engine";
import type { SkState } from "../engine/skirmish-engine";
import type { DeckEntry } from "../types";

let currentState: DuelState | null = null;
let realtimeState: RtState | null = null;
let skirmishState: SkState | null = null;
let panelOpen = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch (error) {
      console.warn("[duel-store] listener 执行失败", error);
    }
  }
}

export function getDuelState(): DuelState | null {
  return currentState;
}

export function setDuelState(next: DuelState | null): void {
  currentState = next;
  if (next) {
    realtimeState = null;
    skirmishState = null;
  }
  notify();
}

export function subscribeDuelState(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 即时对战状态（与回合制互斥：开始其中一种时会清空另一种）。 */
export function getRealtimeState(): RtState | null {
  return realtimeState;
}

export function setRealtimeState(next: RtState | null): void {
  realtimeState = next;
  if (next) {
    currentState = null;
    skirmishState = null;
  }
  notify();
}

/** 半即时对战状态。 */
export function getSkirmishState(): SkState | null {
  return skirmishState;
}

export function setSkirmishState(next: SkState | null): void {
  skirmishState = next;
  if (next) {
    currentState = null;
    realtimeState = null;
  }
  notify();
}

/** 面板挂载/卸载时更新；剧情 Block 用它判断玩家有没有中途关掉面板。 */
export function setPanelOpen(open: boolean): void {
  if (panelOpen === open) return;
  panelOpen = open;
  notify();
}

export function isPanelOpen(): boolean {
  return panelOpen;
}

/** 面板最近一次读到的玩家卡组（来自存档）。 */
let cachedDeck: readonly DeckEntry[] = [];

export function setCachedDeck(deck: readonly DeckEntry[]): void {
  cachedDeck = deck;
}

export function getCachedDeck(): readonly DeckEntry[] {
  return cachedDeck;
}
