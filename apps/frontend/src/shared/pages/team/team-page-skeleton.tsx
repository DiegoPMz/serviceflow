/** biome-ignore-all lint/suspicious/noArrayIndexKey: <skeleton rows> */

import { Skeleton } from "@/shared/components/ui/skeleton";
import { MemberRowCardSkeleton } from "./components/member-row-card";

export function TeamPageSkeleton() {
	return (
		<main
			aria-busy="true"
			aria-label="Cargando equipo del espacio de trabajo"
			className="px-4 py-6 sm:px-6 lg:px-8"
		>
			<header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
				<div className="min-w-0">
					<Skeleton className="h-3 w-44 max-w-full" />
					<Skeleton className="mt-2 h-9 w-32 lg:h-10" />
					<Skeleton className="mt-2 h-4 w-80 max-w-full" />
				</div>
			</header>

			<div className="my-4 flex flex-wrap items-center justify-between gap-3">
				<div className="inline-flex h-8 items-center gap-1 rounded-lg bg-muted p-[3px]">
					<Skeleton className="h-6.5 w-28 rounded-md" />
					<Skeleton className="h-6.5 w-32 rounded-md" />
				</div>

				<Skeleton className="h-4 w-44 max-w-full" />
			</div>

			<section
				aria-label="Cargando miembros del espacio de trabajo"
				className="rounded-xl bg-card p-4 ring ring-border/70 sm:p-6"
			>
				<div className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
					<div className="min-w-0">
						<div className="flex items-center gap-2.5">
							<Skeleton className="h-5 w-56 max-w-full" />
							<Skeleton className="h-5 w-8 rounded-full" />
						</div>

						<Skeleton className="mt-2 h-3 w-80 max-w-full" />
					</div>

					<Skeleton className="h-8 w-full rounded-lg sm:w-64" />
				</div>

				<div className="mt-4 space-y-2.5">
					{[1, 2, 3].map((index) => (
						<MemberRowCardSkeleton key={index} />
					))}
				</div>
			</section>
		</main>
	);
}
