import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateTeamQueries } from "../common/invalidate-team-queries";
import { notifyTeamError } from "../common/notify-team-error";
import {
	type RemoveWorkspaceMemberInput,
	removeWorkspaceMember,
} from "./remove-workspace-member.use-case";

interface RemoveWorkspaceMemberMutationVariables
	extends RemoveWorkspaceMemberInput {
	memberName: string;
}

export function useRemoveWorkspaceMember() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			memberName: _memberName,
			...variables
		}: RemoveWorkspaceMemberMutationVariables) =>
			removeWorkspaceMember(variables),

		onSuccess: async (_result, variables) => {
			await invalidateTeamQueries(queryClient, variables.workspaceId);
			toast.success("Miembro eliminado", {
				description: `${variables.memberName} ya no tiene acceso al espacio de trabajo.`,
			});
		},

		onError: (error) =>
			notifyTeamError(error, "No se pudo eliminar el miembro"),
	});
}
