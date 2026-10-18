import React, { useMemo, useState } from "react";
import { useExtensionContext } from "@avg-studio/sdk";
import { ATTRIBUTE_GLYPHS, raceGlyph, type CardDefinition } from "../types";
import { attributeGradient, colors } from "./theme";

/**
 * 卡图 / 立绘渲染。
 *
 * 支持的写法（编辑器里填什么都行）：
 *   - "emoji:🐉"            直接用 emoji 当立绘
 *   - "https://…" / "data:"  网络或内嵌图片
 *   - 其他非空字符串          当作项目素材 / 扩展内资源，交给 ctx.asset.resolve
 *   - 空                     程序化卡图（属性渐变 + 种族符号）
 */
export function CardArt(props: {
  card: CardDefinition;
  height?: number | string;
  radius?: number;
}): React.ReactElement {
  const { card } = props;
  const ctx = useExtensionContext();
  const [broken, setBroken] = useState(false);
  const art = card.art.trim();

  const resolvedUrl = useMemo(() => {
    if (!art || art.startsWith("emoji:")) return null;
    if (/^(https?:|data:|blob:)/i.test(art)) return art;
    try {
      const ref = ctx.asset.resolve(art);
      return ref?.url ?? null;
    } catch {
      return null;
    }
  }, [art, ctx]);

  const height = props.height ?? 120;
  const baseStyle: React.CSSProperties = {
    height,
    width: "100%",
    borderRadius: props.radius ?? 6,
    overflow: "hidden",
    position: "relative",
    background: attributeGradient[card.attribute] ?? attributeGradient.dark,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  if (resolvedUrl && !broken) {
    return (
      <div style={baseStyle}>
        <img
          src={resolvedUrl}
          alt={card.name}
          onError={() => setBroken(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      </div>
    );
  }

  if (art.startsWith("emoji:")) {
    const glyph = art.slice(6).trim() || "🃏";
    return (
      <div style={baseStyle}>
        <ProceduralBackdrop card={card} />
        <span
          style={{
            fontSize: typeof height === "number" ? Math.max(18, height * 0.52) : 44,
            lineHeight: 1,
            filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.45))",
            position: "relative",
          }}
        >
          {glyph}
        </span>
      </div>
    );
  }

  return (
    <div style={baseStyle}>
      <ProceduralBackdrop card={card} />
      <span
        style={{
          fontSize: typeof height === "number" ? Math.max(16, height * 0.44) : 40,
          lineHeight: 1,
          opacity: 0.92,
          filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.5))",
          position: "relative",
        }}
      >
        {raceGlyph(card.race)}
      </span>
    </div>
  );
}

function ProceduralBackdrop(props: { card: CardDefinition }): React.ReactElement {
  const { card } = props;
  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.35), transparent 55%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.16,
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(0,0,0,0.65) 0 2px, transparent 2px 9px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: 6,
          bottom: 4,
          fontSize: 11,
          color: "rgba(255,255,255,0.75)",
          textShadow: "0 1px 2px rgba(0,0,0,0.6)",
        }}
      >
        {ATTRIBUTE_GLYPHS[card.attribute]}
      </div>
      <div
        style={{
          position: "absolute",
          left: 6,
          bottom: 4,
          fontSize: 10,
          color: "rgba(255,255,255,0.65)",
          letterSpacing: 1,
        }}
      >
        {card.race}
      </div>
    </>
  );
}

/** 卡背：用于对手手牌、盖放卡。 */
export function CardBack(props: { height?: number; label?: string }): React.ReactElement {
  return (
    <div
      style={{
        height: props.height ?? 96,
        width: "100%",
        borderRadius: 6,
        border: `1px solid ${colors.border}`,
        background:
          "repeating-linear-gradient(45deg,#2a3557 0 6px,#202944 6px 12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: colors.goldSoft,
        fontSize: 18,
        letterSpacing: 2,
      }}
    >
      {props.label ?? "✦"}
    </div>
  );
}
