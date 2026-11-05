import { use } from "react";
import { ThemeContext, type ThemeContextValue } from "./theme-context";

/**
 * Acceso al tema de la aplicación.
 * Debe usarse dentro de `<ThemeProvider>`.
 */
export function useTheme(): ThemeContextValue {
	const context = use(ThemeContext);

	if (!context) {
		throw new Error("useTheme debe usarse dentro de <ThemeProvider>.");
	}

	return context;
}
