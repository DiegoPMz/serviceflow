import type { QueryClient } from "@tanstack/react-query";

export async function invalidateTeamQueries(
	queryClient: QueryClient,
	workspaceId: string,
) {
	await Promise.all([
		queryClient.invalidateQueries({
			queryKey: ["workspace-members", "paginated", workspaceId],
		}),
		queryClient.invalidateQueries({
			queryKey: ["workspace-invitations", "paginated", workspaceId],
		}),
		queryClient.invalidateQueries({
			queryKey: ["workspace-summary", workspaceId],
		}),
	]);
}
