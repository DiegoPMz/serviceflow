import {
	createContext,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useSyncExternalStore,
} from "react";
import type { ResolvedTheme, ThemePreference } from "./theme.constants";
import { applyTheme } from "./theme-storage";
import {
	getThemeSnapshot,
	setThemePreference,
	subscribeToTheme,
} from "./theme-store";

export type ThemeContextValue = {
	/** Preferencia elegida por el usuario (`system` | `light` | `dark`). */
	preference: ThemePreference;
	/** Tema efectivo aplicado al documento. */
	resolvedTheme: ResolvedTheme;
	/** Tema que reporta `window.matchMedia` en este momento. */
	systemTheme: ResolvedTheme;
	setPreference: (preference: ThemePreference) => void;
	/** Alterna claro/oscuro y persiste la elección explícita. */
	toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
	const snapshot = useSyncExternalStore(
		subscribeToTheme,
		getThemeSnapshot,
		getThemeSnapshot,
	);

	const { preference, resolved, system } = snapshot;

	// Sincroniza el documento al montar y tras cualquier cambio de tema.
	useEffect(() => {
		applyTheme(resolved);
	}, [resolved]);

	const setPreference = useCallback((next: ThemePreference) => {
		setThemePreference(next);
	}, []);

	const toggleTheme = useCallback(() => {
		setThemePreference(resolved === "dark" ? "light" : "dark");
	}, [resolved]);

	const value = useMemo<ThemeContextValue>(
		() => ({
			preference,
			resolvedTheme: resolved,
			systemTheme: system,
			setPreference,
			toggleTheme,
		}),
		[preference, resolved, system, setPreference, toggleTheme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}
