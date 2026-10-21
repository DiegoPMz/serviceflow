import { WORKSPACE_ERROR_CODES } from "@serviceflow/error-codes";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { getWorkspaceSummaryQueryOptions } from "@/features/workpace/get-workspace-summary";
import { WorkspaceShell } from "@/shared/layouts/workspace-shell";
import { WorkspaceShellSkeleton } from "@/shared/layouts/workspace-shell-skeleton";
import { ApiError } from "@/shared/lib/api-error";

export const Route = createFileRoute("/_authenticated/workspace/$workspaceId")({
	loader: async ({ context, params }) => {
		await context.queryClient.query(
			getWorkspaceSummaryQueryOptions(context.eden, {
				workspaceId: params.workspaceId,
			}),
		);
	},

	onError: (error: unknown) => {
		if (!(error instanceof ApiError)) {
			return;
		}

		const redirectCodes = new Set<string>([
			WORKSPACE_ERROR_CODES.NOT_FOUND,
			WORKSPACE_ERROR_CODES.NOT_A_MEMBER,
		]);

		if (redirectCodes.has(error.code)) {
			toast.error("No pudimos acceder a este workspace.", {
				description:
					"Es posible que haya sido eliminado o que ya no tengas acceso. Te llevaremos al selector de workspaces.",
			});

			throw redirect({ to: "/" });
		}
	},
	component: RouteComponent,
	pendingComponent: WorkspaceShellSkeleton,
	pendingMs: 250,
});

function RouteComponent() {
	return (
		<WorkspaceShell>
			<Outlet />
		</WorkspaceShell>
	);
}
