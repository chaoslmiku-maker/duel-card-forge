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
 * 另外缓存一份「玩家当前卡组」：Block 拿不到 Extension 实例的 this.save，
 * 所以由面板在读取/修改卡组时同步过来，剧情开战时用它组牌。
 */
import type { DuelState } from "../engine/duel-engine";
import type { DeckEntry } from "../types";

let currentState: DuelState | null = null;
const listeners = new Set<() => void>();

export function getDuelState(): DuelState | null {
  return currentState;
}

export function setDuelState(next: DuelState | null): void {
  currentState = next;
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch (error) {
      console.warn("[duel-store] listener 执行失败", error);
    }
  }
}

export function subscribeDuelState(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** 面板最近一次读到的玩家卡组（来自存档）。 */
let cachedDeck: readonly DeckEntry[] = [];

export function setCachedDeck(deck: readonly DeckEntry[]): void {
  cachedDeck = deck;
}

export function getCachedDeck(): readonly DeckEntry[] {
  return cachedDeck;
}
