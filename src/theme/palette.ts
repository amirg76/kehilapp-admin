/**
 * The palette, in the form MUI needs it.
 *
 * This is a MIRROR of the custom properties in src/styles/tokens.scss, which is
 * where the reasoning and the measured contrast ratios are written down. It
 * exists separately because `createTheme` is JavaScript: it has to be handed
 * real colour values, and a `var(--text)` string would be passed straight
 * through to MUI's own colour maths (alpha(), getContrastRatio()) and throw.
 *
 * If a colour changes, change it in BOTH files. Everything MUI draws — the
 * DataGrid's toolbar, its column menu, its filter panel, the pagination row,
 * every portalled popover — takes its colours from here, and everything the
 * app's own SCSS draws takes them from there. They are the same surface to a
 * user and any drift between them shows up immediately as two greys.
 */

export type ModePalette = {
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  border: string;
  borderStrong: string;
  text: string;
  text2: string;
  text3: string;
  accent: string;
  accentHover: string;
  accentFill: string;
  onAccent: string;
  danger: string;
};

/** Measured against #ffffff / #f5f7fb — see tokens.scss for every ratio. */
export const light: ModePalette = {
  bg: "#f5f7fb",
  surface: "#ffffff",
  surface2: "#edf1f8",
  surface3: "#e4eaf5",
  border: "#d8e0ee",
  borderStrong: "#b9c4d9",
  text: "#0f172a", // 17.85:1 on surface
  text2: "#48546b", //  7.62:1 on surface
  text3: "#5a6579", //  5.88:1 on surface
  accent: "#4f46e5",
  accentHover: "#4338ca",
  accentFill: "#4f46e5",
  onAccent: "#ffffff", // 6.29:1 on the fill
  danger: "#b42318", // white on it = 6.57:1
};

/** Measured against #1c2434 / #131a28 — see tokens.scss for every ratio. */
export const dark: ModePalette = {
  bg: "#131a28",
  surface: "#1c2434",
  surface2: "#232d40",
  surface3: "#2c3a52",
  border: "#313d54",
  borderStrong: "#46546f",
  text: "#f1f5f9", // 14.19:1 on surface
  text2: "#b3becf", //  8.28:1 on surface
  text3: "#9aa6ba", //  6.32:1 on surface
  accent: "#818cf8",
  accentHover: "#a5b4fc",
  accentFill: "#4f46e5",
  onAccent: "#ffffff", // 6.29:1 on the fill
  danger: "#b42318",
};
