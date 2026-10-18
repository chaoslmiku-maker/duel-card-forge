import React, { useMemo, useRef, useState } from "react";
import {
  ATTRIBUTE_GLYPHS,
  ATTRIBUTE_LABELS,
  EFFECT_LABELS,
  KEYWORD_HINTS,
  KEYWORD_LABELS,
  KIND_LABELS,
  RACE_PRESETS,
  TARGET_LABELS,
  TRIGGER_LABELS,
  makeId,
  normalizeCards,
  type BuffDuration,
  type BuffStat,
  type CardAttribute,
  type CardDefinition,
  type CardEffect,
  type CardKeyword,
  type CardKind,
  type EffectKind,
  type EffectTarget,
  type EffectTrigger,
} from "../types";
import { CardArt } from "./card-art";
import { CardFrame } from "./card-frame";
import { Btn, Chip, Empty, Field, NumInput, Panel, Select, TextInput } from "./kit";
import { colors } from "./theme";

const TRIGGER_OPTIONS: Array<{ value: EffectTrigger; label: string }> = (
  Object.keys(TRIGGER_LABELS) as EffectTrigger[]
).map((value) => ({ value, label: TRIGGER_LABELS[value] }));

const KIND_OPTIONS: Array<{ value: EffectKind; label: string }> = (
  Object.keys(EFFECT_LABELS) as EffectKind[]
).map((value) => ({ value, label: EFFECT_LABELS[value] }));

const STAT_OPTIONS: Array<{ value: BuffStat; label: string }> = [
  { value: "attack", label: "攻击力" },
  { value: "defense", label: "守备力" },
];

const DURATION_OPTIONS: Array<{ value: BuffDuration; label: string }> = [
  { value: "turn", label: "本回合" },
  { value: "duel", label: "整场决斗" },
];

function targetsFor(kind: EffectKind): EffectTarget[] {
  if (kind === "damage") return ["enemy-lp", "both-lp"];
  if (kind === "heal") return ["self-lp"];
  if (kind === "draw") return ["self"];
  if (kind === "destroy") return ["enemy-strongest", "enemy-random", "enemy-all"];
  if (kind === "buff") return ["self", "self-monsters"];
  return ["enemy-strongest"];
}

function valueLabel(kind: EffectKind): string {
  if (kind === "damage" || kind === "heal") return "数值";
  if (kind === "draw") return "张数";
  if (kind === "buff") return "提升值";
  return "数值";
}

export function CardEditor(props: {
  cards: CardDefinition[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (card: CardDefinition) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: () => void;
  onImportText: (text: string) => string | null;
}): React.ReactElement {
  const { cards, selectedId, onSelect, onChange, onAdd, onDuplicate, onDelete } = props;
  const [query, setQuery] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (card) =>
        card.name.toLowerCase().includes(q) ||
        card.race.toLowerCase().includes(q) ||
        KIND_LABELS[card.kind].includes(q),
    );
  }, [cards, query]);

  const selected = cards.find((card) => card.id === selectedId) ?? null;

  const patch = (part: Partial<CardDefinition>) => {
    if (!selected) return;
    onChange({ ...selected, ...part });
  };

  const patchEffect = (effectId: string, part: Partial<CardEffect>) => {
    if (!selected) return;
    onChange({
      ...selected,
      effects: selected.effects.map((effect) =>
        effect.id === effectId ? { ...effect, ...part } : effect,
      ),
    });
  };

  const addEffect = () => {
    if (!selected) return;
    onChange({
      ...selected,
      effects: [
        ...selected.effects,
        {
          id: makeId("eff"),
          trigger: selected.kind === "monster" ? "on-summon" : "on-activate",
          kind: "damage",
          target: "enemy-lp",
          value: 300,
          stat: "attack",
          duration: "turn",
        },
      ],
    });
  };

  const removeEffect = (effectId: string) => {
    if (!selected) return;
    onChange({
      ...selected,
      effects: selected.effects.filter((effect) => effect.id !== effectId),
    });
  };

  const toggleKeyword = (keyword: CardKeyword) => {
    if (!selected) return;
    const has = selected.keywords.includes(keyword);
    patch({
      keywords: has
        ? selected.keywords.filter((item) => item !== keyword)
        : [...selected.keywords, keyword],
    });
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "236px minmax(0,1fr) 300px",
        gap: 12,
        alignItems: "stretch",
        minHeight: 0,
        height: "100%",
      }}
    >
      {/* 卡牌列表 */}
      <Panel
        title={`卡牌库 · ${cards.length}`}
        subtitle="点击卡牌开始编辑"
        right={
          <Btn size="sm" variant="gold" onClick={onAdd}>
            + 新建
          </Btn>
        }
        bodyStyle={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}
      >
        <TextInput
          value={query}
          onChange={setQuery}
          placeholder="搜索卡名 / 种族 / 种类…"
        />
        <div style={{ display: "flex", gap: 6 }}>
          <Btn size="sm" full onClick={props.onExport}>
            导出 JSON
          </Btn>
          <Btn size="sm" full onClick={() => fileRef.current?.click()}>
            导入 JSON
          </Btn>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          style={{ display: "none" }}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            const text = await file.text();
            const error = props.onImportText(text);
            setImportError(error);
          }}
        />
        {importError ? (
          <div style={{ fontSize: 11, color: colors.red, lineHeight: 1.5 }}>{importError}</div>
        ) : null}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", paddingRight: 2 }}>
          {filtered.length === 0 ? (
            <Empty text="还没有卡牌。点击「+ 新建」创建第一张。" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filtered.map((card) => {
                const active = card.id === selectedId;
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => onSelect(card.id)}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      textAlign: "left",
                      padding: "6px 8px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      border: `1px solid ${active ? colors.gold : colors.borderSoft}`,
                      background: active ? "rgba(231,196,106,0.10)" : colors.panel2,
                    }}
                  >
                    <div style={{ width: 36, flexShrink: 0, borderRadius: 4, overflow: "hidden" }}>
                      <CardArt card={card} height={46} radius={4} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: 12.5,
                          color: colors.text,
                          fontWeight: 600,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {card.name}
                      </div>
                      <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 2 }}>
                        {KIND_LABELS[card.kind]}
                        {card.kind === "monster" ? ` · ${card.race}` : ""}
                      </div>
                      <div style={{ fontSize: 10.5, color: colors.muted, marginTop: 1 }}>
                        {card.kind === "monster"
                          ? `攻 ${card.attack} / 守 ${card.defense}`
                          : "魔法·陷阱"}
                        {" · "}花费 {card.cost}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </Panel>

      {/* 编辑表单 */}
      <Panel
        title={selected ? `编辑：${selected.name}` : "编辑器"}
        subtitle={selected ? "所有字段即时生效，卡面右侧实时预览" : "从左侧选择一张卡牌"}
        right={
          selected ? (
            <div style={{ display: "flex", gap: 6 }}>
              <Btn size="sm" onClick={() => onDuplicate(selected.id)}>
                复制
              </Btn>
              <Btn size="sm" variant="danger" onClick={() => onDelete(selected.id)}>
                删除
              </Btn>
            </div>
          ) : undefined
        }
        bodyStyle={{ padding: 12, overflowY: "auto", minHeight: 0 }}
      >
        {!selected ? (
          <Empty text={"选择一张卡牌开始编辑，或点击「+ 新建」。\n攻击力、守备力、种族、花费、效果、立绘都可以随时修改。"} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Section title="基础信息">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="卡名">
                  <TextInput value={selected.name} onChange={(name) => patch({ name })} />
                </Field>
                <Field label="种类">
                  <div style={{ display: "flex", gap: 6 }}>
                    {(Object.keys(KIND_LABELS) as CardKind[]).map((kind) => (
                      <Chip
                        key={kind}
                        active={selected.kind === kind}
                        onClick={() => {
                          const nextKind = kind;
                          patch({
                            kind: nextKind,
                            effects:
                              nextKind === "monster"
                                ? selected.effects
                                : selected.effects.map((effect) => ({
                                    ...effect,
                                    trigger:
                                      effect.trigger === "on-summon" ||
                                      effect.trigger === "on-attack" ||
                                      effect.trigger === "on-destroyed"
                                        ? "on-activate"
                                        : effect.trigger,
                                  })),
                          });
                        }}
                      >
                        {KIND_LABELS[kind]}
                      </Chip>
                    ))}
                  </div>
                </Field>
                <Field label="种族" hint="可自由输入新种族">
                  <TextInput
                    list="dcf-race-list"
                    value={selected.race}
                    onChange={(race) => patch({ race })}
                  />
                  <datalist id="dcf-race-list">
                    {RACE_PRESETS.map((race) => (
                      <option key={race} value={race} />
                    ))}
                  </datalist>
                </Field>
                <Field label="属性">
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {(Object.keys(ATTRIBUTE_LABELS) as CardAttribute[]).map((attr) => (
                      <Chip
                        key={attr}
                        active={selected.attribute === attr}
                        title={ATTRIBUTE_LABELS[attr]}
                        onClick={() => patch({ attribute: attr })}
                      >
                        {ATTRIBUTE_GLYPHS[attr]} {ATTRIBUTE_LABELS[attr]}
                      </Chip>
                    ))}
                  </div>
                </Field>
              </div>
            </Section>

            <Section title={selected.kind === "monster" ? "战斗数值" : "费用"}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 10 }}>
                {selected.kind === "monster" ? (
                  <>
                    <Field label="等级" hint="1-12，影响祭品">
                      <NumInput value={selected.level} min={1} max={12} onChange={(level) => patch({ level })} />
                    </Field>
                    <Field label="攻击力">
                      <NumInput
                        value={selected.attack}
                        min={0}
                        max={99999}
                        step={100}
                        onChange={(attack) => patch({ attack })}
                      />
                    </Field>
                    <Field label="守备力">
                      <NumInput
                        value={selected.defense}
                        min={0}
                        max={99999}
                        step={100}
                        onChange={(defense) => patch({ defense })}
                      />
                    </Field>
                  </>
                ) : (
                  <Field label="等级">
                    <NumInput value={selected.level} min={1} max={12} onChange={(level) => patch({ level })} />
                  </Field>
                )}
                <Field label="花费" hint="召唤/发动消耗的能量">
                  <NumInput value={selected.cost} min={0} max={30} onChange={(cost) => patch({ cost })} />
                </Field>
              </div>
              <div style={{ marginTop: 10, fontSize: 11, color: colors.faint }}>
                即时对战（皇室战争风）专用；回合制与影之诗模式会忽略这三项。
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 10, marginTop: 6 }}>
                <Field label="移动速度" hint="格 / 秒">
                  <NumInput
                    value={selected.moveSpeed ?? 1.2}
                    min={0}
                    max={5}
                    step={1}
                    onChange={(moveSpeed) => patch({ moveSpeed })}
                  />
                </Field>
                <Field label="攻击间隔" hint="毫秒">
                  <NumInput
                    value={selected.attackIntervalMs ?? 1000}
                    min={200}
                    max={5000}
                    step={100}
                    onChange={(attackIntervalMs) => patch({ attackIntervalMs })}
                  />
                </Field>
                <Field label="攻击距离" hint="格">
                  <NumInput
                    value={selected.range ?? 0.8}
                    min={0}
                    max={6}
                    step={1}
                    onChange={(range) => patch({ range })}
                  />
                </Field>
              </div>
            </Section>

            <Section title="立绘 / 卡图">
              <Field label="立绘地址" hint="emoji:🐉 / 图片 URL / 素材路径">
                <TextInput
                  value={selected.art}
                  placeholder="留空则使用属性渐变 + 种族符号"
                  onChange={(art) => patch({ art })}
                />
              </Field>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
                {["🐉", "🔮", "⚔️", "🐺", "😈", "😇", "⚙️", "💀", "🌊", "⚡", "🪨", "🔥", "🦅", "🌿", "✨", "🃏"].map(
                  (emoji) => (
                    <Chip
                      key={emoji}
                      active={selected.art === `emoji:${emoji}`}
                      onClick={() =>
                        patch({ art: selected.art === `emoji:${emoji}` ? "" : `emoji:${emoji}` })
                      }
                    >
                      {emoji}
                    </Chip>
                  ),
                )}
                <Chip onClick={() => patch({ art: "" })}>清空（程序化）</Chip>
              </div>
            </Section>

            <Section title="卡牌效果">
              <Field label="效果文本（显示在卡面上）">
                <TextInput
                  multiline
                  rows={3}
                  value={selected.description}
                  placeholder="例如：此卡召唤成功时，对玩家造成 600 点伤害。"
                  onChange={(description) => patch({ description })}
                />
              </Field>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  margin: "12px 0 6px",
                }}
              >
                <span style={{ fontSize: 12, color: colors.muted }}>
                  效果规则（驱动真实结算）
                </span>
                <Btn size="sm" variant="primary" onClick={addEffect}>
                  + 添加效果
                </Btn>
              </div>
              {selected.effects.length === 0 ? (
                <div
                  style={{
                    fontSize: 11.5,
                    color: colors.faint,
                    border: `1px dashed ${colors.border}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                    lineHeight: 1.6,
                  }}
                >
                  暂无结构化效果。只有写了效果规则，卡牌才会在对战中真正产生伤害、抽卡、破坏等行为。
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selected.effects.map((effect, index) => {
                    const validTargets = targetsFor(effect.kind);
                    return (
                      <div
                        key={effect.id}
                        style={{
                          border: `1px solid ${colors.borderSoft}`,
                          borderRadius: 10,
                          background: colors.bgSoft,
                          padding: 10,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <span style={{ fontSize: 11.5, color: colors.gold }}>
                            效果 {index + 1}
                          </span>
                          <Btn size="sm" variant="quiet" onClick={() => removeEffect(effect.id)}>
                            移除
                          </Btn>
                        </div>
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                            gap: 8,
                          }}
                        >
                          <Field label="触发时机">
                            <Select
                              value={effect.trigger}
                              options={TRIGGER_OPTIONS}
                              onChange={(trigger) => patchEffect(effect.id, { trigger })}
                            />
                          </Field>
                          <Field label="效果">
                            <Select
                              value={effect.kind}
                              options={KIND_OPTIONS}
                              onChange={(kind) => {
                                const nextTargets = targetsFor(kind);
                                patchEffect(effect.id, {
                                  kind,
                                  target: nextTargets.includes(effect.target)
                                    ? effect.target
                                    : nextTargets[0],
                                });
                              }}
                            />
                          </Field>
                          <Field label="作用目标">
                            <Select
                              value={effect.target}
                              options={validTargets.map((value) => ({
                                value,
                                label: TARGET_LABELS[value],
                              }))}
                              onChange={(target) => patchEffect(effect.id, { target })}
                            />
                          </Field>
                          {effect.kind === "buff" ? (
                            <>
                              <Field label="提升">
                                <Select
                                  value={effect.stat}
                                  options={STAT_OPTIONS}
                                  onChange={(stat) => patchEffect(effect.id, { stat })}
                                />
                              </Field>
                              <Field label="持续时间">
                                <Select
                                  value={effect.duration}
                                  options={DURATION_OPTIONS}
                                  onChange={(duration) => patchEffect(effect.id, { duration })}
                                />
                              </Field>
                              <Field label={valueLabel(effect.kind)}>
                                <NumInput
                                  value={effect.value}
                                  min={0}
                                  max={99999}
                                  step={100}
                                  onChange={(value) => patchEffect(effect.id, { value })}
                                />
                              </Field>
                            </>
                          ) : (
                            <Field label={valueLabel(effect.kind)}>
                              <NumInput
                                value={effect.value}
                                min={0}
                                max={99999}
                                step={effect.kind === "draw" ? 1 : 100}
                                onChange={(value) => patchEffect(effect.id, { value })}
                              />
                            </Field>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>

            <Section title="关键词">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(Object.keys(KEYWORD_LABELS) as CardKeyword[]).map((keyword) => (
                  <Chip
                    key={keyword}
                    active={selected.keywords.includes(keyword)}
                    title={KEYWORD_HINTS[keyword]}
                    onClick={() => toggleKeyword(keyword)}
                  >
                    {KEYWORD_LABELS[keyword]}
                  </Chip>
                ))}
              </div>
              <div style={{ fontSize: 11, color: colors.faint, marginTop: 8, lineHeight: 1.6 }}>
                {selected.keywords.length === 0
                  ? "未启用关键词。鼠标悬停可查看每个关键词的说明。"
                  : selected.keywords.map((keyword) => `「${KEYWORD_LABELS[keyword]}」${KEYWORD_HINTS[keyword]}`).join(" ")}
              </div>
            </Section>
          </div>
        )}
      </Panel>

      {/* 实时预览 */}
      <Panel
        title="卡面预览"
        subtitle="与实际对战中的卡面一致"
        bodyStyle={{
          padding: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          overflowY: "auto",
          minHeight: 0,
        }}
      >
        {selected ? (
          <>
            <CardFrame card={selected} size="lg" />
            <div
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
                fontSize: 11.5,
                color: colors.muted,
              }}
            >
              <InfoRow label="种类" value={KIND_LABELS[selected.kind]} />
              <InfoRow label="种族" value={selected.race} />
              <InfoRow label="属性" value={ATTRIBUTE_LABELS[selected.attribute]} />
              <InfoRow label="等级" value={`${selected.level}`} />
              <InfoRow label="花费" value={`${selected.cost} 能量`} />
              <InfoRow label="效果数" value={`${selected.effects.length}`} />
            </div>
            <div style={{ fontSize: 11, color: colors.faint, lineHeight: 1.7, width: "100%" }}>
              提示：卡面会随编辑实时变化，文本过长时在卡面上自动截断，完整效果仍会正常结算。
            </div>
          </>
        ) : (
          <Empty text="选择卡牌后这里会显示卡面。" />
        )}
      </Panel>
    </div>
  );
}

function Section(props: { title: string; children: React.ReactNode }): React.ReactElement {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: colors.goldSoft,
          marginBottom: 8,
          paddingBottom: 5,
          borderBottom: `1px solid ${colors.borderSoft}`,
          letterSpacing: 0.5,
        }}
      >
        {props.title}
      </div>
      {props.children}
    </div>
  );
}

function InfoRow(props: { label: string; value: string }): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        background: colors.bgSoft,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 6,
        padding: "4px 8px",
      }}
    >
      <span style={{ color: colors.faint }}>{props.label}</span>
      <span style={{ color: colors.text }}>{props.value}</span>
    </div>
  );
}

export { normalizeCards };
