import { createFileRoute } from "@tanstack/react-router";
import { PaginatedOrdersSchema } from "@/features/order/paginated-orders";
import { getWorkspacePermissions } from "@/features/workpace/common/workspace-permissions";
import { useGetWorkspaceSummary } from "@/features/workpace/get-workspace-summary";
import { HomeEmptyState } from "@/shared/pages/home/home-empty-state";
import { HomePageSkeleton } from "@/shared/pages/home/home-route-skeleton";

export const Route = createFileRoute("/_authenticated/workspace/$workspaceId/")(
	{
		component: HomePage,
		pendingComponent: HomePageSkeleton,
		pendingMs: 250,
		validateSearch: PaginatedOrdersSchema,
	},
);

function HomePage() {
	const { eden } = Route.useRouteContext();
	const { workspaceId } = Route.useParams();

	const { data } = useGetWorkspaceSummary(eden, { workspaceId });

	const permissions = getWorkspacePermissions(data.userRole);
	const isReadOnly =
		!permissions.canCreateOrders && !permissions.canCreateClients;

	return (
		<main className="px-4 py-6 pb-28 sm:px-6 lg:px-8 lg:pb-8">
			<header className="mb-6">
				<p className="font-mono text-[11px] uppercase tracking-widest text-primary">
					Inicio
				</p>

				<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h1 className="mt-1 font-display text-3xl font-bold lg:text-4xl">
							Resumen de la operación
						</h1>

						<p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
							Órdenes de servicio y actividad reciente de tu espacio.
						</p>
					</div>

					{isReadOnly && (
						<div className="inline-flex w-fit items-center rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-muted-foreground">
							Modo de solo lectura
						</div>
					)}
				</div>
			</header>

			{data.orderCount === 0 && (
				<HomeEmptyState
					isReadOnly={isReadOnly}
					canInviteMembers={permissions.canInviteMembers}
				/>
			)}
		</main>
	);
}
