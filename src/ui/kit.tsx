import React from "react";
import { colors, radius } from "./theme";

type BtnVariant = "primary" | "ghost" | "danger" | "gold" | "quiet";

export function Btn(props: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  size?: "sm" | "md";
  disabled?: boolean;
  title?: string;
  full?: boolean;
  style?: React.CSSProperties;
}): React.ReactElement {
  const {
    children,
    onClick,
    variant = "ghost",
    size = "md",
    disabled = false,
    title,
    full,
    style,
  } = props;
  const palette: Record<BtnVariant, React.CSSProperties> = {
    primary: {
      background: "linear-gradient(180deg,#3f5fa8,#2c4379)",
      border: "1px solid #5577c4",
      color: "#eef4ff",
    },
    gold: {
      background: "linear-gradient(180deg,#e7c46a,#c49a3a)",
      border: "1px solid #f0d68f",
      color: "#2a2109",
      fontWeight: 700,
    },
    ghost: {
      background: colors.panel2,
      border: `1px solid ${colors.border}`,
      color: colors.text,
    },
    danger: {
      background: "linear-gradient(180deg,#7a2b34,#4d1a22)",
      border: "1px solid #a2434f",
      color: "#ffe3e6",
    },
    quiet: {
      background: "transparent",
      border: `1px solid ${colors.borderSoft}`,
      color: colors.muted,
    },
  };
  return (
    <button
      type="button"
      className="dcf-btn"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={{
        ...palette[variant],
        padding: size === "sm" ? "4px 9px" : "7px 14px",
        borderRadius: radius.sm,
        fontSize: size === "sm" ? 12 : 13,
        lineHeight: 1.35,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        width: full ? "100%" : undefined,
        fontFamily: "inherit",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function Chip(props: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  tone?: "gold" | "blue" | "plain";
  title?: string;
}): React.ReactElement {
  const { children, active = false, onClick, tone = "gold", title } = props;
  const activeColor =
    tone === "blue" ? colors.blue : tone === "plain" ? colors.text : colors.gold;
  return (
    <button
      type="button"
      className="dcf-chip"
      title={title}
      onClick={onClick}
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontFamily: "inherit",
        cursor: onClick ? "pointer" : "default",
        border: `1px solid ${active ? activeColor : colors.border}`,
        background: active ? "rgba(231,196,106,0.14)" : colors.panel2,
        color: active ? activeColor : colors.muted,
      }}
    >
      {children}
    </button>
  );
}

export function Field(props: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}): React.ReactElement {
  return (
    <label style={{ display: "block", ...props.style }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 4,
        }}
      >
        <span style={{ fontSize: 12, color: colors.muted }}>{props.label}</span>
        {props.hint ? (
          <span style={{ fontSize: 11, color: colors.faint }}>{props.hint}</span>
        ) : null}
      </div>
      {props.children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "6px 9px",
  borderRadius: radius.sm,
  border: `1px solid ${colors.border}`,
  background: colors.bgSoft,
  color: colors.text,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
};

export function TextInput(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  list?: string;
  style?: React.CSSProperties;
}): React.ReactElement {
  if (props.multiline) {
    return (
      <textarea
        value={props.value}
        rows={props.rows ?? 3}
        placeholder={props.placeholder}
        onChange={(event) => props.onChange(event.target.value)}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.55, ...props.style }}
      />
    );
  }
  return (
    <input
      value={props.value}
      list={props.list}
      placeholder={props.placeholder}
      onChange={(event) => props.onChange(event.target.value)}
      style={{ ...inputStyle, ...props.style }}
    />
  );
}

export function NumInput(props: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}): React.ReactElement {
  const { value, onChange, min = 0, max = 999999, step = 1, suffix } = props;
  return (
    <div style={{ position: "relative" }}>
      <input
        type="number"
        value={String(value)}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (!Number.isFinite(parsed)) return;
          onChange(Math.max(min, Math.min(max, Math.round(parsed))));
        }}
        style={{ ...inputStyle, paddingRight: suffix ? 30 : 9 }}
      />
      {suffix ? (
        <span
          style={{
            position: "absolute",
            right: 9,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 11,
            color: colors.faint,
            pointerEvents: "none",
          }}
        >
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

export function Toggle(props: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}): React.ReactElement {
  const { checked, onChange, label, hint } = props;
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        gap: 10,
        padding: "8px 10px",
        background: colors.panel2,
        border: `1px solid ${checked ? "rgba(231,196,106,0.55)" : colors.border}`,
        borderRadius: radius.md,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      <span
        style={{
          width: 34,
          height: 18,
          borderRadius: 999,
          background: checked ? colors.gold : "#3b466a",
          position: "relative",
          flexShrink: 0,
          transition: "background .15s ease",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 14,
            height: 14,
            borderRadius: "50%",
            background: checked ? "#2a2109" : "#c9d3ee",
            transition: "left .15s ease",
          }}
        />
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: 13, color: colors.text }}>{label}</span>
        {hint ? (
          <span style={{ display: "block", fontSize: 11, color: colors.faint, marginTop: 2 }}>
            {hint}
          </span>
        ) : null}
      </span>
    </button>
  );
}

export function Select<T extends string>(props: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}): React.ReactElement {
  return (
    <select
      value={props.value}
      onChange={(event) => props.onChange(event.target.value as T)}
      style={{ ...inputStyle, cursor: "pointer" }}
    >
      {props.options.map((option) => (
        <option key={option.value} value={option.value} style={{ background: colors.panel }}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Panel(props: {
  title?: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: React.CSSProperties;
  bodyStyle?: React.CSSProperties;
}): React.ReactElement {
  return (
    <section
      style={{
        background: colors.panel,
        border: `1px solid ${colors.borderSoft}`,
        borderRadius: radius.lg,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        ...props.style,
      }}
    >
      {props.title ? (
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 12px",
            borderBottom: `1px solid ${colors.borderSoft}`,
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: colors.goldSoft }}>
              {props.title}
            </div>
            {props.subtitle ? (
              <div style={{ fontSize: 11, color: colors.faint, marginTop: 2 }}>
                {props.subtitle}
              </div>
            ) : null}
          </div>
          {props.right}
        </header>
      ) : null}
      <div style={{ padding: 12, minHeight: 0, ...props.bodyStyle }}>{props.children}</div>
    </section>
  );
}

export function Empty(props: { text: string }): React.ReactElement {
  return (
    <div
      style={{
        padding: "28px 12px",
        textAlign: "center",
        color: colors.faint,
        fontSize: 12,
        lineHeight: 1.7,
      }}
    >
      {props.text}
    </div>
  );
}

export function StatBar(props: {
  label: string;
  value: number;
  max: number;
  color: string;
  text?: string;
}): React.ReactElement {
  const ratio = props.max > 0 ? Math.max(0, Math.min(1, props.value / props.max)) : 0;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: colors.muted,
          marginBottom: 3,
        }}
      >
        <span>{props.label}</span>
        <span style={{ color: colors.text }}>{props.text ?? props.value}</span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: "#0b1020",
          border: `1px solid ${colors.borderSoft}`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${ratio * 100}%`,
            height: "100%",
            background: props.color,
            transition: "width .3s ease",
          }}
        />
      </div>
    </div>
  );
}
