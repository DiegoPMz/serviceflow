import { Created, Result } from "@serviceflow/backend/shared/result";
import { UserErrors } from "../user/common/user.errors";
import type { User } from "../user/common/user.model";
import type { UserRepository } from "../user/common/user-repository";
import type { MailService } from "./common/mail-service";
import { workspaceErrors } from "./common/workspace.errors";
import type { Workspace } from "./common/workspace.model";
import {
	type InvitationRole,
	WorkspaceInvitation,
} from "./common/workspace-invitation.model";
import type { WorkspaceInvitationRepository } from "./common/workspace-invitation-repository";
import { workspaceMemberErrors } from "./common/workspace-member.errors";
import type { WorkspaceMemberRepository } from "./common/workspace-member.repository";
import type { WorkspaceRepository } from "./common/workspace-repository";

interface InviteUserToWorkspaceCommand {
	inviterId: string;
	workspaceId: string;
	role: InvitationRole;
	email: string;
}

interface InviteUserToWorkspaceHandlerProps {
	command: InviteUserToWorkspaceCommand;
	invitationRepository: WorkspaceInvitationRepository;
	memberRepository: WorkspaceMemberRepository;
	workspaceRepository: WorkspaceRepository;
	userRepository: UserRepository;
	mailService: MailService;
	appUrl: string;
}

export const inviteUserToWorkspaceHandler = async ({
	command,
	invitationRepository,
	memberRepository,
	userRepository,
	workspaceRepository,
	mailService,
	appUrl,
}: InviteUserToWorkspaceHandlerProps): Promise<Result<Created>> => {
	const { inviterId, email, workspaceId, role } = command;

	const isAlreadyMember = await memberRepository.existsByEmailAndWorkspace(
		email,
		workspaceId,
	);

	if (isAlreadyMember) {
		return Result.failure(workspaceMemberErrors.USER_ALREADY_MEMBER);
	}

	const existingInvitation = await invitationRepository.findByEmailAndWorkspace(
		email,
		workspaceId,
	);

	const [workspace, inviter] = await Promise.all([
		workspaceRepository.getById(workspaceId),
		userRepository.getById(inviterId),
	]);

	if (!workspace) return Result.failure(workspaceErrors.WORKSPACE_NOT_FOUND);
	if (!inviter) return Result.failure(UserErrors.USER_NOT_FOUND);

	if (existingInvitation) {
		const renewInvitationResult = existingInvitation.renew();

		if (renewInvitationResult.isFailure) {
			return Result.failure(renewInvitationResult.error);
		}

		const previousEmailId = existingInvitation.emailId;

		const mailSenderResponse = await sendInvitation({
			invitation: existingInvitation,
			inviter,
			workspace,
		});

		existingInvitation.linkEmail(mailSenderResponse.emailId);
		await invitationRepository.update(existingInvitation);

		if (previousEmailId) {
			mailService.cancelInvitationEmail(previousEmailId).catch((error) => {
				console.error(
					`Failed to cancel previous email ${previousEmailId}:`,
					error,
				);
			});
		}
	}

	if (!existingInvitation) {
		const invitationResult = WorkspaceInvitation.create({
			workspaceId,
			role,
			email,
		});

		if (invitationResult.isFailure) {
			return Result.failure(invitationResult.error);
		}

		const newInvitation = invitationResult.value;

		const mailSenderResponse = await sendInvitation({
			invitation: newInvitation,
			inviter,
			workspace,
		});

		newInvitation.linkEmail(mailSenderResponse.emailId);
		await invitationRepository.save(newInvitation);
	}

	return Created.toResult();

	async function sendInvitation({
		inviter,
		workspace,
		invitation,
	}: {
		workspace: Workspace;
		inviter: User;
		invitation: WorkspaceInvitation;
	}) {
		const acceptUrl = `${appUrl}/invitaciones/aceptar?token=${invitation.token}`;

		return await mailService.sendWorkspaceInvitation({
			to: invitation.email,
			workspaceName: workspace.name,
			inviterEmail: inviter.email,
			role: invitation.role,
			acceptUrl: acceptUrl,
		});
	}
};
