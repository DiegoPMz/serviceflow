import { Skeleton } from "../components/ui/skeleton";

interface WorkspaceShellSkeletonProps {
	children?: React.ReactNode;
}

export function WorkspaceShellSkeleton({
	children,
}: WorkspaceShellSkeletonProps) {
	return (
		<div className="relative max-h-screen overflow-hidden  bg-background font-body text-foreground antialiased">
			{/* Ambient background */}
			<div
				className="pointer-events-none absolute -left-28 -top-28 size-110 rounded-full bg-primary/15 blur-3xl"
				style={{
					animation: "drift 18s cubic-bezier(0.32,0.72,0,1) infinite",
				}}
			/>

			<div
				className="pointer-events-none absolute right-0 top-1/3 size-90 rounded-full bg-success/10 blur-3xl"
				style={{
					animation: "drift 18s cubic-bezier(0.32,0.72,0,1) infinite",
					animationDelay: "-7s",
				}}
			/>

			<div className="mx-auto flex h-full max-w-360">
				{/* Desktop sidebar */}
				<aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-glass/60 px-4 py-5 backdrop-blur-xl lg:flex">
					{/* Branding */}
					<div className="flex items-center gap-2.5 px-2">
						<Skeleton className="size-9 shrink-0 rounded-full" />

						<div className="min-w-0 space-y-1.5">
							<Skeleton className="h-3.5 w-24" />
							<Skeleton className="h-2.5 w-20" />
						</div>
					</div>

					{/* Workspace selector */}
					<Skeleton className="mt-6 h-11 w-full rounded-lg" />

					{/* Main navigation */}
					<nav
						aria-label="Navegación principal"
						className="mt-6 flex flex-col gap-1"
					>
						<Skeleton className="h-10 w-full rounded-lg" />
						<Skeleton className="h-10 w-full rounded-lg" />
						<Skeleton className="h-10 w-full rounded-lg" />
					</nav>

					{/* Current user */}
					<Skeleton className="mt-auto h-12 w-full rounded-lg" />
				</aside>

				{/* Main content */}
				<div className="relative min-w-0 flex-1 overflow-y-auto">
					{/* Header */}
					<header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-8">
						{/* Mobile / tablet */}
						<div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
							<Skeleton className="size-8 shrink-0 rounded-full" />
							<Skeleton className="h-8 w-32 rounded-lg" />
						</div>

						{/* Desktop spacer */}
						<div className="hidden flex-1 lg:block" />

						{/* Global actions */}
						<div className="flex shrink-0 items-center gap-1">
							<Skeleton className="size-8 rounded-lg" />
						</div>
					</header>

					{/* Page content */}
					{children}
				</div>
			</div>

			{/* Mobile bottom navigation */}
			<nav
				aria-label="Navegación móvil"
				className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-background/85 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
			>
				<Skeleton className="mx-auto my-2.5 h-9 w-14 rounded-lg" />
				<Skeleton className="mx-auto my-2.5 h-9 w-14 rounded-lg" />
				<Skeleton className="mx-auto my-2.5 h-9 w-14 rounded-lg" />
			</nav>
		</div>
	);
}
