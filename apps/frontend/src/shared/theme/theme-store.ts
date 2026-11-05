import {
	type ResolvedTheme,
	THEME_MEDIA_QUERY,
	THEME_STORAGE_KEY,
	type ThemePreference,
} from "./theme.constants";
import {
	applyTheme,
	getSystemTheme,
	readStoredTheme,
	resolveTheme,
	writeStoredTheme,
} from "./theme-storage";

export type ThemeSnapshot = {
	preference: ThemePreference;
	system: ResolvedTheme;
	resolved: ResolvedTheme;
};

type ThemeListener = () => void;

const listeners = new Set<ThemeListener>();

let mediaQuery: MediaQueryList | null = null;
let snapshot = computeSnapshot(readStoredTheme());

function computeSnapshot(preference: ThemePreference): ThemeSnapshot {
	const system = getSystemTheme();

	return {
		preference,
		system,
		resolved: resolveTheme(preference, system),
	};
}

function emit(next: ThemeSnapshot): void {
	snapshot = next;

	for (const listener of listeners) listener();
}

function handleSystemChange(): void {
	// Con una preferencia explícita el SO ya no manda.
	if (snapshot.preference !== "system") return;

	const next = computeSnapshot("system");
	if (next.resolved === snapshot.resolved) return;

	applyTheme(next.resolved);
	emit(next);
}

function handleStorage(event: StorageEvent): void {
	if (event.key !== null && event.key !== THEME_STORAGE_KEY) return;

	const preference = readStoredTheme();
	if (preference === snapshot.preference) return;

	const next = computeSnapshot(preference);
	applyTheme(next.resolved);
	emit(next);
}

function attachListeners(): void {
	if (typeof window === "undefined") return;

	mediaQuery = window.matchMedia(THEME_MEDIA_QUERY);
	mediaQuery.addEventListener("change", handleSystemChange);
	window.addEventListener("storage", handleStorage);
}

function detachListeners(): void {
	mediaQuery?.removeEventListener("change", handleSystemChange);
	mediaQuery = null;

	if (typeof window === "undefined") return;
	window.removeEventListener("storage", handleStorage);
}

/** Snapshot estable para `useSyncExternalStore`. */
export function getThemeSnapshot(): ThemeSnapshot {
	return snapshot;
}

export function subscribeToTheme(listener: ThemeListener): () => void {
	listeners.add(listener);
	if (listeners.size === 1) attachListeners();

	return () => {
		listeners.delete(listener);
		if (listeners.size === 0) detachListeners();
	};
}

/**
 * Guarda la preferencia, aplica el tema de inmediato (feedback sin esperar al
 * render) y notifica a los suscriptores.
 */
export function setThemePreference(preference: ThemePreference): void {
	if (preference === snapshot.preference) return;

	writeStoredTheme(preference);

	const next = computeSnapshot(preference);
	applyTheme(next.resolved);
	emit(next);
}
