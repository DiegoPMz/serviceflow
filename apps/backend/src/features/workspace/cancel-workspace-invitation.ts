import { Deleted, Result } from "@serviceflow/backend/shared/result";
import type { MailService } from "./common/mail-service";
import { workspaceInvitationErrors } from "./common/workspace-invitation.errors";
import type { WorkspaceInvitationRepository } from "./common/workspace-invitation-repository";

interface CancelWorkspaceInvitationCommand {
	workspaceId: string;
	invitationToken: string;
}

interface HandlerProps {
	command: CancelWorkspaceInvitationCommand;
	workspaceInvitationRepository: WorkspaceInvitationRepository;
	mailService: MailService;
}

export const cancelWorkspaceInvitationHandler = async ({
	command,
	workspaceInvitationRepository,
	mailService,
}: HandlerProps): Promise<Result<Deleted>> => {
	const invitation = await workspaceInvitationRepository.findByToken(
		command.invitationToken,
	);

	if (!invitation || invitation.workspaceId !== command.workspaceId) {
		return Result.failure(workspaceInvitationErrors.NOT_FOUND);
	}

	const cancelationResult = invitation.cancel();

	if (cancelationResult.isFailure) {
		return Result.failure(cancelationResult.error);
	}

	await workspaceInvitationRepository.update(invitation);

	if (invitation.emailId) {
		mailService.cancelInvitationEmail(invitation.emailId).catch((error) => {
			console.error("Failed to cancel invitation email:", error);
		});
	}

	return Deleted.toResult();
};
