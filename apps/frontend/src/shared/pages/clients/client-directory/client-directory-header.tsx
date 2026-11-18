import { cn } from "cn";
import { Search, X } from "lucide-react";
import { type ReactNode, useId } from "react";
import { Input } from "@/shared/components/ui/input";

type ClientDirectorySearchProps = {
	value: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
};

export function ClientDirectoryHeader({ children }: { children: ReactNode }) {
	return (
		<div
			className={cn(
				"sticky top-14 z-20 isolate shrink-0",
				"border-b border-border/70 pb-4",
				"bg-card pt-4 backdrop-blur-[100px] sm:pt-5",
				"xl:static xl:bg-transparent xl:backdrop-blur-none",
			)}
		>
			{children}
		</div>
	);
}

export function ClientDirectoryTitle({
	children = "Directorio de clientes",
}: {
	children?: ReactNode;
}) {
	return (
		<p className="px-1 text-sm font-semibold tracking-tight">{children}</p>
	);
}

export function ClientDirectoryCount({ count }: { count: number }) {
	return (
		<span className="text-xs text-muted-foreground">
			Mostrando:{" "}
			<span className="font-mono text-xs font-semibold tabular-nums text-foreground">
				{count}
			</span>
		</span>
	);
}

export function ClientDirectorySearch({
	value,
	onValueChange,
	placeholder = "Buscar por nombre, correo o teléfono...",
}: ClientDirectorySearchProps) {
	const inputId = useId();

	return (
		<div className="relative">
			<label htmlFor={inputId} className="sr-only">
				Buscar clientes
			</label>

			<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

			<Input
				id={inputId}
				type="search"
				value={value}
				onChange={(event) => onValueChange(event.target.value)}
				placeholder={placeholder}
				className="h-11 bg-background/60 pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden"
			/>

			{value && (
				<button
					type="button"
					aria-label="Limpiar búsqueda"
					onClick={() => onValueChange("")}
					className={cn(
						"absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md",
						"text-muted-foreground transition-colors",
						"hover:bg-accent hover:text-foreground",
						"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
					)}
				>
					<X className="size-3.5" />
				</button>
			)}
		</div>
	);
}
