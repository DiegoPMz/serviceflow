/** biome-ignore-all lint/suspicious/noArrayIndexKey: lista estática de marcadores de carga */

import { Skeleton } from "@/shared/components/ui/skeleton";

export function RecentActivitySectionSkeleton() {
	return (
		<section className="animate-rise h-full flex min-w-0 flex-1 flex-col rounded-xl border border-border/70 bg-card p-4 sm:p-5">
			{/* Header */}
			<div className="flex min-w-0 items-center gap-3">
				<Skeleton className="size-6.5 shrink-0 rounded-sm" />

				<div className="min-w-0 flex-1 space-y-0.5">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-4 w-48" />
				</div>
			</div>

			{/* Activity timeline */}
			<ol className="relative mt-5 flex min-w-0 flex-col gap-4 before:absolute before:bottom-2 before:left-0.75 before:top-2 before:w-0.5 before:bg-border before:content-['']">
				{Array.from({ length: 4 }).map((_, index) => (
					<li key={index} className="relative flex min-w-0 gap-3">
						<Skeleton className="relative z-10 mt-1.5 size-2 shrink-0 rounded-full ring-4 ring-card" />

						<div className="min-w-0 flex-1 space-y-1">
							<Skeleton className="h-5 w-40" />
							<Skeleton className="h-4 w-20" />
						</div>
					</li>
				))}
			</ol>
		</section>
	);
}
