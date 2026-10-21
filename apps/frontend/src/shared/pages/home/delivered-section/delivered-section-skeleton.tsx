import { Skeleton } from "@/shared/components/ui/skeleton";

export function DeliveredSectionSkeleton() {
	return (
		<section className="animate-rise rounded-xl border border-border/70 bg-card p-4 sm:p-5">
			{/* Summary */}
			<div className="flex min-w-0 items-center gap-2">
				<Skeleton className="h-9 w-10 shrink-0" />

				<div className="flex min-w-0 items-center gap-2.5">
					<Skeleton className="size-8 shrink-0 rounded-xl" />

					<div className="min-w-0 space-y-1">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-20" />
					</div>
				</div>
			</div>

			{/* Latest delivery */}
			<div className="mt-4 flex min-w-0 items-center gap-3 border-t border-border/70 pt-3">
				<Skeleton className="size-6.5 shrink-0 rounded-sm" />

				<div className="min-w-0 flex-1 space-y-1">
					<Skeleton className="h-3 w-24" />
					<Skeleton className="h-3.5 w-32" />
				</div>
			</div>
		</section>
	);
}
