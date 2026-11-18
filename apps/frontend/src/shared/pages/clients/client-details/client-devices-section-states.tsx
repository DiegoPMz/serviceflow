import { cn } from "cn";
import { AlertCircle, Printer, RefreshCw, Search } from "lucide-react";
import { IconContainer } from "@/shared/components/icon-container";
import { Button } from "@/shared/components/ui/button";

export function ClientDevicesError({ onRetry }: { onRetry: () => void }) {
	return (
		<div
			role="alert"
			className="flex flex-col items-center justify-center rounded-xl border border-border/70 bg-card p-6 text-center"
		>
			<IconContainer
				className="size-10"
				iconClassName="text-destructive size-7"
				icon={AlertCircle}
			/>

			<p className="mt-4 text-sm font-semibold">
				No se pudieron cargar los dispositivos
			</p>

			<p className="mt-1 max-w-xs text-xs text-muted-foreground">
				Ocurrió un problema al consultar los dispositivos de este cliente.
			</p>

			<Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
				<RefreshCw className="size-3.5" />
				Reintentar
			</Button>
		</div>
	);
}

type ClientDevicesEmptyProps = {
	searching?: boolean;
	className?: string;
};

export function ClientDevicesEmpty({
	searching = false,
	className,
}: ClientDevicesEmptyProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center rounded-lg border border-border border-dashed px-4 py-10 text-center",
				className,
			)}
		>
			<div className="mb-3">
				<IconContainer icon={searching ? Search : Printer} />
			</div>

			<p className="text-sm font-medium">
				{searching
					? "No se encontraron dispositivos"
					: "Sin dispositivos registrados"}
			</p>

			<p className="mt-1 max-w-xs text-xs text-muted-foreground">
				{searching
					? "Intenta modificar los términos de búsqueda."
					: "Los dispositivos asociados a este cliente aparecerán aquí."}
			</p>
		</div>
	);
}
