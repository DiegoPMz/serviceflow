import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	type CreateOrderUseCaseInput,
	createOrder,
} from "./create-order.use-case";

export function useCreateOrder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (variables: CreateOrderUseCaseInput) => createOrder(variables),

		onSuccess: async (_result, variables) => {
			await Promise.all([
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

			toast.success("Orden creada");
		},
	});
}
