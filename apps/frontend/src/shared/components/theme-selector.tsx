import { Monitor, Moon, Sun } from "lucide-react";
import { type ThemePreference, useTheme } from "@/shared/theme";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

const THEME_OPTIONS = [
	{ value: "system", label: "Sistema", icon: Monitor },
	{ value: "light", label: "Claro", icon: Sun },
	{ value: "dark", label: "Oscuro", icon: Moon },
] as const satisfies ReadonlyArray<{
	value: ThemePreference;
	label: string;
	icon: typeof Monitor;
}>;

export function ThemeSelector() {
	const { preference, setPreference } = useTheme();

	return (
		<ToggleGroup
			aria-label="Tema de la aplicación"
			variant="outline"
			size="sm"
			spacing={0}
			value={[preference]}
			onValueChange={(values) => {
				// Base UI permite deseleccionar el ítem activo; el tema siempre
				// debe tener una opción elegida.
				const next = values[0];
				if (next === "system" || next === "light" || next === "dark") {
					setPreference(next);
				}
			}}
		>
			{THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
				<ToggleGroupItem key={value} value={value} className="gap-1.5 px-3">
					<Icon aria-hidden="true" />
					<span>{label}</span>
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);
}
