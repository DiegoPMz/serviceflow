import type { PropsWithChildren } from "react";
import { Skeleton } from "../components/ui/skeleton";

export function WorkspaceShellSkeleton({ children }: PropsWithChildren) {
	return (
		<div className="relative h-screen overflow-hidden bg-background font-body text-foreground antialiased">
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
				<aside className="hidden h-screen w-68 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/50 px-5 py-6 text-sidebar-foreground lg:flex">
					{/* Branding */}
					<div className="flex items-center gap-3 rounded-xl px-2">
						<Skeleton className="size-10 shrink-0 rounded-[14px]" />

						<div className="min-w-0 flex-1 space-y-1.5">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-3 w-28" />
						</div>
					</div>

					{/* Workspace selector */}
					<div className="mt-8 flex w-full items-center gap-3 rounded-xl px-3 py-2.5">
						<Skeleton className="size-9 shrink-0 rounded-xl" />

						<div className="min-w-0 flex-1 space-y-1.5">
							<Skeleton className="h-2.5 w-16" />
							<Skeleton className="h-3.5 w-32 max-w-full" />
						</div>

						<Skeleton className="size-4 shrink-0 rounded-sm" />
					</div>

					{/* Main navigation */}
					<nav
						aria-label="Cargando navegación principal"
						className="mt-8 flex flex-col gap-1.5"
					>
						{/* Principal */}
						<div className="mb-2 px-3">
							<Skeleton className="h-2.5 w-14" />
						</div>

						{/* Inicio: active navigation item */}
						<div className="flex h-11 items-center gap-3 rounded-xl px-3  ">
							<Skeleton className="size-4.5 shrink-0 rounded-sm" />
							<Skeleton className="h-3 w-12" />
						</div>

						{/* Clientes */}
						<div className="flex h-11 items-center gap-3 rounded-xl px-3">
							<Skeleton className="size-4.5 shrink-0 rounded-sm" />
							<Skeleton className="h-3 w-14" />
						</div>

						{/* Administración */}
						<div className="mb-2 mt-7 px-3">
							<Skeleton className="h-2.5 w-24" />
						</div>

						{/* Equipo */}
						<div className="flex h-11 items-center gap-3 rounded-xl px-3">
							<Skeleton className="size-4.5 shrink-0 rounded-sm" />
							<Skeleton className="h-3 w-12" />
						</div>

						{/* Configuración */}
						<div className="flex h-11 items-center gap-3 rounded-xl px-3">
							<Skeleton className="size-4.5 shrink-0 rounded-sm" />
							<Skeleton className="h-3 w-24" />
						</div>
					</nav>

					{/* Current user */}
					<div className="mt-auto flex w-full items-center gap-3 rounded-xl px-2.5 py-3">
						<Skeleton className="size-10 shrink-0 rounded-full" />

						<div className="min-w-0 flex-1 space-y-1.5">
							<Skeleton className="h-3 w-28 max-w-full" />
							<Skeleton className="h-2.5 w-24 max-w-full" />
						</div>

						<Skeleton className="size-4 shrink-0 rounded-sm" />
					</div>
				</aside>

				{/* Main content */}
				<div className="relative min-w-0 flex-1 overflow-y-auto">
					{/* Header */}
					<header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-8">
						{/* Mobile / tablet */}
						<div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
							<Skeleton className="size-8 shrink-0 rounded-full" />

							<div className="flex h-8 min-w-0 max-w-64 items-center gap-2 rounded-xl px-2">
								<Skeleton className="size-1.5 shrink-0 rounded-full" />
								<Skeleton className="h-3 w-28 max-w-full" />
								<Skeleton className="size-3.5 shrink-0 rounded-sm" />
							</div>
						</div>

						{/* Desktop spacer */}
						<div className="hidden flex-1 lg:block" />

						{/* Theme toggle */}
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
				aria-label="Cargando navegación móvil"
				className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-1 border-t border-sidebar-border bg-sidebar px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] lg:hidden"
			>
				{/* Inicio: active navigation item */}
				<div className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-card/50 ">
					<Skeleton className="size-5 rounded-sm" />
					<Skeleton className="h-2 w-7" />
				</div>

				{/* Clientes */}
				<div className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-card/50 ">
					<Skeleton className="size-5 rounded-sm" />
					<Skeleton className="h-2 w-9" />
				</div>

				{/* Cuenta */}
				<div className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl bg-card/50 ">
					<Skeleton className="size-6 rounded-full" />
					<Skeleton className="h-2 w-7" />
				</div>
			</nav>
		</div>
	);
}
