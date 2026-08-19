import { Result } from "@serviceflow/backend/shared/result";
import { workspaceMemberErrors } from "./common/workspace-member.errors";
import { WORKSPACE_ROLES } from "./common/workspace-member.model";
import type { WorkspaceMemberRepository } from "./common/workspace-member.repository";

export interface RemoveWorkspaceMemberCommand {
	workspaceId: string;
	requesterUserId: string;
	targetUserId: string;
}

export type RemovedWorkspaceMember = {
	memberId: string;
};

interface HandlerProps {
	command: RemoveWorkspaceMemberCommand;
	workspaceMemberRepository: WorkspaceMemberRepository;
}

export const removeWorkspaceMemberHandler = async ({
	command,
	workspaceMemberRepository,
}: HandlerProps): Promise<Result<RemovedWorkspaceMember>> => {
	const requesterMember = await workspaceMemberRepository.findMembership({
		workspaceId: command.workspaceId,
		userId: command.requesterUserId,
	});

	if (!requesterMember) {
		return Result.failure(workspaceMemberErrors.NOT_A_MEMBER);
	}

	const targetMember = await workspaceMemberRepository.findMembership({
		workspaceId: command.workspaceId,
		userId: command.targetUserId,
	});

	if (!targetMember) {
		return Result.failure(workspaceMemberErrors.NOT_A_MEMBER);
	}

	if (targetMember.role === WORKSPACE_ROLES.OWNER) {
		return Result.failure(workspaceMemberErrors.CANNOT_REMOVE_OWNER);
	}

	if (command.requesterUserId === command.targetUserId) {
		return Result.failure(workspaceMemberErrors.CANNOT_REMOVE_SELF);
	}

	if (
		targetMember.role === WORKSPACE_ROLES.ADMIN &&
		requesterMember.role !== WORKSPACE_ROLES.OWNER
	) {
		return Result.failure(workspaceMemberErrors.ONLY_OWNER_CAN_REMOVE_ADMIN);
	}

	await workspaceMemberRepository.remove(targetMember);

	return Result.success<RemovedWorkspaceMember>({
		memberId: targetMember.userId,
	});
};
