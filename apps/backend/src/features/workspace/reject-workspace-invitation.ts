import { Result, Success } from "@serviceflow/backend/shared/result";
import { UserErrors } from "../user/common/user.errors";
import type { UserRepository } from "../user/common/user-repository";
import { workspaceInvitationErrors } from "./common/workspace-invitation.errors";
import type { WorkspaceInvitationRepository } from "./common/workspace-invitation-repository";

interface RejectWorkspaceInvitationCommand {
	token: string;
	userId: string;
}

interface RejectWorkspaceInvitationHandlerProps {
	command: RejectWorkspaceInvitationCommand;
	invitationRepository: WorkspaceInvitationRepository;
	userRepository: UserRepository;
}

export const rejectWorkspaceInvitationHandler = async ({
	command,
	invitationRepository,
	userRepository,
}: RejectWorkspaceInvitationHandlerProps): Promise<Result<Success>> => {
	const { token, userId } = command;

	const invitation = await invitationRepository.findByToken(token);

	if (!invitation) {
		return Result.failure(workspaceInvitationErrors.NOT_FOUND);
	}

	if (invitation.isExpired()) {
		return Result.failure(workspaceInvitationErrors.EXPIRED);
	}

	const user = await userRepository.getById(userId);

	if (!user) {
		return Result.failure(UserErrors.USER_NOT_FOUND);
	}

	if (!invitation.isForEmail(user.email)) {
		return Result.failure(workspaceInvitationErrors.EMAIL_MISMATCH);
	}

	await invitationRepository.deleteByToken(token);

	return Success.toResult();
};
