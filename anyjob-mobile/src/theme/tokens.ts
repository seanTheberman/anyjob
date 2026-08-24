export type AppColors = {
  brand: string;
  brandDark: string;
  ink: string;
  muted: string;
  subtle: string;
  line: string;
  canvas: string;
  surface: string;
  elevated: string;
  soft: string;
  softStrong: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
  danger: string;
  overlay: string;
  tabBar: string;
};

export const lightColors: AppColors = {
  brand: "#ef0a16",
  brandDark: "#bd0812",
  ink: "#151515",
  muted: "#656a73",
  subtle: "#9297a1",
  line: "#e6e7e9",
  canvas: "#f7f8f8",
  surface: "#ffffff",
  elevated: "#ffffff",
  soft: "#f1f3f3",
  softStrong: "#e8ebeb",
  success: "#087a55",
  successSoft: "#e8f7f0",
  warning: "#9a5900",
  warningSoft: "#fff4dc",
  info: "#3659a2",
  infoSoft: "#edf2ff",
  danger: "#c92828",
  overlay: "rgba(0,0,0,.36)",
  tabBar: "#ffffff",
};

export const darkColors: AppColors = {
  brand: "#ff3944",
  brandDark: "#ff6a72",
  ink: "#f7f7f5",
  muted: "#a9adb5",
  subtle: "#7d828c",
  line: "#2c2f33",
  canvas: "#111315",
  surface: "#191c1f",
  elevated: "#202428",
  soft: "#25292d",
  softStrong: "#30353a",
  success: "#49d7a3",
  successSoft: "#18372d",
  warning: "#ffc267",
  warningSoft: "#3c2d17",
  info: "#9bb9ff",
  infoSoft: "#1d2b4b",
  danger: "#ff7575",
  overlay: "rgba(0,0,0,.48)",
  tabBar: "#171a1d",
};

// Legacy light palette for screens that have not yet opted into live theme styles.
export const colors = lightColors;
export const radius = { sm: 6, md: 10, lg: 14, xl: 20 };
export const shadow = {
  boxShadow: "0 5px 14px rgba(0, 0, 0, 0.09)",
  elevation: 3,
};
