import { Skeleton } from "@/shared/components/ui/skeleton";
import { WorkspaceShellSkeleton } from "@/shared/layouts/workspace-shell-skeleton";
import { DeliveredSectionSkeleton } from "./delivered-section/delivered-section-skeleton";
import { OrderSectionLoadingState } from "./orders-section/order-section-loading-state";
import { QuickActionsSectionSkeleton } from "./quick-actions-section/quick-actions-section-skeleton";
import { RecentActivitySectionSkeleton } from "./recent-activity-section/recent-activity-section-skeleton";

export function HomeRouteSkeleton() {
	return (
		<WorkspaceShellSkeleton>
			<HomePageSkeleton />
		</WorkspaceShellSkeleton>
	);
}

export function HomePageSkeleton() {
	return (
		<main className="relative flex flex-col px-4 py-6 sm:px-6 lg:px-8">
			{/* Page heading */}
			<header className="mb-6">
				<Skeleton className="h-3 w-14" />

				<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div className="min-w-0">
						<Skeleton className="mt-1 h-9 w-72 max-w-full lg:h-10 lg:w-96" />

						<Skeleton className="mt-1.5 h-4 w-full max-w-2xl" />
					</div>
				</div>
			</header>

			{/* Home content */}
			<div className="grid grid-cols-1 gap-4 xl:grid-cols-12 xl:items-start">
				{/* Orders */}
				<div className="h-full xl:col-span-8 xl:col-start-1 xl:row-span-1">
					<OrderSectionLoadingState />
				</div>

				{/* Right column */}
				<aside className="flex flex-col gap-4 xl:col-span-4 xl:flex-col-reverse xl:h-full">
					<QuickActionsSectionSkeleton />
					<RecentActivitySectionSkeleton />
					<DeliveredSectionSkeleton />
				</aside>
			</div>
		</main>
	);
}
