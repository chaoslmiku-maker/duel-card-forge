/**
 * 浏览器预览入口：不依赖 Studio，直接用假上下文渲染真实扩展 UI。
 * 访问 index.html 看卡牌库；index.html#battle 看对战界面。
 */
import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { DuelApp } from "../src/ui/app";
import { BattleBoard } from "../src/ui/battle-board";
import { DeckBuilder } from "../src/ui/deck-builder";
import { RulesEditor } from "../src/ui/rules-editor";
import { STARTER_CARDS, STARTER_DECK } from "../src/data/starter-cards";
import { DEFAULT_RULES, type DeckEntry } from "../src/types";
import {
  startDuel,
  type DuelState,
  type MonsterPosition,
} from "../src/engine/duel-engine";
import { PreviewProvider, type PreviewContext } from "./sdk-shim";

const settingsStore: Record<string, string> = { cardsJson: "", rulesJson: "" };
const saveStore = { deck: STARTER_DECK as DeckEntry[], wins: 3, losses: 2 };

function useStoreValue<T>(
  read: () => T,
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(read);
  return [
    value,
    (next: T) => {
      setValue(next);
    },
  ];
}

const context: PreviewContext = {
  settings: {
    get: (key) => settingsStore[key],
    set: (key, value) => {
      settingsStore[key] = String(value ?? "");
    },
    snapshot: () => ({ ...settingsStore }),
    useValue: <T,>(key: string) => {
      const [value, setValue] = useStoreValue<T>(() => settingsStore[key] as unknown as T);
      return [
        value,
        (next: T) => {
          settingsStore[key] = String(next ?? "");
          setValue(next);
        },
      ] as [T | undefined, (value: T) => void];
    },
    useSnapshot: () => settingsStore as unknown as Record<string, unknown>,
    subscribe: () => () => undefined,
    cross: {
      get: () => undefined,
      set: () => undefined,
      subscribe: () => () => undefined,
    },
  },
  asset: { resolve: (uri) => ({ url: uri }) },
};

function makeSaveApi(): {
  get(key: string): unknown;
  set(key: string, value: unknown): void;
  useValue<T>(key: string): [T, (value: T) => void];
} {
  return {
    get: (key) => (saveStore as Record<string, unknown>)[key],
    set: (key, value) => {
      (saveStore as Record<string, unknown>)[key] = value;
    },
    useValue: <T,>(key: string) => {
      const [value, setValue] = useStoreValue<T>(() => (saveStore as Record<string, unknown>)[key] as T);
      return [
        value,
        (next: T) => {
          (saveStore as Record<string, unknown>)[key] = next;
          setValue(next);
        },
      ] as [T, (value: T) => void];
    },
  };
}

function DemoBattle(): React.ReactElement {
  const state = React.useMemo<DuelState>(() => {
    let duel = startDuel(STARTER_CARDS, STARTER_DECK, DEFAULT_RULES);
    duel.player.energy = 8;
    duel.opponent.energy = 7;
    duel.player.hand = [
      ...duel.player.hand.slice(0, 3),
      { uid: "demo_h1", card: STARTER_CARDS[0] },
      { uid: "demo_h2", card: STARTER_CARDS[4] },
      { uid: "demo_h3", card: STARTER_CARDS[13] },
    ];
    const playerMonsters = STARTER_CARDS.filter((card) => card.kind === "monster").slice(0, 2);
    duel.player.monsters = [
      {
        uid: "demo_p1",
        card: playerMonsters[0],
        position: "attack",
        atkMod: 0,
        defMod: 0,
        tempAtk: 0,
        tempDef: 0,
        attacksUsed: 0,
        changedPosition: false,
      },
      {
        uid: "demo_p2",
        card: playerMonsters[1],
        position: "defense",
        atkMod: 0,
        defMod: 0,
        tempAtk: 0,
        tempDef: 0,
        attacksUsed: 0,
        changedPosition: false,
      },
      null,
    ];
    const enemyMonsters = STARTER_CARDS.filter((card) => card.kind === "monster").slice(2, 4);
    duel.opponent.monsters = [
      {
        uid: "demo_e1",
        card: enemyMonsters[0],
        position: "attack",
        atkMod: 0,
        defMod: 0,
        tempAtk: 0,
        tempDef: 0,
        attacksUsed: 0,
        changedPosition: false,
      },
      {
        uid: "demo_e2",
        card: enemyMonsters[1],
        position: "defense",
        atkMod: 0,
        defMod: 0,
        tempAtk: 0,
        tempDef: 0,
        attacksUsed: 0,
        changedPosition: false,
      },
      null,
    ];
    duel.opponent.traps = [
      { uid: "demo_t1", card: STARTER_CARDS[15] },
      null,
    ];
    duel.opponent.lp = 6200;
    duel.player.lp = 7400;
    duel.opponent.hand = duel.opponent.hand.slice(0, 4);
    duel.phase = "battle";
    duel.attackLocked = false;
    duel.log = [
      { id: "l1", tone: "info", text: "决斗开始！" },
      { id: "l2", tone: "good", text: "你召唤了 苍蓝星龙（攻击表示）。" },
      { id: "l3", tone: "info", text: "苍蓝星龙 的效果造成 600 点伤害。" },
      { id: "l4", tone: "bad", text: "对手盖放了一张陷阱卡。" },
      { id: "l5", tone: "good", text: "你用 铁壁守卫 发起攻击。" },
    ];
    return duel;
  }, []);

  const noop = () => undefined;
  return (
    <BattleBoard
      state={state}
      deckCount={37}
      deckValid
      wins={saveStore.wins}
      losses={saveStore.losses}
      onStart={noop}
      onSummon={(_uid: string, _position: MonsterPosition) => undefined}
      onActivateSpell={noop}
      onSetTrap={noop}
      onAttack={noop}
      onChangePosition={noop}
      onStartBattle={noop}
      onEndTurn={noop}
      onExit={noop}
    />
  );
}

function DeckDemo(): React.ReactElement {
  return (
    <div style={{ padding: 12, height: "100%", boxSizing: "border-box" }}>
      <DeckBuilder
        cards={STARTER_CARDS}
        deck={STARTER_DECK}
        rules={DEFAULT_RULES}
        onChange={() => undefined}
        onReset={() => undefined}
      />
    </div>
  );
}

function RulesDemo(): React.ReactElement {
  return (
    <div style={{ padding: 12, height: "100%", boxSizing: "border-box" }}>
      <RulesEditor
        rules={DEFAULT_RULES}
        onChange={() => undefined}
        onReset={() => undefined}
      />
    </div>
  );
}

type View = "app" | "battle" | "deck" | "rules";

function readView(): View {
  const hash = window.location.hash.replace(/^#/, "");
  return hash === "battle" || hash === "deck" || hash === "rules" ? hash : "app";
}

function Root(): React.ReactElement {
  const [view, setView] = React.useState<View>(readView);
  React.useEffect(() => {
    const onHash = () => setView(readView());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  return (
    <PreviewProvider context={context}>
      {view === "battle" ? (
        <DemoBattle />
      ) : view === "deck" ? (
        <DeckDemo />
      ) : view === "rules" ? (
        <RulesDemo />
      ) : (
        <DuelApp save={makeSaveApi()} />
      )}
    </PreviewProvider>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<Root />);
}
