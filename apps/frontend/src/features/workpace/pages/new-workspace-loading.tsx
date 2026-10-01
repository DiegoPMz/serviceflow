import { MinimalHeaderSkeleton } from "@/shared/components/minimal-header";
import { Separator } from "@/shared/components/ui/separator";
import { Skeleton } from "@/shared/components/ui/skeleton";

export function NewWorkspaceLoading() {
	return (
		<div className="relative z-50 min-h-screen overflow-hidden bg-background font-body text-foreground antialiased">
			<div
				className="pointer-events-none absolute -left-28 -top-28 size-110 rounded-full bg-primary/15 blur-3xl"
				style={{ animation: "drift 18s cubic-bezier(0.32,0.72,0,1) infinite" }}
			/>

			<MinimalHeaderSkeleton />

			<main className="relative mx-auto max-w-xl px-4 py-10 sm:px-6">
				<div
					className="mb-4"
					style={{
						animation: "rise 600ms cubic-bezier(0.32,0.72,0,1) both",
					}}
				>
					<Skeleton className="h-8 w-36 bg-muted-foreground/10" />
				</div>

				<div
					className="glass-panel rounded-xl px-6 py-8"
					style={{
						animation: "rise 600ms cubic-bezier(0.32,0.72,0,1) both",
						animationDelay: "50ms",
					}}
				>
					{/* Header */}
					<div className="space-y-2.5">
						<Skeleton className="h-3 w-14 bg-primary/20" />
						<Skeleton className="h-8 w-64 bg-muted-foreground/20" />
						<Skeleton className="mt-2 h-4 w-72 max-w-full bg-muted-foreground/10" />
					</div>

					{/* Form */}
					<div
						className="mt-6 space-y-5"
						style={{
							animation: "rise 600ms cubic-bezier(0.32,0.72,0,1) both",
							animationDelay: "100ms",
						}}
					>
						{/* Workspace name */}
						<div className="space-y-2">
							<Skeleton className="h-4 w-36 bg-muted-foreground/15" />
							<Skeleton className="h-10 w-full bg-muted-foreground/10" />
						</div>

						<Separator />

						{/* Company name */}
						<div className="space-y-2">
							<Skeleton className="h-4 w-40 bg-muted-foreground/15" />
							<Skeleton className="h-10 w-full bg-muted-foreground/10" />
						</div>

						{/* Phone + email */}
						<div className="grid gap-3 sm:grid-cols-2">
							<div className="space-y-2">
								<Skeleton className="h-4 w-16 bg-muted-foreground/15" />
								<Skeleton className="h-10 w-full bg-muted-foreground/10" />
							</div>

							<div className="space-y-2">
								<Skeleton className="h-4 w-36 bg-muted-foreground/15" />
								<Skeleton className="h-10 w-full bg-muted-foreground/10" />
							</div>
						</div>

						{/* Address */}
						<div className="space-y-2">
							<Skeleton className="h-4 w-20 bg-muted-foreground/15" />
							<Skeleton className="h-10 w-full bg-muted-foreground/10" />
						</div>

						{/* Logo upload */}
						<div className="space-y-2">
							<Skeleton className="h-4 w-32 bg-muted-foreground/15" />

							<div className="flex items-center gap-4 rounded-lg border border-dashed border-border/60 p-4">
								<Skeleton className="size-14 shrink-0 rounded-lg bg-muted-foreground/10" />

								<div className="flex-1 space-y-2">
									<Skeleton className="h-4 w-40 bg-muted-foreground/15" />
									<Skeleton className="h-3 w-52 max-w-full bg-muted-foreground/10" />
								</div>

								<Skeleton className="h-9 w-20 shrink-0 bg-muted-foreground/10" />
							</div>
						</div>

						{/* Actions */}
						<div className="flex justify-end gap-3 pt-2">
							<Skeleton className="h-9 w-20 bg-muted-foreground/10" />
							<Skeleton className="h-9 w-40 bg-muted-foreground/15" />
						</div>
					</div>
				</div>
			</main>
		</div>
	);
}
