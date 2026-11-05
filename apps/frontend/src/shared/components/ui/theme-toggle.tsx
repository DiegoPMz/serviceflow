import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/shared/theme";
import { Button } from "./button";

export function ThemeToggle() {
	const { resolvedTheme, toggleTheme } = useTheme();
	const isDark = resolvedTheme === "dark";
	const label = isDark ? "Usar modo claro" : "Usar modo oscuro";

	return (
		<Button
			type="button"
			variant="glass"
			size="icon"
			onClick={toggleTheme}
			aria-label={label}
			aria-pressed={isDark}
			title={label}
		>
			{isDark ? <Sun /> : <Moon />}
		</Button>
	);
}
