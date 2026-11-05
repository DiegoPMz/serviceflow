import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { orderDetailsQueryKey } from "../order-details";
import {
	type ChangeOrderStatusUseCaseInput,
	changeOrderStatus,
} from "./change-order-status.use-case";

export function useChangeOrderStatus() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (variables: ChangeOrderStatusUseCaseInput) =>
			changeOrderStatus(variables),

		onSuccess: async (_result, variables) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: orderDetailsQueryKey(
						variables.workspaceId,
						variables.orderId,
					),
				}),
				queryClient.invalidateQueries({
					queryKey: ["orders"],
				}),
				queryClient.invalidateQueries({
					queryKey: ["workspace-summary", variables.workspaceId],
				}),
				queryClient.invalidateQueries({
					queryKey: ["recent-activities", variables.workspaceId],
				}),
			]);

			toast.success("Estado de la orden actualizado");
		},
	});
}
