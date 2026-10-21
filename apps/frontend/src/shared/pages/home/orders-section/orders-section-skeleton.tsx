/** biome-ignore-all lint/suspicious/noArrayIndexKey: lista estática de marcadores de carga */

import { Skeleton } from "@/shared/components/ui/skeleton";

export function OrdersSectionSkeleton() {
	return (
		<>
			{/* Buscador */}
			<div className="mt-4 flex flex-col gap-2 sm:flex-row">
				<Skeleton className="h-8 min-w-0 flex-1 rounded-lg" />
				<Skeleton className="h-8 w-full rounded-lg sm:w-40" />
			</div>

			{/* Lista de órdenes */}
			<div className="mt-3 h-full lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
				<div className="space-y-2">
					{Array.from({ length: 5 }).map((_, index) => (
						<div
							key={index}
							className="flex w-full min-w-0 flex-col gap-2 rounded-xl border border-border/70 bg-card p-4"
						>
							{/* Folio, estado y fecha */}
							<div className="flex min-w-0 items-start justify-between gap-3">
								<div className="flex min-w-0 flex-wrap items-center gap-2">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-5 w-20 rounded-full" />
								</div>

								<div className="flex shrink-0 items-center gap-1.5 pt-0.5">
									<Skeleton className="size-3.5 shrink-0" />
									<Skeleton className="h-3 w-10" />
								</div>
							</div>

							{/* Cliente y dispositivo */}
							<div className="min-w-0">
								<Skeleton className="h-5 w-32" />

								<div className="mt-1.5 flex min-w-0 items-center gap-1.5">
									<Skeleton className="size-3.5 shrink-0" />
									<Skeleton className="h-4 w-44 max-w-full" />
								</div>
							</div>

							{/* Responsable */}
							<div className="flex min-w-0 items-center gap-2.5 border-t border-border/70 pt-3">
								<Skeleton className="size-7 shrink-0 rounded-full" />

								<div className="min-w-0 flex-1 space-y-1.5">
									<Skeleton className="h-2.5 w-14" />
									<Skeleton className="h-3.5 w-24" />
								</div>

								<Skeleton className="size-4 shrink-0" />
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Paginación */}
			<div className="flex w-full flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
				<Skeleton className="mx-auto h-3 w-40 sm:mx-0" />

				<div className="flex items-center gap-1">
					<Skeleton className="h-9 w-20 rounded-lg" />
					<Skeleton className="size-9 rounded-lg" />
					<Skeleton className="size-9 rounded-lg" />
					<Skeleton className="size-9 rounded-lg" />
					<Skeleton className="h-9 w-20 rounded-lg" />
				</div>
			</div>
		</>
	);
}
