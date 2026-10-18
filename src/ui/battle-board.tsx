import React, { useEffect, useRef, useState } from "react";
import type { CardDefinition } from "../types";
import {
  effectiveAttack,
  effectiveDefense,
  monsterHealth,
  summonBlocker,
  tributeRequirement,
  type DuelSide,
  type DuelState,
  type FieldMonster,
  type MonsterPosition,
} from "../engine/duel-engine";
import { CardFrame } from "./card-frame";
import { Btn, Panel, StatBar } from "./kit";
import { colors, radius } from "./theme";

export function BattleBoard(props: {
  state: DuelState | null;
  deckCount: number;
  deckValid: boolean;
  wins: number;
  losses: number;
  onStart: () => void;
  onSummon: (handUid: string, position: MonsterPosition, tributes: string[]) => void;
  onActivateSpell: (handUid: string) => void;
  onSetTrap: (handUid: string) => void;
  onAttack: (attackerUid: string, targetUid: string | null) => void;
  onChangePosition: (monsterUid: string) => void;
  onStartBattle: () => void;
  onEndTurn: () => void;
  onEvolve: (monsterUid: string) => void;
  onExit: () => void;
}): React.ReactElement {
  const { state } = props;
  const [selectedHand, setSelectedHand] = useState<string | null>(null);
  const [selectedMonster, setSelectedMonster] = useState<string | null>(null);
  const [attackMode, setAttackMode] = useState(false);
  const [pendingSummon, setPendingSummon] = useState<{
    handUid: string;
    position: MonsterPosition;
    need: number;
  } | null>(null);
  const [tributes, setTributes] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedHand(null);
    setSelectedMonster(null);
    setAttackMode(false);
    setPendingSummon(null);
    setTributes([]);
  }, [state?.turn]);

  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [state?.log.length]);

  if (!state) {
    return <StartScreen {...props} />;
  }

  const player = state.player;
  const opponent = state.opponent;
  const enemyHasMonsters = opponent.monsters.some((monster) => monster !== null);
  const myTurn = state.active === "player" && !state.winner;
  const shadowverse = state.rules.battleMode === "shadowverse";
  const handCard = selectedHand
    ? player.hand.find((card) => card.uid === selectedHand)?.card ?? null
    : null;
  const selectedMonsterObj = selectedMonster
    ? player.monsters.find((monster) => monster?.uid === selectedMonster) ?? null
    : null;

  const toggleTribute = (uid: string) => {
    if (!pendingSummon) return;
    setTributes((current) => {
      if (current.includes(uid)) return current.filter((item) => item !== uid);
      if (current.length >= pendingSummon.need) return current;
      return [...current, uid];
    });
  };

  const beginSummon = (position: MonsterPosition) => {
    if (!handCard || !selectedHand) return;
    const need = tributeRequirement(handCard, state.rules);
    if (need === 0) {
      props.onSummon(selectedHand, position, []);
      setSelectedHand(null);
      return;
    }
    setPendingSummon({ handUid: selectedHand, position, need });
    setTributes([]);
    setSelectedHand(null);
    setSelectedMonster(null);
  };

  const confirmSummon = () => {
    if (!pendingSummon) return;
    if (tributes.length !== pendingSummon.need) return;
    props.onSummon(pendingSummon.handUid, pendingSummon.position, tributes);
    setPendingSummon(null);
    setTributes([]);
  };

  const handleOwnMonsterClick = (monster: FieldMonster) => {
    if (pendingSummon) {
      toggleTribute(monster.uid);
      return;
    }
    if (selectedMonster === monster.uid) {
      setSelectedMonster(null);
      setAttackMode(false);
      return;
    }
    setSelectedMonster(monster.uid);
    setSelectedHand(null);
    setAttackMode(false);
  };

  const handleEnemyMonsterClick = (monster: FieldMonster) => {
    if (!attackMode || !selectedMonster) return;
    props.onAttack(selectedMonster, monster.uid);
    setAttackMode(false);
    setSelectedMonster(null);
  };

  const zoneSize: "sm" | "mini" = state.rules.monsterZones >= 5 ? "mini" : "sm";

  return (
    <div style={{ display: "flex", gap: 10, height: "100%", minHeight: 0 }}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          overflowY: "auto",
          paddingRight: 2,
        }}
      >
        {/* 对手 */}
        <SideStrip
          title="对手"
          side={opponent}
          tone="enemy"
          active={state.active === "opponent"}
          energyMax={state.rules.energyMax}
        />

        <ZoneRow
          label="对手场地"
          monsterZones={state.rules.monsterZones}
          trapZones={state.rules.spellZones}
          size={zoneSize}
          monsters={opponent.monsters}
          traps={opponent.traps}
          highlight={attackMode}
          shadowverse={shadowverse}
          onMonsterClick={handleEnemyMonsterClick}
        />

          <CenterBar
            state={state}
            myTurn={myTurn}
            onStartBattle={props.onStartBattle}
            onEndTurn={props.onEndTurn}
            onDirectAttack={() => {
              if (!selectedMonster) return;
              props.onAttack(selectedMonster, null);
              setAttackMode(false);
              setSelectedMonster(null);
            }}
            directAttackEnabled={
              shadowverse ||
              (state.rules.directAttackAllowed &&
                (!enemyHasMonsters ||
                  Boolean(
                    selectedMonsterObj?.card.keywords.includes("direct"),
                  )))
            }
            hasSelectedMonster={Boolean(selectedMonsterObj)}
            attackMode={attackMode}
            evolvePoints={shadowverse ? state.evolve.player : undefined}
          />

          <ZoneRow
            label="你的场地"
            monsterZones={state.rules.monsterZones}
            trapZones={state.rules.spellZones}
            size={zoneSize}
            monsters={player.monsters}
            traps={player.traps}
            highlight={Boolean(pendingSummon)}
            selectedUid={selectedMonster}
            shadowverse={shadowverse}
            tributeUids={tributes}
            onMonsterClick={(monster) => handleOwnMonsterClick(monster)}
          />

        <SideStrip
          title="你"
          side={player}
          tone="self"
          active={state.active === "player"}
          energyMax={state.rules.energyMax}
        />

        {/* 手牌与操作 */}
        <Panel
          title={`手牌 · ${player.hand.length}`}
        subtitle={
          state.winner
            ? "决斗已结束"
            : state.active === "player"
              ? state.phase === "main"
                ? "主要阶段：召唤怪兽、发动魔法、盖放陷阱"
                : "战斗阶段：选择怪兽攻击"
              : "对手回合…"
        }
        bodyStyle={{ padding: 8, display: "flex", flexDirection: "column", gap: 8 }}
      >
        {player.hand.length === 0 ? (
          <div style={{ fontSize: 11.5, color: colors.faint, padding: "10px 4px" }}>
            手牌为空。
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              paddingBottom: 2,
              minHeight: 176,
              alignItems: "flex-end",
            }}
          >
            {player.hand.map((instance) => {
              const card = instance.card;
              const blocker = myTurn ? summonBlocker(state, instance.uid) : null;
              const dimmed = myTurn && card.kind === "monster" && blocker !== null;
              return (
                <CardFrame
                  key={instance.uid}
                  card={card}
                  size="sm"
                  selected={selectedHand === instance.uid}
                  dimmed={dimmed}
                  onClick={() => {
                    if (pendingSummon) return;
                    setSelectedHand(selectedHand === instance.uid ? null : instance.uid);
                    setSelectedMonster(null);
                    setAttackMode(false);
                  }}
                />
              );
            })}
          </div>
        )}

        {/* 操作条 */}
        {pendingSummon ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "rgba(231,196,106,0.10)",
              border: `1px solid ${colors.gold}`,
              borderRadius: radius.md,
              padding: "8px 10px",
            }}
          >
            <span style={{ fontSize: 12, color: colors.goldSoft }}>
              祭品召唤：请选择 {pendingSummon.need} 只祭品（已选 {tributes.length}）
            </span>
            <div style={{ flex: 1 }} />
            <Btn
              size="sm"
              variant="gold"
              disabled={tributes.length !== pendingSummon.need}
              onClick={confirmSummon}
            >
              确认召唤
            </Btn>
            <Btn
              size="sm"
              disabled={false}
              onClick={() => {
                setPendingSummon(null);
                setTributes([]);
              }}
            >
              取消
            </Btn>
          </div>
        ) : selectedHand && handCard ? (
          <ActionBar
            card={handCard}
            canSummon={myTurn && summonBlocker(state, selectedHand) === null}
            canActivate={myTurn && state.phase === "main" && player.energy >= handCard.cost}
            onSummonAttack={() => beginSummon("attack")}
            onSummonDefense={() => beginSummon("defense")}
            onActivateSpell={() => {
              props.onActivateSpell(selectedHand);
              setSelectedHand(null);
            }}
            onSetTrap={() => {
              props.onSetTrap(selectedHand);
              setSelectedHand(null);
            }}
          />
        ) : selectedMonsterObj ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              background: colors.panel2,
              border: `1px solid ${colors.border}`,
              borderRadius: radius.md,
              padding: "8px 10px",
            }}
          >
            <span style={{ fontSize: 12, color: colors.text }}>
              {selectedMonsterObj.card.name}
              <span style={{ color: colors.faint, marginLeft: 6 }}>
                攻 {effectiveAttack(selectedMonsterObj)} /{" "}
                {shadowverse
                  ? `生命 ${monsterHealth(selectedMonsterObj)}`
                  : `守 ${effectiveDefense(selectedMonsterObj)}`}
                {shadowverse
                  ? selectedMonsterObj.evolved
                    ? " · 已进化"
                    : ""
                  : ` · ${selectedMonsterObj.position === "attack" ? "攻击表示" : "守备表示"}`}
              </span>
            </span>
            <div style={{ flex: 1 }} />
            {selectedMonsterObj.position === "attack" &&
            state.phase === "battle" &&
            myTurn &&
            !state.attackLocked &&
            selectedMonsterObj.attacksUsed < (selectedMonsterObj.card.keywords.includes("double") ? 2 : 1) ? (
              shadowverse ? (
                <>
                  <Btn
                    size="sm"
                    variant="gold"
                    onClick={() => {
                      props.onAttack(selectedMonsterObj.uid, null);
                      setSelectedMonster(null);
                    }}
                  >
                    攻击玩家
                  </Btn>
                  {enemyHasMonsters ? (
                    <Btn size="sm" onClick={() => setAttackMode(true)}>
                      攻击随从
                    </Btn>
                  ) : null}
                </>
              ) : (
                <Btn
                  size="sm"
                  variant="gold"
                  onClick={() => {
                    if (enemyHasMonsters) setAttackMode(true);
                    else {
                      props.onAttack(selectedMonsterObj.uid, null);
                      setSelectedMonster(null);
                    }
                  }}
                >
                  {enemyHasMonsters ? "选择攻击目标" : "直接攻击"}
                </Btn>
              )
            ) : null}
            {shadowverse ? (
              <Btn
                size="sm"
                variant="primary"
                disabled={
                  !myTurn ||
                  selectedMonsterObj.evolved ||
                  state.evolve.player <= 0
                }
                onClick={() => {
                  props.onEvolve(selectedMonsterObj.uid);
                  setSelectedMonster(null);
                }}
              >
                进化（剩余 {state.evolve.player}）
              </Btn>
            ) : (
              <Btn
                size="sm"
                onClick={() => {
                  props.onChangePosition(selectedMonsterObj.uid);
                  setSelectedMonster(null);
                }}
              >
                改变表示形式
              </Btn>
            )}
            <Btn size="sm" variant="quiet" onClick={() => setSelectedMonster(null)}>
              取消
            </Btn>
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: colors.faint }}>
            点击手牌查看可执行的操作；点击自己的怪兽可以攻击
            {shadowverse ? "或进化" : "或改变表示形式"}。
          </div>
        )}
      </Panel>
      </div>

      {/* 战斗日志 */}
      <Panel
        title="决斗记录"
        subtitle={`第 ${state.turn} 回合`}
        style={{ width: 264, flex: "0 0 264px", alignSelf: "stretch" }}
        bodyStyle={{ padding: 0, minHeight: 0, flex: 1, display: "flex" }}
      >
        <div
          ref={logRef}
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: 5,
            fontSize: 11.5,
            lineHeight: 1.5,
          }}
        >
          {state.log.slice(-120).map((entry) => (
            <div
              key={entry.id}
              style={{
                color:
                  entry.tone === "good"
                    ? colors.green
                    : entry.tone === "bad"
                      ? colors.red
                      : entry.tone === "warn"
                        ? colors.gold
                        : colors.muted,
              }}
            >
              {entry.text}
            </div>
          ))}
        </div>
      </Panel>

      {state.winner ? (
        <ResultOverlay
          winner={state.winner}
          onRestart={props.onStart}
          onExit={props.onExit}
          wins={props.wins}
          losses={props.losses}
        />
      ) : null}
    </div>
  );
}

function StartScreen(
  props: Parameters<typeof BattleBoard>[0],
): React.ReactElement {
  return (
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 20 }}>
      <Panel
        title="准备决斗"
        subtitle="规则与卡组来自「规则」「卡组」两页"
        style={{ width: 560 }}
        bodyStyle={{ display: "flex", flexDirection: "column", gap: 12 }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
          <Metric label="卡组张数" value={`${props.deckCount}`} tone={colors.gold} />
          <Metric label="胜场" value={`${props.wins}`} tone={colors.green} />
          <Metric label="败场" value={`${props.losses}`} tone={colors.red} />
        </div>
        {!props.deckValid ? (
          <div
            style={{
              fontSize: 12,
              color: colors.red,
              border: `1px solid ${colors.redSoft}`,
              background: "rgba(255,115,115,0.08)",
              borderRadius: 8,
              padding: "8px 10px",
              lineHeight: 1.6,
            }}
          >
            卡组为空或不满足规则要求，请先到「卡组」页准备一套卡组。
          </div>
        ) : (
          <div style={{ fontSize: 12, color: colors.muted, lineHeight: 1.7 }}>
            使用当前卡组与对手进行一场决斗。生命值归零或卡组抽空即分胜负。
            你也可以先到「规则」页调整生命值、能量、召唤次数与祭品规则。
          </div>
        )}
        <Btn variant="gold" onClick={props.onStart} disabled={!props.deckValid}>
          开始决斗
        </Btn>
      </Panel>
    </div>
  );
}

function Metric(props: { label: string; value: string; tone: string }): React.ReactElement {
  return (
    <div
      style={{
        background: colors.bgSoft,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 8,
        padding: "8px 10px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, color: props.tone }}>{props.value}</div>
      <div style={{ fontSize: 11, color: colors.faint, marginTop: 2 }}>{props.label}</div>
    </div>
  );
}

function SideStrip(props: {
  title: string;
  side: DuelSide;
  tone: "self" | "enemy";
  active: boolean;
  energyMax: number;
}): React.ReactElement {
  const { side, tone } = props;
  const accent = tone === "self" ? colors.blue : colors.red;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "150px minmax(0,1fr) 212px",
        gap: 12,
        alignItems: "center",
        background: colors.panel,
        border: `1px solid ${props.active ? accent : colors.borderSoft}`,
        borderRadius: radius.md,
        padding: "8px 12px",
      }}
    >
      <div>
        <div style={{ fontSize: 12.5, color: colors.text, fontWeight: 600 }}>
          {props.title}
          {props.active ? (
            <span style={{ marginLeft: 6, fontSize: 10.5, color: accent }}>● 行动中</span>
          ) : null}
        </div>
        <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2 }}>
          卡组 {side.deck.length} · 墓地 {side.graveyard.length} · 手牌 {side.hand.length}
        </div>
        {tone === "enemy" && side.hand.length > 0 ? (
          <div style={{ display: "flex", gap: 2, marginTop: 4, alignItems: "center" }}>
            {Array.from({ length: Math.min(side.hand.length, 8) }).map((_, index) => (
              <span
                key={index}
                style={{
                  width: 9,
                  height: 14,
                  borderRadius: 2,
                  border: `1px solid ${colors.purple}`,
                  background:
                    "repeating-linear-gradient(45deg,#3a2a52 0 3px,#2a1e3c 3px 6px)",
                }}
              />
            ))}
            {side.hand.length > 8 ? (
              <span style={{ fontSize: 10, color: colors.faint }}>
                +{side.hand.length - 8}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
      <StatBar
        label="生命值"
        value={side.lp}
        max={Math.max(side.lp, 1)}
        color={tone === "self" ? "linear-gradient(90deg,#3f7ad6,#69a8ff)" : "linear-gradient(90deg,#a13a3a,#ff7373)"}
        text={`${side.lp}`}
      />
      <div style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
        <span style={{ fontSize: 10.5, color: colors.faint }}>能量</span>
        <EnergyOrbs value={side.energy} max={props.energyMax} />
      </div>
    </div>
  );
}

function EnergyOrbs(props: { value: number; max: number }): React.ReactElement {
  const total = Math.max(1, Math.min(12, props.max));
  const filled = Math.max(0, Math.min(total, props.value));
  return (
    <span style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: index < filled ? colors.gold : "#2c3552",
            border: `1px solid ${index < filled ? colors.goldSoft : colors.border}`,
            boxShadow: index < filled ? "0 0 6px rgba(231,196,106,.7)" : undefined,
          }}
        />
      ))}
      <span style={{ fontSize: 11, color: colors.muted, marginLeft: 3 }}>
        {props.value}/{props.max}
      </span>
    </span>
  );
}

function ZoneRow(props: {
  label: string;
  monsterZones: number;
  trapZones: number;
  size: "sm" | "mini";
  monsters: Array<FieldMonster | null>;
  traps: Array<{ uid: string; card: CardDefinition } | null>;
  highlight?: boolean;
  selectedUid?: string | null;
  tributeUids?: string[];
  shadowverse?: boolean;
  onMonsterClick?: (monster: FieldMonster) => void;
}): React.ReactElement {
  const { monsters, traps, size } = props;
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        background: props.highlight ? "rgba(231,196,106,0.06)" : colors.bgSoft,
        border: `1px dashed ${props.highlight ? colors.gold : colors.border}`,
        borderRadius: radius.md,
        padding: 8,
        overflowX: "auto",
      }}
    >
      <span
        style={{
          writingMode: "vertical-rl",
          fontSize: 10.5,
          color: colors.faint,
          letterSpacing: 2,
          alignSelf: "center",
        }}
      >
        {props.label}
      </span>
      <div style={{ display: "flex", gap: 6 }}>
        {monsters.slice(0, props.monsterZones).map((monster, index) => {
          const isTribute = Boolean(monster && props.tributeUids?.includes(monster.uid));
          if (!monster) {
            return (
              <div key={`slot_${index}`} style={emptySlotStyle(size)}>
                <span style={{ fontSize: 10, color: colors.faint }}>空</span>
              </div>
            );
          }
          const attacked =
            monster.attacksUsed >= (monster.card.keywords.includes("double") ? 2 : 1);
          return (
            <div key={monster.uid} style={{ position: "relative" }}>
              <CardFrame
                card={monster.card}
                size={size}
                selected={props.selectedUid === monster.uid || isTribute}
                dimmed={attacked && monster.position === "attack"}
                onClick={() => props.onMonsterClick?.(monster)}
              />
              <div
                style={{
                  marginTop: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  fontSize: 10,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    color: isTribute
                      ? colors.gold
                      : props.shadowverse
                        ? colors.red
                        : monster.position === "defense"
                          ? colors.blue
                          : colors.red,
                  }}
                >
                  {isTribute
                    ? "祭品"
                    : props.shadowverse
                      ? "随从"
                      : monster.position === "defense"
                        ? "守备"
                        : "攻击"}
                </span>
                <span style={{ color: colors.faint }}>
                  {props.shadowverse
                    ? `生命 ${monsterHealth(monster)}`
                    : monster.position === "defense"
                      ? effectiveDefense(monster)
                      : effectiveAttack(monster)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {props.trapZones > 0 ? (
        <div style={{ display: "flex", gap: 5, marginLeft: 4 }}>
          {traps.slice(0, props.trapZones).map((trap, index) =>
            trap ? (
              <div
                key={trap.uid}
                title={trap.card.name}
                style={{
                  width: size === "mini" ? 44 : 52,
                  height: size === "mini" ? 64 : 78,
                  borderRadius: 6,
                  border: `1px solid ${colors.purple}`,
                  background:
                    "repeating-linear-gradient(45deg,#3a2a52 0 5px,#2a1e3c 5px 10px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: colors.purple,
                  fontSize: 9,
                  textAlign: "center",
                }}
              >
                盖放
              </div>
            ) : (
              <div
                key={`trap_${index}`}
                style={{
                  width: size === "mini" ? 44 : 52,
                  height: size === "mini" ? 64 : 78,
                  borderRadius: 6,
                  border: `1px dashed ${colors.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: colors.faint,
                }}
              >
                魔陷
              </div>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

function emptySlotStyle(size: "sm" | "mini"): React.CSSProperties {
  return {
    width: size === "mini" ? 88 : 116,
    height: size === "mini" ? 128 : 170,
    borderRadius: 8,
    border: `1px dashed ${colors.border}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255,255,255,0.015)",
  };
}

function CenterBar(props: {
  state: DuelState;
  myTurn: boolean;
  onStartBattle: () => void;
  onEndTurn: () => void;
  onDirectAttack: () => void;
  directAttackEnabled: boolean;
  hasSelectedMonster: boolean;
  attackMode: boolean;
  evolvePoints?: number;
}): React.ReactElement {
  const { state } = props;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: colors.panel,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: radius.md,
        padding: "8px 12px",
      }}
    >
      <div style={{ fontSize: 12, color: colors.goldSoft, fontWeight: 600 }}>
        第 {state.turn} 回合
      </div>
      <span
        style={{
          fontSize: 10.5,
          color: colors.muted,
          border: `1px solid ${colors.border}`,
          borderRadius: 999,
          padding: "2px 8px",
        }}
      >
        {state.phase === "main" ? "主要阶段" : "战斗阶段"}
      </span>
      <span style={{ fontSize: 11, color: colors.faint }}>
        召唤 {state.summonsThisTurn}/{state.rules.summonPerTurn} · 攻击{" "}
        {state.attackLocked ? "锁定（先攻）" : "可用"}
        {props.evolvePoints !== undefined
          ? ` · 进化点 ${props.evolvePoints}`
          : ""}
      </span>
      <div style={{ flex: 1 }} />
      {props.attackMode ? (
        <span style={{ fontSize: 11.5, color: colors.gold }}>
          请点击对方怪兽选择攻击目标
        </span>
      ) : null}
      {props.hasSelectedMonster && props.directAttackEnabled ? (
        <Btn size="sm" variant="primary" onClick={props.onDirectAttack}>
          直接攻击
        </Btn>
      ) : null}
      <Btn
        size="sm"
        onClick={props.onStartBattle}
        disabled={!props.myTurn || state.phase === "battle"}
      >
        进入战斗阶段
      </Btn>
      <Btn size="sm" variant="gold" onClick={props.onEndTurn} disabled={!props.myTurn}>
        结束回合
      </Btn>
    </div>
  );
}

function ActionBar(props: {
  card: CardDefinition;
  canSummon: boolean;
  canActivate: boolean;
  onSummonAttack: () => void;
  onSummonDefense: () => void;
  onActivateSpell: () => void;
  onSetTrap: () => void;
}): React.ReactElement {
  const { card } = props;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
        background: colors.panel2,
        border: `1px solid ${colors.border}`,
        borderRadius: radius.md,
        padding: "8px 10px",
      }}
    >
      <span style={{ fontSize: 12, color: colors.text }}>
        {card.name}
        <span style={{ color: colors.faint, marginLeft: 6 }}>
          ◈{card.cost}
          {card.kind === "monster"
            ? ` · 攻 ${card.attack} / 守 ${card.defense} / Lv${card.level}`
            : ` · ${card.kind === "spell" ? "魔法" : "陷阱"}`}
        </span>
      </span>
      <div style={{ flex: 1 }} />
      {card.kind === "monster" ? (
        <>
          <Btn size="sm" variant="gold" disabled={!props.canSummon} onClick={props.onSummonAttack}>
            攻击表示召唤
          </Btn>
          <Btn size="sm" disabled={!props.canSummon} onClick={props.onSummonDefense}>
            守备表示召唤
          </Btn>
        </>
      ) : card.kind === "spell" ? (
        <Btn size="sm" variant="gold" disabled={!props.canActivate} onClick={props.onActivateSpell}>
          发动魔法
        </Btn>
      ) : (
        <Btn size="sm" variant="gold" disabled={!props.canActivate} onClick={props.onSetTrap}>
          盖放陷阱
        </Btn>
      )}
    </div>
  );
}

function ResultOverlay(props: {
  winner: "player" | "opponent" | "draw";
  onRestart: () => void;
  onExit: () => void;
  wins: number;
  losses: number;
}): React.ReactElement {
  const text =
    props.winner === "player"
      ? "你赢得了决斗！"
      : props.winner === "opponent"
        ? "决斗失败…"
        : "平局";
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(6,9,18,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: 360,
          background: colors.panel,
          border: `1px solid ${colors.gold}`,
          borderRadius: radius.lg,
          padding: 22,
          textAlign: "center",
          boxShadow: "0 20px 60px rgba(0,0,0,.6)",
        }}
      >
        <div style={{ fontSize: 22, color: colors.goldSoft, fontWeight: 700, marginBottom: 8 }}>
          {text}
        </div>
        <div style={{ fontSize: 12, color: colors.muted, marginBottom: 18 }}>
          战绩：{props.wins} 胜 / {props.losses} 负
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn variant="gold" full onClick={props.onRestart}>
            再来一局
          </Btn>
          <Btn variant="ghost" full onClick={props.onExit}>
            返回
          </Btn>
        </div>
      </div>
    </div>
  );
}

