import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ClientDetailFieldSkeleton } from "./client-detail-field";

export function ClientDetailsCardSkeleton() {
	return (
		<Card
			className="gap-0 border-border/70 bg-card p-4 shadow-none sm:p-5"
			aria-busy="true"
		>
			{/* Header */}
			<CardHeader className="flex flex-row items-center gap-3 px-0 pb-4 sm:pb-5">
				{/* Avatar */}
				<Skeleton className="size-11 shrink-0 rounded-full" />

				{/* Client name */}
				<div className="min-w-0 flex-1 space-y-1.5">
					<Skeleton className="h-4 w-36 max-w-full" />
					<Skeleton className="h-3 w-28 max-w-full" />
				</div>

				{/* Copy button */}
				<Skeleton className="size-8 shrink-0 rounded-md" />
			</CardHeader>

			{/* Client information */}
			<CardContent className="grid gap-5 border-t border-border/70 px-0 pt-4 sm:grid-cols-2 sm:pt-5">
				<ClientDetailFieldSkeleton valueWidth="w-40" />

				<ClientDetailFieldSkeleton valueWidth="w-24" />

				<ClientDetailFieldSkeleton valueWidth="w-52" />
			</CardContent>
		</Card>
	);
}
