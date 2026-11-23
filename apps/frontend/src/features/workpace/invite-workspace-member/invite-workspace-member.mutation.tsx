import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notifyTeamError } from "../common/notify-team-error";
import {
	type InviteWorkspaceMemberInput,
	inviteWorkspaceMember,
} from "./invite-workspace-member.use-case";

export function useInviteWorkspaceMember() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (variables: InviteWorkspaceMemberInput) =>
			inviteWorkspaceMember(variables),

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
			toast.success("Invitación enviada", {
				description: variables.email,
			});
		},

		onError: (error) =>
			notifyTeamError(error, "No se pudo enviar la invitación"),
	});
}
