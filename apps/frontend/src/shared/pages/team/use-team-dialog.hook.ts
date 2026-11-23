import { useState } from "react";
import type { WorkspaceInvitationListItem } from "@/features/workpace/paginated-workspace-invitations";
import type { WorkspaceMemberListItem } from "@/features/workpace/paginated-workspace-members";

export type TeamDialog =
	| { type: "invite" }
	| { type: "changeRole"; member: WorkspaceMemberListItem }
	| { type: "removeMember"; member: WorkspaceMemberListItem }
	| { type: "revokeInvitation"; invitation: WorkspaceInvitationListItem }
	| null;

export function useTeamDialog() {
	const [dialog, setDialog] = useState<TeamDialog>(null);

	return {
		dialog,
		openDialog: setDialog,
		closeDialog: () => setDialog(null),
	};
}
