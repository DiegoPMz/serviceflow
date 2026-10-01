import { createFileRoute } from "@tanstack/react-router";
import { WorkspacesError } from "@/features/workpace/pages/workspaces-error";
import { WorkspacesLoading } from "@/features/workpace/pages/workspaces-loading";
import { WorkspacesPage } from "@/features/workpace/pages/workspaces-page";
import { paginatedWorkspacesInfiniteQueryOptions } from "@/features/workpace/paginated-workspaces";

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
