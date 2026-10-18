import React, { useMemo, useState } from "react";
import type { CardDefinition, DeckEntry, DuelRules } from "../types";
import { KIND_LABELS } from "../types";
import { CardArt } from "./card-art";
import { Btn, Empty, Panel, TextInput } from "./kit";
import { colors } from "./theme";

export function DeckBuilder(props: {
  cards: CardDefinition[];
  deck: readonly DeckEntry[];
  rules: DuelRules;
  onChange: (deck: DeckEntry[]) => void;
  onReset: () => void;
}): React.ReactElement {
  const { cards, deck, rules } = props;
  const [query, setQuery] = useState("");
  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of deck) map.set(entry.cardId, entry.count);
    return map;
  }, [deck]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? cards.filter(
          (card) =>
            card.name.toLowerCase().includes(q) || card.race.toLowerCase().includes(q),
        )
      : cards;
    return [...list].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "monster" ? -1 : 1;
      return b.cost - a.cost;
    });
  }, [cards, query]);

  const setCount = (cardId: string, next: number) => {
    const count = Math.max(0, Math.min(9, next));
    const rest = deck.filter((entry) => entry.cardId !== cardId);
    if (count === 0) {
      props.onChange(rest);
      return;
    }
    props.onChange([...rest, { cardId, count }]);
  };

  const total = deck.reduce((sum, entry) => sum + entry.count, 0);
  const stats = useMemo(() => {
    const byKind = { monster: 0, spell: 0, trap: 0 };
    const costBuckets = [0, 0, 0, 0, 0, 0];
    let atkSum = 0;
    let atkCount = 0;
    for (const entry of deck) {
      const card = cards.find((item) => item.id === entry.cardId);
      if (!card) continue;
      byKind[card.kind] += entry.count;
      const bucket = Math.min(5, Math.floor(card.cost));
      costBuckets[bucket] += entry.count;
      if (card.kind === "monster") {
        atkSum += card.attack * entry.count;
        atkCount += entry.count;
      }
    }
    return {
      byKind,
      costBuckets,
      avgAtk: atkCount > 0 ? Math.round(atkSum / atkCount) : 0,
    };
  }, [deck, cards]);

  const warnings: string[] = [];
  if (total < rules.deckMinSize) {
    warnings.push(`卡组只有 ${total} 张，规则要求至少 ${rules.deckMinSize} 张。`);
  }
  if (total === 0) warnings.push("卡组为空，无法开始决斗。");
  const missing = deck.filter((entry) => !cards.some((card) => card.id === entry.cardId));
  if (missing.length > 0) warnings.push(`有 ${missing.length} 种卡牌已从卡牌库删除。`);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) 320px",
        gap: 12,
        minHeight: 0,
        height: "100%",
      }}
    >
      <Panel
        title="卡牌库"
        subtitle="点击「+」把卡牌加入卡组，同一张最多 9 张"
        right={
          <div style={{ width: 220, flexShrink: 0 }}>
            <TextInput value={query} onChange={setQuery} placeholder="搜索卡名 / 种族…" />
          </div>
        }
        bodyStyle={{ padding: 10, overflowY: "auto", minHeight: 0 }}
      >
        {cards.length === 0 ? (
          <Empty text="卡牌库是空的，先去「卡牌库」页创建卡牌。" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map((card) => {
              const count = counts.get(card.id) ?? 0;
              return (
                <div
                  key={card.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: `1px solid ${count > 0 ? "rgba(231,196,106,0.5)" : colors.borderSoft}`,
                    background: count > 0 ? "rgba(231,196,106,0.07)" : colors.panel2,
                  }}
                >
                  <div style={{ width: 36, flexShrink: 0, borderRadius: 4, overflow: "hidden" }}>
                    <CardArt card={card} height={46} radius={4} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: colors.text, fontWeight: 600 }}>
                      {card.name}
                      <span style={{ marginLeft: 6, fontSize: 10.5, color: colors.faint }}>
                        {KIND_LABELS[card.kind]}
                        {card.kind === "monster" ? ` · ${card.race}` : ""} · ◈{card.cost}
                      </span>
                    </div>
                    <div style={{ fontSize: 10.5, color: colors.muted, marginTop: 1 }}>
                      {card.kind === "monster"
                        ? `攻 ${card.attack} / 守 ${card.defense} / Lv${card.level}`
                        : card.description || "（无效果文本）"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Btn size="sm" onClick={() => setCount(card.id, count - 1)} disabled={count === 0}>
                      −
                    </Btn>
                    <span
                      style={{
                        minWidth: 22,
                        textAlign: "center",
                        fontSize: 13,
                        color: count > 0 ? colors.gold : colors.faint,
                        fontWeight: 700,
                      }}
                    >
                      {count}
                    </span>
                    <Btn size="sm" variant="primary" onClick={() => setCount(card.id, count + 1)}>
                      +
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel
        title={`当前卡组 · ${total} 张`}
        subtitle="规则检查与费用曲线"
        right={
          <div style={{ display: "flex", gap: 6 }}>
            <Btn size="sm" onClick={props.onReset}>
              示例卡组
            </Btn>
            <Btn size="sm" variant="danger" onClick={() => props.onChange([])}>
              清空
            </Btn>
          </div>
        }
        bodyStyle={{ padding: 12, display: "flex", flexDirection: "column", gap: 12, minHeight: 0, overflowY: "auto" }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <Stat label="怪兽" value={stats.byKind.monster} tone={colors.orange} />
          <Stat label="魔法" value={stats.byKind.spell} tone={colors.green} />
          <Stat label="陷阱" value={stats.byKind.trap} tone={colors.purple} />
        </div>
        <div style={{ fontSize: 11.5, color: colors.muted }}>
          平均攻击力 <span style={{ color: colors.goldSoft, fontWeight: 700 }}>{stats.avgAtk}</span>
        </div>
        <div>
          <div style={{ fontSize: 12, color: colors.muted, marginBottom: 6 }}>费用曲线</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 68 }}>
            {stats.costBuckets.map((count, index) => {
              const max = Math.max(1, ...stats.costBuckets);
              return (
                <div key={index} style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      height: `${(count / max) * 46}px`,
                      minHeight: count > 0 ? 4 : 1,
                      background:
                        count > 0
                          ? "linear-gradient(180deg,#e7c46a,#a47c2b)"
                          : colors.borderSoft,
                      borderRadius: 3,
                      transition: "height .2s ease",
                    }}
                  />
                  <div style={{ fontSize: 10, color: colors.faint, marginTop: 3 }}>
                    {index === 5 ? "6+" : index}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {warnings.length > 0 ? (
          <div
            style={{
              border: `1px solid ${colors.redSoft}`,
              background: "rgba(255,115,115,0.08)",
              borderRadius: 8,
              padding: "8px 10px",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            {warnings.map((text) => (
              <div key={text} style={{ fontSize: 11.5, color: colors.red, lineHeight: 1.5 }}>
                · {text}
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              fontSize: 11.5,
              color: colors.green,
              border: `1px solid ${colors.greenSoft}`,
              background: "rgba(95,214,162,0.08)",
              borderRadius: 8,
              padding: "8px 10px",
            }}
          >
            卡组符合规则，可以开始决斗。
          </div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: colors.faint, lineHeight: 1.7 }}>
          卡组会保存到当前存档槽位；卡牌本身保存在扩展的项目设置里，导出 JSON 即可分享给其他项目。
        </div>
      </Panel>
    </div>
  );
}

function Stat(props: { label: string; value: number; tone: string }): React.ReactElement {
  return (
    <div
      style={{
        background: colors.bgSoft,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: 8,
        padding: "6px 8px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 16, fontWeight: 700, color: props.tone }}>{props.value}</div>
      <div style={{ fontSize: 10.5, color: colors.faint, marginTop: 1 }}>{props.label}</div>
    </div>
  );
}
