import { createFileRoute } from "@tanstack/react-router";
import { paginatedWorkspacesInfiniteQueryOptions } from "@/features/workpace/paginated-workspaces";
import { WorkspacesError } from "@/shared/pages/select-workpace/workspaces-error";
import { WorkspacesLoading } from "@/shared/pages/select-workpace/workspaces-loading";
import { WorkspacesPage } from "@/shared/pages/select-workpace/workspaces-page";

export const Route = createFileRoute("/_authenticated/")({
	loader: async ({ context }) => {
		context.queryClient.infiniteQuery({
			...paginatedWorkspacesInfiniteQueryOptions({
				eden: context.eden,
			}),
			staleTime: "static",
		});
	},
	component: WorkspacesPage,
	pendingComponent: WorkspacesLoading,
	errorComponent: WorkspacesError,
	pendingMs: 200,
});
