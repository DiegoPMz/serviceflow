import { AlertCircle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function SectionHeader({
	title,
	description,
	count,
}: {
	title: string;
	description: string;
	count: ReactNode;
}) {
	return (
		<div className="mb-3 flex items-center justify-between gap-2">
			<div className="space-y-1">
				<h3 className="text-sm font-semibold">{title}</h3>

				<p className="text-xs text-muted-foreground">{description}</p>
			</div>

			{count === null ? (
				<Skeleton className="h-5 w-8 rounded-full" />
			) : (
				<Badge variant="outline" className="tabular-nums">
					{count}
				</Badge>
			)}
		</div>
	);
}

export function LoadMoreButton({
	isLoading = false,
	onClick,
}: {
	isLoading?: boolean;
	onClick: () => void;
}) {
	return (
		<div className="mt-3 flex justify-center">
			<Button
				variant="ghost"
				size="sm"
				className="text-[11px] text-muted-foreground"
				disabled={isLoading}
				onClick={onClick}
			>
				{isLoading ? "Cargando…" : "Ver más"}
			</Button>
		</div>
	);
}

export function SectionSkeleton() {
	return (
		<div className="space-y-3" aria-busy="true">
			{[0, 1, 2].map((item) => (
				<div key={item} className="flex items-center gap-3 py-2">
					<Skeleton className="size-8 shrink-0 rounded-lg" />

					<div className="min-w-0 flex-1 space-y-2">
						<Skeleton className="h-3 w-3/4" />
						<Skeleton className="h-2.5 w-1/2" />
					</div>

					<Skeleton className="h-4 w-12 rounded-full" />
				</div>
			))}
		</div>
	);
}

export function SectionError({
	description,
	onRetry,
}: {
	description: string;
	onRetry: () => void;
}) {
	return (
		<div className="flex flex-col items-center gap-2 py-6 text-center">
			<AlertCircle className="size-5 text-muted-foreground" />

			<p className="text-xs font-semibold">No pudimos cargar la información</p>

			<p className="text-[11px] text-muted-foreground">{description}</p>

			<Button variant="outline" size="sm" className="mt-1" onClick={onRetry}>
				<RefreshCw className="size-3.5" />
				Reintentar
			</Button>
		</div>
	);
}
