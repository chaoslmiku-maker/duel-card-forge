import React from "react";
import {
  ATTRIBUTE_LABELS,
  KIND_LABELS,
  type CardDefinition,
} from "../types";
import { CardArt } from "./card-art";
import { attributeGradient, colors, kindAccent, kindSurface, radius, shadow } from "./theme";

export type CardSize = "lg" | "md" | "sm" | "mini";

interface SizeSpec {
  width: number;
  height: number;
  name: number;
  body: number;
  stars: number;
  artHeight: number;
  pad: number;
}

const SIZES: Record<CardSize, SizeSpec> = {
  lg: { width: 268, height: 392, name: 15, body: 11, stars: 11, artHeight: 150, pad: 8 },
  md: { width: 182, height: 266, name: 12.5, body: 9.5, stars: 9, artHeight: 96, pad: 6 },
  sm: { width: 116, height: 170, name: 10.5, body: 8.5, stars: 8, artHeight: 58, pad: 4 },
  mini: { width: 88, height: 128, name: 9.5, body: 8, stars: 7, artHeight: 40, pad: 3 },
};

export function CardFrame(props: {
  card: CardDefinition;
  size?: CardSize;
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
  badge?: string;
  badgeTone?: string;
  footerExtra?: React.ReactNode;
  style?: React.CSSProperties;
}): React.ReactElement {
  const {
    card,
    size = "md",
    selected = false,
    dimmed = false,
    onClick,
    badge,
    badgeTone = colors.gold,
    footerExtra,
    style,
  } = props;
  const spec = SIZES[size];
  const isMonster = card.kind === "monster";
  const stars = isMonster ? Math.max(1, Math.min(12, card.level)) : 0;
  const starText = "★".repeat(Math.min(stars, 10));
  const lineClamp = size === "lg" ? 6 : size === "md" ? 4 : size === "sm" ? 3 : 2;

  return (
    <div
      className={onClick ? "dcf-card is-clickable" : "dcf-card"}
      onClick={onClick}
      style={{
        width: spec.width,
        minWidth: spec.width,
        height: spec.height,
        padding: 3,
        borderRadius: radius.md,
        background: attributeGradient[card.attribute] ?? attributeGradient.dark,
        boxShadow: selected
          ? `0 0 0 2px ${colors.gold}, 0 10px 26px rgba(0,0,0,.55)`
          : shadow.card,
        cursor: onClick ? "pointer" : "default",
        opacity: dimmed ? 0.55 : 1,
        filter: dimmed ? "grayscale(0.45)" : undefined,
        position: "relative",
        transition: "transform .12s ease, box-shadow .12s ease",
        ...style,
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: radius.md - 3,
          background: kindSurface[card.kind],
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: spec.pad,
          gap: size === "lg" ? 5 : 3,
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {/* 卡名条 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "linear-gradient(180deg,#332818,#241c11)",
            border: "1px solid rgba(231,196,106,0.45)",
            borderRadius: 4,
            padding: `${size === "lg" ? 4 : 2}px ${size === "lg" ? 7 : 4}px`,
          }}
        >
          <span
            style={{
              flex: 1,
              minWidth: 0,
              color: colors.goldSoft,
              fontSize: spec.name,
              fontWeight: 700,
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {card.name}
          </span>
          <span
            style={{
              flexShrink: 0,
              fontSize: spec.body - 1,
              color: "#cbb27a",
              letterSpacing: 0.5,
            }}
          >
            {isMonster ? ATTRIBUTE_LABELS[card.attribute] : KIND_LABELS[card.kind]}
          </span>
        </div>

        {/* 星数 / 种类行 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: spec.stars + 2,
          }}
        >
          <span
            style={{
              color: "#c9962c",
              fontSize: spec.stars,
              letterSpacing: 0.5,
              lineHeight: 1,
              textShadow: "0 1px 0 rgba(255,255,255,.6)",
            }}
          >
            {isMonster ? starText : "◆"}
          </span>
          {isMonster && stars > 10 ? (
            <span style={{ fontSize: spec.stars - 1, color: "#9a7320" }}>Lv{stars}</span>
          ) : null}
          <span
            style={{
              fontSize: spec.body - 1,
              color: kindAccent[card.kind],
              letterSpacing: 0.6,
            }}
          >
            {card.race}
          </span>
        </div>

        {/* 卡图 / 立绘 */}
        <CardArt card={card} height={spec.artHeight} radius={4} />

        {/* 效果文本框 */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            borderRadius: 4,
            border: `1px solid ${kindAccent[card.kind]}44`,
            background: "rgba(255,255,255,0.45)",
            padding: size === "lg" ? 6 : 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              fontSize: spec.body,
              lineHeight: 1.45,
              color: "#3c3323",
              display: "-webkit-box",
              WebkitLineClamp: lineClamp,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              wordBreak: "break-word",
            }}
          >
            {card.description || "（尚未填写卡牌效果）"}
          </div>
        </div>

        {/* 攻守 / 花费 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 4,
            fontSize: spec.body,
            color: "#3c3323",
          }}
        >
          {isMonster ? (
            <span style={{ display: "flex", gap: size === "lg" ? 10 : 6 }}>
              <span style={{ color: "#a5341e", fontWeight: 700 }}>
                攻 {card.attack}
              </span>
              <span style={{ color: "#27568f", fontWeight: 700 }}>
                守 {card.defense}
              </span>
            </span>
          ) : (
            <span style={{ color: kindAccent[card.kind], fontWeight: 700 }}>
              {KIND_LABELS[card.kind]}卡
            </span>
          )}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              background: "linear-gradient(180deg,#f4d98c,#d8ae4a)",
              color: "#3a2a08",
              borderRadius: 999,
              padding: `0 ${size === "lg" ? 7 : 5}px`,
              fontWeight: 700,
              fontSize: spec.body - 0.5,
              border: "1px solid rgba(120,86,20,.5)",
            }}
          >
            ◈ {card.cost}
          </span>
        </div>

        {footerExtra}

        {badge ? (
          <span
            style={{
              position: "absolute",
              top: 2,
              right: 2,
              fontSize: spec.body - 1,
              padding: "1px 6px",
              borderRadius: 999,
              background: "rgba(20,16,8,.82)",
              color: badgeTone,
              border: `1px solid ${badgeTone}`,
              pointerEvents: "none",
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>
    </div>
  );
}
