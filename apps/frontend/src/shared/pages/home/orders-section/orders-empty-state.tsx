import { ClipboardList, SearchX } from "lucide-react";

interface OrdersEmptyStateProps {
	hasFilters: boolean;
}

export function OrdersEmptyState({ hasFilters }: OrdersEmptyStateProps) {
	const Icon = hasFilters ? SearchX : ClipboardList;

	return (
		<div className="flex  flex-col items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/20 px-5 py-10 text-center lg:min-h-full">
			<Icon
				className="size-6 mb-2 text-muted-foreground/70"
				strokeWidth={1.7}
			/>

			<h3 className="text-base font-semibold tracking-tight">
				{hasFilters ? "No encontramos órdenes" : "Todavía no hay órdenes"}
			</h3>

			<p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
				{hasFilters
					? "No hay órdenes que coincidan con tu búsqueda. Prueba con otro término o cambia los filtros."
					: "Las órdenes de servicio que se registren en este espacio aparecerán aquí."}
			</p>
		</div>
	);
}
