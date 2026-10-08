import { Link, useParams, useRouteContext } from "@tanstack/react-router";
import { cn } from "cn";
import { ChevronDown, Home, LogOut, Settings, Users } from "lucide-react";
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
				<aside className="hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-glass/60 px-4 py-5 backdrop-blur-xl lg:flex">
					{/* Branding */}
					<div className="flex items-center gap-2.5 px-2">
						<Avatar className="size-9">
							<AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
								SF
							</AvatarFallback>
						</Avatar>

						<div className="min-w-0">
							<p className="truncate font-display text-sm font-semibold leading-none">
								ServiceFlow
							</p>

							<p className="mt-1 font-mono text-[10px] uppercase text-muted-foreground">
								Operación · MX
							</p>
						</div>
					</div>

					{/* Workspace selector */}
					<button
						type="button"
						className="mt-6 flex w-full items-center gap-2.5 rounded-lg border border-border bg-foreground/3 px-3 py-2.5 text-left transition-colors hover:bg-foreground/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					>
						<span className="size-1.5 shrink-0 rounded-full bg-success" />

						<span className="min-w-0 flex-1 truncate text-sm font-semibold">
							{workspace.name}
						</span>

						<ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
					</button>

					{/* Main navigation */}
					<nav
						aria-label="Navegación principal"
						className="mt-6 flex flex-col gap-1"
					>
						<Link
							from="/workspace/$workspaceId"
							to="/workspace/$workspaceId"
							activeOptions={{ exact: true }}
							className={cn(buttonVariants({ size: "lg", variant: "ghost" }))}
							activeProps={{
								className:
									"bg-primary text-primary-foreground font-semibold hover:text-primary-foreground hover:bg-primary! ",
							}}
						>
							<Home className="size-4" />
							Inicio
						</Link>

						<Link
							from="/workspace/$workspaceId"
							to="/workspace/$workspaceId/clientes"
							activeOptions={{ exact: true }}
							className={cn(buttonVariants({ size: "lg", variant: "ghost" }))}
							activeProps={{
								className:
									"bg-primary text-primary-foreground font-semibold hover:text-primary-foreground hover:bg-primary! ",
							}}
						>
							<Users className="size-4" />
							Clientes
						</Link>

						<Link
							from="/workspace/$workspaceId"
							to="/workspace/$workspaceId/equipo"
							activeOptions={{ exact: true }}
							className={cn(buttonVariants({ size: "lg", variant: "ghost" }))}
							activeProps={{
								className:
									"bg-primary text-primary-foreground font-semibold hover:text-primary-foreground hover:bg-primary! ",
							}}
						>
							<Users className="size-4" />
							Equipo
						</Link>

						<Link
							from="/workspace/$workspaceId"
							to="/workspace/$workspaceId/configuracion"
							activeOptions={{ exact: true }}
							className={cn(buttonVariants({ size: "lg", variant: "ghost" }))}
							activeProps={{
								className:
									"bg-primary text-primary-foreground font-semibold hover:text-primary-foreground hover:bg-primary! ",
							}}
						>
							<Settings className="size-4" />
							Configuración
						</Link>
					</nav>

					{/* Current user */}

					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									type="button"
									variant="outline"
									className="mt-auto flex w-full h-fit py-2 items-center gap-2.5"
								>
									<Avatar className="size-8">
										<AvatarFallback className="text-xs font-semibold">
											LD
										</AvatarFallback>
									</Avatar>

									<div className="min-w-0 flex-1">
										<p className="truncate text-xs font-semibold">
											Luisa Delgado
										</p>

										<p className="truncate text-[11px] text-muted-foreground">
											Administración
										</p>
									</div>

									<ChevronDown className="size-3.5 text-muted-foreground" />
								</Button>
							}
						/>

						<DropdownMenuContent side="top" align="center" className="w-56">
							<DropdownMenuGroup>
								<DropdownMenuLabel>
									<div className="flex flex-col gap-0.5">
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
				className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-border bg-background/85 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
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
