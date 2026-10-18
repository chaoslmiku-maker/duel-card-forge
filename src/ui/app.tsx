import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useExtensionContext, type ExtensionProps, type SaveAPI } from "@avg-studio/sdk";
import {
  DEFAULT_RULES,
  makeId,
  normalizeCards,
  normalizeRules,
  type CardDefinition,
  type DeckEntry,
  type DuelRules,
} from "../types";
import { STARTER_CARDS, STARTER_DECK } from "../data/starter-cards";
import {
  getDuelState,
  getRealtimeState,
  getSkirmishState,
  setCachedDeck,
  setDuelState,
  setPanelOpen,
  setRealtimeState,
  setSkirmishState,
  subscribeDuelState,
} from "../state/duel-store";
import {
  activateSpell,
  changePosition,
  declareAttack,
  endTurn,
  setTrap,
  startBattlePhase,
  startDuel,
  summonMonster,
  type DuelResult,
  type MonsterPosition,
  evolveMonster,
} from "../engine/duel-engine";
import {
  deploy,
  startRealtime,
  tick,
} from "../engine/realtime-engine";
import {
  playCard as playSkirmishCard,
  startSkirmish,
  tick as tickSkirmish,
  weaponAttack,
} from "../engine/skirmish-engine";
import { BattleBoard } from "./battle-board";
import { RealtimeBoard } from "./realtime-board";
import { SkirmishBoard } from "./skirmish-board";
import { CardEditor } from "./card-editor";
import { DeckBuilder } from "./deck-builder";
import { RulesEditor } from "./rules-editor";
import { Btn } from "./kit";
import { colors, radius } from "./theme";

export interface DuelAppProps extends ExtensionProps {
  save: SaveAPI<{
    deck: readonly DeckEntry[];
    wins: number;
    losses: number;
  }>;
}

type TabId = "cards" | "deck" | "rules" | "battle";

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "cards", label: "卡牌库" },
  { id: "deck", label: "卡组" },
  { id: "rules", label: "规则" },
  { id: "battle", label: "对战" },
];

export function DuelApp(props: DuelAppProps): React.ReactElement {
  const ctx = useExtensionContext();

  // 宿主暂未接通 save.useValue / settings.useValue 的 React hook，
  // 这里统一用 get/set + subscribe + 本地 state，保证在任何宿主版本都能工作。
  const [cardsRaw, setCardsRaw] = useState<string | undefined>(() =>
    ctx.settings.get<string>("cardsJson"),
  );
  const [rulesRaw, setRulesRaw] = useState<string | undefined>(() =>
    ctx.settings.get<string>("rulesJson"),
  );

  useEffect(() => {
    const subscribeText = (
      key: string,
      apply: (value: string | undefined) => void,
    ): (() => void) => {
      try {
        const off = ctx.settings.subscribe<string>(key, (next) =>
          apply(typeof next === "string" ? next : ""),
        );
        return typeof off === "function" ? off : () => undefined;
      } catch {
        return () => undefined;
      }
    };
    const offCards = subscribeText("cardsJson", setCardsRaw);
    const offRules = subscribeText("rulesJson", setRulesRaw);
    return () => {
      offCards();
      offRules();
    };
  }, [ctx]);

  const [deck, setDeckState] = useState<readonly DeckEntry[]>(
    () => props.save.get("deck") ?? [],
  );
  const [wins, setWinsState] = useState<number>(() => props.save.get("wins") ?? 0);
  const [losses, setLossesState] = useState<number>(
    () => props.save.get("losses") ?? 0,
  );

  const setDeck = (next: readonly DeckEntry[]) => {
    setDeckState(next);
    try {
      props.save.set("deck", next);
    } catch {
      /* 宿主未接通时只保留内存态 */
    }
  };
  const setWins = (next: number) => {
    setWinsState(next);
    try {
      props.save.set("wins", next);
    } catch {
      /* 同上 */
    }
  };
  const setLosses = (next: number) => {
    setLossesState(next);
    try {
      props.save.set("losses", next);
    } catch {
      /* 同上 */
    }
  };

  // 把玩家卡组同步给共享 store，剧情 Block 开战时才能用上玩家自己组的牌。
  useEffect(() => {
    setCachedDeck(deck);
  }, [deck]);

  // 面板可见性：剧情「开始战斗」等待结果时，玩家中途关面板要能中止等待。
  useEffect(() => {
    setPanelOpen(true);
    return () => setPanelOpen(false);
  }, []);

  const [tab, setTab] = useState<TabId>("cards");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const duel = useSyncExternalStore(
    subscribeDuelState,
    getDuelState,
    getDuelState,
  );
  const realtime = useSyncExternalStore(
    subscribeDuelState,
    getRealtimeState,
    getRealtimeState,
  );
  const skirmish = useSyncExternalStore(
    subscribeDuelState,
    getSkirmishState,
    getSkirmishState,
  );

  const cardsState = useMemo<{ list: CardDefinition[]; error: string | null }>(() => {
    if (!cardsRaw) return { list: STARTER_CARDS, error: null };
    try {
      return { list: normalizeCards(JSON.parse(cardsRaw) as unknown), error: null };
    } catch {
      return {
        list: STARTER_CARDS,
        error: "卡牌库 JSON 解析失败，已回退到内置示例卡。",
      };
    }
  }, [cardsRaw]);
  const cards = cardsState.list;

  const rulesState = useMemo<{ value: DuelRules; error: string | null }>(() => {
    if (!rulesRaw) return { value: DEFAULT_RULES, error: null };
    try {
      return {
        value: normalizeRules(JSON.parse(rulesRaw) as unknown),
        error: null,
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

  const persistCards = (next: CardDefinition[]) => {
    const raw = JSON.stringify(next, null, 2);
    setCardsRaw(raw);
    try {
      ctx.settings.set("cardsJson", raw);
    } catch {
      /* 宿主未接通时只保留内存态 */
    }
  };

  const persistRules = (next: DuelRules) => {
    const raw = JSON.stringify(next, null, 2);
    setRulesRaw(raw);
    try {
      ctx.settings.set("rulesJson", raw);
    } catch {
      /* 同上 */
    }
  };

  const updateCard = (card: CardDefinition) => {
    persistCards(cards.map((item) => (item.id === card.id ? card : item)));
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
        keywords: [],
      },
    ])[0];
    if (!base) return;
    const card: CardDefinition = { ...base, id: makeId("card") };
    persistCards([...cards, card]);
    setSelectedCardId(card.id);
  };

  const duplicateCard = (id: string) => {
    const source = cards.find((card) => card.id === id);
    if (!source) return;
    const copy: CardDefinition = {
      ...source,
      id: makeId("card"),
      name: `${source.name} 副本`,
      effects: source.effects.map((effect) => ({ ...effect, id: makeId("eff") })),
      keywords: [...source.keywords],
    };
    persistCards([...cards, copy]);
    setSelectedCardId(copy.id);
  };

  const deleteCard = (id: string) => {
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
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "duel-cards.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`已导出 ${cards.length} 张卡牌。`);
  };

  const importCards = (text: string): string | null => {
    try {
      const parsed = JSON.parse(text) as unknown;
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
  const deckValid =
    deckTotal > 0 &&
    deckTotal >= rules.deckMinSize &&
    deck.every((entry) => cards.some((card) => card.id === entry.cardId));

  const run = (result: DuelResult) => {
    if (!result.ok && result.message) setNotice(result.message);
    const previousWinner = duel?.winner;
    setDuelState(result.state);
    if (result.state.winner && !previousWinner) {
      if (result.state.winner === "player") setWins(wins + 1);
      else if (result.state.winner === "opponent") setLosses(losses + 1);
    }
  };

  const startRealtimeBattle = () => {
    const validDeck = deck.filter((entry) =>
      cards.some((card) => card.id === entry.cardId),
    );
    if (validDeck.length === 0) {
      setNotice("卡组为空，先到「卡组」页准备卡组。");
      return;
    }
    setRealtimeState(startRealtime(cards, validDeck, rules));
  };

  const startSkirmishBattle = () => {
    const validDeck = deck.filter((entry) =>
      cards.some((card) => card.id === entry.cardId),
    );
    if (validDeck.length === 0) {
      setNotice("卡组为空，先到「卡组」页准备卡组。");
      return;
    }
    setSkirmishState(startSkirmish(cards, validDeck, rules));
  };

  const handleStart = () => {
    const validDeck = deck.filter((entry) =>
      cards.some((card) => card.id === entry.cardId),
    );
    if (validDeck.length === 0) {
      setNotice("卡组为空，先到「卡组」页准备卡组。");
      return;
    }
    if (rules.battleMode === "realtime") {
      setRealtimeState(startRealtime(cards, validDeck, rules));
      return;
    }
    if (rules.battleMode === "skirmish") {
      setSkirmishState(startSkirmish(cards, validDeck, rules));
      return;
    }
    setDuelState(startDuel(cards, validDeck, rules));
  };

  const handleSkirmishTick = (deltaMs: number) => {
    const current = getSkirmishState();
    if (!current || current.winner) return;
    setSkirmishState(tickSkirmish(current, deltaMs));
  };

  const handleSkirmishPlay = (handIndex: number) => {
    const current = getSkirmishState();
    if (!current) return;
    const result = playSkirmishCard(current, "player", handIndex);
    if (!result.ok) {
      if (result.message) setNotice(result.message);
      return;
    }
    setSkirmishState(result.state);
  };

  const handleSkirmishWeapon = (targetUid: string | null) => {
    const current = getSkirmishState();
    if (!current) return;
    const result = weaponAttack(current, "player", targetUid);
    if (!result.ok) {
      if (result.message) setNotice(result.message);
      return;
    }
    setSkirmishState(result.state);
  };

  const handleRealtimeTick = (deltaMs: number) => {
    const currentRt = getRealtimeState();
    if (!currentRt || currentRt.winner) return;
    setRealtimeState(tick(currentRt, deltaMs));
  };

  const handleRealtimeDeploy = (handIndex: number, lane: number) => {
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
  const effectiveSelectedId =
    selectedCardId && currentCards.some((card) => card.id === selectedCardId)
      ? selectedCardId
      : (currentCards[0]?.id ?? null);

  return (
    <div className="dcf-root" style={rootStyle}>
      <style>{globalCss}</style>

      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: colors.goldSoft, letterSpacing: 1 }}>
            决斗卡牌工坊
          </span>
          <span style={{ fontSize: 11, color: colors.faint }}>
            可视化编辑卡牌与规则
          </span>
        </div>

        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              style={{
                padding: "6px 14px",
                borderRadius: radius.sm,
                border: `1px solid ${tab === item.id ? colors.gold : colors.borderSoft}`,
                background: tab === item.id ? "rgba(231,196,106,0.14)" : colors.panel2,
                color: tab === item.id ? colors.gold : colors.muted,
                fontSize: 12.5,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: colors.faint }}>
          <span>卡牌 {cards.length}</span>
          <span>卡组 {deckTotal} 张</span>
          <span>
            战绩 {wins} 胜 / {losses} 负
          </span>
          <Btn size="sm" onClick={handleStart} variant="gold">
            快速开始决斗
          </Btn>
        </div>
      </header>

      {parseError ? (
        <div
          style={{
            marginBottom: 8,
            fontSize: 11.5,
            color: colors.gold,
            border: `1px solid ${colors.gold}`,
            background: "rgba(231,196,106,0.08)",
            borderRadius: radius.sm,
            padding: "6px 10px",
          }}
        >
          {parseError}
        </div>
      ) : null}

      <main style={{ flex: 1, minHeight: 0 }}>
        {tab === "cards" ? (
          <CardEditor
            cards={cards}
            selectedId={effectiveSelectedId}
            onSelect={setSelectedCardId}
            onChange={updateCard}
            onAdd={addCard}
            onDuplicate={duplicateCard}
            onDelete={deleteCard}
            onExport={exportCards}
            onImportText={importCards}
          />
        ) : null}

        {tab === "deck" ? (
          <DeckBuilder
            cards={cards}
            deck={deck}
            rules={rules}
            onChange={(next) => setDeck(next)}
            onReset={() => setDeck(STARTER_DECK)}
          />
        ) : null}

        {tab === "rules" ? (
          <RulesEditor
            rules={rules}
            onChange={persistRules}
            onReset={() => persistRules(DEFAULT_RULES)}
          />
        ) : null}

        {tab === "battle" ? (
          rules.battleMode === "realtime" ? (
            <RealtimeBoard
              state={realtime}
              deckCount={deckTotal}
              deckValid={deckValid}
              onStart={startRealtimeBattle}
              onTick={handleRealtimeTick}
              onDeploy={handleRealtimeDeploy}
              onExit={() => setRealtimeState(null)}
            />
          ) : rules.battleMode === "skirmish" ? (
            <SkirmishBoard
              state={skirmish}
              rules={rules}
              deckCount={deckTotal}
              deckValid={deckValid}
              onStart={startSkirmishBattle}
              onTick={handleSkirmishTick}
              onPlay={handleSkirmishPlay}
              onWeaponAttack={handleSkirmishWeapon}
              onExit={() => setSkirmishState(null)}
            />
          ) : (
            <BattleBoard
              state={duel}
              deckCount={deckTotal}
              deckValid={deckValid}
              wins={wins}
              losses={losses}
              onStart={handleStart}
              onSummon={(handUid, position, tributes) =>
                run(summonMonster(duel!, handUid, position as MonsterPosition, tributes))
              }
              onActivateSpell={(handUid) => run(activateSpell(duel!, handUid))}
              onSetTrap={(handUid) => run(setTrap(duel!, handUid))}
              onAttack={(attackerUid, targetUid) =>
                run(declareAttack(duel!, attackerUid, targetUid))
              }
              onChangePosition={(uid) => run(changePosition(duel!, uid))}
              onStartBattle={() => run(startBattlePhase(duel!))}
              onEndTurn={() => run(endTurn(duel!))}
              onEvolve={(uid) => run(evolveMonster(duel!, uid))}
              onExit={() => setDuelState(null)}
            />
          )
        ) : null}
      </main>

      {notice ? (
        <div
          style={{
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
            whiteSpace: "nowrap",
          }}
        >
          {notice}
        </div>
      ) : null}
    </div>
  );
}

const rootStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  minHeight: 560,
  boxSizing: "border-box",
  padding: 12,
  display: "flex",
  flexDirection: "column",
  background: colors.bg,
  color: colors.text,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  overflow: "hidden",
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
