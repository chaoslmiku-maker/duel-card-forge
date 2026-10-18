/** 统一的视觉变量：深色底 + 金色描边，贴近决斗盘质感。 */
export const colors = {
  bg: "#0d1220",
  bgSoft: "#141a2c",
  panel: "#192034",
  panel2: "#202943",
  panel3: "#273354",
  border: "#2f3c63",
  borderSoft: "#26314f",
  text: "#eaeefb",
  muted: "#9aa7c9",
  faint: "#6d7a9c",
  gold: "#e7c46a",
  goldSoft: "#f4e3b0",
  red: "#ff7373",
  redSoft: "#5c2430",
  green: "#5fd6a2",
  greenSoft: "#1d4a3c",
  blue: "#74aaff",
  blueSoft: "#1e3358",
  purple: "#b58cff",
  orange: "#ffab5e",
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
};

export const shadow = {
  card: "0 8px 20px rgba(0,0,0,0.45)",
  panel: "0 10px 30px rgba(0,0,0,0.35)",
};

/** 属性 → 卡框主色。 */
export const attributeGradient: Record<string, string> = {
  light: "linear-gradient(140deg,#fff3c4,#e7c46a 45%,#b48a2c)",
  dark: "linear-gradient(140deg,#6c5a92,#3a2f5c 45%,#221a38)",
  earth: "linear-gradient(140deg,#c9a877,#8d6b3f 45%,#5a4227)",
  water: "linear-gradient(140deg,#9fd8ff,#4a90c8 45%,#22557a)",
  fire: "linear-gradient(140deg,#ffb27a,#e2622f 45%,#8f2c14)",
  wind: "linear-gradient(140deg,#b7f0cf,#4fb182 45%,#276b52)",
  divine: "linear-gradient(140deg,#ffe9a8,#d8a3ff 50%,#7a5bd6)",
};

/** 卡种 → 卡面底色。 */
export const kindSurface: Record<string, string> = {
  monster: "#f6efdb",
  spell: "#e8f2e4",
  trap: "#f4e6ee",
};

export const kindAccent: Record<string, string> = {
  monster: "#8a6a2f",
  spell: "#3f6b52",
  trap: "#7a3f5e",
};
