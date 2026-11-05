import {
	type ResolvedTheme,
	THEME_COLORS,
	THEME_MEDIA_QUERY,
	THEME_STORAGE_KEY,
	type ThemePreference,
} from "./theme.constants";

function isThemePreference(value: string): value is ThemePreference {
	return value === "system" || value === "light" || value === "dark";
}

/**
 * Lee la preferencia guardada. Un valor ausente o corrupto se interpreta como
 * `system` (y se limpia) para que el tema vuelva a seguir al sistema operativo.
 */
export function readStoredTheme(): ThemePreference {
	if (typeof window === "undefined") return "system";

	try {
		const stored = window.localStorage.getItem(THEME_STORAGE_KEY);

		if (stored === null) return "system";
		if (isThemePreference(stored)) return stored;

		window.localStorage.removeItem(THEME_STORAGE_KEY);
		return "system";
	} catch {
		return "system";
	}
}

/**
 * Persiste la preferencia. `system` elimina la clave para que el sistema vuelva
 * a mandar y la próxima visita arranque en modo automático.
 */
export function writeStoredTheme(preference: ThemePreference): void {
	if (typeof window === "undefined") return;

	try {
		if (preference === "system") {
			window.localStorage.removeItem(THEME_STORAGE_KEY);
			return;
		}

		window.localStorage.setItem(THEME_STORAGE_KEY, preference);
	} catch {
		// Almacenamiento no disponible (modo privado, cuota): el tema sigue en memoria.
	}
}

export function getSystemTheme(): ResolvedTheme {
	if (typeof window === "undefined") return "light";

	return window.matchMedia(THEME_MEDIA_QUERY).matches ? "dark" : "light";
}

export function resolveTheme(
	preference: ThemePreference,
	system: ResolvedTheme,
): ResolvedTheme {
	return preference === "system" ? system : preference;
}

/** Aplica el tema al documento: clase `dark`, `color-scheme` y `theme-color`. */
export function applyTheme(theme: ResolvedTheme): void {
	if (typeof document === "undefined") return;

	const root = document.documentElement;
	root.classList.toggle("dark", theme === "dark");
	root.style.colorScheme = theme;

	document
		.querySelector('meta[name="theme-color"]')
		?.setAttribute("content", THEME_COLORS[theme]);
}
