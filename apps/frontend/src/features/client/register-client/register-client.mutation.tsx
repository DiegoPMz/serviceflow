import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	type RegisterClientUseCaseInput,
	registerClient,
} from "./register-client.use-case";

export function useRegisterClient() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (variables: RegisterClientUseCaseInput) =>
			registerClient(variables),

		onSuccess: async () => {
			await queryClient.invalidateQueries({
				queryKey: ["clients"],
			});

			toast.success("Cliente registrado");
		},
	});
}
