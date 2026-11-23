import { createFileRoute } from "@tanstack/react-router";
import { paginatedWorkspaceMembersInfiniteQueryOptions } from "@/features/workpace/paginated-workspace-members";
import { TeamPage, TeamPageSkeleton } from "@/shared/pages/team";

export const Route = createFileRoute(
	"/_authenticated/workspace/$workspaceId/equipo",
)({
	loader: async ({ context, params }) => {
		await context.queryClient
			.infiniteQuery({
				...paginatedWorkspaceMembersInfiniteQueryOptions(context.eden, {
					workspaceId: params.workspaceId,
				}),
			})
			.catch();
	},
	component: TeamPageRoute,
	pendingComponent: TeamPageSkeleton,
	pendingMs: 250,
});

function TeamPageRoute() {
	const { eden } = Route.useRouteContext();
	const { workspaceId } = Route.useParams();

	return <TeamPage eden={eden} workspaceId={workspaceId} />;
}
