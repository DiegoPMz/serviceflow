import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invalidateTeamQueries } from "../common/invalidate-team-queries";
import { notifyTeamError } from "../common/notify-team-error";
import { WORKSPACE_ROLE_LABELS } from "../common/workspace-role";
import {
	type ChangeWorkspaceMemberRoleInput,
	changeWorkspaceMemberRole,
} from "./change-workspace-member-role.use-case";

interface ChangeWorkspaceMemberRoleMutationVariables
	extends ChangeWorkspaceMemberRoleInput {
	memberName: string;
}

export function useChangeWorkspaceMemberRole() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			memberName: _memberName,
			...variables
		}: ChangeWorkspaceMemberRoleMutationVariables) =>
			changeWorkspaceMemberRole(variables),

		onSuccess: async (_result, variables) => {
			await invalidateTeamQueries(queryClient, variables.workspaceId);
			toast.success("Rol actualizado", {
				description: `${variables.memberName} ahora es ${WORKSPACE_ROLE_LABELS[variables.role]}.`,
			});
		},

		onError: (error) => notifyTeamError(error, "No se pudo actualizar el rol"),
	});
}
