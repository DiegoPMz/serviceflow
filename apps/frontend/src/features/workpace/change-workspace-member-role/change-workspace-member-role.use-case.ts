import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";
import type { AssignableWorkspaceRole } from "../common/workspace-role";

export interface ChangeWorkspaceMemberRoleInput {
	workspaceId: string;
	memberId: string;
	role: AssignableWorkspaceRole;
	eden: Eden;
}

export async function changeWorkspaceMemberRole({
	workspaceId,
	memberId,
	role,
	eden,
}: ChangeWorkspaceMemberRoleInput): Promise<void> {
	const { error } = await eden.v1
		.workspaces({ workspaceId })
		.members({ memberId })
		.patch({ role });

	if (error) normalizeEdenError(error);
}
