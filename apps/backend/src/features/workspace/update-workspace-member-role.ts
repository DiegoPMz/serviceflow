import { Result, Updated } from "@serviceflow/backend/shared/result";
import { workspaceMemberErrors } from "./common/workspace-member.errors";
import type { WorkspaceRole } from "./common/workspace-member.model";
import type { WorkspaceMemberRepository } from "./common/workspace-member.repository";

export interface UpdateWorkspaceMemberRoleCommand {
	workspaceId: string;
	targetUserId: string;
	newRole: Exclude<WorkspaceRole, "owner">;
}

interface HandlerProps {
	command: UpdateWorkspaceMemberRoleCommand;
	workspaceMemberRepository: WorkspaceMemberRepository;
}

export const updateWorkspaceMemberRoleHandler = async ({
	command,
	workspaceMemberRepository,
}: HandlerProps): Promise<Result<Updated>> => {
	const targetMember = await workspaceMemberRepository.findMembership({
		workspaceId: command.workspaceId,
		userId: command.targetUserId,
	});

	if (!targetMember) {
		return Result.failure(workspaceMemberErrors.NOT_A_MEMBER);
	}

	const changeRoleResult = targetMember.changeRole(command.newRole);

	if (changeRoleResult.isFailure) {
		return Result.failure(changeRoleResult.error);
	}

	await workspaceMemberRepository.update(targetMember);
	return Updated.toResult();
};
