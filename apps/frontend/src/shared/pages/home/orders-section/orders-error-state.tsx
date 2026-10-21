import { CloudOff, RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

interface OrdersErrorStateProps {
	onRetry: () => void;
	isRetrying: boolean;
}

export function OrdersErrorState({
	onRetry,
	isRetrying,
}: OrdersErrorStateProps) {
	return (
		<div className="flex min-h-80 flex-col items-center justify-center rounded-lg border  border-border/70 bg-muted/20 px-5 py-10 text-center lg:min-h-full">
			<div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-sidebar-accent text-sidebar-foreground/70">
				<CloudOff className="size-6 text-destructive" strokeWidth={1.7} />
			</div>

			<p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
				Órdenes no disponibles
			</p>

			<h3 className="text-base font-semibold tracking-tight">
				No pudimos cargar las órdenes
			</h3>

			<p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
				Ocurrió un problema al obtener las órdenes de servicio. Inténtalo de
				nuevo en unos momentos.
			</p>

			<Button
				className="mt-4"
				variant="outline"
				size="sm"
				onClick={onRetry}
				disabled={isRetrying}
			>
				<RefreshCw
					className={`mr-2 size-4 ${isRetrying ? "animate-spin" : ""}`}
				/>
				{isRetrying ? "Reintentando..." : "Reintentar"}
			</Button>
		</div>
	);
}
