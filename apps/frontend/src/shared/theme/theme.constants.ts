/**
 * Clave de persistencia del tema. Se mantiene la misma que usaba el toggle
 * original para no perder la preferencia de usuarios existentes.
 */
export const THEME_STORAGE_KEY = "serviceflow-theme";

export const THEME_MEDIA_QUERY = "(prefers-color-scheme: dark)";

/** Preferencia elegida por el usuario. `system` sigue al sistema operativo. */
export type ThemePreference = "system" | "light" | "dark";

/** Tema efectivo que se aplica al documento. */
export type ResolvedTheme = "light" | "dark";

/**
 * Color de la barra del navegador / PWA por tema.
 * Deben coincidir con `--background` en `main.css` y con el script inline
 * anti-FOUC de `index.html`.
 */
export const THEME_COLORS = {
	light: "#e9f6fd",
	dark: "#121212",
} as const satisfies Record<ResolvedTheme, string>;
