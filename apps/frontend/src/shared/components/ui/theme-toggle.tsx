import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./button";

export function ThemeToggle() {
	const [isDark, setIsDark] = useState(false);

	useEffect(() => {
		const storedTheme = window.localStorage.getItem("serviceflow-theme");
		const prefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches;
		const shouldUseDark = storedTheme ? storedTheme === "dark" : prefersDark;
		document.documentElement.classList.toggle("dark", shouldUseDark);
		setIsDark(shouldUseDark);
	}, []);

	function toggleTheme() {
		const nextIsDark = !isDark;
		document.documentElement.classList.toggle("dark", nextIsDark);
		window.localStorage.setItem(
			"serviceflow-theme",
			nextIsDark ? "dark" : "light",
		);
		setIsDark(nextIsDark);
	}

	return (
		<Button
			type="button"
			variant="glass"
			size="icon"
			onClick={toggleTheme}
			aria-label={isDark ? "Usar modo claro" : "Usar modo oscuro"}
			title={isDark ? "Usar modo claro" : "Usar modo oscuro"}
		>
			{isDark ? <Sun /> : <Moon />}
		</Button>
	);
}
