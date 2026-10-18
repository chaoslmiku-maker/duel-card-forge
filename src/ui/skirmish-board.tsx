/**
 * 半即时战场（武器对战）。
 *
 * 上面是对手主战者与场面，中间是资源与武器操作，下面是自己的场面与手牌。
 * 没有回合按钮：资源实时回复，单位自动开打，武器需要自己点「挥砍」。
 */
import React, { useEffect, useRef, useState } from "react";
import type { CardDefinition, DuelRules } from "../types";
import { CARD_ROLE_LABELS } from "../types";
import {
  boardScore,
  effectiveUnitAttack,
  unitsOf,
  type SkSide,
  type SkState,
  type SkUnit,
  type SkWeapon,
} from "../engine/skirmish-engine";import { CardFrame } from "./card-frame";
import { Btn, Panel } from "./kit";
import { colors, radius } from "./theme";

function roleOf(card: CardDefinition): keyof typeof CARD_ROLE_LABELS {
  if (card.role) return card.role;
  if (card.kind === "monster") return "unit";
  if (card.kind === "spell") return "spell";
  return "field";
}

function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function SkirmishBoard(props: {
  state: SkState | null;
  rules: DuelRules;
  deckCount: number;
  deckValid: boolean;
  onStart: () => void;
  onTick: (deltaMs: number) => void;
  onPlay: (handIndex: number) => void;
  onWeaponAttack: (targetUid: string | null) => void;
  onExit: () => void;
}): React.ReactElement {
  const { state } = props;
  const tickRef = useRef(props.onTick);
  tickRef.current = props.onTick;
  const [targeting, setTargeting] = useState(false);
  const running = Boolean(state && !state.winner);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => tickRef.current(100), 100);
    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => setTargeting(false), [state?.winner]);

  if (!state) {
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 20 }}>
        <Panel
          title="半即时对战 · 准备"
          subtitle="没有回合与先后手，资源随时间回复"
          style={{ width: 620 }}
          bodyStyle={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <div style={{ fontSize: 12, color: colors.muted, lineHeight: 1.9 }}>
            资源每分钟回复 <b>{props.rules.manaPerMinute}</b> 点（开局 {props.rules.manaStart}），
            上限 {props.rules.elixirMax}；主战者 {props.rules.startingLp} 生命；限时{" "}
            {Math.round(props.rules.matchSeconds / 60)} 分钟，时间到按场面评分判定。
            单位上场后自动作战，武器由主战者手动挥砍并消耗耐久。
          </div>
          {!props.deckValid ? (
            <div style={{ fontSize: 12, color: colors.red }}>
              卡组为空或不满足规则要求，请先到「卡组」页准备一套卡组。
            </div>
          ) : (
            <div style={{ fontSize: 12, color: colors.faint }}>
              当前卡组 {props.deckCount} 张。对手镜像你的卡组。
            </div>
          )}
          <Btn variant="gold" onClick={props.onStart} disabled={!props.deckValid}>
            开始半即时对战
          </Btn>
        </Panel>
      </div>
    );
  }

  const mana = state.mana.player;
  const weapon = state.hero.player.weapon;
  const enemyWeapon = state.hero.opponent.weapon;

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
          {clock(state.timeLimitMs - state.timeMs)}
        </span>
        <span style={{ fontSize: 11, color: colors.faint }}>
          场面评分 {boardScore(state, "player")} : {boardScore(state, "opponent")}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: colors.faint }}>资源</span>
        <ManaPips value={mana} max={Math.max(3, state.rules.elixirMax)} />
      </div>

      <HeroStrip
        state={state}
        side="opponent"
        weapon={enemyWeapon}
        onAttack={undefined}
      />
      <UnitRow state={state} side="opponent" targeting={targeting} onPick={(uid) => {
        props.onWeaponAttack(uid);
        setTargeting(false);
      }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          background: colors.panel,
          border: `1px solid ${colors.gold}`,
          borderRadius: radius.md,
          padding: "8px 12px",
        }}
      >
        <span style={{ fontSize: 12, color: colors.goldSoft }}>双方随时行动 · 无回合与先后手</span>
        <div style={{ flex: 1 }} />
        {targeting ? (
          <>
            <span style={{ fontSize: 11.5, color: colors.gold }}>点击对手单位作为武器目标</span>
            <Btn size="sm" variant="quiet" onClick={() => setTargeting(false)}>
              取消
            </Btn>
          </>
        ) : (
          <>
            <Btn
              size="sm"
              variant="gold"
              disabled={!weapon || state.hero.player.weaponCooldown > 0}
              onClick={() => props.onWeaponAttack(null)}
            >
              武器攻击主战者
              {weapon ? `（${weapon.attack}）` : ""}
            </Btn>
            <Btn
              size="sm"
              disabled={!weapon || state.hero.player.weaponCooldown > 0 || unitsOf(state, "opponent").length === 0}
              onClick={() => setTargeting(true)}
            >
              武器攻击单位
            </Btn>
          </>
        )}
        <Btn size="sm" variant="ghost" onClick={props.onExit}>
          离开
        </Btn>
      </div>

      <UnitRow state={state} side="player" targeting={false} onPick={() => undefined} />
      <HeroStrip state={state} side="player" weapon={weapon} onAttack={undefined} />

      <Panel
        title={`手牌 · ${state.hand.player.length}`}
        subtitle="点击卡牌立即打出：单位/王牌上场、武器装备、法术结算、场地铺开"
        bodyStyle={{ padding: 8 }}
      >
        <div style={{ display: "flex", gap: 6, overflowX: "auto", minHeight: 176 }}>
          {state.hand.player.map((card, index) => {
            const affordable = card.cost <= mana + 1e-6;
            return (
              <div key={`${card.id}_${index}`} style={{ position: "relative" }}>
                <CardFrame
                  card={card}
                  size="sm"
                  dimmed={!affordable}
                  onClick={() => props.onPlay(index)}
                />
                <span
                  style={{
                    position: "absolute",
                    left: 4,
                    bottom: 20,
                    fontSize: 9,
                    padding: "1px 5px",
                    borderRadius: 999,
                    background: "rgba(6,9,18,0.78)",
                    border: `1px solid ${colors.border}`,
                    color: colors.goldSoft,
                  }}
                >
                  {CARD_ROLE_LABELS[roleOf(card)]} · {card.cost}
                </span>
              </div>
            );
          })}
          {state.hand.player.length === 0 ? (
            <div style={{ fontSize: 11.5, color: colors.faint }}>
              手牌打空了，等待自动抽牌（每 6 秒 1 张）。
            </div>
          ) : null}
        </div>
      </Panel>

      {state.winner ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(6,9,18,0.84)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              width: 380,
              background: colors.panel,
              border: `1px solid ${colors.gold}`,
              borderRadius: radius.lg,
              padding: 22,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 22, color: colors.goldSoft, fontWeight: 700, marginBottom: 8 }}>
              {state.winner === "player"
                ? "你赢下了这场对决"
                : state.winner === "opponent"
                  ? "主战者倒下了…"
                  : "时间到，评分相同"}
            </div>
            <div style={{ fontSize: 12, color: colors.muted, marginBottom: 18 }}>
              场面评分 {boardScore(state, "player")} : {boardScore(state, "opponent")}
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

function ManaPips(props: { value: number; max: number }): React.ReactElement {
  const value = Math.floor(props.value);
  const pips: React.ReactElement[] = [];
  for (let i = 0; i < props.max; i += 1) {
    const filled = i < value;
    pips.push(
      <span
        key={i}
        style={{
          width: 12,
          height: 12,
          borderRadius: 3,
          border: `1px solid ${filled ? colors.blue : colors.border}`,
          background: filled ? "linear-gradient(180deg,#6ea8ff,#2f6bd0)" : "#0b1020",
          display: "inline-block",
        }}
      />,
    );
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      {pips}
      <span style={{ fontSize: 11, color: colors.faint, marginLeft: 4 }}>
        {value}/{props.max}
      </span>
    </div>
  );
}

function HeroStrip(props: {
  state: SkState;
  side: SkSide;
  weapon: SkWeapon | null;
  onAttack: (() => void) | undefined;
}): React.ReactElement {
  const { state, side, weapon } = props;
  const hero = state.hero[side];
  const field = state.field[side];
  const ratio = hero.maxHp > 0 ? hero.hp / hero.maxHp : 0;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: colors.panel,
        border: `1px solid ${side === "player" ? colors.blue : colors.red}`,
        borderRadius: radius.md,
        padding: "8px 12px",
      }}
    >
      <span style={{ fontSize: 12, color: colors.text, minWidth: 84 }}>
        {side === "player" ? "你的主战者" : "对手主战者"}
      </span>
      <div style={{ width: 200 }}>
        <div style={{ height: 8, borderRadius: 999, background: "#0b1020", overflow: "hidden" }}>
          <div
            style={{
              width: `${Math.max(0, Math.min(1, ratio)) * 100}%`,
              height: "100%",
              background:
                side === "player"
                  ? "linear-gradient(90deg,#3f7ad6,#7fb2ff)"
                  : "linear-gradient(90deg,#a13a3a,#e07777)",
            }}
          />
        </div>
        <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2 }}>
          生命 {hero.hp} / {hero.maxHp}
        </div>
      </div>
      <div style={{ fontSize: 11, color: weapon ? colors.goldSoft : colors.faint }}>
        {weapon
          ? `武器 ${weapon.card.name} · 攻击 ${weapon.attack} · 耐久 ${weapon.durability}/${weapon.maxDurability}`
          : "未装备武器"}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ fontSize: 11, color: field ? colors.goldSoft : colors.faint }}>
        {field ? `场地 ${field.name}（攻击 +${field.attack}）` : "无场地"}
      </div>
    </div>
  );
}

function UnitRow(props: {
  state: SkState;
  side: SkSide;
  targeting: boolean;
  onPick: (uid: string) => void;
}): React.ReactElement {
  const units = unitsOf(props.state, props.side);
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        minHeight: 150,
        background: props.targeting ? "rgba(231,196,106,0.06)" : colors.bgSoft,
        border: `1px dashed ${props.targeting ? colors.gold : colors.border}`,
        borderRadius: radius.md,
        padding: 8,
        overflowX: "auto",
      }}
    >
      {units.length === 0 ? (
        <span style={{ fontSize: 11.5, color: colors.faint, alignSelf: "center", paddingLeft: 8 }}>
          {props.side === "player" ? "你的场上没有单位" : "对手场上没有单位"}
        </span>
      ) : null}
      {units.map((unit) => (
        <UnitCard
          key={unit.uid}
          state={props.state}
          unit={unit}
          clickable={props.targeting}
          onClick={() => props.onPick(unit.uid)}
        />
      ))}
    </div>
  );
}

function UnitCard(props: {
  state: SkState;
  unit: SkUnit;
  clickable: boolean;
  onClick: () => void;
}): React.ReactElement {
  const { unit, state } = props;
  const attack = effectiveUnitAttack(state, unit);
  const ratio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 0;
  return (
    <div style={{ position: "relative" }}>
      <CardFrame
        card={unit.card}
        size="sm"
        selected={props.clickable}
        onClick={props.clickable ? props.onClick : undefined}
      />
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginTop: 3 }}>
        <span style={{ color: colors.goldSoft }}>
          {attack}
          {unit.experience > 0 ? ` (+${unit.experience})` : ""}
        </span>
        <span style={{ color: colors.faint }}>
          {unit.hp}/{unit.maxHp}
        </span>
      </div>
      <div style={{ height: 3, borderRadius: 999, background: "#0b1020", overflow: "hidden" }}>
        <div
          style={{
            width: `${Math.max(0, Math.min(1, ratio)) * 100}%`,
            height: "100%",
            background: unit.side === "player" ? colors.blue : colors.red,
          }}
        />
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 2, fontSize: 9, color: colors.faint }}>
        {unit.ace ? <span style={{ color: colors.gold }}>王牌</span> : null}
        {unit.flying ? <span>飞行</span> : null}
        {unit.blocking ? <span>挡刀</span> : null}
      </div>
    </div>
  );
}
