import { Result, Success } from "@serviceflow/backend/shared/result";
import { UserErrors } from "../user/common/user.errors";
import type { UserRepository } from "../user/common/user-repository";
import { workspaceInvitationErrors } from "./common/workspace-invitation.errors";
import type { WorkspaceInvitationRepository } from "./common/workspace-invitation-repository";
import { workspaceMemberErrors } from "./common/workspace-member.errors";
import { WorkspaceMember } from "./common/workspace-member.model";
import type { WorkspaceMemberRepository } from "./common/workspace-member.repository";
import type { WorkspacesUnitOfWork } from "./common/workspaces.unit-of-work";

interface AcceptWorkspaceInvitationCommand {
	token: string;
	userId: string;
}

interface AcceptWorkspaceInvitationHandlerProps {
	command: AcceptWorkspaceInvitationCommand;
	invitationRepository: WorkspaceInvitationRepository;
	memberRepository: WorkspaceMemberRepository;
	userRepository: UserRepository;
	unitOfWork: WorkspacesUnitOfWork;
}

export const acceptWorkspaceInvitationHandler = async ({
	command,
	invitationRepository,
	userRepository,
	memberRepository,
	unitOfWork,
}: AcceptWorkspaceInvitationHandlerProps): Promise<Result<Success>> => {
	const { token, userId } = command;

	const user = await userRepository.getById(userId);
	if (!user) {
		return Result.failure(UserErrors.USER_NOT_FOUND);
	}

	const invitation = await invitationRepository.findByToken(token);
	if (!invitation) {
		return Result.failure(workspaceInvitationErrors.NOT_FOUND);
	}

	if (!invitation.isForEmail(user.email)) {
		return Result.failure(workspaceInvitationErrors.EMAIL_MISMATCH);
	}

	const isAlreadyMember = await memberRepository.existsByEmailAndWorkspace(
		user.email,
		invitation.workspaceId,
	);

	if (isAlreadyMember) {
		return Result.failure(workspaceMemberErrors.USER_ALREADY_MEMBER);
	}

	const invitationAccepted = invitation.accept();
	if (invitationAccepted.isFailure) {
		return Result.failure(invitationAccepted.error);
	}

	const newMember = WorkspaceMember.create({
		userId: userId,
		workspaceId: invitation.workspaceId,
		role: invitation.role,
	});

	if (newMember.isFailure) {
		return Result.failure(newMember.error);
	}

	await unitOfWork.transaction(async ({ invitations, members }) => {
		await members.addMember(newMember.value);
		await invitations.update(invitation);
	});

	return Success.toResult();
};
