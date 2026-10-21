import { Skeleton } from "@/shared/components/ui/skeleton";

export function QuickActionsSectionSkeleton() {
	return (
		<section className="animate-rise rounded-xl border border-border/70 bg-card p-4 sm:p-5">
			{/* Header */}
			<div className="mb-4 flex items-center gap-3">
				<Skeleton className="size-6.5 shrink-0 rounded-sm" />

				<div className="min-w-0 space-y-0.5">
					<Skeleton className="h-5 w-32" />
					<Skeleton className="h-4 w-24" />
				</div>
			</div>

			<div className="grid grid-cols-2 gap-2">
				{/* Primary action */}
				<Skeleton className="col-span-2 h-9 rounded-lg" />

				{/* Secondary actions */}
				<Skeleton className="h-7 rounded-lg" />
				<Skeleton className="h-7 rounded-lg" />

				{/* Optional invite action */}
				<Skeleton className="col-span-2 h-9 rounded-lg" />
			</div>
		</section>
	);
}
