import {
	ORDER_ERROR_CODES,
	WORKSPACE_ERROR_CODES,
} from "@serviceflow/error-codes";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { toast } from "sonner";
import { getOrderDetailsQueryOptions } from "@/features/order/order-details";
import { getWorkspacePermissions } from "@/features/workpace/common/workspace-permissions";
import { useGetWorkspaceSummary } from "@/features/workpace/get-workspace-summary";
import { ApiError } from "@/shared/lib/api-error";
import {
	OrderDetailPage,
	OrderDetailPageSkeleton,
} from "@/shared/pages/order-detail";

export const Route = createFileRoute(
	"/_authenticated/workspace/$workspaceId/orden/$orderId",
)({
	loader: ({ context, params }) =>
		context.queryClient.query({
			...getOrderDetailsQueryOptions(context.eden, params),
			staleTime: "static",
		}),

	onError: (error: unknown) => {
		if (!(error instanceof ApiError)) {
			return;
		}

		const redirectCodes = new Set<string>([
			ORDER_ERROR_CODES.NOT_FOUND,
			WORKSPACE_ERROR_CODES.NOT_A_MEMBER,
		]);

		if (redirectCodes.has(error.code)) {
			toast.error("No se pudo acceder a esta orden.", {
				description:
					"La orden no existe o ya no tienes acceso a este workspace. Te redirigiremos al selector de workspaces.",
			});

			throw redirect({
				from: "/workspace/$workspaceId/orden/$orderId",
				to: "/workspace/$workspaceId",
			});
		}
	},
	component: OrderDetailRoute,
	pendingComponent: OrderDetailPageSkeleton,
	pendingMs: 250,
});

function OrderDetailRoute() {
	const { eden } = Route.useRouteContext();
	const { workspaceId, orderId } = Route.useParams();

	const { data: workspace } = useGetWorkspaceSummary(eden, { workspaceId });

	const permissions = getWorkspacePermissions(workspace.userRole);

	return (
		<OrderDetailPage
			eden={eden}
			permissions={permissions}
			orderDetails={{ orderId, workspaceId }}
		/>
	);
}
