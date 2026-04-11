import type { CSSProperties } from "react";

export type ThemeMode = "light" | "dark";

export interface ThemeBoundaryAttrs {
  "data-theme": ThemeMode;
  className: ThemeMode;
  style: CSSProperties;
}

export function getThemeBoundaryAttrs(theme: ThemeMode): ThemeBoundaryAttrs {
  return {
    "data-theme": theme,
    className: theme,
    style: { colorScheme: theme },
  };
}
