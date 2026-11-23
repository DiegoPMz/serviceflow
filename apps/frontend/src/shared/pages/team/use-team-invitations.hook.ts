import { useInviteWorkspaceMember } from "@/features/workpace/invite-workspace-member";
import { useGetPaginatedWorkspaceInvitations } from "@/features/workpace/paginated-workspace-invitations";
import type { Eden } from "@/shared/http/client";
import type { TeamInvitationsState } from "./team.types";

interface UseTeamInvitationsInput {
	eden: Eden;
	workspaceId: string;
	enabled: boolean;
}

export function useTeamInvitations({
	eden,
	workspaceId,
	enabled,
}: UseTeamInvitationsInput): TeamInvitationsState {
	const resend = useInviteWorkspaceMember();

	const query = useGetPaginatedWorkspaceInvitations(eden, {
		workspaceId,
		enabled,
	});

	return {
		items: (query.data?.pages ?? []).flatMap((page) => page.items),
		resendingEmail: resend.isPending ? (resend.variables?.email ?? null) : null,
		onResend: (invitation) => {
			// El backend renueva la invitación existente en vez de duplicarla.
			if (invitation.status !== "pending") return;

			resend.mutate({
				eden,
				workspaceId,
				email: invitation.email,
				role: invitation.role,
			});
		},
		query: {
			isPending: query.isPending,
			isError: query.isError,
			isRefetchError: query.isRefetchError,
			isFetchNextPageError: query.isFetchNextPageError,
			hasNextPage: query.hasNextPage,
			isFetchingNextPage: query.isFetchingNextPage,
			onLoadMore: () => query.fetchNextPage(),
			refetch: () => query.refetch(),
		},
	};
}
