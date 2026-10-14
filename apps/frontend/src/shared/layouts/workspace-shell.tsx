import { Link, useParams, useRouteContext } from "@tanstack/react-router";
import { cn } from "cn";
import {
	Building2,
	ChevronDown,
	Home,
	LogOut,
	MoreHorizontal,
	Settings,
	Users,
} from "lucide-react";
import type { PropsWithChildren } from "react";
import { useGetWorkspaceSummary } from "@/features/workpace/get-workspace-summary";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button, buttonVariants } from "../components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { AccountDrawer } from "./account-drawer";
import { MobileNavLink } from "./mobile-nav-link";

export function WorkspaceShell({ children }: PropsWithChildren) {
	const { eden } = useRouteContext({
		from: "/_authenticated/workspace/$workspaceId",
	});
	const { workspaceId } = useParams({
		from: "/_authenticated/workspace/$workspaceId",
	});

	const { data: workspace } = useGetWorkspaceSummary(eden, { workspaceId });

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
					<Link
						to="/"
						className="flex items-center gap-3 rounded-xl px-2"
						aria-label="ServiceFlow - Inicio"
					>
						<div className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-foreground text-background shadow-sm">
							<span className="font-display text-sm font-bold tracking-tight">
								SF
							</span>
						</div>

						<div className="min-w-0">
							<p className="truncate font-display text-base font-semibold leading-none tracking-tight">
								ServiceFlow
							</p>

							<p className="mt-1.5 truncate text-xs text-muted-foreground">
								Gestión de servicios
							</p>
						</div>
					</Link>

					{/* Workspace selector */}
					<button
						type="button"
						className="mt-8 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
					>
						<span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sidebar-accent text-sidebar-accent-foreground">
							<Building2 className="size-4 text-muted-foreground" />
						</span>

						<span className="min-w-0 flex-1">
							<span className="block text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
								Workspace
							</span>

							<span className="mt-0.5 block truncate text-sm font-semibold">
								{workspace.name}
							</span>
						</span>

						<ChevronDown className="size-4 shrink-0 text-muted-foreground" />
					</button>

					{/* Main navigation */}
					<nav
						aria-label="Navegación principal"
						className="mt-8 flex flex-col gap-1.5"
					>
						<p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">
							Principal
						</p>

						<Link
							from="/workspace/$workspaceId"
							to="/workspace/$workspaceId"
							activeOptions={{ exact: true }}
							className={cn(
								buttonVariants({ size: "lg", variant: "ghost" }),
								"h-11 w-full  justify-start gap-3 rounded-xl px-3 font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
							)}
							activeProps={{
								className:
									"bg-card text-card-foreground font-semibold shadow-sm shadow-card-foreground/5 ring-1 ring-sidebar-border hover:bg-card",
							}}
						>
							<Home className="size-4.5" />
							<span>Inicio</span>
						</Link>

						<Link
							from="/workspace/$workspaceId"
							to="/workspace/$workspaceId/clientes"
							activeOptions={{ exact: true }}
							className={cn(
								buttonVariants({ size: "lg", variant: "ghost" }),
								"h-11 w-full justify-start gap-3 rounded-xl px-3 font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
							)}
							activeProps={{
								className:
									"bg-card text-card-foreground font-semibold shadow-sm shadow-card-foreground/5 ring-1 ring-sidebar-border hover:bg-card",
							}}
						>
							<Users className="size-4.5" />
							<span>Clientes</span>
						</Link>

						{/* Management section */}
						<p className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">
							Administración
						</p>

						<Link
							from="/workspace/$workspaceId"
							to="/workspace/$workspaceId/equipo"
							activeOptions={{ exact: true }}
							className={cn(
								buttonVariants({ size: "lg", variant: "ghost" }),
								"h-11 w-full justify-start gap-3 rounded-xl px-3 font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
							)}
							activeProps={{
								className:
									"bg-card text-card-foreground font-semibold shadow-sm shadow-card-foreground/5 ring-1 ring-sidebar-border hover:bg-card",
							}}
						>
							<Users className="size-4.5" />
							<span>Equipo</span>
						</Link>

						<Link
							from="/workspace/$workspaceId"
							to="/workspace/$workspaceId/configuracion"
							activeOptions={{ exact: true }}
							className={cn(
								buttonVariants({ size: "lg", variant: "ghost" }),
								"h-11 w-full justify-start gap-3 rounded-xl px-3 font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
							)}
							activeProps={{
								className:
									"bg-card text-card-foreground font-semibold shadow-sm shadow-card-foreground/5 ring-1 ring-sidebar-border hover:bg-card",
							}}
						>
							<Settings className="size-4.5" />
							<span>Configuración</span>
						</Link>
					</nav>

					{/* Current user */}
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									type="button"
									variant="ghost"
									className="mt-auto flex h-auto w-full items-center justify-start gap-3 rounded-xl border border-transparent px-2.5 py-3 text-left shadow-none transition-colors hover:bg-foreground/5"
								/>
							}
						>
							<Avatar className="size-10 shrink-0">
								<AvatarFallback className="bg-foreground text-sm font-semibold text-background">
									LD
								</AvatarFallback>
							</Avatar>

							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-semibold">Luisa Delgado</p>

								<p className="mt-0.5 truncate text-xs text-muted-foreground">
									Administración
								</p>
							</div>

							<MoreHorizontal className="size-4 shrink-0 text-muted-foreground" />
						</DropdownMenuTrigger>

						<DropdownMenuContent side="top" align="start" className="w-60">
							<DropdownMenuGroup>
								<DropdownMenuLabel>
									<div className="flex flex-col gap-1">
										<span>Luisa Delgado</span>
										<span className="font-normal text-muted-foreground">
											Administración
										</span>
									</div>
								</DropdownMenuLabel>

								<DropdownMenuSeparator />

								<DropdownMenuItem
									className="text-destructive focus:text-destructive"
									// onClick={onSignOut}
								>
									<LogOut className="mr-2 size-4" />
									Cerrar sesión
								</DropdownMenuItem>
							</DropdownMenuGroup>
						</DropdownMenuContent>
					</DropdownMenu>
				</aside>

				{/* Main content */}
				<div className="relative min-w-0 flex-1 overflow-y-auto">
					{/* Header */}
					<header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-8">
						{/* Mobile / tablet */}
						<div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
							<Avatar className="size-8 shrink-0">
								<AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
									SF
								</AvatarFallback>
							</Avatar>

							<Button
								type="button"
								variant="ghost"
								className="min-w-0 gap-2 px-2"
							>
								<span className="size-1.5 shrink-0 rounded-full bg-success" />

								<span className="truncate text-sm font-medium">
									{workspace.name}
								</span>

								<ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
							</Button>
						</div>

						{/* Desktop */}
						<div className="hidden flex-1 lg:block" />

						{/* Global actions */}
						<div className="flex shrink-0 items-center gap-1">
							<ThemeToggle />
						</div>
					</header>

					{/* Page content */}
					{children}
				</div>
			</div>

			{/* Mobile bottom navigation */}

			<nav
				aria-label="Navegación móvil"
				className={cn(
					"fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 gap-1",
					"border-t border-sidebar-border bg-sidebar px-3 pt-2",
					"pb-[calc(env(safe-area-inset-bottom)+0.5rem)]",
					"lg:hidden",
				)}
			>
				<MobileNavLink route="inicio">
					<Home className="size-5" />
					Inicio
				</MobileNavLink>

				<MobileNavLink route="clientes">
					<Users className="size-5" />
					Clientes
				</MobileNavLink>

				<AccountDrawer onSignOut={() => {}} />
			</nav>
		</div>
	);
}
