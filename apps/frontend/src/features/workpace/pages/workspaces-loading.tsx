import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { SceneLayout } from "@/shared/layouts/scene-layout";

export function WorkspacesLoading() {
	return (
		<SceneLayout>
			<main className="relative mx-auto max-w-xl px-4 py-10 sm:px-6">
				<div
					className="mb-8 space-y-2.5"
					style={{ animation: "rise 600ms cubic-bezier(0.32,0.72,0,1) both" }}
				>
					<Skeleton className="h-3 w-14 bg-primary/20" />
					<Skeleton className="h-8 w-3/4 bg-muted-foreground/20" />
					<Skeleton className="h-4 w-5/6 bg-muted-foreground/10 mt-2" />
				</div>

				<div
					className="space-y-2"
					style={{
						animation: "rise 600ms cubic-bezier(0.32,0.72,0,1) both",
						animationDelay: "100ms",
					}}
				>
					{[0, 1, 2].map((i) => (
						<WorkspaceSkeleton key={i} />
					))}

					<div className="pt-2">
						<Separator className="my-4 opacity-40" />
						<Skeleton className="h-12 w-full rounded-xl bg-muted-foreground/10 border border-dashed border-border/60" />
					</div>
				</div>
			</main>
		</SceneLayout>
	);
}

function WorkspaceSkeleton() {
	return (
		<div className="flex items-center gap-4 rounded-xl border border-border bg-glass/60 px-4 py-4">
			<Skeleton className="size-10 shrink-0 rounded-lg" />
			<div className="min-w-0 flex-1 space-y-2">
				<Skeleton className="h-4 w-36" />
				<Skeleton className="h-3 w-24" />
			</div>
			<Skeleton className="size-4 shrink-0 rounded" />
		</div>
	);
}
