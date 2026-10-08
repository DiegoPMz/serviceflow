import { Skeleton } from "@/shared/components/ui/skeleton";
import { WorkspaceShellSkeleton } from "@/shared/layouts/workspace-shell-skeleton";
import { DeliveredSectionSkeleton } from "./delivered-section-skeleton";
import { OrdersSectionSkeleton } from "./orders-section-skeleton";
import { RecentActivitySectionSkeleton } from "./recent-activity-section-skeleton";

export function HomeRouteSkeleton() {
	return (
		<WorkspaceShellSkeleton>
			<HomePageSkeleton />
		</WorkspaceShellSkeleton>
	);
}

export function HomePageSkeleton() {
	return (
		<main className="px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-8">
			{/* Page heading */}
			<header className="mb-6">
				<Skeleton className="h-3 w-14" />

				<Skeleton className="mt-2 h-9 w-72 max-w-full lg:h-10 lg:w-96" />

				<Skeleton className="mt-2 h-4 w-full max-w-2xl" />
			</header>

			{/* Home content */}
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
				{/* Orders */}
				<section className="glass-panel rounded-xl p-4 sm:p-5 lg:col-span-8">
					<div className="flex items-center gap-2">
						<Skeleton className="size-4 rounded" />
						<Skeleton className="h-5 w-20" />
						<Skeleton className="hidden h-5 w-20 rounded-full sm:block" />
					</div>

					<OrdersSectionSkeleton />
				</section>

				{/* Right column */}
				<div className="flex flex-col gap-4 lg:col-span-4">
					<DeliveredSectionSkeleton />
					<RecentActivitySectionSkeleton />
					<QuickActionsSectionSkeleton />
				</div>
			</div>
		</main>
	);
}

function QuickActionsSectionSkeleton() {
	return (
		<section className="glass-panel rounded-xl p-5">
			<Skeleton className="mb-3 h-5 w-32" />

			<div className="grid grid-cols-2 gap-2">
				<Skeleton className="col-span-2 h-10 rounded-lg" />
				<Skeleton className="h-9 rounded-lg" />
				<Skeleton className="h-9 rounded-lg" />
			</div>
		</section>
	);
}
