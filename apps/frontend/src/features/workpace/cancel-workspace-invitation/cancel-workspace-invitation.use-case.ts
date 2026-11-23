import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";

export interface CancelWorkspaceInvitationInput {
	workspaceId: string;
	token: string;
	eden: Eden;
}

export async function cancelWorkspaceInvitation({
	workspaceId,
	token,
	eden,
}: CancelWorkspaceInvitationInput): Promise<void> {
	const { error } = await eden.v1
		.workspaces({ workspaceId })
		.invitations({ token })
		.patch();

	if (error) normalizeEdenError(error);
}
