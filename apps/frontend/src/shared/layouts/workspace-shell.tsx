import { Link, useParams, useRouteContext } from "@tanstack/react-router";
import { cn } from "cn";
import {
	Building2,
	ChevronDown,
	Home,
	MoreHorizontal,
	Settings,
	Users,
} from "lucide-react";
import type { PropsWithChildren } from "react";
import { useGetWorkspaceSummary } from "@/features/workpace/get-workspace-summary";
import { AccountMenu } from "../components/account-menu";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Button } from "../components/ui/button";
import { ThemeToggle } from "../components/ui/theme-toggle";
import { AccountDrawer } from "./account-drawer";
import { MobileNavLink } from "./mobile-nav-link";
import { SidebarLink } from "./sidebar-link";

export function WorkspaceShell({ children }: PropsWithChildren) {
	const { eden } = useRouteContext({
		from: "/_authenticated/workspace/$workspaceId",
	});

	const { workspaceId } = useParams({
		from: "/_authenticated/workspace/$workspaceId",
	});

	const { data: workspace } = useGetWorkspaceSummary(eden, {
		workspaceId,
	});

	return (
		<div className="relative h-screen overflow-hidden bg-background text-foreground antialiased">
			<div className="mx-auto flex h-full max-w-360">
				<DesktopSidebar workspaceName={workspace.name} />

				<div className="relative mb-18.25 min-w-0 flex-1 overflow-y-auto lg:mb-0">
					<WorkspaceHeader workspaceName={workspace.name} />

					{children}
				</div>
			</div>

			<MobileBottomNavigation />
		</div>
	);
}

// -----------------------------------------------------------------------------
// Desktop sidebar
// -----------------------------------------------------------------------------

type WorkspaceSidebarProps = {
	workspaceName: string;
};

function DesktopSidebar({ workspaceName }: WorkspaceSidebarProps) {
	return (
		<aside className="hidden h-screen w-68 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/50 px-5 py-6 text-sidebar-foreground lg:flex">
			<WorkspaceBrand />

			<WorkspaceSelector workspaceName={workspaceName} />

			<SidebarNavigation />

			<SidebarAccount />
		</aside>
	);
}

function WorkspaceBrand() {
	return (
		<Link
			to="/"
			className="flex items-center gap-3 rounded-xl px-2"
			aria-label="ServiceFlow - Inicio"
		>
			<div className="grid size-10 shrink-0 place-items-center rounded-[14px] bg-foreground text-background shadow-sm">
				<span className="text-sm font-bold tracking-tight">SF</span>
			</div>

			<div className="min-w-0">
				<p className="truncate text-base font-semibold leading-none tracking-tight">
					ServiceFlow
				</p>

				<p className="mt-1.5 truncate text-xs text-muted-foreground">
					Gestión de servicios
				</p>
			</div>
		</Link>
	);
}

function WorkspaceSelector({ workspaceName }: WorkspaceSidebarProps) {
	return (
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
					{workspaceName}
				</span>
			</span>

			<ChevronDown className="size-4 shrink-0 text-muted-foreground" />
		</button>
	);
}

function SidebarNavigation() {
	return (
		<nav
			aria-label="Navegación principal"
			className="mt-8 flex flex-col gap-1.5"
		>
			<p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">
				Principal
			</p>

			<SidebarLink route="inicio">
				<Home className="size-4.5" />
				<span>Inicio</span>
			</SidebarLink>

			<SidebarLink route="clientes">
				<Users className="size-4.5" />
				<span>Clientes</span>
			</SidebarLink>

			<p className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">
				Administración
			</p>

			<SidebarLink route="equipo">
				<Users className="size-4.5" />
				<span>Equipo</span>
			</SidebarLink>

			<SidebarLink route="configuracion">
				<Settings className="size-4.5" />
				<span>Configuración</span>
			</SidebarLink>
		</nav>
	);
}

function SidebarAccount() {
	return (
		<div className="mt-auto grid h-auto place-content-center">
			<AccountMenu className="w-full">
				<div className="flex items-center gap-2">
					<div className="min-w-0 flex-1 text-left">
						<p className="truncate text-sm font-semibold">
							<AccountMenu.UserName />
						</p>

						<p className="mt-0.5 truncate text-xs text-muted-foreground">
							Administración
						</p>
					</div>

					<MoreHorizontal className="size-4 shrink-0 text-muted-foreground" />
				</div>
			</AccountMenu>
		</div>
	);
}

// -----------------------------------------------------------------------------
// Header
// -----------------------------------------------------------------------------

function WorkspaceHeader({ workspaceName }: WorkspaceSidebarProps) {
	return (
		<header className="sticky top-0 z-20 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-8">
			<MobileWorkspaceHeader workspaceName={workspaceName} />

			<div className="hidden flex-1 lg:block" />

			<div className="flex shrink-0 items-center gap-1">
				<ThemeToggle />
			</div>
		</header>
	);
}

function MobileWorkspaceHeader({ workspaceName }: WorkspaceSidebarProps) {
	return (
		<div className="flex min-w-0 flex-1 items-center gap-2 lg:hidden">
			<Avatar className="size-8 shrink-0">
				<AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
					SF
				</AvatarFallback>
			</Avatar>

			<Button type="button" variant="ghost" className="min-w-0 gap-2 px-2">
				<span className="size-1.5 shrink-0 rounded-full bg-success" />

				<span className="truncate text-sm font-medium">{workspaceName}</span>

				<ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
			</Button>
		</div>
	);
}

// -----------------------------------------------------------------------------
// Mobile navigation
// -----------------------------------------------------------------------------

function MobileBottomNavigation() {
	return (
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
	);
}
