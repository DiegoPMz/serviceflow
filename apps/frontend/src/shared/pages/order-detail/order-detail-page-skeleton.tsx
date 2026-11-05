import { cn } from "cn";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";

const SUMMARY_FIELDS = ["createdAt", "updatedAt", "createdBy", "serviceType"];
const CLIENT_ROWS = ["name", "phone", "email", "location"];
const DEVICE_ROWS = ["device", "serialNumber"];
const SUPPLY_ROWS = ["first", "second", "third"];

function DetailCardSkeleton({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	return (
		<Card
			className={cn(
				"ring-1 ring-border/70 shadow-none animate-rise",
				className,
			)}
		>
			<CardHeader className="flex flex-row items-start justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
				<div className="min-w-0 space-y-1.5">
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-3 w-28" />
				</div>

				<Skeleton className="h-8 w-20 rounded-lg" />
			</CardHeader>

			<CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
				<div className="border-t border-border/70 pt-4">{children}</div>
			</CardContent>
		</Card>
	);
}

function DetailRowSkeleton() {
	return (
		<div className="flex min-w-0 items-start justify-between gap-4 py-3 first:pt-0">
			<div className="flex shrink-0 items-center gap-2">
				<Skeleton className="size-3.5" />
				<Skeleton className="h-3 w-16" />
			</div>

			<Skeleton className="h-4 w-32 max-w-[60%]" />
		</div>
	);
}

export function OrderDetailPageSkeleton() {
	return (
		<main className="relative px-4 py-6 sm:px-6 lg:px-8">
			<header className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div className="min-w-0">
					<Skeleton className="h-3 w-28" />
					<Skeleton className="mt-1 h-9 w-64 max-w-full lg:h-10 lg:w-80" />
				</div>

				<div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
					<Skeleton className="size-9 rounded-lg sm:h-9 sm:w-28" />
					<Skeleton className="size-9 rounded-lg sm:h-9 sm:w-44" />
				</div>
			</header>

			<div className="min-w-0 space-y-4">
				{/* Resumen de la orden y estado */}
				<DetailCardSkeleton>
					<div className="flex flex-col gap-6 xl:flex-row">
						<div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:flex-3">
							{SUMMARY_FIELDS.map((field) => (
								<div key={field} className="min-w-0 space-y-1.5">
									<div className="flex items-center gap-2">
										<Skeleton className="size-3.5" />
										<Skeleton className="h-3 w-20" />
									</div>

									<Skeleton className="h-4 w-32 max-w-full" />
								</div>
							))}
						</div>

						<aside className="min-w-0 border-t border-border/70 pt-5 xl:flex-2 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
							<div className="flex items-center justify-between gap-3">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-5 w-20 rounded-full" />
							</div>

							<div className="mt-2 space-y-1.5">
								<Skeleton className="h-3 w-full" />
								<Skeleton className="h-3 w-4/5" />
							</div>

							<div className="mt-4 flex flex-col gap-1">
								<Skeleton className="h-9 w-full rounded-lg" />
								<Skeleton className="h-9 w-full rounded-lg" />
							</div>
						</aside>
					</div>
				</DetailCardSkeleton>

				{/* Cliente y equipo */}
				<div className="grid gap-4 xl:grid-cols-2">
					<DetailCardSkeleton>
						<div className="divide-y divide-border/60">
							{CLIENT_ROWS.map((row) => (
								<DetailRowSkeleton key={row} />
							))}
						</div>
					</DetailCardSkeleton>

					<DetailCardSkeleton>
						<div className="divide-y divide-border/60">
							{DEVICE_ROWS.map((row) => (
								<DetailRowSkeleton key={row} />
							))}
						</div>
					</DetailCardSkeleton>
				</div>

				{/* Observaciones */}
				<DetailCardSkeleton>
					<div className="space-y-2">
						<Skeleton className="h-4 w-full" />
						<Skeleton className="h-4 w-11/12" />
						<Skeleton className="h-4 w-3/4" />
					</div>
				</DetailCardSkeleton>

				{/* Insumos y refacciones */}
				<DetailCardSkeleton>
					<div className="rounded-lg border border-border/70 p-3">
						<div className="flex items-center gap-3">
							<Skeleton className="size-4 shrink-0" />

							<div className="min-w-0 flex-1 space-y-1.5">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-24" />
							</div>

							<Skeleton className="size-4 shrink-0" />
						</div>

						<div className="mt-3 divide-y divide-border/60 border-t border-border/70 pt-1">
							{SUPPLY_ROWS.map((row) => (
								<div
									key={row}
									className="flex min-w-0 items-center justify-between gap-3 py-3"
								>
									<div className="min-w-0 space-y-1.5">
										<Skeleton className="h-4 w-40 max-w-full" />
										<Skeleton className="h-3 w-24" />
									</div>

									<Skeleton className="h-5 w-16 shrink-0 rounded-full" />
								</div>
							))}
						</div>
					</div>
				</DetailCardSkeleton>
			</div>
		</main>
	);
}
