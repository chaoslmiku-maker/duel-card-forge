/**
 * 即时对战战场（皇室战争风）。
 *
 * 上方是对手国王塔与双塔，中间两条兵线，下方是圣水与手牌。
 * 点手牌选中，再点「左路 / 右路」部署；单位自动推进并互相攻击。
 */
import React, { useEffect, useRef, useState } from "react";
import {
  RT_LANE_COUNT,
  towerOf,
  unitsOnLane,
  type RtSide,
  type RtState,
  type RtTower,
  type RtUnit,
} from "../engine/realtime-engine";
import { CardFrame } from "./card-frame";
import { Btn, Panel, StatBar } from "./kit";
import { colors, radius } from "./theme";

function formatTime(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mm = String(Math.floor(total / 60)).padStart(2, "0");
  const ss = String(total % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function RealtimeBoard(props: {
  state: RtState | null;
  deckCount: number;
  deckValid: boolean;
  onStart: () => void;
  onTick: (deltaMs: number) => void;
  onDeploy: (handIndex: number, lane: number) => void;
  onExit: () => void;
}): React.ReactElement {
  const { state } = props;
  const [selected, setSelected] = useState<number | null>(null);
  const tickRef = useRef(props.onTick);
  tickRef.current = props.onTick;

  const running = Boolean(state && !state.winner);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => tickRef.current(100), 100);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    setSelected(null);
  }, [state?.winner]);

  if (!state) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 20 }}>
        <Panel
          title="即时对战 · 准备"
          subtitle="圣水随时间回复，摧毁对方国王塔获胜"
          style={{ width: 560 }}
          bodyStyle={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div style={{ fontSize: 12, color: colors.muted, lineHeight: 1.8 }}>
            规则页的「圣水上限 / 圣水回复 / 对局时长 / 塔血量」会直接影响这一局。
            卡牌的攻击力 = 每次伤害，守备力 = 生命，花费 = 圣水消耗；
            卡牌的「移动速度 / 攻击间隔 / 攻击距离」在卡牌编辑器的战斗数值里调整。
          </div>
          {!props.deckValid ? (
            <div style={{ fontSize: 12, color: colors.red }}>
              卡组为空或不满足规则要求，请先到「卡组」页准备一套卡组。
            </div>
          ) : (
            <div style={{ fontSize: 12, color: colors.faint }}>
              当前卡组 {props.deckCount} 张。对手会镜像你的卡组。
            </div>
          )}
          <Btn variant="gold" onClick={props.onStart} disabled={!props.deckValid}>
            开始即时对战
          </Btn>
        </Panel>
      </div>
    );
  }

  const elixir = state.elixir.player;
  const selectedCard =
    selected !== null ? state.hand.player[selected] ?? null : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%", minHeight: 0 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: colors.panel,
          border: `1px solid ${colors.borderSoft}`,
          borderRadius: radius.md,
          padding: "8px 12px",
        }}
      >
        <span style={{ fontSize: 13, color: colors.goldSoft, fontWeight: 600 }}>
          {formatTime(state.timeLimitMs - state.timeMs)}
        </span>
        <span style={{ fontSize: 11, color: colors.faint }}>
          皇冠 {state.crowns.player} : {state.crowns.opponent}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: colors.faint }}>圣水</span>
        <div style={{ width: 220 }}>
          <StatBar
            label=""
            value={Math.floor(elixir)}
            max={state.rules.elixirMax}
            color="linear-gradient(90deg,#b264ff,#e0a0ff)"
            text={`${Math.floor(elixir)}/${state.rules.elixirMax}`}
          />
        </div>
      </div>

      {/* 对手国王塔 */}
      <KingStrip state={state} side="opponent" />

      {/* 两条兵线 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, minHeight: 0 }}>
        {Array.from({ length: RT_LANE_COUNT }).map((_, lane) => (
          <LaneTrack
            key={lane}
            state={state}
            lane={lane}
            deployable={selectedCard !== null}
            onDeploy={(laneIndex) => {
              if (selected === null) return;
              props.onDeploy(selected, laneIndex);
              setSelected(null);
            }}
          />
        ))}
      </div>

      <KingStrip state={state} side="player" />

      <Panel
        title={`手牌 · ${state.hand.player.length}`}
        subtitle={
          selectedCard
            ? `已选中「${selectedCard.name}」——点兵线的「部署」按钮，或再点一次取消`
            : "点一张手牌，然后选左路/右路部署"
        }
        bodyStyle={{ padding: 8, display: "flex", flexDirection: "column", gap: 8 }}
      >
        <div style={{ display: "flex", gap: 6, overflowX: "auto", minHeight: 176 }}>
          {state.hand.player.map((card, index) => {
            const affordable = card.cost <= elixir + 1e-6;
            return (
              <CardFrame
                key={`${card.id}_${index}`}
                card={card}
                size="sm"
                selected={selected === index}
                dimmed={!affordable}
                onClick={() => setSelected(selected === index ? null : index)}
              />
            );
          })}
        </div>
        {selectedCard ? (
          <div style={{ display: "flex", gap: 8 }}>
            {Array.from({ length: RT_LANE_COUNT }).map((_, lane) => (
              <Btn
                key={lane}
                size="sm"
                variant="gold"
                onClick={() => {
                  props.onDeploy(selected!, lane);
                  setSelected(null);
                }}
              >
                部署到{lane === 0 ? "左路" : "右路"}（圣水 {selectedCard.cost}）
              </Btn>
            ))}
            <Btn size="sm" variant="quiet" onClick={() => setSelected(null)}>
              取消
            </Btn>
          </div>
        ) : null}
      </Panel>

      {state.winner ? (
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
            }}
          >
            <div style={{ fontSize: 22, color: colors.goldSoft, fontWeight: 700, marginBottom: 8 }}>
              {state.winner === "player"
                ? "你摧毁了国王塔！"
                : state.winner === "opponent"
                  ? "你的国王塔被摧毁了…"
                  : "时间到，平局"}
            </div>
            <div style={{ fontSize: 12, color: colors.muted, marginBottom: 18 }}>
              皇冠 {state.crowns.player} : {state.crowns.opponent}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn variant="gold" full onClick={props.onStart}>
                再来一局
              </Btn>
              <Btn variant="ghost" full onClick={props.onExit}>
                返回
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function KingStrip(props: { state: RtState; side: RtSide }): React.ReactElement {
  const { state, side } = props;
  const king = towerOf(state, side, "king");
  const laneTowers = [towerOf(state, side, 0), towerOf(state, side, 1)];
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: colors.panel,
        border: `1px solid ${side === "player" ? colors.blue : colors.red}`,
        borderRadius: radius.md,
        padding: "6px 12px",
      }}
    >
      <span style={{ fontSize: 12, color: colors.text, minWidth: 60 }}>
        {side === "player" ? "你的王国" : "对手王国"}
      </span>
      <KingBar tower={king} label="国王塔" />
      <div style={{ display: "flex", gap: 8 }}>
        {laneTowers.map((tower, index) => (
          <KingBar key={index} tower={tower} label={index === 0 ? "左塔" : "右塔"} compact />
        ))}
      </div>
    </div>
  );
}

function KingBar(props: {
  tower: RtTower | undefined;
  label: string;
  compact?: boolean;
}): React.ReactElement {
  const { tower } = props;
  if (!tower) return <span />;
  const ratio = tower.maxHp > 0 ? tower.hp / tower.maxHp : 0;
  return (
    <div style={{ width: props.compact ? 90 : 180 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 10,
          color: tower.alive ? colors.faint : colors.red,
        }}
      >
        <span>{props.label}</span>
        <span>
          {tower.alive ? Math.ceil(tower.hp) : "已摧毁"}
        </span>
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "#0b1020",
          border: `1px solid ${colors.borderSoft}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(1, ratio)) * 100}%`,
            height: "100%",
            background: tower.alive
              ? "linear-gradient(90deg,#e7c46a,#f4e3b0)"
              : "#5c2430",
          }}
        />
      </div>
    </div>
  );
}

function LaneTrack(props: {
  state: RtState;
  lane: number;
  deployable: boolean;
  onDeploy: (lane: number) => void;
}): React.ReactElement {
  const { state, lane } = props;
  const units = unitsOnLane(state, lane);
  const playerTower = towerOf(state, "player", lane);
  const enemyTower = towerOf(state, "opponent", lane);
  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        minHeight: 96,
        background:
          lane === 0
            ? "linear-gradient(90deg,rgba(63,122,214,0.10),rgba(161,58,58,0.10))"
            : "linear-gradient(90deg,rgba(63,122,214,0.16),rgba(161,58,58,0.16))",
        border: `1px dashed ${colors.border}`,
        borderRadius: radius.md,
        overflow: "hidden",
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 8,
          top: 6,
          fontSize: 10,
          color: colors.faint,
          letterSpacing: 2,
        }}
      >
        {lane === 0 ? "左路" : "右路"}
      </span>
      <TowerChip tower={playerTower} />
      <TowerChip tower={enemyTower} />
      {units.map((unit) => (
        <UnitChip key={unit.uid} unit={unit} />
      ))}
      {props.deployable ? (
        <button
          type="button"
          onClick={() => props.onDeploy(lane)}
          style={{
            position: "absolute",
            right: 8,
            top: 8,
            fontSize: 10,
            padding: "3px 8px",
            borderRadius: 999,
            border: `1px solid ${colors.gold}`,
            background: "rgba(231,196,106,0.16)",
            color: colors.gold,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          部署到{lane === 0 ? "左路" : "右路"}
        </button>
      ) : null}
    </div>
  );
}

function TowerChip(props: { tower: RtTower | undefined }): React.ReactElement | null {
  const { tower } = props;
  if (!tower) return null;
  const left = `${(tower.x / 10) * 100}%`;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: "50%",
        transform: "translate(-50%,-50%)",
        textAlign: "center",
        opacity: tower.alive ? 1 : 0.35,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 6,
          border: `1px solid ${tower.side === "player" ? colors.blue : colors.red}`,
          background: tower.side === "player" ? "#1e3358" : "#5c2430",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
        }}
      >
        🏰
      </div>
      <div style={{ fontSize: 9, color: colors.faint, marginTop: 2 }}>
        {tower.alive ? Math.ceil(tower.hp) : "×"}
      </div>
    </div>
  );
}

function UnitChip(props: { unit: RtUnit }): React.ReactElement {
  const { unit } = props;
  const left = `${(unit.x / 10) * 100}%`;
  const ratio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
  const tone = unit.side === "player" ? colors.blue : colors.red;
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: "50%",
        transform: "translate(-50%,-50%)",
        width: 74,
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          color: colors.text,
          background: unit.side === "player" ? "#1e3358" : "#5c2430",
          border: `1px solid ${tone}`,
          borderRadius: 6,
          padding: "2px 4px",
          textAlign: "center",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {unit.card.name}
      </div>
      <div
        style={{
          height: 4,
          marginTop: 2,
          borderRadius: 999,
          background: "#0b1020",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.max(0, Math.min(1, ratio)) * 100}%`,
            height: "100%",
            background: tone,
          }}
        />
      </div>
      <div style={{ fontSize: 8.5, color: colors.faint, textAlign: "center" }}>
        {Math.ceil(unit.hp)}/{unit.maxHp}
      </div>
    </div>
  );
}

