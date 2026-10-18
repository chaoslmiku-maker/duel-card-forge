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
import { RealtimeBoard } from "../src/ui/realtime-board";
import { STARTER_CARDS, STARTER_DECK } from "../src/data/starter-cards";
import { DEFAULT_RULES, type DeckEntry } from "../src/types";
import {
  startDuel,
  type DuelState,
  type MonsterPosition,
} from "../src/engine/duel-engine";
import { startRealtime, type RtState } from "../src/engine/realtime-engine";
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
      onEvolve={noop}
      onExit={noop}
    />
  );
}

function DemoRealtime(): React.ReactElement {
  const state = React.useMemo<RtState>(() => {
    const rules = {
      ...DEFAULT_RULES,
      battleMode: "realtime" as const,
      elixirMax: 10,
      aiEnabled: false,
      elixirRegenMs: 2800,
    };
    const base = startRealtime(STARTER_CARDS, STARTER_DECK, rules);
    const card = (index: number) => STARTER_CARDS[index];
    return {
      ...base,
      elixir: { player: 7, opponent: 4 },
      timeMs: 52000,
      crowns: { player: 1, opponent: 0 },
      hand: {
        player: [card(0), card(2), card(13), card(16)],
        opponent: [card(3), card(4), card(6), card(9)],
      },
      towers: base.towers.map((tower) =>
        tower.side === "opponent" && tower.lane === 1
          ? { ...tower, alive: false, hp: 0 }
          : tower.side === "opponent" && tower.lane === 0
            ? { ...tower, hp: 720 }
            : tower,
      ),
      units: [
        {
          uid: "rt_p1",
          side: "player",
          lane: 0,
          card: card(0),
          hp: 2400,
          maxHp: 2500,
          x: 5.4,
          cooldown: 0,
        },
        {
          uid: "rt_p2",
          side: "player",
          lane: 1,
          card: card(3),
          hp: 900,
          maxHp: 1200,
          x: 7.6,
          cooldown: 0,
        },
        {
          uid: "rt_e1",
          side: "opponent",
          lane: 0,
          card: card(4),
          hp: 1100,
          maxHp: 1500,
          x: 4.2,
          cooldown: 0,
        },
        {
          uid: "rt_e2",
          side: "opponent",
          lane: 1,
          card: card(2),
          hp: 1800,
          maxHp: 2000,
          x: 6.1,
          cooldown: 0,
        },
      ],
      log: [
        { id: "r1", tone: "info", text: "即时对战开始：圣水会随时间回复。" },
        { id: "r2", tone: "good", text: "你推掉了对手右路防御塔。" },
      ],
    };
  }, []);

  const noop = () => undefined;
  return (
    <div style={{ padding: 12, height: "100%", boxSizing: "border-box" }}>
      <RealtimeBoard
        state={state}
        deckCount={36}
        deckValid
        onStart={noop}
        onTick={noop}
        onDeploy={noop}
        onExit={noop}
      />
    </div>
  );
}

function DemoSV(): React.ReactElement {
  const state = React.useMemo<DuelState>(() => {
    const rules = {
      ...DEFAULT_RULES,
      battleMode: "shadowverse" as const,
      startingLp: 20,
      energyStart: 6,
      energyMax: 10,
      monsterZones: 5,
      spellZones: 0,
      aiEnabled: false,
      evolvePoints: 2,
    };
    const base = startDuel(STARTER_CARDS, STARTER_DECK, rules);
    const card = (index: number) => STARTER_CARDS[index];
    const follower = (
      uid: string,
      index: number,
      x: string,
      hp: number,
    ) => ({
      uid,
      card: card(index),
      position: "attack" as const,
      atkMod: 0,
      defMod: 0,
      tempAtk: 0,
      tempDef: 0,
      attacksUsed: 0,
      changedPosition: false,
      damage: hp,
      evolved: false,
    });
    return {
      ...base,
      turn: 4,
      phase: "battle",
      attackLocked: false,
      player: {
        ...base.player,
        lp: 16,
        energy: 6,
        monsters: [
          follower("sv_p1", 0, "a", 0),
          follower("sv_p2", 4, "b", 900),
          null,
          null,
          null,
        ],
        hand: [12, 13, 14, 9].map((index, i) => ({
          uid: `sv_h${i}`,
          card: card(index),
        })),
      },
      opponent: {
        ...base.opponent,
        lp: 12,
        monsters: [
          follower("sv_e1", 5, "c", 600),
          follower("sv_e2", 7, "d", 300),
          null,
          null,
          null,
        ],
      },
      log: [
        { id: "s1", tone: "info", text: "影之诗模式：主战者 20 生命。" },
        { id: "s2", tone: "good", text: "你进化了 苍蓝星龙（+2/+2）。" },
      ],
    };
  }, []);

  const noop = () => undefined;
  return (
    <div style={{ padding: 12, height: "100%", boxSizing: "border-box" }}>
      <BattleBoard
        state={state}
        deckCount={36}
        deckValid
        wins={0}
        losses={0}
        onStart={noop}
        onSummon={noop}
        onActivateSpell={noop}
        onSetTrap={noop}
        onAttack={noop}
        onChangePosition={noop}
        onStartBattle={noop}
        onEndTurn={noop}
        onEvolve={noop}
        onExit={noop}
      />
    </div>
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

type View = "app" | "battle" | "deck" | "rules" | "realtime" | "sv";

function readView(): View {
  const hash = window.location.hash.replace(/^#/, "");
  return hash === "battle" ||
    hash === "deck" ||
    hash === "rules" ||
    hash === "realtime" ||
    hash === "sv"
    ? hash
    : "app";
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
      ) : view === "realtime" ? (
        <DemoRealtime />
      ) : view === "sv" ? (
        <DemoSV />
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
