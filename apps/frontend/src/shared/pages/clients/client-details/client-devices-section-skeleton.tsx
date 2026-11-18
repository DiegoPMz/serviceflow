/** biome-ignore-all lint/suspicious/noArrayIndexKey: <skeleton> */
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

type ClientDevicesSectionSkeletonProps = {
	count?: number;
};

export function ClientDevicesSectionSkeleton({
	count = 2,
}: ClientDevicesSectionSkeletonProps) {
	return (
		<Card
			className="animate-rise min-w-0 gap-0 border-border/70 bg-card p-4 shadow-none sm:p-5"
			aria-busy="true"
			aria-label="Cargando dispositivos"
		>
			{/* Header */}
			<CardHeader className="flex flex-row items-center justify-between gap-3 px-0 pb-4 sm:pb-5">
				<div className="min-w-0 space-y-2">
					<Skeleton className="h-4 w-24" />
					<Skeleton className="h-3 w-48 max-w-full" />
				</div>

				<Skeleton className="h-5 w-9 shrink-0 rounded-full" />
			</CardHeader>

			{/* Search */}
			<div className="relative mb-4">
				<Skeleton className="h-9 w-full rounded-md" />
			</div>

			{/* Device list */}
			<CardContent className="min-w-0 px-0">
				<ul>
					{Array.from({ length: count }, (_, index) => (
						<li key={index} className="py-2 first:pt-0 last:pb-0">
							<ClientDeviceItemSkeleton />
						</li>
					))}
				</ul>

				{/* Pagination */}
				<div className="flex justify-center pt-2">
					<Skeleton className="h-8 w-28 rounded-md" />
				</div>
			</CardContent>
		</Card>
	);
}

function ClientDeviceItemSkeleton() {
	return (
		<div className="overflow-hidden rounded-lg border border-border/70">
			<div className="flex min-w-0 items-center gap-3 p-3">
				{/* Device icon */}
				<Skeleton className="size-7 shrink-0 rounded-sm" />

				{/* Device information */}
				<div className="min-w-0 flex-1 space-y-2">
					<Skeleton className="h-4 w-36 max-w-full" />
					<Skeleton className="h-3 w-48 max-w-full" />
				</div>

				{/* Orders badge */}
				<Skeleton className="hidden h-5 w-20 shrink-0 rounded-full sm:block" />

				{/* Accordion chevron */}
				<Skeleton className="size-4 shrink-0" />
			</div>
		</div>
	);
}
