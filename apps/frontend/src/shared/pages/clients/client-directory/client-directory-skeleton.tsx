/** biome-ignore-all lint/suspicious/noArrayIndexKey: <> */

import { cn } from "cn";
import { Search } from "lucide-react";
import { Skeleton } from "@/shared/components/ui/skeleton";

type ClientDirectorySkeletonProps = {
	items?: number;
	className?: string;
	showPagination?: boolean;
};

export function ClientDirectorySkeleton({
	items = 4,
	className,
	showPagination = false,
}: ClientDirectorySkeletonProps) {
	return (
		<aside
			aria-label="Cargando directorio de clientes"
			aria-busy="true"
			className={cn(
				"flex min-w-0 flex-col rounded-xl",
				"border border-border/70 bg-card",
				"overflow-visible p-4 pt-0 sm:p-5 sm:pt-0",
				"xl:min-h-0 xl:overflow-hidden",
				className,
			)}
		>
			{/* Header */}
			<div
				className={cn(
					"sticky top-[56px] z-20 isolate shrink-0",
					"border-b border-border/70 pb-4",
					"bg-card pt-4 backdrop-blur-[100px] sm:pt-5",
					"xl:static xl:bg-transparent xl:backdrop-blur-none",
				)}
			>
				<div className="mb-2 flex items-center justify-between gap-2">
					<Skeleton className="h-4 w-36" />

					<div className="flex items-center gap-2">
						<Skeleton className="h-3 w-16" />
						<Skeleton className="h-3 w-5" />
					</div>
				</div>

				{/* Search */}
				<div className="relative">
					<Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/40" />

					<Skeleton className="h-11 w-full rounded-md" />
				</div>
			</div>

			{/* Client list */}
			<div className="mt-2 min-h-0 min-w-0 flex-1 xl:overflow-y-auto">
				<ul
					className={cn(
						"grid min-w-0 grid-cols-1 gap-2",
						"md:grid-cols-2 xl:grid-cols-1",
					)}
				>
					{Array.from({ length: items }, (_, index) => (
						<li key={index} className="min-w-0">
							<ClientDirectoryItemSkeleton />
						</li>
					))}
				</ul>

				{/* Pagination */}
				{showPagination && (
					<div className="flex flex-col items-center gap-2 p-3">
						<Skeleton className="h-10 w-full rounded-md" />
						<Skeleton className="h-3 w-32" />
					</div>
				)}
			</div>
		</aside>
	);
}

// ============================================================
// Client Item Skeleton
// ============================================================

function ClientDirectoryItemSkeleton() {
	return (
		<div
			className={cn(
				"flex min-w-0 flex-col gap-2 rounded-xl",
				"border border-border/70 bg-card p-4",
			)}
		>
			{/* Name and orders */}
			<div className="flex min-w-0 items-start justify-between gap-3">
				<Skeleton className="h-4 w-32 max-w-[60%]" />

				<div className="flex shrink-0 items-center gap-1.5 pt-0.5">
					<Skeleton className="size-3.5 rounded-sm" />
					<Skeleton className="h-3 w-16" />
				</div>
			</div>

			{/* Contact information */}
			<div className="grid min-w-0 gap-1.5">
				<div className="flex items-center gap-1.5">
					<Skeleton className="size-3.5 shrink-0 rounded-sm" />
					<Skeleton className="h-3 w-3/4 max-w-44" />
				</div>

				<div className="flex items-center gap-1.5">
					<Skeleton className="size-3.5 shrink-0 rounded-sm" />
					<Skeleton className="h-3 w-28" />
				</div>
			</div>

			{/* Last order */}
			<div className="flex min-w-0 items-center gap-2.5 border-t border-border/70 pt-3">
				<Skeleton className="size-4 shrink-0 rounded-sm" />

				<div className="min-w-0 flex-1 space-y-1.5">
					<Skeleton className="h-2.5 w-16" />
					<Skeleton className="h-3 w-24" />
				</div>

				<Skeleton className="size-4 shrink-0 rounded-sm" />
			</div>
		</div>
	);
}
