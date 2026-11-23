import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";
import type { AssignableWorkspaceRole } from "../common/workspace-role";

export interface InviteWorkspaceMemberInput {
	workspaceId: string;
	email: string;
	role: AssignableWorkspaceRole;
	eden: Eden;
}

export async function inviteWorkspaceMember({
	workspaceId,
	email,
	role,
	eden,
}: InviteWorkspaceMemberInput): Promise<void> {
	const { error } = await eden.v1
		.workspaces({ workspaceId })
		.invitations.post({ email, role });

	if (error) normalizeEdenError(error);
}
