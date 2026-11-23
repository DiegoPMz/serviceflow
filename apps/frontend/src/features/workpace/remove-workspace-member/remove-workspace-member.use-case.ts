import type { Eden } from "@/shared/http/client";
import { normalizeEdenError } from "@/shared/lib/normalize-eden-error";

export interface RemoveWorkspaceMemberInput {
	workspaceId: string;
	memberId: string;
	eden: Eden;
}

export async function removeWorkspaceMember({
	workspaceId,
	memberId,
	eden,
}: RemoveWorkspaceMemberInput): Promise<void> {
	const { error } = await eden.v1
		.workspaces({ workspaceId })
		.members({ memberId })
		.delete();

	if (error) normalizeEdenError(error);
}
