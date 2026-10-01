import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	type CreateWorkspaceUseCaseInput,
	createWorkspace,
} from "./create-workspace.use-case";

export function useCreateWorkspace() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (variables: CreateWorkspaceUseCaseInput) =>
			createWorkspace(variables),

		onSuccess: async (result) => {
			await queryClient.invalidateQueries({
				queryKey: ["workspaces"],
			});

			if (result.logo.status === "failed") {
				toast.warning("Espacio de trabajo creado", {
					description:
						"No se pudo subir el logo. Los PDFs de las órdenes no mostrarán el logo hasta que lo subas nuevamente.",
				});
			}
		},
	});
}
