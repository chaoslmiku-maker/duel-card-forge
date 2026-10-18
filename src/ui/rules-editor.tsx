import React from "react";
import {
  BATTLE_MODE_LABELS,
  BATTLE_MODE_PRESETS,
  type BattleMode,
  type DuelRules,
} from "../types";
import { Btn, Chip, Empty, Field, NumInput, Panel, Toggle } from "./kit";
import { colors } from "./theme";

const MODE_HINTS: Record<BattleMode, string> = {
  duel: "回合制：攻守表示、祭品召唤、攻对攻/守对守的破坏判定，8000 LP。",
  shadowverse:
    "影之诗风：主战者 20 生命，费用（PP）每回合 +1 上限 10，随从有生命值、伤害跨回合保留，可用进化点让随从 +2/+2。",
  realtime:
    "即时对战：圣水随时间回复，两条兵线自动推进，先摧毁对方国王塔者胜；卡牌的攻击力=伤害、守备力=生命。",
  skirmish:
    "半即时：没有回合与先后手，资源每分钟回复；单位自动作战，武器由主战者挥砍并消耗耐久；飞行可越过地面单位直击主战者，带「不可被效果破坏」的单位会挡刀；时间到按场面评分判定。",
};

export function RulesEditor(props: {
  rules: DuelRules;
  onChange: (rules: DuelRules) => void;
  onReset: () => void;
}): React.ReactElement {
  const { rules, onChange } = props;
  const set = <K extends keyof DuelRules>(key: K, value: DuelRules[K]) =>
    onChange({ ...rules, [key]: value });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0,1fr))",
        gap: 12,
        alignItems: "stretch",
        minHeight: 0,
        height: "100%",
        overflowY: "auto",
        paddingBottom: 4,
        alignContent: "start",
      }}
    >
      <div style={{ gridColumn: "1 / -1" }}>
        <Panel title="战斗模式" subtitle="切换模式会套用该模式的推荐规则">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(Object.keys(BATTLE_MODE_LABELS) as BattleMode[]).map((mode) => (
              <Chip
                key={mode}
                active={rules.battleMode === mode}
                onClick={() =>
                  onChange({ ...rules, ...BATTLE_MODE_PRESETS[mode] })
                }
              >
                {BATTLE_MODE_LABELS[mode]}
              </Chip>
            ))}
          </div>
          <div
            style={{
              fontSize: 11,
              color: colors.faint,
              marginTop: 8,
              lineHeight: 1.7,
            }}
          >
            {MODE_HINTS[rules.battleMode]}
          </div>
        </Panel>
      </div>

      <Panel title="基础规则" subtitle="生命值与资源">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <NumRow
            label="初始生命值"
            hint="双方开局 LP"
            value={rules.startingLp}
            min={100}
            max={100000}
            step={100}
            onChange={(value) => set("startingLp", value)}
          />
          <NumRow
            label="起始手牌"
            hint="开局抽牌数"
            value={rules.startingHand}
            min={0}
            max={8}
            onChange={(value) => set("startingHand", value)}
          />
          <NumRow
            label="每回合抽卡"
            hint="自己回合开始时"
            value={rules.drawPerTurn}
            min={0}
            max={5}
            onChange={(value) => set("drawPerTurn", value)}
          />
          <NumRow
            label="手牌上限"
            hint="0 = 不限制"
            value={rules.handLimit}
            min={0}
            max={20}
            onChange={(value) => set("handLimit", value)}
          />
          <NumRow
            label="卡组最少张数"
            hint="组卡检查用"
            value={rules.deckMinSize}
            min={1}
            max={60}
            onChange={(value) => set("deckMinSize", value)}
          />
        </div>
      </Panel>

      <Panel title="场地与能量" subtitle="区域数量与能量曲线">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <NumRow
            label="怪兽区数量"
            hint="1-5"
            value={rules.monsterZones}
            min={1}
            max={5}
            onChange={(value) => set("monsterZones", value)}
          />
          <NumRow
            label="魔法·陷阱区数量"
            hint="0-5"
            value={rules.spellZones}
            min={0}
            max={5}
            onChange={(value) => set("spellZones", value)}
          />
          <NumRow
            label="初始能量"
            hint="第一回合可用"
            value={rules.energyStart}
            min={0}
            max={20}
            onChange={(value) => set("energyStart", value)}
          />
          <NumRow
            label="每回合能量"
            hint="每回合开始回复"
            value={rules.energyPerTurn}
            min={0}
            max={20}
            onChange={(value) => set("energyPerTurn", value)}
          />
          <NumRow
            label="能量上限"
            value={rules.energyMax}
            min={1}
            max={99}
            onChange={(value) => set("energyMax", value)}
          />
        </div>
      </Panel>

      <Panel title="召唤与战斗" subtitle="祭品、攻击与胜负">
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <NumRow
            label="每回合召唤次数"
            value={rules.summonPerTurn}
            min={1}
            max={5}
            onChange={(value) => set("summonPerTurn", value)}
          />
          <div onClick={() => undefined}>
            <Toggle
              checked={rules.tributeEnabled}
              onChange={(value) => set("tributeEnabled", value)}
              label="启用祭品召唤"
              hint="高等级怪兽需要献祭场上怪兽"
            />
          </div>
          {rules.tributeEnabled ? (
            <>
              <NumRow
                label="1 祭品等级"
                hint="等级 ≥ 此值需要 1 只祭品"
                value={rules.tributeLevelOne}
                min={1}
                max={12}
                onChange={(value) => set("tributeLevelOne", value)}
              />
              <NumRow
                label="2 祭品等级"
                hint="等级 ≥ 此值需要 2 只祭品"
                value={rules.tributeLevelTwo}
                min={1}
                max={12}
                onChange={(value) => set("tributeLevelTwo", value)}
              />
            </>
          ) : null}
          <Toggle
            checked={rules.directAttackAllowed}
            onChange={(value) => set("directAttackAllowed", value)}
            label="允许直接攻击"
            hint="对方场上没有怪兽时可以直接攻击玩家"
          />
          <Toggle
            checked={rules.piercingEnabled}
            onChange={(value) => set("piercingEnabled", value)}
            label="守备穿透"
            hint="所有怪兽攻击守备表示时溢出伤害贯穿"
          />
          <NumRow
            label="战斗伤害倍率"
            hint="%"
            value={rules.battleDamageScale}
            min={0}
            max={300}
            step={10}
            onChange={(value) => set("battleDamageScale", value)}
          />
          <Toggle
            checked={rules.firstTurnAttack}
            onChange={(value) => set("firstTurnAttack", value)}
            label="先攻可以攻击"
            hint="关闭时第一回合不能攻击"
          />
          <Toggle
            checked={rules.aiEnabled}
            onChange={(value) => set("aiEnabled", value)}
            label="AI 对手"
            hint="关闭后对手回合会直接结束"
          />
          <Toggle
            checked={rules.deckOutLose}
            onChange={(value) => set("deckOutLose", value)}
            label="卡组抽空判负"
          />
          <NumRow
            label="回合上限"
            hint="0 = 不限，达到则平局"
            value={rules.turnLimit}
            min={0}
            max={999}
            onChange={(value) => set("turnLimit", value)}
          />
        </div>
      </Panel>

      {rules.battleMode !== "duel" ? (
        <div style={{ gridColumn: "1 / -1" }}>
          <Panel
            title="模式专属设置"
            subtitle={BATTLE_MODE_LABELS[rules.battleMode]}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0,1fr))",
                gap: 12,
              }}
            >
              {rules.battleMode === "shadowverse" ? (
                <>
                  <NumRow
                    label="进化点"
                    hint="每方可用次数"
                    value={rules.evolvePoints}
                    min={0}
                    max={9}
                    onChange={(value) => set("evolvePoints", value)}
                  />
                  <NumRow
                    label="进化攻击加成"
                    value={rules.evolveAttack}
                    min={0}
                    max={20}
                    onChange={(value) => set("evolveAttack", value)}
                  />
                  <NumRow
                    label="进化生命加成"
                    value={rules.evolveDefense}
                    min={0}
                    max={20}
                    onChange={(value) => set("evolveDefense", value)}
                  />
                </>
              ) : rules.battleMode === "skirmish" ? (
                <>
                  <NumRow
                    label="开局资源"
                    value={rules.manaStart}
                    min={0}
                    max={20}
                    onChange={(value) => set("manaStart", value)}
                  />
                  <NumRow
                    label="每分钟回复资源"
                    hint="半即时的核心节奏"
                    value={rules.manaPerMinute}
                    min={1}
                    max={120}
                    onChange={(value) => set("manaPerMinute", value)}
                  />
                  <NumRow
                    label="资源上限"
                    value={rules.elixirMax}
                    min={3}
                    max={20}
                    onChange={(value) => set("elixirMax", value)}
                  />
                  <NumRow
                    label="对局时长（秒）"
                    hint="时间到按场面评分判定"
                    value={rules.matchSeconds}
                    min={30}
                    max={900}
                    step={10}
                    onChange={(value) => set("matchSeconds", value)}
                  />
                </>
              ) : (
                <>
                  <NumRow
                    label="圣水上限"
                    value={rules.elixirMax}
                    min={1}
                    max={20}
                    onChange={(value) => set("elixirMax", value)}
                  />
                  <NumRow
                    label="圣水回复（毫秒/点）"
                    hint="越小回复越快"
                    value={rules.elixirRegenMs}
                    min={300}
                    max={20000}
                    step={100}
                    onChange={(value) => set("elixirRegenMs", value)}
                  />
                  <NumRow
                    label="对局时长（秒）"
                    value={rules.matchSeconds}
                    min={30}
                    max={900}
                    step={10}
                    onChange={(value) => set("matchSeconds", value)}
                  />
                  <NumRow
                    label="普通塔生命"
                    value={rules.towerHp}
                    min={100}
                    max={99999}
                    step={100}
                    onChange={(value) => set("towerHp", value)}
                  />
                  <NumRow
                    label="国王塔生命"
                    value={rules.kingTowerHp}
                    min={100}
                    max={99999}
                    step={100}
                    onChange={(value) => set("kingTowerHp", value)}
                  />
                </>
              )}
            </div>
          </Panel>
        </div>
      ) : null}

      <div style={{ gridColumn: "1 / -1" }}>
        <Panel
          title="规则速览"
          subtitle="当前生效的规则摘要"
          right={
            <Btn size="sm" variant="danger" onClick={props.onReset}>
              恢复默认规则
            </Btn>
          }
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              `生命值 ${rules.startingLp}`,
              `起手 ${rules.startingHand} 张`,
              `每回合抽 ${rules.drawPerTurn} 张`,
              rules.handLimit > 0 ? `手牌上限 ${rules.handLimit}` : "手牌不限",
              `怪兽区 ${rules.monsterZones}`,
              `魔陷区 ${rules.spellZones}`,
              `能量 ${rules.energyStart} → ${rules.energyMax}（+${rules.energyPerTurn}/回合）`,
              `每回合召唤 ${rules.summonPerTurn} 次`,
              rules.tributeEnabled
                ? `祭品：Lv${rules.tributeLevelOne}+ 需 1 只，Lv${rules.tributeLevelTwo}+ 需 2 只`
                : "不启用祭品",
              rules.directAttackAllowed ? "可直接攻击" : "禁止直接攻击",
              rules.piercingEnabled ? "守备穿透" : "无穿透",
              `战斗伤害 ${rules.battleDamageScale}%`,
              rules.deckOutLose ? "抽空判负" : "抽空不判负",
              rules.turnLimit > 0 ? `回合上限 ${rules.turnLimit}` : "无回合上限",
              rules.aiEnabled ? "AI 对手" : "无 AI",
            ].map((text) => (
              <span
                key={text}
                style={{
                  fontSize: 11.5,
                  color: colors.muted,
                  background: colors.bgSoft,
                  border: `1px solid ${colors.borderSoft}`,
                  borderRadius: 999,
                  padding: "4px 10px",
                }}
              >
                {text}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: colors.faint, marginTop: 10, lineHeight: 1.7 }}>
            这些规则适用于「对战」页的每一场决斗，也决定卡牌编辑里「等级 / 花费」的实际意义。
          </div>
        </Panel>
      </div>
    </div>
  );
}

function NumRow(props: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}): React.ReactElement {
  return (
    <Field label={props.label} hint={props.hint}>
      <NumInput
        value={props.value}
        min={props.min}
        max={props.max}
        step={props.step}
        onChange={props.onChange}
      />
    </Field>
  );
}

export function RulesEmpty(): React.ReactElement {
  return <Empty text="加载规则失败，已回退到默认规则。" />;
}
