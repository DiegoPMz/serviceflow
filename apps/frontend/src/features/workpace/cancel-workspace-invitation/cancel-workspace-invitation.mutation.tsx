import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notifyTeamError } from "../common/notify-team-error";
import {
	type CancelWorkspaceInvitationInput,
	cancelWorkspaceInvitation,
} from "./cancel-workspace-invitation.use-case";

export function useCancelWorkspaceInvitation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (variables: CancelWorkspaceInvitationInput) =>
			cancelWorkspaceInvitation(variables),

		onSuccess: async (_result, variables) => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: [
						"workspace-invitations",
						"paginated",
						variables.workspaceId,
					],
				}),
			]);
			toast.success("Invitación revocada");
		},

		onError: (error) =>
			notifyTeamError(error, "No se pudo revocar la invitación"),
	});
}
