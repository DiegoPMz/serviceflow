import { SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/shared/components/ui/button";

export function ClientDirectoryList({ children }: { children: ReactNode }) {
	return (
		<div
			aria-live="polite"
			className="mt-2 min-h-0 min-w-0 flex-1 xl:overflow-y-auto"
		>
			{children}
		</div>
	);
}

export function ClientDirectoryEmpty({
	query,
	onClear,
	title = "No encontramos clientes",
	description = "Prueba con otro nombre, correo o teléfono.",
}: {
	query?: string;
	onClear?: () => void;
	title?: string;
	description?: string;
}) {
	return (
		<div className="grid min-h-40 place-items-center p-6 text-center">
			<div>
				<SearchX className="mx-auto size-6 text-muted-foreground" />

				<p className="mt-3 text-sm font-semibold">{title}</p>

				<p className="mt-1 text-xs text-muted-foreground">{description}</p>

				{query && onClear && (
					<Button variant="ghost" size="sm" className="mt-3" onClick={onClear}>
						Limpiar búsqueda
					</Button>
				)}
			</div>
		</div>
	);
}
