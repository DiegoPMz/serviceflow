import type { PaginatedWorkspacesDto } from "@serviceflow/backend/features/workspace/paginated-workspaces";
import { Link, useRouteContext } from "@tanstack/react-router";
import { cn } from "cn";
import {
	BriefcaseBusiness,
	ChevronRight,
	FileText,
	Plus,
	Printer,
	Users,
} from "lucide-react";
import { useGetPaginatedWorkspaces } from "@/features/workpace/paginated-workspaces";
import { MinimalHeader } from "@/shared/components/minimal-header";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button, buttonVariants } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { SceneLayout } from "@/shared/layouts/scene-layout";

export function WorkspacesPage() {
	const { eden } = useRouteContext({ from: "/_authenticated/" });

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
		useGetPaginatedWorkspaces(eden);

	const allWorkspaces = data?.pages.flatMap((page) => page.items ?? []) ?? [];
	const isEmpty = allWorkspaces.length === 0;

	return (
		<SceneLayout>
			<MinimalHeader />

			<main className="relative mx-auto max-w-xl px-4 py-10 sm:px-6">
				<div
					className="mb-8"
					style={{ animation: "rise 600ms cubic-bezier(0.32,0.72,0,1) both" }}
				>
					<p className="font-mono text-[11px] uppercase tracking-widest text-primary">
						Acceso
					</p>
					<h1 className="mt-1 font-display text-3xl font-bold">
						{isEmpty
							? "No tienes espacios de trabajo"
							: "Selecciona un espacio de trabajo"}
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						{isEmpty
							? "Crea un espacio de trabajo para comenzar a gestionar clientes, dispositivos y órdenes de servicio."
							: "Elige el espacio en el que quieres trabajar."}
					</p>
				</div>

				{isEmpty && <NoWorkspaces />}

				{!isEmpty && (
					<div
						className="space-y-2"
						style={{ animation: "rise 600ms cubic-bezier(0.32,0.72,0,1) both" }}
					>
						{allWorkspaces.map((ws) => (
							<WorkspaceItem key={ws.id} ws={ws} />
						))}

						{hasNextPage && (
							<div className="pt-2 text-center">
								<Button
									variant="glass"
									size="sm"
									disabled={isFetchingNextPage}
									onClick={() => fetchNextPage()}
									className="w-full text-xs text-muted-foreground"
								>
									{isFetchingNextPage
										? "Cargando más..."
										: "Cargar más espacios"}
								</Button>
							</div>
						)}

						<div className="pt-2">
							<Separator className="my-4" />
							<Link
								to="/ws/new"
								className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<Plus className="size-4" /> Crear espacio de trabajo
							</Link>
						</div>
					</div>
				)}
			</main>
		</SceneLayout>
	);
}

function NoWorkspaces() {
	return (
		<div style={{ animation: "rise 600ms cubic-bezier(0.32,0.72,0,1) both" }}>
			<div className="mb-5 grid grid-cols-3 gap-3">
				{[
					{
						label: "Clientes",
						meta: "Registros",
						tone: "text-primary bg-primary/10",
						icon: <Users className="size-4" />,
					},
					{
						label: "Órdenes",
						meta: "Seguimiento",
						tone: "text-success bg-success/10",
						icon: <FileText className="size-4" />,
					},
					{
						label: "Equipos",
						meta: "Dispositivos",
						tone: "text-warning-foreground bg-warning/15",
						icon: <Printer className="size-4" />,
					},
				].map((f) => (
					<div
						key={f.label}
						className="glass-panel flex flex-col items-center gap-2 rounded-xl px-3 py-4 text-center opacity-55"
					>
						<span
							className={`grid size-9 place-items-center rounded-lg ${f.tone}`}
						>
							{f.icon}
						</span>
						<div>
							<p className="font-display text-xs font-semibold">{f.label}</p>
							<p className="font-mono text-[10px] text-muted-foreground">
								{f.meta}
							</p>
						</div>
					</div>
				))}
			</div>
			<div className="glass-panel rounded-xl px-6 py-7 text-center">
				<p className="text-sm text-muted-foreground mb-4">
					Crea tu primer espacio de trabajo para desbloquear todas las
					funciones.
				</p>
				<Link
					to="/ws/new"
					className={cn(buttonVariants({ size: "lg", variant: "flow" }))}
				>
					<Plus className="size-4 " /> Crear espacio de trabajo
				</Link>
				<p className="mt-3 text-xs text-muted-foreground">
					Después podrás invitar usuarios y comenzar a crear órdenes.
				</p>
			</div>
		</div>
	);
}

function WorkspaceItem({ ws }: { ws: PaginatedWorkspacesDto }) {
	return (
		<Link
			to="/ws/$workspaceId/home"
			params={{ workspaceId: ws.id }}
			className={cn(
				buttonVariants({ size: "lg", variant: "outline" }),
				"group w-full h-fit p-4 items-center gap-4 transition-all active:scale-[0.99]",
			)}
		>
			<Avatar size="sm">
				<AvatarImage src={ws.logo ?? undefined} alt="Logo de la Empresa" />
				<AvatarFallback className="bg-primary/50 text-primary-foreground">
					<BriefcaseBusiness />
				</AvatarFallback>
			</Avatar>
			<div className="min-w-0 flex-1">
				<p className="truncate font-display text-sm font-semibold">{ws.name}</p>
				<p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
					{ws.totalUsers} usuarios · {ws.totalClientes} clientes
				</p>
			</div>
			<ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
		</Link>
	);
}
