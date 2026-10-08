import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { getWorkspaceSummaryQueryOptions } from "@/features/workpace/get-workspace-summary";
import { WorkspaceShell } from "@/shared/layouts/workspace-shell";
import { WorkspaceShellSkeleton } from "@/shared/layouts/workspace-shell-skeleton";

export const Route = createFileRoute("/_authenticated/workspace/$workspaceId")({
	loader: async ({ context, params }) => {
		await context.queryClient.query(
			getWorkspaceSummaryQueryOptions(context.eden, {
				workspaceId: params.workspaceId,
			}),
		);
	},

	onError: (error: unknown) => {
		// 		if (error instanceof AppErrorDetails && error.status < 500) {
		// 			console.log("error ruta layout");
		//
		// 			toast.error("No pudimos acceder a este workspace.", {
		// 				description:
		// 					"Es posible que haya sido eliminado o que ya no tengas acceso. Te llevaremos al selector de workspaces.",
		// 			});
		// 			throw redirect({ to: "/" });
		// 		}

		toast.error("No pudimos acceder a este workspace.", {
			description:
				"Es posible que haya sido eliminado o que ya no tengas acceso. Te llevaremos al selector de workspaces.",
		});
		throw redirect({ to: "/" });
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
