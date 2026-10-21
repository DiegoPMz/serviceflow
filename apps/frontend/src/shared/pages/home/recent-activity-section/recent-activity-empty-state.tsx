/** biome-ignore-all lint/suspicious/noArrayIndexKey: lista estática de marcadores visuales */

export function RecentActivityEmptyState() {
	return (
		<div className="mt-5 flex min-w-0 flex-1 flex-col ">
			{/* Empty timeline */}
			<ol
				aria-hidden="true"
				className="relative flex flex-col gap-4 before:absolute before:bottom-2 before:left-0.75 before:top-2 before:border-l before:border-dashed before:border-border/70"
			>
				{Array.from({ length: 4 }, (_, index) => (
					<li key={index} className="relative flex h-4 items-center">
						<span className="relative z-10 size-2 shrink-0 rounded-full border border-border bg-card ring-4 ring-card" />
					</li>
				))}
			</ol>

			{/* Empty state message */}
			<div className="mt-5 border-t border-border/70 pt-5">
				<p className="text-sm font-medium leading-5 text-card-foreground">
					Aún no hay movimientos
				</p>

				<p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
					Cuando se registren órdenes o cambios de estado, aparecerán aquí con
					su fecha y hora.
				</p>
			</div>
		</div>
	);
}
